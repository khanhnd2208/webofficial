import type { NextRequest } from 'next/server';

import { forgetGroupViewer } from '@/features/teaching';
import { apiSuccess, withErrorHandling, withTeachingGroupBoard } from '@/lib/apiUtils';

export const POST = withTeachingGroupBoard(withErrorHandling(async (_request: NextRequest, context) => {
	await forgetGroupViewer(String((await context!.params).slug));
	return apiSuccess({ forgotten: true });
}));
