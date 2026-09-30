import type { NextRequest } from 'next/server';

import {
	configureGroupBoard,
	getGroupBoard,
	configureGroupBoardSchema,
	groupBoardTutorialQuerySchema,
	parseWithAppError,
} from '@/features/teaching';
import { AppError } from '@/lib/appError';
import { apiSuccess, withAdmin, withTeachingGroupBoard } from '@/lib/apiUtils';

async function classId(context?: { params: Promise<{ classId: string }> }) {
	return String((await context!.params).classId);
}

function tutorialClassIdFrom(request: NextRequest) {
	const tutorialClassId = request.nextUrl.searchParams.get('tutorialClassId')?.trim();
	return parseWithAppError(groupBoardTutorialQuerySchema, { tutorialClassId });
}

export const GET = withTeachingGroupBoard(
	withAdmin(async (request: NextRequest, _user, context) => {
		const { tutorialClassId } = tutorialClassIdFrom(request);
		return apiSuccess(await getGroupBoard(await classId(context), tutorialClassId));
	}),
);

export const PATCH = withTeachingGroupBoard(
	withAdmin(async (request: NextRequest, user, context) => {
		const id = await classId(context);
		const body = (await request.json()) as unknown;
		if (typeof body === 'object' && body !== null && 'open' in body) {
			throw new AppError('Chức năng mở/khóa bảng đã được gỡ bỏ.', 410, 'GONE');
		}
		return apiSuccess(
			await configureGroupBoard(id, {
				...parseWithAppError(configureGroupBoardSchema, body),
				actorUserId: user.id,
			}),
		);
	}),
);
