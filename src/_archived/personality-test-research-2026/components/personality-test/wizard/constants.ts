/* ════════════════════════════════════════════════════════════════════════
   Wizard Constants — Static data used by the test-taking wizard
   ════════════════════════════════════════════════════════════════════════ */

export const QUESTIONS_PER_PAGE = 5;
export const STORAGE_KEY = 'personality-test-progress';

export const LIKERT_OPTIONS = [
	{ value: 1, label: 'Strongly Disagree', labelVi: 'Rất không đồng ý' },
	{ value: 2, label: 'Disagree',          labelVi: 'Không đồng ý' },
	{ value: 3, label: 'Neutral',           labelVi: 'Trung lập' },
	{ value: 4, label: 'Agree',             labelVi: 'Đồng ý' },
	{ value: 5, label: 'Strongly Agree',    labelVi: 'Rất đồng ý' },
] as const;

// ─── Demographic Option Sets (match Google Form screenshot) ───────────────────

export const UNIVERSITY_OPTIONS = [
	{ value: 'hanoi', label: 'Trường Đại học Hà Nội', text: 'Trường Đại học Hà Nội' },
	{ value: 'other', label: 'Khác (Other)', text: '' },
] as const;

export const STUDENT_YEAR_OPTIONS = [
	{ value: 1, label: 'Năm 1 (Freshman)' },
	{ value: 2, label: 'Năm 2 (Sophomore)' },
	{ value: 3, label: 'Năm 3 (Junior)' },
	{ value: 4, label: 'Năm 4 (Senior)' },
	{ value: 5, label: 'Khác (Other)' },
] as const;

export const GPA_OPTIONS = [
	{ value: 3.8, label: '3.60 - 4.00 (Xuất sắc / Excellent)' },
	{ value: 3.4, label: '3.20 - 3.59 (Giỏi / Very Good)' },
	{ value: 2.85, label: '2.50 - 3.19 (Khá / Good)' },
	{ value: 2.37, label: '2.25 - 2.49 (Trung bình khá / Fair)' },
	{ value: 2.12, label: '2.00 - 2.24 (Trung bình / Average)' },
] as const;

export const INTELLIGENCE_OPTIONS = [
	{ value: 1, label: '1', subtitle: 'Extremely unintelligent', subtitleVi: 'Cực kỳ kém thông minh' },
	{ value: 2, label: '2', subtitle: 'Very unintelligent', subtitleVi: 'Rất kém thông minh' },
	{ value: 3, label: '3', subtitle: 'Moderately unintelligent', subtitleVi: 'Khá kém thông minh' },
	{ value: 4, label: '4', subtitle: 'Somewhat unintelligent', subtitleVi: 'Hơi kém thông minh' },
	{ value: 5, label: '5', subtitle: 'Average', subtitleVi: 'Trung bình' },
	{ value: 6, label: '6', subtitle: 'Somewhat intelligent', subtitleVi: 'Hơi thông minh' },
	{ value: 7, label: '7', subtitle: 'Moderately intelligent', subtitleVi: 'Khá thông minh' },
	{ value: 8, label: '8', subtitle: 'Very intelligent', subtitleVi: 'Rất thông minh' },
	{ value: 9, label: '9', subtitle: 'Extremely intelligent', subtitleVi: 'Cực kỳ thông minh' },
] as const;

// ─── Default Demographic Values ───────────────────────────────────────────────

export const DEFAULT_DEMOGRAPHICS = {
	gender: 'male' as const,
	university: 'Trường Đại học Hà Nội',
	studentYear: 1,
	cumulativeGpa: 3.8,
	selfRatedIntelligence: 5,
} as const;
