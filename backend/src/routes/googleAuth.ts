import { Router, Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { createSession } from '../services/auth';
import { getGoogleAuthUrl, exchangeCodeForTokens, getGoogleProfile } from '../services/googleOAuth';
import { awardPoints, getLevelForPoints, seedBadges } from '../services/points';
import crypto from 'crypto';

export const googleAuthRouter = Router();
seedBadges().catch(console.error);

// Redirect to Google
googleAuthRouter.get('/google', (req: Request, res: Response) => {
  const redirectUri = (req.query.redirect_uri as string | undefined);
  const url = getGoogleAuthUrl(redirectUri);
  return res.redirect(url);
});

// Google callback
googleAuthRouter.get('/google/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query;
  const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');;
  if (error || !code) {
    return res.redirect(`${frontendUrl}/login?error=google_cancelled`);
  }
  const result = await handleGoogleExchange(code as string, undefined);
  if (!result.ok) {
    return res.redirect(`${frontendUrl}/login?error=google_failed`);
  }
  const userPayload = Buffer.from(JSON.stringify(result.user)).toString('base64');
  const redirectUrl = new URL(`${frontendUrl}/auth/google-callback`);
  redirectUrl.searchParams.set('token',   result.token);
  redirectUrl.searchParams.set('user',    userPayload);
  redirectUrl.searchParams.set('newUser', String(result.isNewUser));
  return res.redirect(redirectUrl.toString());
});

googleAuthRouter.post('/google/exchange', async (req: Request, res: Response) => {
  const { code, redirectUri } = req.body;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  const result = await handleGoogleExchange(code as string, redirectUri as string | undefined);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  return res.json({ token: result.token, user: result.user, isNewUser: result.isNewUser });
});

async function handleGoogleExchange(code: string, redirectUri?: string) {
  try {
    const tokens  = await exchangeCodeForTokens(code, redirectUri);
    const profile = await getGoogleProfile(tokens.access_token);

    let user: any;
    let isNewUser = false;

    const googleAccount = await prisma.googleAccount.findUnique({
      where: { googleId: profile.id },
      include: { user: true },
    });

    if (googleAccount) {
      user = googleAccount.user;
      const today = new Date().toDateString();
      if (user.lastLoginAt?.toDateString() !== today) {
        await awardPoints(user.id, 'DAILY_LOGIN');
      }
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    } else {
      const existingUser = await prisma.user.findUnique({ where: { email: profile.email } });

      if (existingUser) {
        user = existingUser;
        await prisma.googleAccount.create({
          data: { userId: existingUser.id, googleId: profile.id, email: profile.email },
        });
      } else {
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
      where:  { id: user.id },
      select: { id: true, name: true, email: true, avatarUrl: true, points: true, level: true, totalFeedback: true, referralCode: true },
    });
    const levelInfo = getLevelForPoints(freshUser!.points);

    return { ok: true as const, token, user: { ...freshUser, levelInfo }, isNewUser };

  } catch (err: any) {
    console.error('handleGoogleExchange error:', err?.message ?? err);
    return { ok: false as const, error: err?.message ?? 'OAuth exchange failed' };
  }
}