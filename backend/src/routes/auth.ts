import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { hashPassword, createSession, deleteSession, extractToken, generateToken } from '../services/auth';
import { awardPoints, seedBadges, getLevelForPoints } from '../services/points';

export const authRouter = Router();

seedBadges().catch(console.error);

//  Signup
authRouter.post('/signup', async (req: Request, res: Response) => {
  const schema = z.object({
    name:     z.string().min(2).max(80),
    email:    z.string().email(),
    password: z.string().min(6).max(100),
    referralCode: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });

  const { name, email, password, referralCode } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  let referredBy: string | undefined;
  if (referralCode) {
    const referrer = await prisma.user.findUnique({ where: { referralCode } });
    if (referrer) {
      referredBy = referrer.id;
      // Award referrer
      await awardPoints(referrer.id, 'REFERRAL_SENT');
    }
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: hashPassword(password), referredBy, isVerified: true },
  });

  // Award signup points
  await awardPoints(user.id, 'SIGNUP');
  if (referredBy) await awardPoints(user.id, 'REFERRAL_JOINED');

  const token = await createSession(user.id);
  const levelInfo = getLevelForPoints(user.points);

  return res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, points: user.points + 10, level: levelInfo, referralCode: user.referralCode },
  });
});

// Login
authRouter.post('/login', async (req: Request, res: Response) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Daily login bonus
  const today = new Date().toDateString();
  const lastLogin = user.lastLoginAt?.toDateString();
  let dailyBonus = 0;
  if (lastLogin !== today) {
    dailyBonus = 1;
    await awardPoints(user.id, 'DAILY_LOGIN');
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const token = await createSession(user.id);
  const updatedUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, email: true, avatarUrl: true, points: true, level: true, totalFeedback: true, referralCode: true } });
  const levelInfo = getLevelForPoints(updatedUser!.points);

  return res.json({ token, user: { ...updatedUser, levelInfo }, dailyBonus });
});

// Logout
authRouter.post('/logout', async (req: Request, res: Response) => {
  const token = extractToken(req.headers.authorization);
  if (token) await deleteSession(token);
  return res.json({ success: true });
});

// Me
authRouter.get('/me', async (req: Request, res: Response) => {
  const token = extractToken(req.headers.authorization);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const user = await prisma.user.findFirst({
    where: { sessions: { some: { token } } },
    select: {
      id: true, name: true, email: true, avatarUrl: true, bio: true,
      points: true, level: true, totalFeedback: true, referralCode: true,
      createdAt: true, lastLoginAt: true,
      badges: { include: { badge: true } },
      pointsHistory: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });

  if (!user) return res.status(401).json({ error: 'Session invalid' });
  const levelInfo = getLevelForPoints(user.points);
  return res.json({ ...user, levelInfo });
});

// Update Profile   
authRouter.patch('/profile', async (req: Request, res: Response) => {
  const token = extractToken(req.headers.authorization);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session) return res.status(401).json({ error: 'Session invalid' });

  const schema = z.object({
    name:      z.string().min(2).max(80).optional(),
    bio:       z.string().max(200).optional(),
    avatarUrl: z.string().url().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const wasAvatarSet = !!session.user.avatarUrl;
  const updated = await prisma.user.update({ where: { id: session.userId }, data: parsed.data });

  // Award photo upload bonus (first time only)
  if (!wasAvatarSet && parsed.data.avatarUrl) {
    await awardPoints(session.userId, 'PROFILE_PHOTO');
  }

  // Award profile complete bonus first time name+bio+avatar 
  const wasBioSet = !!session.user.bio;
  if (updated.name && updated.bio && updated.avatarUrl && !wasBioSet) {
    await awardPoints(session.userId, 'PROFILE_COMPLETE');
  }

  const fresh = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, name: true, email: true, avatarUrl: true, bio: true, points: true, level: true, totalFeedback: true } });
  return res.json({ ...fresh, levelInfo: getLevelForPoints(fresh!.points) });
});

// Forgot Password
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid email' });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Always return 200 to prevent email enumeration
  if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

  const resetToken = generateToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExp: new Date(Date.now() + 60 * 60 * 1000) }, // 1 hour
  });
  console.log(`Password reset token for ${user.email}: ${resetToken}`);
  return res.json({ message: 'If that email exists, a reset link has been sent.', devToken: process.env.NODE_ENV === 'development' ? resetToken : undefined });
});

// Reset Password
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  const schema = z.object({ token: z.string(), password: z.string().min(6) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const user = await prisma.user.findFirst({
    where: { resetToken: parsed.data.token, resetTokenExp: { gt: new Date() } },
  });
  if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(parsed.data.password), resetToken: null, resetTokenExp: null },
  });
  await prisma.session.deleteMany({ where: { userId: user.id } });

  return res.json({ message: 'Password reset successful. Please log in.' });
});