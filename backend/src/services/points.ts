import { prisma } from './prisma';

export interface PointAction {
  action: string;
  points: number;
  description: string;
}

export const POINT_ACTIONS: Record<string, PointAction> = {
  SIGNUP:            { action: 'SIGNUP',            points: 10, description: 'Welcome bonus for joining the Feedback Portal' },
  FIRST_FEEDBACK:    { action: 'FIRST_FEEDBACK',    points: 5,  description: 'First feedback submitted' },
  FEEDBACK:          { action: 'FEEDBACK',           points: 2,  description: 'Feedback submitted' },
  DAILY_LOGIN:       { action: 'DAILY_LOGIN',        points: 1,  description: 'Daily login bonus' },
  PROFILE_PHOTO:     { action: 'PROFILE_PHOTO',      points: 3,  description: 'Profile photo uploaded' },
  PROFILE_COMPLETE:  { action: 'PROFILE_COMPLETE',   points: 5,  description: 'Profile fully completed' },
  REFERRAL_SENT:     { action: 'REFERRAL_SENT',      points: 8,  description: 'Friend joined via your referral link' },
  REFERRAL_JOINED:   { action: 'REFERRAL_JOINED',    points: 5,  description: 'Joined via referral link' },
  FIVE_FEEDBACKS:    { action: 'FIVE_FEEDBACKS',     points: 10, description: 'Submitted 5 feedbacks milestone' },
  TEN_FEEDBACKS:     { action: 'TEN_FEEDBACKS',      points: 20, description: 'Submitted 10 feedbacks milestone' },
  FIFTY_FEEDBACKS:   { action: 'FIFTY_FEEDBACKS',    points: 50, description: 'Submitted 50 feedbacks milestone' },
};

export const BADGES = [
  { key: 'FIRST_REVIEW',   name: 'First Review',    description: 'Submitted your first feedback',  icon: '⭐', threshold: 1   },
  { key: 'REGULAR',        name: 'Regular',          description: 'Submitted 5 feedbacks',          icon: '🔥', threshold: 5   },
  { key: 'VETERAN',        name: 'Veteran',          description: 'Submitted 10 feedbacks',         icon: '🏆', threshold: 10  },
  { key: 'CHAMPION',       name: 'Champion',         description: 'Submitted 50 feedbacks',         icon: '👑', threshold: 50  },
  { key: 'REFERRER',       name: 'Referrer',         description: 'Referred your first friend',     icon: '🤝', threshold: 0   },
  { key: 'PROFILE_STAR',   name: 'Profile Star',     description: 'Completed your full profile',    icon: '✨', threshold: 0   },
];

export const LEVELS = [
  { level: 1, name: 'Newcomer',    minPoints: 0   },
  { level: 2, name: 'Explorer',    minPoints: 20  },
  { level: 3, name: 'Contributor', minPoints: 50  },
  { level: 4, name: 'Advocate',    minPoints: 100 },
  { level: 5, name: 'Champion',    minPoints: 200 },
  { level: 6, name: 'Legend',      minPoints: 500 },
];

export function getLevelForPoints(points: number) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (points >= lvl.minPoints) current = lvl;
  }
  const next = LEVELS.find(l => l.minPoints > points);
  return { ...current, nextLevel: next ?? null, pointsToNext: next ? next.minPoints - points : 0 };
}

export async function awardPoints(userId: string, actionKey: string): Promise<number> {
  const action = POINT_ACTIONS[actionKey];
  if (!action) return 0;

  const [user] = await Promise.all([
    prisma.user.update({
      where: { id: userId },
      data: { points: { increment: action.points }, level: { set: getLevelForPoints((await prisma.user.findUnique({ where: { id: userId }, select: { points: true } }))!.points + action.points).level } },
    }),
    prisma.pointsEvent.create({
      data: { userId, points: action.points, action: action.action, description: action.description },
    }),
  ]);

  return action.points;
}

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalFeedback: true, badges: { select: { badge: { select: { key: true } } } } },
  });
  if (!user) return [];

  const earned = user.badges.map(b => b.badge.key);
  const newBadges: string[] = [];

  const feedbackBadges = [
    { key: 'FIRST_REVIEW', threshold: 1 },
    { key: 'REGULAR',      threshold: 5 },
    { key: 'VETERAN',      threshold: 10 },
    { key: 'CHAMPION',     threshold: 50 },
  ];

  for (const { key, threshold } of feedbackBadges) {
    if (!earned.includes(key) && user.totalFeedback >= threshold) {
      const badge = await prisma.badge.findUnique({ where: { key } });
      if (badge) {
        await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
        newBadges.push(key);
      }
    }
  }

  return newBadges;
}

export async function seedBadges() {
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: {},
      create: badge,
    });
  }
}