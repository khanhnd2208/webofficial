import { apiError, withErrorHandling, withTeachingGroupBoard } from '@/lib/apiUtils';

export const POST = withTeachingGroupBoard(
	withErrorHandling(async () =>
		apiError('Sinh viên không thể tự xếp nhóm.', 403, { code: 'GROUP_MOVE_FORBIDDEN' }),
	),
);
