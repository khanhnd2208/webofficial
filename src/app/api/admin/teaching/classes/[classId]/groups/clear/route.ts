import { clearGroupAssignments, clearGroupBoardSchema, parseJsonWithAppError } from '@/features/teaching';
import { apiSuccess, withAdmin, withTeachingGroupBoard } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

export const POST = withTeachingGroupBoard(withAdmin(async (request: NextRequest, _user, context) => {
	const body = await parseJsonWithAppError(clearGroupBoardSchema, request);
	return apiSuccess(
		await clearGroupAssignments(String((await context!.params).classId), body.expectedVersion),
	);
}));
