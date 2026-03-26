/* ════════════════════════════════════════════════════════════════════════
   Personality Test — Service Layer (PostgreSQL)
   
   Pure async functions — no HTTP, no auth logic.
   Uses the PostgreSQL data access layer in models/PersonalityTest.ts.
   ════════════════════════════════════════════════════════════════════════ */

import type {
	RawResponse,
	DemographicData,
	PersonalityTestSessionDTO,
	PersonalityTestHistoryDTO,
	TestConfigDTO,
	ScoringResult,
	TraitScore,
	OceanScores,
	DarkTriadScores,
} from '@/types/personalityTest';

import {
	getTestConfig,
	scorePersonalityTest,
	DOMAIN_LABELS_VI,
} from '@/lib/personalityScoring';

import {
	calculateAllPercentiles as calculateNormativePercentiles,
	getDefaultReferenceGroupIds,
	getLevelFromZScore,
	type PercentileResult,
} from '@/lib/normativeData';

import {
	findSessionById,
	findResultBySessionId,
	findResponsesBySessionId,
	findSessionsByUserId,
	createSession,
	insertResult,
	updatePercentiles,
	countSessionsByStatus,
	getArchetypeDistribution,
	getAverageScores,
	type SessionRow,
	type ResultRow,
} from '@/models/PersonalityTest';

// ─── DTO Converters ────────────────────────────────────────────────────────────

function traitScoreFromResult(
	domain: string,
	label: string,
	score: number | null,
	percentile: number | null,
	zScore?: number | null
): TraitScore {
	const s = Number(score) || 0;
	// Use z-score based 5-tier system if z-score available, else fall back to 3-tier score-based
	const level = zScore != null
		? getLevelFromZScore(zScore)
		: s < 2.5 ? 'low' : s > 3.5 ? 'high' : 'moderate';
	return {
		domain: domain as TraitScore['domain'],
		score: s,
		label,
		percentile: percentile ?? null,
		level,
	};
}

function buildScoringResultFromRow(row: ResultRow): ScoringResult {
	// Build scores if they exist (scores are now computed even for invalid sessions)
	const hasScores = row.extraversion != null || row.agreeableness != null;

	const ocean: OceanScores | null = hasScores ? {
		extraversion: traitScoreFromResult(
			'extraversion', 'Extraversion',
			row.extraversion, row.extraversion_pct
		),
		agreeableness: traitScoreFromResult(
			'agreeableness', 'Agreeableness',
			row.agreeableness, row.agreeableness_pct
		),
		conscientiousness: traitScoreFromResult(
			'conscientiousness', 'Conscientiousness',
			row.conscientiousness, row.conscientiousness_pct
		),
		negativeEmotionality: traitScoreFromResult(
			'negativeEmotionality', 'Negative Emotionality',
			row.negative_emotionality, row.negative_emotionality_pct
		),
		openMindedness: traitScoreFromResult(
			'openMindedness', 'Open-Mindedness',
			row.open_mindedness, row.open_mindedness_pct
		),
	} : null;

	const darkTriad: DarkTriadScores | null = hasScores ? {
		machiavellianism: traitScoreFromResult(
			'machiavellianism', 'Machiavellianism',
			row.machiavellianism, row.machiavellianism_pct
		),
		narcissism: traitScoreFromResult(
			'narcissism', 'Narcissism',
			row.narcissism, row.narcissism_pct
		),
		psychopathy: traitScoreFromResult(
			'psychopathy', 'Psychopathy',
			row.psychopathy, row.psychopathy_pct
		),
	} : null;

	return {
		isValid: row.is_valid,
		invalidReason: row.invalid_reason ?? undefined,
		ocean,
		darkTriad,
		archetype: row.archetype ?? null,
	};
}

function sessionToDTO(
	session: SessionRow,
	result: ResultRow | null,
	bfiCount: number,
	sd3Count: number
): PersonalityTestSessionDTO {
	return {
		id: session.id,
		userId: session.user_id,
		userName: session.user_name,
		status: session.status,
		demographics: {
			gender: (session.gender as 'male' | 'female' | 'other') || 'other',
			university: session.university ?? '',
			studentYear: session.student_year ?? 0,
			cumulativeGpa: session.cumulative_gpa ?? 0,
			selfRatedIntelligence: session.self_rated_intelligence ?? 0,
		},
		bfiResponseCount: bfiCount,
		sd3ResponseCount: sd3Count,
		result: result ? buildScoringResultFromRow(result) : null,
		completedAt: session.completed_at?.toISOString() ?? null,
		createdAt: session.created_at.toISOString(),
		updatedAt: session.updated_at.toISOString(),
	};
}

function sessionToHistoryDTO(
	session: SessionRow,
	result: ResultRow | null
): PersonalityTestHistoryDTO {
	const archName = result?.archetype
		? (typeof result.archetype === 'string'
				? JSON.parse(result.archetype as unknown as string)
				: result.archetype
			)?.name ?? null
		: null;

	return {
		id: session.id,
		status: session.status,
		archetype: archName,
		completedAt: session.completed_at?.toISOString() ?? null,
		createdAt: session.created_at.toISOString(),
	};
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Get test configuration (questions + scale).
 */
export function getPersonalityTestConfig(): TestConfigDTO {
	return getTestConfig();
}

/** Re-export for components that import from the service */
export { DOMAIN_LABELS_VI };

/**
 * Get a user's test history (most recent first).
 */
export async function getUserTestHistory(
	userId: string
): Promise<PersonalityTestHistoryDTO[]> {
	const sessions = await findSessionsByUserId(userId, 20);
	const dtos: PersonalityTestHistoryDTO[] = [];

	for (const session of sessions) {
		const result = await findResultBySessionId(session.id);
		dtos.push(sessionToHistoryDTO(session, result));
	}
	return dtos;
}

/**
 * Get a specific test session with full results.
 * Returns null if not found or not authorized.
 */
export async function getTestSession(
	sessionId: string,
	userId: string,
	isAdmin = false
): Promise<PersonalityTestSessionDTO | null> {
	const session = await findSessionById(sessionId);
	if (!session) return null;
	if (!isAdmin && session.user_id !== userId) return null;

	const [result, responses] = await Promise.all([
		findResultBySessionId(sessionId),
		findResponsesBySessionId(sessionId),
	]);

	const bfiCount = responses.filter((r) => r.test_type === 'BFI2S').length;
	const sd3Count = responses.filter((r) => r.test_type === 'SD3').length;

	return sessionToDTO(session, result, bfiCount, sd3Count);
}

/**
 * Submit a completed personality test.
 * 1. Creates a session with demographic data and responses
 * 2. Scores the responses
 * 3. Inserts the result
 * 4. Calculates percentiles
 */
export async function submitPersonalityTest(
	userId: string,
	userName: string,
	demographics: DemographicData,
	responses: RawResponse[],
	durationSeconds: number
): Promise<PersonalityTestSessionDTO> {
	// 1. Score the test
	const scoringResult = scorePersonalityTest(responses);

	const status = scoringResult.isValid ? 'completed' : 'invalid';

	// 2. Create session + insert responses (in transaction)
	const sessionId = await createSession({
		userId,
		userName,
		demographics,
		responses,
		durationSeconds,
		status,
	});

	// 3. Insert scoring result
	await insertResult({ sessionId, result: scoringResult });

	// 4. Calculate and update percentiles if scores are available
	// (scores are computed even for attention-check-failed sessions)
	if (scoringResult.ocean && scoringResult.darkTriad) {
		const percentiles = await calculateAndUpdatePercentiles(
			sessionId,
			scoringResult,
			demographics.gender
		);
		// Update the result with percentile data for the DTO
		if (percentiles && scoringResult.ocean && scoringResult.darkTriad) {
			for (const [domain, pct] of Object.entries(percentiles)) {
				const oceanObj = scoringResult.ocean as unknown as Record<string, TraitScore>;
				const darkObj = scoringResult.darkTriad as unknown as Record<string, TraitScore>;
				if (domain in scoringResult.ocean) {
					oceanObj[domain].percentile = pct;
				}
				if (domain in scoringResult.darkTriad) {
					darkObj[domain].percentile = pct;
				}
			}
		}
	}

	// 5. Build and return DTO
	const session = await findSessionById(sessionId);
	if (!session) throw new Error('Session not found after creation');

	const bfiCount = responses.filter((r) => r.testType === 'BFI2S').length;
	const sd3Count = responses.filter((r) => r.testType === 'SD3').length;

	const resultRow = await findResultBySessionId(sessionId);

	return sessionToDTO(session, resultRow, bfiCount, sd3Count);
}

/**
 * Calculate normative percentile ranks for a session's scores.
 * Uses published reference group norms (BFI-2 & SD3) instead of DB-rank.
 * Applies gender-specific Study 1 norms for SD3 when gender is provided.
 */
async function calculateAndUpdatePercentiles(
	sessionId: string,
	scoringResult: ScoringResult,
	gender?: 'male' | 'female' | 'other'
): Promise<Record<string, number> | null> {
	if (!scoringResult.ocean || !scoringResult.darkTriad) return null;

	// Build a scores map for the normative calculator
	const scores: Partial<Record<string, number>> = {
		extraversion: scoringResult.ocean.extraversion.score,
		agreeableness: scoringResult.ocean.agreeableness.score,
		conscientiousness: scoringResult.ocean.conscientiousness.score,
		negativeEmotionality: scoringResult.ocean.negativeEmotionality.score,
		openMindedness: scoringResult.ocean.openMindedness.score,
		machiavellianism: scoringResult.darkTriad.machiavellianism.score,
		narcissism: scoringResult.darkTriad.narcissism.score,
		psychopathy: scoringResult.darkTriad.psychopathy.score,
	};

	// Calculate normative percentiles using gender-specific reference groups
	const defaults = getDefaultReferenceGroupIds(gender);
	const normativeResults = calculateNormativePercentiles(
		scores as Partial<Record<import('@/types/personalityTest').PersonalityDomain, number>>,
		defaults.ocean,
		defaults.darkTriad,
		gender
	);

	// Extract just the percentile numbers for DB storage
	const percentiles: Record<string, number> = {};
	for (const [domain, result] of Object.entries(normativeResults)) {
		percentiles[domain] = result.percentile;
	}

	await updatePercentiles(sessionId, percentiles);
	return percentiles;
}

/**
 * Calculate percentiles for arbitrary reference groups (on-demand).
 * Used when the user selects different reference groups in the UI.
 */
export function calculatePercentilesForGroups(
	scores: Partial<Record<import('@/types/personalityTest').PersonalityDomain, number>>,
	oceanGroupId?: string,
	darkTriadGroupId?: string,
	gender?: 'male' | 'female' | 'other'
): Record<string, PercentileResult> {
	return calculateNormativePercentiles(scores, oceanGroupId, darkTriadGroupId, gender);
}

// ─── Admin Queries ─────────────────────────────────────────────────────────────

/**
 * Get aggregate statistics for the admin dashboard.
 */
export async function getPersonalityTestStats(): Promise<{
	totalSessions: number;
	validSessions: number;
	invalidSessions: number;
	averageScores: Record<string, number>;
	archetypeDistribution: Record<string, number>;
}> {
	const [counts, archetypeDist, averageScores] = await Promise.all([
		countSessionsByStatus(),
		getArchetypeDistribution(),
		getAverageScores(),
	]);

	const totalSessions = counts.reduce((sum, c) => sum + c.count, 0);
	const validSessions =
		counts.find((c) => c.status === 'completed')?.count ?? 0;
	const invalidSessions =
		counts.find((c) => c.status === 'invalid')?.count ?? 0;

	return {
		totalSessions,
		validSessions,
		invalidSessions,
		averageScores,
		archetypeDistribution: archetypeDist,
	};
}
