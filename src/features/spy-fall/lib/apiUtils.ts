import { NextResponse, type NextRequest } from 'next/server';
import type { Model } from 'mongoose';

import { AppError } from '@/features/spy-fall/lib/appError';
import dbConnect from '@/features/spy-fall/lib/dbConnect';

export function apiSuccess<T>(data: T, status = 200): NextResponse {
	return NextResponse.json({ ok: true, data }, { status });
}

export function apiError(
	code: string,
	status = 400,
	params?: Record<string, string | number>,
): NextResponse {
	return NextResponse.json(
		{ ok: false, error: code, code, ...(params ? { params } : {}) },
		{ status },
	);
}

export { AppError } from '@/features/spy-fall/lib/appError';

type PublicHandler = (
	request: NextRequest,
	context?: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

function handleCaughtError(error: unknown): NextResponse {
	if (error instanceof AppError) {
		return apiError(error.code, error.status, error.params);
	}
	console.error('[API Error]', error);
	return apiError('INTERNAL', 500);
}

export function withErrorHandling(handler: PublicHandler) {
	return async (
		request: NextRequest,
		context?: { params: Promise<Record<string, string>> },
	): Promise<NextResponse> => {
		try {
			return await handler(request, context);
		} catch (error) {
			return handleCaughtError(error);
		}
	};
}

/** Prevent room-token endpoints from exposing or changing admin test rooms. */
export function withPublicRoomGuard<T>(model: Model<T>, handler: PublicHandler) {
	return async (
		request: NextRequest,
		context?: { params: Promise<Record<string, string>> },
	): Promise<NextResponse> => {
		const params = context ? await context.params : {};
		if (params.code) {
			await dbConnect();
			const room = await model.findOne({ code: params.code.toUpperCase() }).select('adminTest.ownerUserId').lean();
			if (room && typeof room === 'object' && 'adminTest' in room && room.adminTest &&
				typeof room.adminTest === 'object' && 'ownerUserId' in room.adminTest && room.adminTest.ownerUserId) {
				return apiError('TEST_ROOM_PRIVATE', 404);
			}
		}
		return handler(request, context);
	};
}
