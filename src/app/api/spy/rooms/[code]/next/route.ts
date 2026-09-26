import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling } from '@/features/spy-fall/lib/apiUtils';
import { hostAdvancePhase } from '@/features/spy-fall/services/spyGameService';
import type { PhaseCursor } from '@/features/spy-fall/types/spyGame';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { token?: string; from?: PhaseCursor };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	if (!body.from) return apiError('PHASE_CHANGED', 409);
	const state = await hostAdvancePhase(code, body.token, body.from);
	return apiSuccess(state);
});
