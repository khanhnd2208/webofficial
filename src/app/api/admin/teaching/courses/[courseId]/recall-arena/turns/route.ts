import {
	listRecallArenaDays,
	listRecallArenaTurns,
	parseWithAppError,
	recallArenaTurnSchema,
	recallArenaTurnsQuerySchema,
	recordRecallArenaTurn,
} from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

async function courseId(context?: { params: Promise<{ courseId: string }> }) {
	return String((await context!.params).courseId);
}

/** Saved arena calls for one game day, plus the days that have any. */
export const GET = withAdmin(async (request: NextRequest, _user, context) => {
	const id = await courseId(context);
	const { date } = parseWithAppError(recallArenaTurnsQuerySchema, {
		date: request.nextUrl.searchParams.get('date') ?? '',
	});
	const [turns, days] = await Promise.all([
		listRecallArenaTurns(id, date),
		listRecallArenaDays(id),
	]);
	return apiSuccess({ date, turns, days });
});

/** Save one arena call; resending the same clientId updates it. */
export const POST = withAdmin(async (request: NextRequest, user, context) =>
	apiSuccess(
		await recordRecallArenaTurn(
			await courseId(context),
			parseWithAppError(recallArenaTurnSchema, await request.json()),
			user.id,
		),
	),
);
