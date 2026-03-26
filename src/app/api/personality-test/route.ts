/* GET /api/personality-test — Get test config (+ user history if logged in) */
/* POST /api/personality-test — Submit a completed test (no login required) */

import { type NextRequest } from 'next/server';

import { withAuth, withErrorHandling, apiSuccess, apiError } from '@/lib/apiUtils';
import {
	getPersonalityTestConfig,
	getUserTestHistory,
	submitPersonalityTest,
} from '@/services/personalityTestService';
import { getApiUser } from '@/lib/apiAuth';
import type { RawResponse, DemographicData } from '@/types/personalityTest';

/**
 * GET /api/personality-test
 * Returns test configuration (questions) and user's history if logged in.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
	const user = await getApiUser(request);
	const [config, history] = await Promise.all([
		getPersonalityTestConfig(),
		user?.id ? getUserTestHistory(user.id) : Promise.resolve([]),
	]);

	return apiSuccess({ config, history });
});

/**
 * POST /api/personality-test
 * Submit a completed personality test for scoring.
 * NO LOGIN REQUIRED — anonymous users can take the test.
 * Body: { demographics: DemographicData, responses: RawResponse[], durationSeconds?: number }
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
	const user = await getApiUser(request);
	const body = await request.json();

	const { demographics, responses, durationSeconds } = body as {
		demographics?: DemographicData;
		responses?: RawResponse[];
		durationSeconds?: number;
	};

	// ── Validate demographics ──
	if (!demographics || typeof demographics !== 'object') {
		return apiError('Missing demographic data', 400);
	}

	// ── Validate responses ──
	if (!Array.isArray(responses) || responses.length === 0) {
		return apiError('Responses array is required', 400);
	}

	// Validate each response has required fields
	for (const r of responses) {
		if (!r.testType || !r.itemNumber || !r.value) {
			return apiError('Each response must have testType, itemNumber, and value', 400);
		}
		if (!['BFI2S', 'SD3'].includes(r.testType)) {
			return apiError(`Invalid testType: ${r.testType}`, 400);
		}
		if (typeof r.value !== 'number' || r.value < 1 || r.value > 5) {
			return apiError(`Invalid value for ${r.testType} item ${r.itemNumber}: ${r.value}`, 400);
		}
	}

	// Expected: 31 BFI (30 scored + 1 attention) + 28 SD3 (27 scored + 1 attention) = 59
	const EXPECTED_TOTAL = 59;
	if (responses.length !== EXPECTED_TOTAL) {
		return apiError(`Expected ${EXPECTED_TOTAL} responses (31 BFI + 28 SD3, including attention checks), got ${responses.length}`, 400);
	}

	// For anonymous users, use a deterministic anonymous ID based on name
	const userId = user?.id ?? `anon-${Date.now()}`;
	const userName = user?.name ?? 'Anonymous';

	const session = await submitPersonalityTest(
		userId,
		userName,
		demographics,
		responses,
		typeof durationSeconds === 'number' ? durationSeconds : 0
	);

	return apiSuccess(session, 201);
});
