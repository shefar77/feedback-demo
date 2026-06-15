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
  1: `[{"text":"Had a pretty disappointing experience overall. Several things did not go as expected and it left a bad impression.","tone":"Critical"},{"text":"The service was very slow and the staff did not seem attentive at all. The whole process felt disorganized.","tone":"Frustrated"},{"text":"Waited much longer than expected and got very little help. The quality was poor and did not feel customer focused.","tone":"Negative"},{"text":"There were too many problems during the visit for it to be enjoyable. Would really appreciate some major improvements.","tone":"Dissatisfied"},{"text":"The overall experience was frustrating. Expectations were not met and the visit felt poorly managed from start to finish.","tone":"Critical"}]`,
  2: `[{"text":"The experience was below expectations and could be improved in several areas. Not quite what I was hoping for.","tone":"Honest"},{"text":"Service was a bit inconsistent and the overall process felt slightly disorganized. Room for improvement for sure.","tone":"Disappointed"},{"text":"A few things went well but there were noticeable areas that needed more attention and care.","tone":"Mixed"},{"text":"The place was fine but the overall experience felt underwhelming. More attention to detail would help a lot.","tone":"Measured"},{"text":"Customer handling could have been a bit more attentive and smooth. Communication also could have been clearer.","tone":"Constructive"}]`,
  3: `[{"text":"The experience was decent overall with some room for improvement. Nothing bad but nothing exceptional either.","tone":"Neutral"},{"text":"Service was satisfactory but there were a few delays. Things were handled reasonably well throughout the visit.","tone":"Balanced"},{"text":"Everything was alright though nothing particularly stood out. It was an average visit that met basic expectations.","tone":"Fair"},{"text":"The place was comfortable and the service was acceptable. A few improvements in speed would make a real difference.","tone":"Neutral"},{"text":"Not a bad experience at all but there is definitely scope for improvement. Would probably come back and give it another shot.","tone":"Balanced"}]`,
  4: `[{"text":"Had a very good experience overall. Everything was managed well and the staff were friendly throughout.","tone":"Positive"},{"text":"The service was quick and the overall process was smooth. Really appreciated the professionalism shown.","tone":"Warm"},{"text":"The experience was pleasant and exceeded most expectations. The team was helpful and responsive when needed.","tone":"Happy"},{"text":"Had a positive experience and would happily visit again. The quality of service was impressive and reliable.","tone":"Satisfied"},{"text":"Overall very satisfied with the experience and service provided. Would recommend this place to others without hesitation.","tone":"Positive"}]`,
  5: `[{"text":"Excellent experience from start to finish. Everything was outstanding and I could not have asked for better.","tone":"Glowing"},{"text":"The staff were extremely welcoming and attentive throughout. Service was exceptional and exceeded all expectations.","tone":"Stellar"},{"text":"Highly satisfied with everything. The attention to detail really stood out and made the whole visit memorable.","tone":"Enthusiastic"},{"text":"Everything was handled perfectly and with great professionalism. One of the best experiences I have had in a long time.","tone":"Glowing"},{"text":"Absolutely loved the experience. The entire team went above and beyond and it showed from the very beginning.","tone":"Exceptional"}]`,
};

export async function generateSuggestions(opts: GenerateOptions): Promise<Suggestion[]> {
  const { rating, bizName, category, lang, count = 5 } = opts;
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