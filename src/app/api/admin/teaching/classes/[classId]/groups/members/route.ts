import type { NextRequest } from 'next/server';

import {
	addGroupMembers,
	addGroupMembersSchema,
	parseWithAppError,
	previewGroupMembers,
} from '@/features/teaching';
import { apiSuccess, withAdmin, withTeachingGroupBoard } from '@/lib/apiUtils';

async function classId(context?: { params: Promise<{ classId: string }> }) {
	return String((await context!.params).classId);
}

export const POST = withTeachingGroupBoard(
	withAdmin(async (request: NextRequest, user, context) => {
		const id = await classId(context);
		const body = (await request.json()) as Record<string, unknown>;
		if (body.preview) {
			const input = parseWithAppError(addGroupMembersSchema, body);
			return apiSuccess(
				await previewGroupMembers(id, input.tutorialClassId, input.groupId, input.studentCodes),
			);
		}
		const input = parseWithAppError(addGroupMembersSchema, body);
		return apiSuccess(await addGroupMembers(id, { ...input, actorUserId: user.id }));
	}),
);
