import type { NextRequest } from 'next/server';

import {
	getGroupBoard,
	getPublicClassIdBySlug,
	groupBoardTutorialQuerySchema,
	parseWithAppError,
} from '@/features/teaching';
import { apiError, apiSuccess, withErrorHandling, withTeachingGroupBoard } from '@/lib/apiUtils';

export const GET = withTeachingGroupBoard(
	withErrorHandling(async (request: NextRequest, context) => {
		const slug = String((await context!.params).slug);
		const classId = await getPublicClassIdBySlug(slug);
		if (!classId) return apiError('Không tìm thấy lớp.', 404, { code: 'NOT_FOUND' });
		const tutorialClassId = request.nextUrl.searchParams.get('tutorialClassId')?.trim();
		if (!tutorialClassId) {
			return apiError('Thiếu tutorialClassId.', 422, { code: 'VALIDATION' });
		}
		parseWithAppError(groupBoardTutorialQuerySchema, { tutorialClassId });
		return apiSuccess(await getGroupBoard(classId, tutorialClassId, slug));
	}),
);
