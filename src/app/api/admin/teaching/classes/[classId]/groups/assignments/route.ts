import type { NextRequest } from 'next/server';

import { moveGroupMember, moveGroupMemberSchema, parseWithAppError } from '@/features/teaching';
import { apiSuccess, withAdmin, withTeachingGroupBoard } from '@/lib/apiUtils';

async function classId(context?: { params: Promise<{ classId: string }> }) {
	return String((await context!.params).classId);
}

export const PUT = withTeachingGroupBoard(
	withAdmin(async (request: NextRequest, user, context) => {
		const input = parseWithAppError(moveGroupMemberSchema, await request.json());
		return apiSuccess(await moveGroupMember(await classId(context), { ...input, actorUserId: user.id }));
	}),
);

export const DELETE = withTeachingGroupBoard(
	withAdmin(async (request: NextRequest, user, context) => {
		const input = parseWithAppError(
			moveGroupMemberSchema.pick({ tutorialClassId: true, enrollmentId: true, expectedVersion: true }),
			await request.json(),
		);
		return apiSuccess(
			await moveGroupMember(await classId(context), { ...input, targetGroupId: null, actorUserId: user.id }),
		);
	}),
);
