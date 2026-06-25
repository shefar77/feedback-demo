import { Router, Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { getLevelForPoints, LEVELS } from '../services/points';

export const dashboardRouter = Router();

// GET /dashboard: full user dashboard data
dashboardRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;

  const [pointsHistory, badges, recentFeedback, statsRaw] = await Promise.all([
    prisma.pointsEvent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    }),
    prisma.feedbackEvent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, rating: true, finalText: true, bizName: true, createdAt: true },
    }),
    prisma.feedbackEvent.groupBy({
      by: ['rating'],
      where: { userId: user.id },
      _count: { rating: true },
    }),
  ]);

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, avatarUrl: true, bio: true, points: true, level: true, totalFeedback: true, referralCode: true, createdAt: true, lastLoginAt: true },
  });

  const levelInfo = getLevelForPoints(fullUser!.points);
  const ratingDist = Object.fromEntries(statsRaw.map(r => [r.rating, r._count.rating]));

  // Points this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyPoints = pointsHistory.filter(p => p.createdAt >= weekAgo).reduce((sum, p) => sum + p.points, 0);

  return res.json({
    user: { ...fullUser, levelInfo },
    stats: {
      totalPoints: fullUser!.points,
      weeklyPoints,
      totalFeedback: fullUser!.totalFeedback,
      ratingDistribution: ratingDist,
      badgeCount: badges.length,
    },
    levels: LEVELS,
    badges: badges.map(b => ({ ...b.badge, earnedAt: b.earnedAt })),
    pointsHistory,
    recentFeedback,
    referralLink: `${process.env.FRONTEND_URL}/signup?ref=${fullUser!.referralCode}`,
  });
});