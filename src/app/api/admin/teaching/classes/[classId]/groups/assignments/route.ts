import type { NextRequest } from 'next/server';

import { groupAssignmentSchema, moveGroupAssignment, parseWithAppError } from '@/features/teaching';
import { apiSuccess, withAdmin, withTeachingGroupBoard } from '@/lib/apiUtils';

async function classId(context?: { params: Promise<{ classId: string }> }) {
	return String((await context!.params).classId);
}

export const PUT = withTeachingGroupBoard(withAdmin(async (request: NextRequest, _user, context) => {
	const input = parseWithAppError(groupAssignmentSchema, await request.json());
	return apiSuccess(await moveGroupAssignment(await classId(context), { ...input, actor: 'ADMIN' }));
}));

export const DELETE = withTeachingGroupBoard(withAdmin(async (request: NextRequest, _user, context) => {
	const input = parseWithAppError(groupAssignmentSchema.pick({ enrollmentId: true, expectedVersion: true }), await request.json());
	return apiSuccess(await moveGroupAssignment(await classId(context), { ...input, groupId: null, actor: 'ADMIN' }));
}));
