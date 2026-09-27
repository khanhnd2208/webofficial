import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling } from '@/features/spy-fall/lib/apiUtils';
import { updateSettings } from '@/features/cheese-thief/services/cheeseThiefService';
import type { UpdateSettingsInput } from '@/features/cheese-thief/types';

export const PATCH = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as UpdateSettingsInput & { token?: string };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	const state = await updateSettings(code, body.token, body);
	return apiSuccess(state);
});
