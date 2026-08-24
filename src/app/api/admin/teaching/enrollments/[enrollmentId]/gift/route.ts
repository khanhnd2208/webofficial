import { giftDeltaSchema, parseWithAppError, updateGift } from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

export const PATCH = withAdmin(async (request: NextRequest, _user, context) => {
	const input = parseWithAppError(giftDeltaSchema, await request.json());
	const enrollmentId = String((await context!.params).enrollmentId);
	return apiSuccess(await updateGift(enrollmentId, input.delta));
});
