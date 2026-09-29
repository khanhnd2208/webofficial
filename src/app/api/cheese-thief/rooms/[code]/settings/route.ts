import RoomModel from '@/features/cheese-thief/models/CheeseThiefRoom';
import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling, withPublicRoomGuard } from '@/features/spy-fall/lib/apiUtils';
import { updateSettings } from '@/features/cheese-thief/services/cheeseThiefService';
import type { UpdateSettingsInput } from '@/features/cheese-thief/types';

const PATCHBase = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as UpdateSettingsInput & { token?: string };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	const state = await updateSettings(code, body.token, body);
	return apiSuccess(state);
});

export const PATCH = withPublicRoomGuard(RoomModel, PATCHBase);
