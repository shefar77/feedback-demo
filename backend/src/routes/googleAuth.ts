import { Router, Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { createSession } from '../services/auth';
import { getGoogleAuthUrl, exchangeCodeForTokens, getGoogleProfile } from '../services/googleOAuth';
import { awardPoints, getLevelForPoints, seedBadges } from '../services/points';
import crypto from 'crypto';

export const googleAuthRouter = Router();

seedBadges().catch(console.error);

// Redirect to Google
googleAuthRouter.get('/google', (_req: Request, res: Response) => {
  const url = getGoogleAuthUrl();
  return res.redirect(url);
});

// Google callback
googleAuthRouter.get('/google/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

  if (error || !code) {
    return res.redirect(`${frontendUrl}/login?error=google_cancelled`);
  }

  try {
    const tokens  = await exchangeCodeForTokens(code as string);
    const profile = await getGoogleProfile(tokens.access_token);

    let user: any;
    let isNewUser = false;

    // Check if Google account already linked
    const googleAccount = await prisma.googleAccount.findUnique({
      where: { googleId: profile.id },
      include: { user: true },
    });

    if (googleAccount) {
      // Existing Google user ko login hi kar dena hai
      user = googleAccount.user;

      // Daily login bonus
      const today     = new Date().toDateString();
      const lastLogin = user.lastLoginAt?.toDateString();
      if (lastLogin !== today) {
        await awardPoints(user.id, 'DAILY_LOGIN');
      }
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    } 
    else {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({ where: { email: profile.email } });

      if (existingUser) {
        // Link Google to existing account
        user = existingUser;
        await prisma.googleAccount.create({
          data: { userId: existingUser.id, googleId: profile.id, email: profile.email },
        });
      } else {
        // new user 
        isNewUser = true;
        user = await prisma.user.create({
          data: {
            name:         profile.name,
            email:        profile.email,
            passwordHash: crypto.randomBytes(32).toString('hex'), 
            avatarUrl:    profile.picture,
            isVerified:   profile.verified_email,
            points:       0,
          },
        });
        await prisma.googleAccount.create({
          data: { userId: user.id, googleId: profile.id, email: profile.email },
        });
        await awardPoints(user.id, 'SIGNUP');
        await awardPoints(user.id, 'PROFILE_PHOTO');
      }
    }
    const token     = await createSession(user.id);
    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, avatarUrl: true, points: true, level: true, totalFeedback: true, referralCode: true },
    });
    const levelInfo = getLevelForPoints(freshUser!.points);
    const userPayload = Buffer.from(JSON.stringify({ ...freshUser, levelInfo })).toString('base64');

    const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
    redirectUrl.searchParams.set('token',   token);
    redirectUrl.searchParams.set('user',    userPayload);
    redirectUrl.searchParams.set('newUser', String(isNewUser));
    console.log('OAuth success — redirecting to:', redirectUrl.toString());
    return res.redirect(redirectUrl.toString());
  } catch (err: any) {
    console.error('Google OAuth error:', err);
    return res.redirect(`${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/login?error=google_failed`);
  }
});