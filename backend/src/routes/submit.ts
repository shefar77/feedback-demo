import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { optionalAuth } from '../middleware/requireAuth';
import { awardPoints, checkAndAwardBadges } from '../services/points';

export const submitRouter = Router();

const schema = z.object({
  rating:          z.number().int().min(1).max(5),
  context: z.object({
    placeId: z.string().min(1),
    bizName: z.string().min(1),
    category: z.string().min(1),
    lang: z.string().min(2),
  }),  
  text: z.string().min(1),
});

submitRouter.post('/', optionalAuth, async (req: Request, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }
  const { rating, context, text } = parsed.data;
  const authUser = (req as any).user; // Assuming optionalAuth middleware attaches user to req

  const record = await prisma.feedbackEvent.create({
    data: {
      placeId:         context.placeId,
      bizName:         context.bizName,
      category:        context.category,
      lang:            context.lang,
      rating:          rating,
      finalText:       text,
      suggestionIndex: 0,
      edited:          false,
      userId:          authUser?.id ?? null,
    },
  });

  let pointsAwarded = 0;
  let newBadges: string[] = [];
  if (authUser){
    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: { totalFeedback: { increment: 1 } },
      select: { totalFeedback: true },
    });

    const total = updatedUser.totalFeedback;

    // First feedback bonus
    if (total === 1) {
      pointsAwarded += await awardPoints(authUser.id, 'FIRST_FEEDBACK');
    } else {
      pointsAwarded += await awardPoints(authUser.id, 'FEEDBACK');
    }

    // Milestone bonuses
    if (total === 5)  pointsAwarded += await awardPoints(authUser.id, 'FIVE_FEEDBACKS');
    if (total === 10) pointsAwarded += await awardPoints(authUser.id, 'TEN_FEEDBACKS');
    if (total === 50) pointsAwarded += await awardPoints(authUser.id, 'FIFTY_FEEDBACKS');

    newBadges = await checkAndAwardBadges(authUser.id);
  }

  const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${context.placeId}`;

    return res.status(201).json({
      id:             record.id,
      googleReviewUrl,
      storedAt:       record.createdAt,
      pointsAwarded,
      newBadges,
    });
  });