import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { generateSuggestions } from '../services/openai';
import { getRedis } from '../services/redis';
import { getSuggestionsForRating } from '../services/suggestions';

export const generateRouter = Router();

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  context: z.object({
    placeId:  z.string().min(1),
    bizName:  z.string().min(1).max(100),
    category: z.string().min(1).max(50),
    lang:     z.string().min(2).max(10),
  }),
});

generateRouter.post('/', async (req: Request, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { rating, context } = parsed.data;
  const start = Date.now();

  try {
    // Try cache first
    const suggestions = await getSuggestionsForRating(rating);

    return res.json({
      suggestions,
      cached: false,
      latencyMs: Date.now() - start,
    });
  } 
  catch (err){
    console.error('Generation error:', err);
    return res.status(502).json({ error: 'Failed to generate suggestions. Please retry.' });
  }
});