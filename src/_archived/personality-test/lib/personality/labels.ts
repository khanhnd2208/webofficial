/* ════════════════════════════════════════════════════════════════════════
   Scoring Constants & Labels

   Shared constants, Likert scale configuration, and human-readable labels
   used across the scoring engine and UI.
   ════════════════════════════════════════════════════════════════════════ */

import type { PersonalityDomain } from '@/types/personalityTest';

// ─── Likert Scale Boundaries ───────────────────────────────────────────────────

export const LIKERT_MIN = 1;
export const LIKERT_MAX = 5;
export const REVERSE_CONSTANT = 6; // Reversed score = 6 - raw score

// Coarse 3-tier thresholds used at scoring time (before percentile calculation).
// The results dashboard overrides with 5-tier z-score system once norms are computed.
export const LEVEL_LOW_THRESHOLD = 2.5;
export const LEVEL_HIGH_THRESHOLD = 3.5;

// ─── Human-readable Domain Labels ──────────────────────────────────────────────

export const DOMAIN_LABELS: Record<PersonalityDomain, string> = {
	extraversion: 'Extraversion',
	agreeableness: 'Agreeableness',
	conscientiousness: 'Conscientiousness',
	negativeEmotionality: 'Negative Emotionality',
	openMindedness: 'Open-Mindedness',
	machiavellianism: 'Machiavellianism',
	narcissism: 'Narcissism',
	psychopathy: 'Psychopathy',
};

export const DOMAIN_LABELS_VI: Record<PersonalityDomain, string> = {
	extraversion: 'Hướng ngoại',
	agreeableness: 'Dễ chịu',
	conscientiousness: 'Tận tâm',
	negativeEmotionality: 'Cảm xúc tiêu cực',
	openMindedness: 'Cởi mở',
	machiavellianism: 'Mưu lược',
	narcissism: 'Ái kỷ',
	psychopathy: 'Thái nhân cách',
};

// ─── Likert Scale Labels ────────────────────────────────────────────────────────

export const LIKERT_LABELS: Record<number, string> = {
	1: 'Strongly Disagree',
	2: 'Disagree',
	3: 'Neutral',
	4: 'Agree',
	5: 'Strongly Agree',
};

export const LIKERT_LABELS_VI: Record<number, string> = {
	1: 'Rất không đồng ý',
	2: 'Không đồng ý',
	3: 'Trung lập',
	4: 'Đồng ý',
	5: 'Rất đồng ý',
};
