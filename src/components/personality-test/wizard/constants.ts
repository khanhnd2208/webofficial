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
	{ value: 'other', label: 'Other', text: '' },
] as const;

export const STUDENT_YEAR_OPTIONS = [
	{ value: 1, label: 'Năm 1' },
	{ value: 2, label: 'Năm 2' },
	{ value: 3, label: 'Năm 3' },
	{ value: 4, label: 'Năm 4' },
	{ value: 5, label: 'Other' },
] as const;

export const GPA_OPTIONS = [
	{ value: 3.8, label: '3.60 - 4.00' },
	{ value: 3.4, label: '3.20 - 3.59' },
	{ value: 2.85, label: '2.50 - 3.19' },
	{ value: 2.37, label: '2.25 - 2.49' },
	{ value: 2.12, label: '2.00 - 2.24' },
] as const;

export const INTELLIGENCE_OPTIONS = [
	{ value: 1, label: '1', subtitle: 'Extremely unintelligent' },
	{ value: 2, label: '2', subtitle: 'Very unintelligent' },
	{ value: 3, label: '3', subtitle: 'Moderately unintelligent' },
	{ value: 4, label: '4', subtitle: 'Somewhat unintelligent' },
	{ value: 5, label: '5', subtitle: 'Average' },
	{ value: 6, label: '6', subtitle: 'Somewhat intelligent' },
	{ value: 7, label: '7', subtitle: 'Moderately intelligent' },
	{ value: 8, label: '8', subtitle: 'Very intelligent' },
	{ value: 9, label: '9', subtitle: 'Extremely intelligent' },
] as const;

// ─── Default Demographic Values ───────────────────────────────────────────────

export const DEFAULT_DEMOGRAPHICS = {
	gender: 'male' as const,
	university: 'Trường Đại học Hà Nội',
	studentYear: 1,
	cumulativeGpa: 3.8,
	selfRatedIntelligence: 5,
} as const;
