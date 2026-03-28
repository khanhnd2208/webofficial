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
	gender: string | null;
	university: string | null;
	student_year: number | null;
	cumulative_gpa: number | null;
	self_rated_intelligence: number | null;
	status: SessionStatus;
	duration_seconds: number | null;
	device_fingerprint: string | null;
	ip_address: string | null;
	user_agent: string | null;
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
	longstring_max: number | null;
	irv: number | null;
	person_total_r: number | null;
	avg_item_time: number | null;
	reliability_flag: string | null;
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

// ─── Report Row Type ────────────────────────────────────────────────────────────

export interface ReportRow {
	// Session / demographics
	id: string;
	user_id: string;
	user_name: string;
	full_name: string | null;
	gender: string | null;
	university: string | null;
	student_year: number | null;
	cumulative_gpa: number | null;
	self_rated_intelligence: number | null;
	status: string;
	duration_seconds: number | null;
	device_fingerprint: string | null;
	ip_address: string | null;
	completed_at: Date | null;
	created_at: Date;
	// Results
	is_valid: boolean | null;
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
	archetype_name: string | null;
	// Reliability metrics
	longstring_max: number | null;
	irv: number | null;
	person_total_r: number | null;
	avg_item_time: number | null;
	reliability_flag: string | null;
	// Device duplicate count
	device_submissions: number | null;
}

/**
 * Fetch all completed sessions with joined results — for admin report.
 * Returns rows sorted by created_at DESC with an optional limit.
 */
export async function findAllSessionsForReport(
	limit = 500
): Promise<ReportRow[]> {
	const { rows } = await pgPool.query<ReportRow>(
		`SELECT
			s.id, s.user_id, s.user_name,
			s.full_name, s.gender, s.university, s.student_year, s.cumulative_gpa, s.self_rated_intelligence,
			s.status, s.duration_seconds, s.device_fingerprint, s.ip_address,
			s.completed_at, s.created_at,
			r.is_valid,
			r.extraversion, r.agreeableness, r.conscientiousness,
			r.negative_emotionality, r.open_mindedness,
			r.machiavellianism, r.narcissism, r.psychopathy,
			r.extraversion_pct, r.agreeableness_pct, r.conscientiousness_pct,
			r.negative_emotionality_pct, r.open_mindedness_pct,
			r.machiavellianism_pct, r.narcissism_pct, r.psychopathy_pct,
			r.archetype->>'name' AS archetype_name,
			r.longstring_max, r.irv, r.person_total_r, r.avg_item_time, r.reliability_flag,
			-- Count how many sessions share the same device fingerprint
			CASE
				WHEN s.device_fingerprint IS NOT NULL
				THEN (SELECT COUNT(*)::int FROM personality_test_sessions s2
				      WHERE s2.device_fingerprint = s.device_fingerprint)
				ELSE NULL
			END AS device_submissions
		 FROM personality_test_sessions s
		 LEFT JOIN personality_test_results r ON r.session_id = s.id
		 ORDER BY s.created_at DESC
		 LIMIT $1`,
		[limit]
	);
	return rows;
}

/**
 * Fetch all raw responses for a list of session IDs.
 * Returns a map: sessionId → { testType_itemNumber → value }
 * Used for the detailed Excel export.
 */
export async function findResponsesForSessions(
	sessionIds: string[]
): Promise<Map<string, Map<string, number>>> {
	if (sessionIds.length === 0) return new Map();

	const placeholders = sessionIds.map((_, i) => `$${i + 1}`).join(', ');
	const { rows } = await pgPool.query<{
		session_id: string;
		test_type: string;
		item_number: number;
		form_order: number;
		value: number;
	}>(
		`SELECT session_id, test_type, item_number, form_order, value
		 FROM personality_test_responses
		 WHERE session_id IN (${placeholders})
		 ORDER BY session_id, test_type, form_order`,
		sessionIds
	);

	const result = new Map<string, Map<string, number>>();
	for (const row of rows) {
		if (!result.has(row.session_id)) {
			result.set(row.session_id, new Map());
		}
		// Key: "BFI2S_fo1" or "SD3_fo3" (by formOrder for predictable column ordering)
		const key = `${row.test_type}_fo${row.form_order}`;
		result.get(row.session_id)!.set(key, row.value);
	}
	return result;
}

export async function countSessionsByStatus(): Promise<
	Array<{ status: string; count: number }>
> {
	const { rows } = await pgPool.query<{ status: string; count: string }>(
		'SELECT status, COUNT(*)::int AS count FROM personality_test_sessions GROUP BY status'
	);
	return rows.map((r) => ({ status: r.status, count: Number(r.count) }));
}

// ─── Deletions ─────────────────────────────────────────────────────────────────

/**
 * Bulk-delete sessions and all related data (results + responses).
 * Uses a transaction to ensure atomicity.
 * Deletes in FK-safe order: responses → results → sessions.
 *
 * @returns The number of sessions actually deleted.
 */
export async function deleteSessionsByIds(ids: string[]): Promise<number> {
	if (ids.length === 0) return 0;

	const client = await pgPool.connect();
	try {
		await client.query('BEGIN');

		const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');

		// 1. Delete responses (child of sessions)
		await client.query(
			`DELETE FROM personality_test_responses WHERE session_id IN (${placeholders})`,
			ids
		);

		// 2. Delete results (child of sessions)
		await client.query(
			`DELETE FROM personality_test_results WHERE session_id IN (${placeholders})`,
			ids
		);

		// 3. Delete sessions (parent)
		const { rowCount } = await client.query(
			`DELETE FROM personality_test_sessions WHERE id IN (${placeholders})`,
			ids
		);

		await client.query('COMMIT');
		return rowCount ?? 0;
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export async function createSession(params: {
	userId: string;
	userName: string;
	demographics: DemographicData;
	responses: RawResponse[];
	durationSeconds: number;
	status: SessionStatus;
	deviceFingerprint?: string;
	ipAddress?: string;
	userAgent?: string;
}): Promise<string> {
	const client = await pgPool.connect();
	try {
		await client.query('BEGIN');

		// 1. Insert session
		const sessionResult = await client.query<{ id: string }>(
			`INSERT INTO personality_test_sessions
				(user_id, user_name, full_name, gender, university, student_year, cumulative_gpa,
				 self_rated_intelligence, status, duration_seconds, device_fingerprint, ip_address, user_agent, completed_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
			 RETURNING id`,
			[
				params.userId,
				params.userName,
				null,
				params.demographics.gender || null,
				params.demographics.university || null,
				params.demographics.studentYear || null,
				params.demographics.cumulativeGpa || null,
				params.demographics.selfRatedIntelligence || null,
				params.status,
				params.durationSeconds,
				params.deviceFingerprint || null,
				params.ipAddress || null,
				params.userAgent || null,
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

/**
 * Update response reliability / quality metrics for a session.
 */
export async function updateReliabilityMetrics(
	sessionId: string,
	metrics: {
		longstringMax: number;
		irv: number;
		personTotalR: number | null;
		avgItemTime: number;
		reliabilityFlag: string;
	}
): Promise<void> {
	await pgPool.query(
		`UPDATE personality_test_results SET
			longstring_max = $2,
			irv = $3,
			person_total_r = $4,
			avg_item_time = $5,
			reliability_flag = $6
		 WHERE session_id = $1`,
		[
			sessionId,
			metrics.longstringMax,
			metrics.irv,
			metrics.personTotalR,
			metrics.avgItemTime,
			metrics.reliabilityFlag,
		]
	);
}

/**
 * Get the mean response pattern (by form_order) from all valid sessions.
 * Used for computing person-total correlation.
 * Returns a map: `testType_foN` → mean value
 */
export async function getMeanResponsePattern(): Promise<Map<string, number>> {
	const { rows } = await pgPool.query<{ key: string; avg_value: string }>(
		`SELECT
			test_type || '_fo' || form_order AS key,
			AVG(value)::numeric(5,3) AS avg_value
		 FROM personality_test_responses resp
		 JOIN personality_test_sessions s ON s.id = resp.session_id
		 JOIN personality_test_results r ON r.session_id = s.id
		 WHERE r.is_valid = true
		 GROUP BY test_type, form_order
		 ORDER BY test_type, form_order`
	);
	const map = new Map<string, number>();
	for (const r of rows) {
		map.set(r.key, Number(r.avg_value));
	}
	return map;
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
 * Compute local normative statistics (mean, stddev, n) for ALL 8 trait
 * domains from valid sessions stored in the database.
 *
 * Returns a Record<camelCase-domain, { mean, sd, n }> that can be fed
 * directly into the percentile engine as a dynamic ReferenceGroup.
 *
 * Uses STDDEV_SAMP (Bessel-corrected, n-1) which is the correct
 * estimator when the DB rows are a *sample* — not the whole population.
 * Falls back to 0.5 for sd when < 2 rows to avoid division-by-zero.
 */
export async function getLocalNormativeStats(): Promise<
	Record<string, { mean: number; sd: number; n: number }>
> {
	const cols = [
		{ camel: 'extraversion', sql: 'extraversion' },
		{ camel: 'agreeableness', sql: 'agreeableness' },
		{ camel: 'conscientiousness', sql: 'conscientiousness' },
		{ camel: 'negativeEmotionality', sql: 'negative_emotionality' },
		{ camel: 'openMindedness', sql: 'open_mindedness' },
		{ camel: 'machiavellianism', sql: 'machiavellianism' },
		{ camel: 'narcissism', sql: 'narcissism' },
		{ camel: 'psychopathy', sql: 'psychopathy' },
	];

	// Build a single query that computes AVG, STDDEV_SAMP, COUNT for every column
	const selects = cols.map(
		(c) =>
			`ROUND(AVG(${c.sql})::numeric, 4)          AS "${c.camel}_mean",
			 ROUND(STDDEV_SAMP(${c.sql})::numeric, 4)  AS "${c.camel}_sd",
			 COUNT(${c.sql})::int                       AS "${c.camel}_n"`
	);

	const { rows } = await pgPool.query<Record<string, string>>(
		`SELECT ${selects.join(',\n')}
		 FROM personality_test_results
		 WHERE is_valid = true`
	);

	const row = rows[0];
	if (!row) return {};

	const result: Record<string, { mean: number; sd: number; n: number }> = {};
	for (const c of cols) {
		const mean = Number(row[`${c.camel}_mean`]);
		const sd = Number(row[`${c.camel}_sd`]);
		const n = Number(row[`${c.camel}_n`]);
		if (!isNaN(mean) && n > 0) {
			result[c.camel] = {
				mean,
				sd: isNaN(sd) || sd === 0 ? 0.5 : sd, // fallback for n<2
				n,
			};
		}
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
