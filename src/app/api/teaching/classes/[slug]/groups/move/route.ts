import type { NextRequest } from 'next/server';

import {
	getClassIdBySlug,
	getGroupBoard,
	getGroupViewer,
	groupAssignmentSchema,
	moveGroupAssignment,
	parseWithAppError,
} from '@/features/teaching';
import { apiError, apiSuccess, withErrorHandling, withTeachingGroupBoard } from '@/lib/apiUtils';
import { assertScopedRateLimit } from '@/lib/inquiryRateLimit';

export const POST = withTeachingGroupBoard(
	withErrorHandling(async (request: NextRequest, context) => {
		const slug = String((await context!.params).slug);
		await assertScopedRateLimit(request, `teaching-group-move:${slug}`, 20, 5 * 60 * 1000);
		const viewer = await getGroupViewer(slug);
		if (!viewer)
			return apiError('Hãy chọn tên của bạn trước khi xếp nhóm.', 401, {
				code: 'IDENTITY_REQUIRED',
			});
		const classId = await getClassIdBySlug(slug);
		if (!classId) return apiError('Không tìm thấy lớp.', 404, { code: 'NOT_FOUND' });
		const input = parseWithAppError(
			groupAssignmentSchema.pick({ groupId: true, slotIndex: true }),
			await request.json(),
		);
		await moveGroupAssignment(classId, {
			enrollmentId: viewer.enrollmentId,
			...input,
			actor: 'STUDENT',
			actorEnrollmentId: viewer.enrollmentId,
			actorClaimEpoch: viewer.claimEpoch,
		});
		return apiSuccess(await getGroupBoard(classId, slug, viewer.enrollmentId));
	}),
);
