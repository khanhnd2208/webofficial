import type { NextRequest } from 'next/server';

import { AppError } from '@/lib/appError';
import { withAdmin, withTeachingGroupBoard } from '@/lib/apiUtils';

async function classId(context?: { params: Promise<{ classId: string }> }) {
	return String((await context!.params).classId);
}

export const POST = withTeachingGroupBoard(
	withAdmin(async (_request: NextRequest, _user, context) => {
		await classId(context);
		throw new AppError('Xếp ngẫu nhiên đã được gỡ bỏ.', 410, 'GONE');
	}),
);
