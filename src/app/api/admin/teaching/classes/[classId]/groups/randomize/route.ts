import { parseJsonWithAppError, randomizeGroupAssignments, randomizeGroupBoardSchema } from '@/features/teaching';
import { apiSuccess, withAdmin, withTeachingGroupBoard } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

export const POST = withTeachingGroupBoard(withAdmin(async (request: NextRequest, _user, context) => {
	const body = await parseJsonWithAppError(randomizeGroupBoardSchema, request);
	return apiSuccess(await randomizeGroupAssignments(String((await context!.params).classId), body));
}));
