import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export interface GenerateOptions {
  rating: number;
  bizName: string;
  category: string;
  lang: string;
  count?: number;
}

export interface Suggestion {
  text: string;
  tone: string;
}

const TONE_MAP: Record<number, { tone: string; instruction: string; forbidden: string }> = {
  1: {
    tone: 'Critical',
    instruction: 'The customer is deeply unhappy. Write genuinely critical, disappointed, negative reviews. Mention specific failures like poor service, bad quality, long waits, wrong orders. Sound frustrated but not abusive.',
    forbidden: 'NEVER use positive words like great, good, lovely, nice, enjoyed, recommend, will return. The review must justify 1 star.',
  },
  2: {
    tone: 'Honest',
    instruction: 'The customer is unhappy but not furious. Highlight clear problems. Only one minor positive allowed, immediately outweighed by negatives. Sound disappointed.',
    forbidden: 'NEVER write an overall positive review. Do not recommend the place. Do not say will return.',
  },
  3: {
    tone: 'Balanced',
    instruction: 'The customer had a mixed experience. Balance positives and negatives equally, roughly half and half. Sound fair and impartial.',
    forbidden: 'NEVER make the review fully positive or fully negative. It must be mixed.',
  },
  4: {
    tone: 'Positive',
    instruction: 'The customer is happy. Write warm positive reviews highlighting real highlights. One minor caveat is fine but overall tone must be clearly positive.',
    forbidden: 'NEVER write a mostly negative or critical review.',
  },
  5: {
    tone: 'Glowing',
    instruction: 'The customer is delighted. Write enthusiastic glowing reviews. Highlight exceptional service, quality, and experience. Sound genuinely impressed.',
    forbidden: 'NEVER include any criticism or negatives. The review must fully justify 5 stars.',
  },
};

const LANG_MAP: Record<string, string> = {
  en:       'English',
  hi:       'Hindi (Devanagari script)',
  hinglish: 'Hinglish (casual mix of Hindi and English in Roman script)',
  mr:       'Marathi',
  ta:       'Tamil',
};

const CATEGORY_CONTEXT: Record<string, string> = {
  cafe:       'cafe or restaurant, mention coffee, food, ambience, service, wait time',
  ecommerce:  'online store, mention delivery speed, packaging, product quality',
  saas:       'software product, mention UX, performance, reliability, support',
  healthcare: 'clinic or healthcare provider, mention staff empathy, cleanliness, wait time',
  retail:     'retail shop, mention staff helpfulness, product variety, pricing',
  hotel:      'hotel, mention cleanliness, room comfort, location, staff',
};

const FEW_SHOT: Record<number, string> = {
  1: `[{"text":"Really disappointing visit. The staff were dismissive and the wait was unacceptably long. My order arrived cold and incorrect and when I flagged it nobody seemed to care. For the price they charge the quality and service fall well short. I will not be returning.","tone":"Critical"},{"text":"Not what I expected at all. Poor service, mediocre food and a chaotic atmosphere. Several tables were unclean and the team seemed overwhelmed. Nothing about this visit justified the cost. Needs serious improvement.","tone":"Frustrated"}]`,
  2: `[{"text":"A bit of a letdown overall. The coffee was decent but the food was underwhelming and took far too long. Staff were polite but clearly stretched thin. There is potential here but several things need fixing before it lives up to the reviews.","tone":"Honest"},{"text":"Below average unfortunately. Ambience is pleasant but service was inconsistent and my order was not quite right. Not terrible but not worth the price either. Would not rush back.","tone":"Disappointed"}]`,
  3: `[{"text":"Decent spot overall. Coffee is solid and the space is comfortable. Service was a bit hit and miss today but the food was tasty enough. Worth trying if you are in the area though do not expect to be blown away.","tone":"Balanced"},{"text":"A perfectly fine cafe that does what it says. Nothing extraordinary but reliable enough. Staff were friendly if a little slow. Good for a casual visit and I would probably return though it is not a destination spot yet.","tone":"Neutral"}]`,
  4: `[{"text":"Really lovely place. Great coffee and a warm welcoming atmosphere. Staff were friendly and attentive and my order arrived quickly. The food was fresh and delicious. Will definitely make this a regular spot.","tone":"Warm"},{"text":"Had a wonderful experience here. The latte was one of the best in the area and the food menu had some great options. Service was efficient and the team genuinely seemed to enjoy what they do. Highly recommend.","tone":"Positive"}]`,
  5: `[{"text":"Absolutely love this place. Every visit is a delight, exceptional coffee, creative food and a team that genuinely makes you feel welcome. The attention to detail is remarkable. Hands down my favourite cafe in the city.","tone":"Glowing"},{"text":"One of the best experiences I have had. Stunning coffee, incredible food and the warmest staff around. It is rare to find somewhere that gets everything right but this place manages it every single time. A true gem.","tone":"Stellar"}]`,
};

export async function generateSuggestions(opts: GenerateOptions): Promise<Suggestion[]> {
  const { rating, bizName, category, lang, count = 3 } = opts;
  const toneInfo  = TONE_MAP[rating]  ?? TONE_MAP[3];
  const langLabel = LANG_MAP[lang]    ?? 'English';
  const catCtx    = CATEGORY_CONTEXT[category] ?? 'business';

  const prompt = `You are a review-writing assistant that writes authentic Google reviews for a ${catCtx} called "${bizName}".

THE CUSTOMER GAVE ${rating} OUT OF 5 STARS. THIS RATING IS FIXED AND NON-NEGOTIABLE.

TONE RULE: ${toneInfo.instruction}

FORBIDDEN: ${toneInfo.forbidden}

Language: ${langLabel}

Output format rules:
- Return ONLY a raw JSON array, no wrapper object, no markdown fences, no explanation.
- Format: [{"text":"full review text here","tone":"1-2 word tone label"}]
- Each review must be 60 to 110 words.
- Natural sentence flow. No long hyphens. No bullet points.
- Vary wording and structure across all ${count} suggestions.
- Sound like a real human customer, not AI generated.

Reference examples for ${rating} star tone (do NOT copy, just match the sentiment):
${FEW_SHOT[rating]}

Now generate ${count} NEW distinct ${rating}-star reviews for "${bizName}" in ${langLabel}. Return only the JSON array, nothing else.`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 900,
    },
  });

  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  const clean = raw.replace(/```json|```/g, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch {
    const match = clean.match(/\[[\s\S]*\]/);
    parsed = match ? JSON.parse(match[0]) : [];
  }

  const arr: unknown[] = Array.isArray(parsed)
  ? parsed
  : Array.isArray((parsed as Record<string, unknown>).suggestions)
    ? ((parsed as Record<string, unknown>).suggestions as unknown[])
    : Array.isArray((parsed as Record<string, unknown>).reviews)
      ? ((parsed as Record<string, unknown>).reviews as unknown[])
      : [];

  return arr.map((s: unknown) => {
    if (typeof s === 'string') return { text: s, tone: toneInfo.tone };
    const obj = s as Record<string, string>;
    return { text: obj.text ?? String(s), tone: obj.tone ?? toneInfo.tone };
  });
}