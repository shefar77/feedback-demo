import crypto from 'crypto';
import { prisma } from './prisma';

// session based auth
export function hashPassword(password: string): string {
    const secret = process.env.AUTH_SECRET || 'ff_secret';
    return crypto.createHash('sha256').update(password + secret).digest('hex');
}

export function generateToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await prisma.session.create({ data: { userId, token, expiresAt } });
  return token;
}

export async function validateSession(token: string) {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { select: { id: true, email: true, name: true, avatarUrl: true, points: true, level: true, totalFeedback: true, referralCode: true, isVerified: true } } },
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { token } });
    return null;
  }
  return session.user;
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

export function extractToken(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}