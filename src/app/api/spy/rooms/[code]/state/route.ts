import RoomModel from '@/features/spy-fall/models/SpyGame';
import type { NextRequest } from 'next/server';

import {
	apiSuccess,
	withErrorHandling,
	withPublicRoomGuard,
} from '@/features/spy-fall/lib/apiUtils';
import { getScopedState } from '@/features/spy-fall/services/spyGameService';

const GETBase = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const token = request.nextUrl.searchParams.get('token');
	const state = await getScopedState(code, token);
	return apiSuccess(state);
});

export const GET = withPublicRoomGuard(RoomModel, GETBase);
