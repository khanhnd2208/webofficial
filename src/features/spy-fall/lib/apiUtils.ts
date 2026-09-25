import { NextResponse, type NextRequest } from 'next/server';

import { AppError } from '@/features/spy-fall/lib/appError';

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
