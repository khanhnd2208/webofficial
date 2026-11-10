import { awardRecallArenaCp, parseWithAppError, recallArenaAwardSchema } from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

/** A correct answer in the recall arena: raise this week's CP, never lower it. */
export const POST = withAdmin(async (request: NextRequest, user, context) =>
	apiSuccess(
		await awardRecallArenaCp(
			String((await context!.params).sessionId),
			parseWithAppError(recallArenaAwardSchema, await request.json()),
			user.id,
		),
	),
);
