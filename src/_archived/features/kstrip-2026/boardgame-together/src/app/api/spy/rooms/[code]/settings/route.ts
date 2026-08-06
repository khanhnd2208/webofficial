import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { updateSettings } from '@/services/spyGameService';
import type { UpdateSettingsInput } from '@/types/spyGame';

export const PATCH = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as UpdateSettingsInput & { token?: string };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	const { token, ...settings } = body;
	const state = await updateSettings(code, token, settings);
	return apiSuccess(state);
});
