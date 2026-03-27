/* ════════════════════════════════════════════════════════════════════════
   Personality Test — Type Definitions
   
   Dual assessment: BFI-2-S (OCEAN) + Short Dark Triad (SD3)
   Database: PostgreSQL
   ════════════════════════════════════════════════════════════════════════ */

// ─── Enums & Literal Types ─────────────────────────────────────────────────────

/** BFI-2-S measures 5 broad personality domains */
export type OceanDomain =
	| 'extraversion'
	| 'agreeableness'
	| 'conscientiousness'
	| 'negativeEmotionality'
	| 'openMindedness';

/** Short Dark Triad measures 3 "dark" traits */
export type DarkTriadDomain =
	| 'machiavellianism'
	| 'narcissism'
	| 'psychopathy';

export type PersonalityDomain = OceanDomain | DarkTriadDomain;

export type TestType = 'BFI2S' | 'SD3';

export type SessionStatus = 'in_progress' | 'completed' | 'invalid';

// ─── Demographic / Survey Fields ───────────────────────────────────────────────

export interface DemographicData {
	/** University / institution (Trường Đại học) */
	university: string;
	/** Student year 1-5+ (Sinh viên năm mấy) */
	studentYear: number;
	/** Cumulative GPA on a 4.0 scale (Điểm GPA tích lũy) */
	cumulativeGpa: number;
	/** Self-rated intelligence 1-9 (Bạn tự đánh giá trí thông minh) */
	selfRatedIntelligence: number;
	/** Gender: 'male' | 'female' | 'other' — used for gender-specific SD3 norms */
	gender: 'male' | 'female' | 'other';
}

// ─── Question Configuration ────────────────────────────────────────────────────

export interface QuestionConfig {
	/** Unique item number within the test (academic numbering — BFI 1-30, SD3 1-27) */
	itemNumber: number;
	/** Display order in the Google Form (1-based). Determines column order in exports. */
	formOrder: number;
	/** Which test this belongs to */
	testType: TestType;
	/** Which trait domain this item measures */
	domain: PersonalityDomain;
	/** The question text shown to the user */
	text: string;
	/** Vietnamese translation of the question */
	textVi: string;
	/** Whether this item requires reverse scoring (Actual = 6 - Raw) */
	isReversed: boolean;
	/** Whether this is an attention check item */
	isAttentionCheck: boolean;
	/** Expected answer for attention checks (1-5) */
	attentionCheckExpected?: number;
}

// ─── Raw Response ──────────────────────────────────────────────────────────────

export interface RawResponse {
	/** Test type */
	testType: TestType;
	/** Academic item number within the test */
	itemNumber: number;
	/** User's raw answer (1-5 Likert scale) */
	value: number;
}

// ─── Scoring Results ───────────────────────────────────────────────────────────

export interface TraitScore {
	domain: PersonalityDomain;
	/** Average score for this domain (1.00 - 5.00) */
	score: number;
	/** Human-readable label */
	label: string;
	/** Percentile rank against normative reference group (1-99). Null if not yet calculated. */
	percentile: number | null;
	/** 5-tier z-score classification: very_low | low | moderate | high | very_high */
	level: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
}

export interface OceanScores {
	extraversion: TraitScore;
	agreeableness: TraitScore;
	conscientiousness: TraitScore;
	negativeEmotionality: TraitScore;
	openMindedness: TraitScore;
}

export interface DarkTriadScores {
	machiavellianism: TraitScore;
	narcissism: TraitScore;
	psychopathy: TraitScore;
}

export interface ScoringResult {
	isValid: boolean;
	invalidReason?: string;
	ocean: OceanScores | null;
	darkTriad: DarkTriadScores | null;
	archetype: ArchetypeProfile | null;
}

// ─── Archetype / Persona Profile ───────────────────────────────────────────────

export interface ArchetypeProfile {
	/** E.g. "The Strategic Executor" */
	name: string;
	/** Short tagline */
	tagline: string;
	/** Emoji icon */
	icon: string;
	/** Constructive strengths in professional context */
	strengths: string[];
	/** Destructive risks / blind spots */
	blindspots: string[];
	/** Detailed narrative paragraph */
	narrative: string;
	/** Primary color theme for UI */
	colorTheme: 'amber' | 'indigo' | 'rose' | 'teal' | 'purple' | 'emerald';
	// ─── Vietnamese translations (optional for backward compat) ─────────
	/** Vietnamese name */
	nameVi?: string;
	/** Vietnamese tagline */
	taglineVi?: string;
	/** Vietnamese strengths */
	strengthsVi?: string[];
	/** Vietnamese blind spots */
	blindspotsVi?: string[];
	/** Vietnamese narrative */
	narrativeVi?: string;
}

// ─── DTOs (API / Client) ──────────────────────────────────────────────────────

export interface PersonalityTestSessionDTO {
	id: string;
	userId: string;
	userName: string;
	status: SessionStatus;
	/** Demographic data (null if not provided) */
	demographics: DemographicData | null;
	/** BFI-2-S responses (0 if not yet answered) */
	bfiResponseCount: number;
	/** SD3 responses (0 if not yet answered) */
	sd3ResponseCount: number;
	/** Scoring results — null if not yet scored or invalid */
	result: ScoringResult | null;
	completedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface PersonalityTestHistoryDTO {
	id: string;
	status: SessionStatus;
	archetype: string | null;
	completedAt: string | null;
	createdAt: string;
}

export interface TestSubmissionPayload {
	demographics: DemographicData;
	responses: RawResponse[];
}

export interface TestConfigDTO {
	bfiQuestions: QuestionConfig[];
	sd3Questions: QuestionConfig[];
	totalQuestions: number;
	likertScale: { min: number; max: number; labels: Record<number, string> };
}
