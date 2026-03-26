/* ════════════════════════════════════════════════════════════════════════
   Personality Test — PostgreSQL Data Access Layer
   
   Replaces the Mongoose model. Provides typed query/mutation helpers
   that work with the `pg` pool from pgPool.ts.
   ════════════════════════════════════════════════════════════════════════ */

import { pgPool } from '@/lib/pgPool';
import type {
	SessionStatus,
	DemographicData,
	RawResponse,
	ScoringResult,
	ArchetypeProfile,
} from '@/types/personalityTest';
import { BFI2S_QUESTIONS, SD3_QUESTIONS } from '@/lib/personalityScoring';

// ─── Row Types (what comes back from SQL queries) ──────────────────────────────

export interface SessionRow {
	id: string;
	user_id: string;
	user_name: string;
	full_name: string | null;
	university: string | null;
	student_year: number | null;
	cumulative_gpa: number | null;
	self_rated_intelligence: number | null;
	status: SessionStatus;
	duration_seconds: number | null;
	completed_at: Date | null;
	created_at: Date;
	updated_at: Date;
}

export interface ResultRow {
	session_id: string;
	is_valid: boolean;
	invalid_reason: string | null;
	extraversion: number | null;
	agreeableness: number | null;
	conscientiousness: number | null;
	negative_emotionality: number | null;
	open_mindedness: number | null;
	machiavellianism: number | null;
	narcissism: number | null;
	psychopathy: number | null;
	extraversion_pct: number | null;
	agreeableness_pct: number | null;
	conscientiousness_pct: number | null;
	negative_emotionality_pct: number | null;
	open_mindedness_pct: number | null;
	machiavellianism_pct: number | null;
	narcissism_pct: number | null;
	psychopathy_pct: number | null;
	archetype: ArchetypeProfile | null;
}

export interface ResponseRow {
	id: string;
	session_id: string;
	test_type: string;
	item_number: number;
	form_order: number;
	value: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Build a formOrder lookup from the question configs */
function getFormOrder(testType: string, itemNumber: number): number {
	const allQuestions = [...BFI2S_QUESTIONS, ...SD3_QUESTIONS];
	const q = allQuestions.find(
		(x) => x.testType === testType && x.itemNumber === itemNumber
	);
	return q?.formOrder ?? 0;
}

// ─── Queries ───────────────────────────────────────────────────────────────────

export async function findSessionById(
	sessionId: string
): Promise<SessionRow | null> {
	const { rows } = await pgPool.query<SessionRow>(
		'SELECT * FROM personality_test_sessions WHERE id = $1',
		[sessionId]
	);
	return rows[0] ?? null;
}

export async function findResultBySessionId(
	sessionId: string
): Promise<ResultRow | null> {
	const { rows } = await pgPool.query<ResultRow>(
		'SELECT * FROM personality_test_results WHERE session_id = $1',
		[sessionId]
	);
	return rows[0] ?? null;
}

export async function findResponsesBySessionId(
	sessionId: string
): Promise<ResponseRow[]> {
	const { rows } = await pgPool.query<ResponseRow>(
		'SELECT * FROM personality_test_responses WHERE session_id = $1 ORDER BY form_order',
		[sessionId]
	);
	return rows;
}

export async function findSessionsByUserId(
	userId: string,
	limit = 20
): Promise<SessionRow[]> {
	const { rows } = await pgPool.query<SessionRow>(
		'SELECT * FROM personality_test_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
		[userId, limit]
	);
	return rows;
}

export async function countSessionsByStatus(): Promise<
	Array<{ status: string; count: number }>
> {
	const { rows } = await pgPool.query<{ status: string; count: string }>(
		'SELECT status, COUNT(*)::int AS count FROM personality_test_sessions GROUP BY status'
	);
	return rows.map((r) => ({ status: r.status, count: Number(r.count) }));
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export async function createSession(params: {
	userId: string;
	userName: string;
	demographics: DemographicData;
	responses: RawResponse[];
	durationSeconds: number;
	status: SessionStatus;
}): Promise<string> {
	const client = await pgPool.connect();
	try {
		await client.query('BEGIN');

		// 1. Insert session
		const sessionResult = await client.query<{ id: string }>(
			`INSERT INTO personality_test_sessions
				(user_id, user_name, full_name, university, student_year, cumulative_gpa,
				 self_rated_intelligence, status, duration_seconds, completed_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			 RETURNING id`,
			[
				params.userId,
				params.userName,
				params.demographics.fullName || null,
				params.demographics.university || null,
				params.demographics.studentYear || null,
				params.demographics.cumulativeGpa || null,
				params.demographics.selfRatedIntelligence || null,
				params.status,
				params.durationSeconds,
				params.status === 'completed' || params.status === 'invalid'
					? new Date()
					: null,
			]
		);
		const sessionId = sessionResult.rows[0].id;

		// 2. Batch-insert responses
		if (params.responses.length > 0) {
			const values: unknown[] = [];
			const placeholders: string[] = [];
			let idx = 1;

			for (const r of params.responses) {
				const formOrder = getFormOrder(r.testType, r.itemNumber);
				placeholders.push(
					`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4})`
				);
				values.push(sessionId, r.testType, r.itemNumber, formOrder, r.value);
				idx += 5;
			}

			await client.query(
				`INSERT INTO personality_test_responses (session_id, test_type, item_number, form_order, value)
				 VALUES ${placeholders.join(', ')}`,
				values
			);
		}

		await client.query('COMMIT');
		return sessionId;
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
}

export async function insertResult(params: {
	sessionId: string;
	result: ScoringResult;
}): Promise<void> {
	const { sessionId, result } = params;

	await pgPool.query(
		`INSERT INTO personality_test_results
			(session_id, is_valid, invalid_reason,
			 extraversion, agreeableness, conscientiousness, negative_emotionality, open_mindedness,
			 machiavellianism, narcissism, psychopathy,
			 archetype)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		 ON CONFLICT (session_id) DO UPDATE SET
			is_valid = EXCLUDED.is_valid,
			invalid_reason = EXCLUDED.invalid_reason,
			extraversion = EXCLUDED.extraversion,
			agreeableness = EXCLUDED.agreeableness,
			conscientiousness = EXCLUDED.conscientiousness,
			negative_emotionality = EXCLUDED.negative_emotionality,
			open_mindedness = EXCLUDED.open_mindedness,
			machiavellianism = EXCLUDED.machiavellianism,
			narcissism = EXCLUDED.narcissism,
			psychopathy = EXCLUDED.psychopathy,
			archetype = EXCLUDED.archetype`,
		[
			sessionId,
			result.isValid,
			result.invalidReason ?? null,
			result.ocean?.extraversion.score ?? null,
			result.ocean?.agreeableness.score ?? null,
			result.ocean?.conscientiousness.score ?? null,
			result.ocean?.negativeEmotionality.score ?? null,
			result.ocean?.openMindedness.score ?? null,
			result.darkTriad?.machiavellianism.score ?? null,
			result.darkTriad?.narcissism.score ?? null,
			result.darkTriad?.psychopathy.score ?? null,
			result.archetype ? JSON.stringify(result.archetype) : null,
		]
	);
}

export async function updatePercentiles(
	sessionId: string,
	percentiles: Record<string, number>
): Promise<void> {
	await pgPool.query(
		`UPDATE personality_test_results SET
			extraversion_pct = $2,
			agreeableness_pct = $3,
			conscientiousness_pct = $4,
			negative_emotionality_pct = $5,
			open_mindedness_pct = $6,
			machiavellianism_pct = $7,
			narcissism_pct = $8,
			psychopathy_pct = $9
		 WHERE session_id = $1`,
		[
			sessionId,
			percentiles.extraversion ?? null,
			percentiles.agreeableness ?? null,
			percentiles.conscientiousness ?? null,
			percentiles.negativeEmotionality ?? null,
			percentiles.openMindedness ?? null,
			percentiles.machiavellianism ?? null,
			percentiles.narcissism ?? null,
			percentiles.psychopathy ?? null,
		]
	);
}

export async function getArchetypeDistribution(): Promise<
	Record<string, number>
> {
	const { rows } = await pgPool.query<{ name: string; count: string }>(
		`SELECT archetype->>'name' AS name, COUNT(*)::int AS count
		 FROM personality_test_results
		 WHERE is_valid = true AND archetype IS NOT NULL
		 GROUP BY archetype->>'name'
		 ORDER BY count DESC`
	);
	const result: Record<string, number> = {};
	for (const r of rows) {
		if (r.name) result[r.name] = Number(r.count);
	}
	return result;
}

export async function getAverageScores(): Promise<Record<string, number>> {
	const { rows } = await pgPool.query<Record<string, string>>(
		`SELECT
			ROUND(AVG(extraversion), 2)           AS extraversion,
			ROUND(AVG(agreeableness), 2)          AS agreeableness,
			ROUND(AVG(conscientiousness), 2)      AS conscientiousness,
			ROUND(AVG(negative_emotionality), 2)  AS negative_emotionality,
			ROUND(AVG(open_mindedness), 2)        AS open_mindedness,
			ROUND(AVG(machiavellianism), 2)       AS machiavellianism,
			ROUND(AVG(narcissism), 2)             AS narcissism,
			ROUND(AVG(psychopathy), 2)            AS psychopathy
		 FROM personality_test_results
		 WHERE is_valid = true`
	);
	const row = rows[0];
	if (!row) return {};

	const result: Record<string, number> = {};
	for (const [key, value] of Object.entries(row)) {
		if (value != null) result[key] = Number(value);
	}
	return result;
}

/**
 * Calculate percentile rank for a given domain score.
 * Uses: (count of scores below this score / total valid sessions) * 100
 */
export async function calculatePercentileForDomain(
	domain: string,
	score: number
): Promise<number> {
	// Map camelCase domain names to snake_case column names
	const columnMap: Record<string, string> = {
		extraversion: 'extraversion',
		agreeableness: 'agreeableness',
		conscientiousness: 'conscientiousness',
		negativeEmotionality: 'negative_emotionality',
		openMindedness: 'open_mindedness',
		machiavellianism: 'machiavellianism',
		narcissism: 'narcissism',
		psychopathy: 'psychopathy',
	};
	const column = columnMap[domain];
	if (!column) return 50;

	const { rows } = await pgPool.query<{ below: string; total: string }>(
		`SELECT
			COUNT(*) FILTER (WHERE ${column} < $1) AS below,
			COUNT(*) AS total
		 FROM personality_test_results
		 WHERE is_valid = true AND ${column} IS NOT NULL`,
		[score]
	);
	const { below, total } = rows[0];
	if (Number(total) === 0) return 50;
	return Math.round((Number(below) / Number(total)) * 100);
}
