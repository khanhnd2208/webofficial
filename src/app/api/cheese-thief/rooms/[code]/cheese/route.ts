import RoomModel from '@/features/cheese-thief/models/CheeseThiefRoom';
import type { NextRequest } from 'next/server';

import { reportCheese } from '@/features/cheese-thief/services/cheeseThiefService';
import {
	apiError,
	apiSuccess,
	withErrorHandling,
	withPublicRoomGuard,
} from '@/features/spy-fall/lib/apiUtils';

const POSTBase = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { token?: string; present?: unknown };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	if (typeof body.present !== 'boolean') return apiError('CHEESE_REPORT_INVALID', 400);
	return apiSuccess(await reportCheese(code, body.token, body.present));
});

export const POST = withPublicRoomGuard(RoomModel, POSTBase);
