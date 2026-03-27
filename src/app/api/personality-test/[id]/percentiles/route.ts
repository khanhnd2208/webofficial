/* ════════════════════════════════════════════════════════════════════════
   GET /api/personality-test/[id]/percentiles
   
   Calculate percentiles for a test session using specific reference groups.
   
   Query params:
     oceanGroup       Reference group ID for BFI-2 (default: bfi2-internet)
     darkTriadGroup   Reference group ID for SD3 (default: sd3-community)
   
   Supports local norms: pass oceanGroup=local-ocean or darkTriadGroup=local-darktriad
   to compare against the platform's own student database.
   
   Returns:
     { percentiles: Record<domain, PercentileResult>, referenceGroups: [...] }
   ════════════════════════════════════════════════════════════════════════ */

import { type NextRequest } from 'next/server';

import { withErrorHandling, apiSuccess, apiError } from '@/lib/apiUtils';
import { getApiUser } from '@/lib/apiAuth';
import { getTestSession, calculatePercentilesForGroups } from '@/services/personalityTestService';
import {
	REFERENCE_GROUPS,
	getReferenceGroupById,
	getDefaultReferenceGroupIds,
	getReferenceGroupOptions,
	LOCAL_OCEAN_GROUP_ID,
	LOCAL_DARKTRIAD_GROUP_ID,
	buildLocalReferenceGroup,
} from '@/lib/normativeData';
import { getLocalNormativeStats } from '@/models/PersonalityTest';
import type { PersonalityDomain } from '@/types/personalityTest';
import type { ReferenceGroup } from '@/lib/normative';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/personality-test/:id/percentiles?oceanGroup=...&darkTriadGroup=...
 * No login required — returns normative percentiles for any session.
 */
export const GET = withErrorHandling(async (request: NextRequest, context?) => {
	const { id } = await (context as RouteContext).params;

	if (!id || typeof id !== 'string') {
		return apiError('Session ID is required', 400);
	}

	const user = await getApiUser(request);
	const isAdmin = user?.role === 'admin';
	const allowAll = !user || isAdmin;

	const session = await getTestSession(id, user?.id ?? '__anonymous__', allowAll);

	if (!session) {
		return apiError('Test session not found', 404);
	}

	// Allow percentile lookup if scores exist — even for attention-check failures.
	// isValid=false + scores present = "scored but flagged" sessions should still see percentiles.
	if (!session.result?.ocean || !session.result?.darkTriad) {
		return apiError('Test session has no valid results', 400);
	}

	// Parse reference group preferences from query params
	const { searchParams } = new URL(request.url);
	const defaults = getDefaultReferenceGroupIds();
	const oceanGroupId = searchParams.get('oceanGroup') || defaults.ocean;
	const darkTriadGroupId = searchParams.get('darkTriadGroup') || defaults.darkTriad;

	// ── Handle local norms ──────────────────────────────────────────────────
	const needsLocal =
		oceanGroupId === LOCAL_OCEAN_GROUP_ID ||
		darkTriadGroupId === LOCAL_DARKTRIAD_GROUP_ID;

	let localOceanGroup: ReferenceGroup | undefined;
	let localDtGroup: ReferenceGroup | undefined;
	const dynamicGroups: Record<string, ReferenceGroup> = {};

	if (needsLocal) {
		const localStats = await getLocalNormativeStats();
		if (oceanGroupId === LOCAL_OCEAN_GROUP_ID) {
			localOceanGroup = buildLocalReferenceGroup('ocean', localStats);
			dynamicGroups[LOCAL_OCEAN_GROUP_ID] = localOceanGroup;
		}
		if (darkTriadGroupId === LOCAL_DARKTRIAD_GROUP_ID) {
			localDtGroup = buildLocalReferenceGroup('darkTriad', localStats);
			dynamicGroups[LOCAL_DARKTRIAD_GROUP_ID] = localDtGroup;
		}
	}

	// Validate non-local reference group IDs
	if (oceanGroupId !== LOCAL_OCEAN_GROUP_ID && !getReferenceGroupById(oceanGroupId)) {
		return apiError(`Invalid OCEAN reference group: ${oceanGroupId}`, 400);
	}
	if (darkTriadGroupId !== LOCAL_DARKTRIAD_GROUP_ID && !getReferenceGroupById(darkTriadGroupId)) {
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

	// Calculate percentiles (with dynamic groups for local norms)
	const percentiles = calculatePercentilesForGroups(
		scores, oceanGroupId, darkTriadGroupId, undefined, dynamicGroups
	);

	// ── Build available groups list (include local options) ──────────────
	const staticOptions = getReferenceGroupOptions();

	// Fetch local stats to include local norms in the selector (with real n)
	// If we already fetched for the computation above, reuse; otherwise fetch now
	let localStatsForSelector: Record<string, { mean: number; sd: number; n: number }> | null = null;
	if (!needsLocal) {
		try {
			localStatsForSelector = await getLocalNormativeStats();
		} catch { /* ignore — local norms optional */ }
	}

	// Add local groups to available groups list
	const localOceanN = localOceanGroup
		? Object.values(localOceanGroup.norms)[0]?.n ?? 0
		: localStatsForSelector
			? (localStatsForSelector['extraversion']?.n ?? 0)
			: 0;
	const localDtN = localDtGroup
		? Object.values(localDtGroup.norms)[0]?.n ?? 0
		: localStatsForSelector
			? (localStatsForSelector['machiavellianism']?.n ?? 0)
			: 0;

	const MIN_LOCAL_N = 10; // require at least 10 valid sessions for local norms

	const availableGroups = [
		...staticOptions,
		...(localOceanN >= MIN_LOCAL_N ? [{
			id: LOCAL_OCEAN_GROUP_ID,
			label: `Local Student Norms (n=${localOceanN})`,
			labelVi: `Chuẩn sinh viên tại đây (n=${localOceanN})`,
			type: 'ocean' as const,
			n: localOceanN,
			isLocal: true,
		}] : []),
		...(localDtN >= MIN_LOCAL_N ? [{
			id: LOCAL_DARKTRIAD_GROUP_ID,
			label: `Local Student Norms (n=${localDtN})`,
			labelVi: `Chuẩn sinh viên tại đây (n=${localDtN})`,
			type: 'darkTriad' as const,
			n: localDtN,
			isLocal: true,
		}] : []),
	];

	// ── Reference group details ─────────────────────────────────────────
	const oceanDetail = localOceanGroup
		?? REFERENCE_GROUPS.find(g => g.id === oceanGroupId);
	const dtDetail = localDtGroup
		?? REFERENCE_GROUPS.find(g => g.id === darkTriadGroupId);

	// Return percentiles + available reference groups for UI dropdowns
	return apiSuccess({
		sessionId: id,
		percentiles,
		selectedGroups: {
			ocean: oceanGroupId,
			darkTriad: darkTriadGroupId,
		},
		availableGroups,
		referenceGroupDetails: {
			ocean: oceanDetail,
			darkTriad: dtDetail,
		},
	});
});
