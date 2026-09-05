import type { NextRequest } from 'next/server';

import { forgetGroupViewer } from '@/features/teaching';
import { apiSuccess, withErrorHandling, withTeachingGroupBoard } from '@/lib/apiUtils';

export const POST = withTeachingGroupBoard(
	withErrorHandling(async (_request: NextRequest, context) => {
		const slug = String((await context!.params).slug);
		await forgetGroupViewer(slug);
		return apiSuccess({ ok: true });
	}),
);
