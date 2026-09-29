import RoomModel from '@/features/spy-fall/models/SpyGame';
import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling, withPublicRoomGuard } from '@/features/spy-fall/lib/apiUtils';
import { updateSettings } from '@/features/spy-fall/services/spyGameService';
import type { UpdateSettingsInput } from '@/features/spy-fall/types/spyGame';

const PATCHBase = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as UpdateSettingsInput & { token?: string };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	const { token, ...settings } = body;
	const state = await updateSettings(code, token, settings);
	return apiSuccess(state);
});

export const PATCH = withPublicRoomGuard(RoomModel, PATCHBase);
