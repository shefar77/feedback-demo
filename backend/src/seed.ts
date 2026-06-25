import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + (process.env.AUTH_SECRET ?? 'ff_secret')).digest('hex');
}

const BADGES = [
  { key: 'FIRST_REVIEW',  name: 'First Review',  description: 'Submitted your first feedback',  icon: '⭐', threshold: 1  },
  { key: 'REGULAR',       name: 'Regular',        description: 'Submitted 5 feedbacks',          icon: '🔥', threshold: 5  },
  { key: 'VETERAN',       name: 'Veteran',        description: 'Submitted 10 feedbacks',         icon: '🏆', threshold: 10 },
  { key: 'CHAMPION',      name: 'Champion',       description: 'Submitted 50 feedbacks',         icon: '👑', threshold: 50 },
  { key: 'REFERRER',      name: 'Referrer',       description: 'Referred your first friend',     icon: '🤝', threshold: 0  },
  { key: 'PROFILE_STAR',  name: 'Profile Star',   description: 'Completed your full profile',    icon: '✨', threshold: 0  },
];

async function main() {
  console.log('🌱 Seeding database...');

  for (const badge of BADGES) {
    await prisma.badge.upsert({ where: { key: badge.key }, update: {}, create: badge });
  }
  console.log('Badges fetched');

  // Create demo user
  const demoEmail = 'demo@feedbackflow.com';
  const existing = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (existing) {
    console.log('ℹ️  Demo user already exists');
  } else {
    const user = await prisma.user.create({
      data: {
        name:         'Demo User',
        email:        demoEmail,
        passwordHash: hashPassword('Demo@123'),
        isVerified:   true,
        points:       47,
        level:        2,
        totalFeedback:4,
      },
    });

    const events = [
      { points: 10, action: 'SIGNUP',         description: 'Welcome bonus for joining FeedbackFlow' },
      { points: 1,  action: 'DAILY_LOGIN',    description: 'Daily login bonus' },
      { points: 5,  action: 'FIRST_FEEDBACK', description: 'First feedback submitted' },
      { points: 3,  action: 'PROFILE_PHOTO',  description: 'Profile photo uploaded' },
      { points: 5,  action: 'PROFILE_COMPLETE', description: 'Profile fully completed' },
      { points: 2,  action: 'FEEDBACK',       description: 'Feedback submitted' },
      { points: 2,  action: 'FEEDBACK',       description: 'Feedback submitted' },
      { points: 2,  action: 'FEEDBACK',       description: 'Feedback submitted' },
      { points: 1,  action: 'DAILY_LOGIN',    description: 'Daily login bonus' },
      { points: 1,  action: 'DAILY_LOGIN',    description: 'Daily login bonus' },
    ];

    for (const e of events) {
      await prisma.pointsEvent.create({ data: { userId: user.id, ...e } });
    }

    // Award first badge
    const firstBadge = await prisma.badge.findUnique({ where: { key: 'FIRST_REVIEW' } });
    if (firstBadge) {
      await prisma.userBadge.create({ data: { userId: user.id, badgeId: firstBadge.id } });
    }

    // Seed sample feedback events
    const feedbackSamples = [
      { rating: 5, finalText: 'Absolutely loved the experience. Staff were extremely welcoming.', bizName: 'Brew & Co Cafe', placeId: 'demo', category: 'cafe', lang: 'en', suggestionIndex: 0, edited: false },
      { rating: 4, finalText: 'Really good service overall. Quick and professional.', bizName: 'Brew & Co Cafe', placeId: 'demo', category: 'cafe', lang: 'en', suggestionIndex: 1, edited: true },
      { rating: 3, finalText: 'Decent experience. Some delays but otherwise okay.', bizName: 'Local Salon', placeId: 'demo2', category: 'retail', lang: 'en', suggestionIndex: 2, edited: false },
      { rating: 5, finalText: 'One of the best experiences I have had. Highly recommend!', bizName: 'City Clinic', placeId: 'demo3', category: 'healthcare', lang: 'en', suggestionIndex: 0, edited: true },
    ];

    for (const f of feedbackSamples) {
      await prisma.feedbackEvent.create({ data: { ...f, userId: user.id } });
    }

    console.log('Demo user created');
    console.log('');
    console.log('  DEMO LOGIN CREDENTIALS');
    console.log('  Email:    demo@feedbackflow.com');
    console.log('  Password: Demo@123');
    console.log('  Points:   47');
    console.log('  Level:    2 (Explorer)');
  }

  await prisma.$disconnect();
}

main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1); });