export interface FeedbackContext {
  placeId: string;
  bizName: string;
  category: string;
  lang: string;
}

export interface Suggestion {
  text: string;
  tone: string;
}

export interface GenerateRequest {
  rating: number;
  context: FeedbackContext;
}

export interface GenerateResponse {
  suggestions: Suggestion[];
  cached: boolean;
  latencyMs: number;
}

export interface SubmitRequest {
  rating: number;
  context: {
    placeId: string;
    bizName: string;
    category: string;
    lang: string;
  };
  text: string;
}

export interface SubmitResponse {
  id: string;
  googleReviewUrl: string;
  storedAt: string;
}

export type Step = 1 | 2 | 3 | 4;