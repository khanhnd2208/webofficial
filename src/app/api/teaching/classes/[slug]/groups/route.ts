import type { NextRequest } from 'next/server';

import { getClassIdBySlug, getGroupBoard, getPublicClassBoard } from '@/features/teaching';
import { apiError, apiSuccess, withErrorHandling, withTeachingGroupBoard } from '@/lib/apiUtils';

export const GET = withTeachingGroupBoard(withErrorHandling(async (_request: NextRequest, context) => {
	const slug = String((await context!.params).slug);
	const publicClass = await getPublicClassBoard(slug);
	if (!publicClass) return apiError('Không tìm thấy lớp.', 404, { code: 'NOT_FOUND' });
	const classId = await getClassIdBySlug(slug);
	if (!classId) return apiError('Không tìm thấy lớp.', 404, { code: 'NOT_FOUND' });
	return apiSuccess(await getGroupBoard(classId, slug));
}));
