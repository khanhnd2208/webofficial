import type { NextRequest } from 'next/server';

import { apiError, withErrorHandling, withTeachingGroupBoard } from '@/lib/apiUtils';

export const POST = withTeachingGroupBoard(
	withErrorHandling(async (_request: NextRequest) =>
		apiError('Sinh viên không thể tự xếp nhóm.', 403, { code: 'GROUP_MOVE_FORBIDDEN' }),
	),
);
