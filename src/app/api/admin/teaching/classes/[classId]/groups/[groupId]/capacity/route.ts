import type { NextRequest } from 'next/server';

import { parseWithAppError, setGroupCapacity, setGroupCapacitySchema } from '@/features/teaching';
import { apiSuccess, withAdmin, withTeachingGroupBoard } from '@/lib/apiUtils';

async function ids(context?: { params: Promise<{ classId: string; groupId: string }> }) {
	const params = await context!.params;
	return { classId: String(params.classId), groupId: String(params.groupId) };
}

export const PATCH = withTeachingGroupBoard(
	withAdmin(async (request: NextRequest, user, context) => {
		const { classId, groupId } = await ids(context);
		const input = parseWithAppError(setGroupCapacitySchema, await request.json());
		return apiSuccess(await setGroupCapacity(classId, groupId, { ...input, actorUserId: user.id }));
	}),
);
