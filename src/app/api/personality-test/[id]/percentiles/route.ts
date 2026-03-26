/* ════════════════════════════════════════════════════════════════════════
   GET /api/personality-test/[id]/percentiles
   
   Calculate percentiles for a test session using specific reference groups.
   
   Query params:
     oceanGroup       Reference group ID for BFI-2 (default: bfi2-internet)
     darkTriadGroup   Reference group ID for SD3 (default: sd3-community)
   
   Returns:
     { percentiles: Record<domain, PercentileResult>, referenceGroups: [...] }
   ════════════════════════════════════════════════════════════════════════ */

import { type NextRequest } from 'next/server';

import { withAuth, apiSuccess, apiError } from '@/lib/apiUtils';
import { getTestSession, calculatePercentilesForGroups } from '@/services/personalityTestService';
import {
	REFERENCE_GROUPS,
	getReferenceGroupById,
	getDefaultReferenceGroupIds,
	getReferenceGroupOptions,
} from '@/lib/normativeData';
import type { PersonalityDomain } from '@/types/personalityTest';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/personality-test/:id/percentiles?oceanGroup=...&darkTriadGroup=...
 * 
 * Returns normative percentiles for the given test session,
 * calculated against the specified (or default) reference groups.
 */
export const GET = withAuth(async (request: NextRequest, user, context?) => {
	const { id } = await (context as RouteContext).params;

	if (!id || typeof id !== 'string') {
		return apiError('Session ID is required', 400);
	}

	const isAdmin = user.role === 'admin';
	const session = await getTestSession(id, user.id, isAdmin);

	if (!session) {
		return apiError('Test session not found', 404);
	}

	if (!session.result?.isValid || !session.result.ocean || !session.result.darkTriad) {
		return apiError('Test session has no valid results', 400);
	}

	// Parse reference group preferences from query params
	const { searchParams } = new URL(request.url);
	const defaults = getDefaultReferenceGroupIds();
	const oceanGroupId = searchParams.get('oceanGroup') || defaults.ocean;
	const darkTriadGroupId = searchParams.get('darkTriadGroup') || defaults.darkTriad;

	// Validate reference group IDs
	if (!getReferenceGroupById(oceanGroupId)) {
		return apiError(`Invalid OCEAN reference group: ${oceanGroupId}`, 400);
	}
	if (!getReferenceGroupById(darkTriadGroupId)) {
		return apiError(`Invalid Dark Triad reference group: ${darkTriadGroupId}`, 400);
	}

	// Build scores map from the session result
	const { ocean, darkTriad } = session.result;
	const scores: Partial<Record<PersonalityDomain, number>> = {
		extraversion: ocean.extraversion.score,
		agreeableness: ocean.agreeableness.score,
		conscientiousness: ocean.conscientiousness.score,
		negativeEmotionality: ocean.negativeEmotionality.score,
		openMindedness: ocean.openMindedness.score,
		machiavellianism: darkTriad.machiavellianism.score,
		narcissism: darkTriad.narcissism.score,
		psychopathy: darkTriad.psychopathy.score,
	};

	// Calculate percentiles
	const percentiles = calculatePercentilesForGroups(scores, oceanGroupId, darkTriadGroupId);

	// Return percentiles + available reference groups for UI dropdowns
	return apiSuccess({
		sessionId: id,
		percentiles,
		selectedGroups: {
			ocean: oceanGroupId,
			darkTriad: darkTriadGroupId,
		},
		availableGroups: getReferenceGroupOptions(),
		referenceGroupDetails: {
			ocean: REFERENCE_GROUPS.find(g => g.id === oceanGroupId),
			darkTriad: REFERENCE_GROUPS.find(g => g.id === darkTriadGroupId),
		},
	});
});
