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
  pointsAwarded:  number;
  newBadges:      string[];
}

export type Step = 1 | 2 | 3 | 4;

export interface LevelInfo {
  level:        number;
  name:         string;
  minPoints:    number;
  nextLevel:    { level: number; name: string; minPoints: number } | null;
  pointsToNext: number;
}

export interface User {
  id:           string;
  name:         string;
  email:        string;
  avatarUrl?:   string;
  bio?:         string;
  points:       number;
  level:        number;
  totalFeedback:number;
  referralCode: string;
  levelInfo?:   LevelInfo;
}

export interface Badge {
  key:         string;
  name:        string;
  description: string;
  icon:        string;
  earnedAt:    string;
}

export interface PointsEvent {
  id:          string;
  points:      number;
  action:      string;
  description: string;
  createdAt:   string;
}

export interface DashboardData {
  user:          User & { levelInfo: LevelInfo };
  stats:         { totalPoints: number; weeklyPoints: number; totalFeedback: number; ratingDistribution: Record<number, number>; badgeCount: number };
  levels:        { level: number; name: string; minPoints: number }[];
  badges:        Badge[];
  pointsHistory: PointsEvent[];
  recentFeedback:{ id: string; rating: number; finalText: string; bizName: string; createdAt: string }[];
  referralLink:  string;
}