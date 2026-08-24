import type { NextRequest } from 'next/server';

import {
	configureGroupBoard,
	getGroupBoard,
	groupBoardOpenSchema,
	configureGroupBoardSchema,
	parseWithAppError,
	setGroupBoardOpen,
} from '@/features/teaching';
import { apiSuccess, withAdmin, withTeachingGroupBoard } from '@/lib/apiUtils';

async function classId(context?: { params: Promise<{ classId: string }> }) {
	return String((await context!.params).classId);
}

export const GET = withTeachingGroupBoard(withAdmin(async (_request: NextRequest, _user, context) => apiSuccess(await getGroupBoard(await classId(context)))));

export const PATCH = withTeachingGroupBoard(withAdmin(async (request: NextRequest, _user, context) => {
	const id = await classId(context);
	const body = await request.json() as unknown;
	if (typeof body === 'object' && body !== null && 'open' in body) {
		const input = parseWithAppError(groupBoardOpenSchema, body);
		return apiSuccess(await setGroupBoardOpen(id, input.open));
	}
	return apiSuccess(await configureGroupBoard(id, parseWithAppError(configureGroupBoardSchema, body)));
}));
