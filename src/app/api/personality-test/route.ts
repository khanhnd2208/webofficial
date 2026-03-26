/* GET /api/personality-test — Get test config + user history */
/* POST /api/personality-test — Submit a completed test (demographics + responses) */

import { type NextRequest } from 'next/server';

import { withAuth, apiSuccess, apiError } from '@/lib/apiUtils';
import {
	getPersonalityTestConfig,
	getUserTestHistory,
	submitPersonalityTest,
} from '@/services/personalityTestService';
import type { RawResponse, DemographicData } from '@/types/personalityTest';

/**
 * GET /api/personality-test
 * Returns test configuration (questions) and user's history.
 * Requires authentication.
 */
export const GET = withAuth(async (_request: NextRequest, user) => {
	const [config, history] = await Promise.all([
		getPersonalityTestConfig(),
		getUserTestHistory(user.id),
	]);

	return apiSuccess({ config, history });
});

/**
 * POST /api/personality-test
 * Submit a completed personality test for scoring.
 * Body: { demographics: DemographicData, responses: RawResponse[], durationSeconds?: number }
 */
export const POST = withAuth(async (request: NextRequest, user) => {
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
	if (!demographics.fullName?.trim()) {
		return apiError('Họ và Tên is required', 400);
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

	// Expected: 30 BFI + 27 SD3 = 57
	if (responses.length !== 57) {
		return apiError(`Expected 57 responses (30 BFI + 27 SD3), got ${responses.length}`, 400);
	}

	const session = await submitPersonalityTest(
		user.id,
		user.name ?? demographics.fullName ?? 'Anonymous',
		demographics,
		responses,
		typeof durationSeconds === 'number' ? durationSeconds : 0
	);

	return apiSuccess(session, 201);
});
