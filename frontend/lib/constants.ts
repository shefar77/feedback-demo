export const RATING_LABELS: Record<number, string> = {
  1: 'Very poor',
  2: 'Below average',
  3: 'Okay',
  4: 'Very good',
  5: 'Excellent!',
};

export const TONE_INFO: Record<number, { cls: string; label: string }> = {
  1: { cls: 'critical', label: 'Critical tone' },
  2: { cls: 'critical', label: 'Honest feedback' },
  3: { cls: 'neutral',  label: 'Balanced tone' },
  4: { cls: 'positive', label: 'Positive tone' },
  5: { cls: 'positive', label: 'Glowing praise' },
};