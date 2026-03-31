/* ════════════════════════════════════════════════════════════════════════
   GET /api/personality-test/public-report

   Public (password-protected) aggregate report endpoint.

   Query params:
     password   Required — must match the configured shared password.

   Returns aggregate-only data — NO individual session details,
   NO raw responses, NO ability to export/download.
   ════════════════════════════════════════════════════════════════════════ */

import { type NextRequest, NextResponse } from 'next/server';

import { pgPool } from '@/lib/pgPool';
import { apiError } from '@/lib/apiUtils';

// ─── Shared password for public access ─────────────────────────────────────────
const PUBLIC_REPORT_PASSWORD = '123567!@#';

// ─── Aggregate query helpers ───────────────────────────────────────────────────

async function getOverviewStats() {
	const { rows } = await pgPool.query<{
		total: string;
		valid: string;
		invalid: string;
		avg_duration: string;
	}>(`
		SELECT
			COUNT(*)::int                                    AS total,
			COUNT(*) FILTER (WHERE r.is_valid = true)::int   AS valid,
			COUNT(*) FILTER (WHERE r.is_valid = false)::int  AS invalid,
			ROUND(AVG(s.duration_seconds) FILTER (WHERE r.is_valid = true))::int AS avg_duration
		FROM personality_test_sessions s
		LEFT JOIN personality_test_results r ON r.session_id = s.id
		WHERE s.status IN ('completed', 'invalid')
	`);
	const row = rows[0];
	return {
		total: Number(row?.total ?? 0),
		valid: Number(row?.valid ?? 0),
		invalid: Number(row?.invalid ?? 0),
		avgDurationSeconds: Number(row?.avg_duration ?? 0),
	};
}

async function getAverageScores() {
	const { rows } = await pgPool.query<Record<string, string>>(`
		SELECT
			ROUND(AVG(extraversion), 2)           AS extraversion,
			ROUND(AVG(agreeableness), 2)          AS agreeableness,
			ROUND(AVG(conscientiousness), 2)      AS conscientiousness,
			ROUND(AVG(negative_emotionality), 2)  AS negative_emotionality,
			ROUND(AVG(open_mindedness), 2)        AS open_mindedness,
			ROUND(AVG(machiavellianism), 2)       AS machiavellianism,
			ROUND(AVG(narcissism), 2)             AS narcissism,
			ROUND(AVG(psychopathy), 2)            AS psychopathy
		FROM personality_test_results
		WHERE is_valid = true
	`);
	const row = rows[0];
	if (!row) return {};
	const result: Record<string, number> = {};
	for (const [key, value] of Object.entries(row)) {
		if (value != null) result[key] = Number(value);
	}
	return result;
}

async function getScoreStdDevs() {
	const { rows } = await pgPool.query<Record<string, string>>(`
		SELECT
			ROUND(STDDEV_SAMP(extraversion)::numeric, 2)           AS extraversion,
			ROUND(STDDEV_SAMP(agreeableness)::numeric, 2)          AS agreeableness,
			ROUND(STDDEV_SAMP(conscientiousness)::numeric, 2)      AS conscientiousness,
			ROUND(STDDEV_SAMP(negative_emotionality)::numeric, 2)  AS negative_emotionality,
			ROUND(STDDEV_SAMP(open_mindedness)::numeric, 2)        AS open_mindedness,
			ROUND(STDDEV_SAMP(machiavellianism)::numeric, 2)       AS machiavellianism,
			ROUND(STDDEV_SAMP(narcissism)::numeric, 2)             AS narcissism,
			ROUND(STDDEV_SAMP(psychopathy)::numeric, 2)            AS psychopathy
		FROM personality_test_results
		WHERE is_valid = true
	`);
	const row = rows[0];
	if (!row) return {};
	const result: Record<string, number> = {};
	for (const [key, value] of Object.entries(row)) {
		if (value != null) result[key] = Number(value);
	}
	return result;
}

async function getArchetypeDistribution() {
	const { rows } = await pgPool.query<{ name: string; count: string }>(`
		SELECT archetype->>'name' AS name, COUNT(*)::int AS count
		FROM personality_test_results
		WHERE is_valid = true AND archetype IS NOT NULL
		GROUP BY archetype->>'name'
		ORDER BY count DESC
	`);
	return rows
		.filter((r) => r.name)
		.map((r) => ({ name: r.name, count: Number(r.count) }));
}

async function getGenderDistribution() {
	const { rows } = await pgPool.query<{ gender: string; count: string }>(`
		SELECT COALESCE(s.gender, 'unknown') AS gender, COUNT(*)::int AS count
		FROM personality_test_sessions s
		JOIN personality_test_results r ON r.session_id = s.id
		WHERE r.is_valid = true
		GROUP BY s.gender
		ORDER BY count DESC
	`);
	return rows.map((r) => ({ gender: r.gender ?? 'unknown', count: Number(r.count) }));
}

async function getUniversityDistribution() {
	const { rows } = await pgPool.query<{ university: string; count: string }>(`
		SELECT COALESCE(s.university, 'Không rõ') AS university, COUNT(*)::int AS count
		FROM personality_test_sessions s
		JOIN personality_test_results r ON r.session_id = s.id
		WHERE r.is_valid = true
		GROUP BY s.university
		ORDER BY count DESC
		LIMIT 20
	`);
	return rows.map((r) => ({ university: r.university, count: Number(r.count) }));
}

async function getReliabilityOverview() {
	const { rows } = await pgPool.query<{ flag: string; count: string }>(`
		SELECT COALESCE(reliability_flag, 'unknown') AS flag, COUNT(*)::int AS count
		FROM personality_test_results
		WHERE is_valid = true
		GROUP BY reliability_flag
		ORDER BY count DESC
	`);
	return rows.map((r) => ({ flag: r.flag, count: Number(r.count) }));
}

async function getScoreDistributions() {
	// Return histogram buckets (1.0-1.5, 1.5-2.0, ..., 4.5-5.0) for each trait
	const traits = [
		'extraversion', 'agreeableness', 'conscientiousness',
		'negative_emotionality', 'open_mindedness',
		'machiavellianism', 'narcissism', 'psychopathy',
	];

	const result: Record<string, Array<{ bucket: string; count: number }>> = {};

	for (const trait of traits) {
		const { rows } = await pgPool.query<{ bucket: string; count: string }>(`
			SELECT
				CONCAT(
					FLOOR(${trait} * 2) / 2,
					'–',
					FLOOR(${trait} * 2) / 2 + 0.5
				) AS bucket,
				COUNT(*)::int AS count
			FROM personality_test_results
			WHERE is_valid = true AND ${trait} IS NOT NULL
			GROUP BY FLOOR(${trait} * 2)
			ORDER BY FLOOR(${trait} * 2)
		`);
		result[trait] = rows.map((r) => ({ bucket: r.bucket, count: Number(r.count) }));
	}

	return result;
}

async function getCompletionTimeline() {
	const { rows } = await pgPool.query<{ date: string; count: string }>(`
		SELECT
			TO_CHAR(s.completed_at, 'YYYY-MM-DD') AS date,
			COUNT(*)::int AS count
		FROM personality_test_sessions s
		JOIN personality_test_results r ON r.session_id = s.id
		WHERE r.is_valid = true AND s.completed_at IS NOT NULL
		GROUP BY TO_CHAR(s.completed_at, 'YYYY-MM-DD')
		ORDER BY date
	`);
	return rows.map((r) => ({ date: r.date, count: Number(r.count) }));
}

async function getAverageScoresByGender() {
	const { rows } = await pgPool.query<Record<string, string>>(`
		SELECT
			COALESCE(s.gender, 'unknown') AS gender,
			ROUND(AVG(r.extraversion), 2) AS extraversion,
			ROUND(AVG(r.agreeableness), 2) AS agreeableness,
			ROUND(AVG(r.conscientiousness), 2) AS conscientiousness,
			ROUND(AVG(r.negative_emotionality), 2) AS negative_emotionality,
			ROUND(AVG(r.open_mindedness), 2) AS open_mindedness,
			ROUND(AVG(r.machiavellianism), 2) AS machiavellianism,
			ROUND(AVG(r.narcissism), 2) AS narcissism,
			ROUND(AVG(r.psychopathy), 2) AS psychopathy
		FROM personality_test_results r
		JOIN personality_test_sessions s ON s.id = r.session_id
		WHERE r.is_valid = true
		GROUP BY s.gender
		ORDER BY COUNT(*) DESC
	`);
	return rows.map((row) => {
		const entry: Record<string, string | number> = {};
		for (const [key, value] of Object.entries(row)) {
			entry[key] = key === 'gender' ? (value ?? 'unknown') : Number(value);
		}
		return entry;
	});
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const password = searchParams.get('password');

		if (!password || password !== PUBLIC_REPORT_PASSWORD) {
			return apiError('Sai mật khẩu truy cập.', 403);
		}

		const [
			overview,
			averageScores,
			stdDevs,
			archetypeDistribution,
			genderDistribution,
			universityDistribution,
			reliabilityOverview,
			scoreDistributions,
			completionTimeline,
			averageScoresByGender,
		] = await Promise.all([
			getOverviewStats(),
			getAverageScores(),
			getScoreStdDevs(),
			getArchetypeDistribution(),
			getGenderDistribution(),
			getUniversityDistribution(),
			getReliabilityOverview(),
			getScoreDistributions(),
			getCompletionTimeline(),
			getAverageScoresByGender(),
		]);

		return NextResponse.json({
			ok: true,
			data: {
				overview,
				averageScores,
				stdDevs,
				archetypeDistribution,
				genderDistribution,
				universityDistribution,
				reliabilityOverview,
				scoreDistributions,
				completionTimeline,
				averageScoresByGender,
			},
		});
	} catch (error) {
		console.error('[PUBLIC-REPORT] Error:', error);
		return apiError('Lỗi hệ thống, vui lòng thử lại.', 500);
	}
}
