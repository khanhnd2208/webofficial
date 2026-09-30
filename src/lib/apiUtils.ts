/**
 * API Utilities — Shared helpers for Next.js API route handlers.
 *
 * Centralizes authentication checks, error handling, and response formatting
 * to eliminate ~80+ lines of repetitive boilerplate across 27 API routes.
 *
 * Usage:
 *   export const GET = withAuth(async (request, user) => {
 *     const data = await someService(user.id);
 *     return apiSuccess(data);
 *   });
 *
 *   export const POST = withAdmin(async (request, user) => {
 *     const body = await request.json();
 *     const created = await createSomething(body);
 *     return apiSuccess(created, 201);
 *   });
 */

import { randomUUID } from 'node:crypto';

import { NextResponse, type NextRequest } from 'next/server';

import { AppError } from '@/lib/appError';
import { getApiUser, type ApiUser } from '@/lib/apiAuth';
import { isTeachingGroupBoardEnabled } from '@/features/teaching/groupBoardAvailability';

// ─── Response Helpers ──────────────────────────────────────────────────────────

/**
 * Standard success response.
 * All API routes MUST use this format: `{ ok: true, data: T }`
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
	return NextResponse.json({ ok: true, data }, { status });
}

/**
 * Standard error response.
 * All API routes MUST use this format: `{ ok: false, error: string, code?, fields? }`
 */
export function apiError(
	message: string,
	status = 400,
	extra?: { code?: string; fields?: Record<string, string>; details?: unknown },
): NextResponse {
	return NextResponse.json(
		{
			ok: false,
			error: message,
			...(extra?.code ? { code: extra.code } : {}),
			...(extra?.fields ? { fields: extra.fields } : {}),
			...(extra?.details !== undefined ? { details: extra.details } : {}),
		},
		{ status },
	);
}

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

/** Return a bounded request id suitable for correlation in logs and headers. */
export function getRequestId(request: Pick<Request, 'headers'>): string {
	const supplied = request.headers.get('x-request-id')?.trim();
	return supplied && REQUEST_ID_PATTERN.test(supplied) ? supplied : randomUUID();
}

/** Add correlation metadata without changing the success response contract. */
export async function withRequestId(
	response: NextResponse,
	requestId: string,
): Promise<NextResponse> {
	response.headers.set('x-request-id', requestId);
	if (response.status < 400) return response;

	try {
		const body = await response.clone().json();
		if (body && typeof body === 'object' && !Array.isArray(body)) {
			return NextResponse.json(
				{ ...body, requestId },
				{
					status: response.status,
					headers: response.headers,
				},
			);
		}
	} catch {
		// Preserve non-JSON responses (for example framework-generated errors).
	}
	return response;
}

export { AppError } from '@/lib/appError';

/**
 * Maps a caught error to the appropriate API response.
 * - AppError → use its message + status (safe, expected)
 * - Unknown error → log server-side, return generic 500 (never leak internals)
 */
function handleCaughtError(error: unknown): NextResponse {
	if (error instanceof AppError) {
		return apiError(error.message, error.status, {
			code: error.code,
			fields: error.fields,
			details: error.details,
		});
	}
	return apiError('Internal server error', 500);
}

function logApiFailure(
	request: NextRequest,
	error: unknown,
	response: NextResponse,
	requestId: string,
	startedAt: number,
) {
	console.error(
		JSON.stringify({
			requestId,
			route: request.nextUrl.pathname,
			method: request.method,
			status: response.status,
			code: error instanceof AppError ? error.code : 'INTERNAL_ERROR',
			durationMs: Date.now() - startedAt,
		}),
	);
}

// ─── Auth Wrapper Types ────────────────────────────────────────────────────────

/** Handler that receives the authenticated user. */
type AuthenticatedHandler = (
	request: NextRequest,
	user: ApiUser,
	context?: RouteContext,
) => Promise<NextResponse>;

/** Handler that does NOT require authentication. */
type PublicHandler = (request: NextRequest, context?: RouteContext) => Promise<NextResponse>;

type ResponseHandler = (request: NextRequest, context?: RouteContext) => Promise<Response>;

/**
 * Next.js App Router dynamic route context.
 * `params` is a Promise in Next.js 16+.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteContext = { params: Promise<any> };

// ─── Wrapper Functions ─────────────────────────────────────────────────────────

/**
 * Wraps a route handler with authentication + error handling.
 *
 * - Checks for a valid session (via `getApiUser`).
 * - Returns 401 if unauthenticated.
 * - Catches errors and returns a standardized error response.
 *
 * Supports both simple routes and dynamic routes with params:
 *   export const GET = withAuth(async (req, user) => { ... });
 *   export const GET = withAuth(async (req, user, ctx) => { ... });
 */
export function withAuth(handler: AuthenticatedHandler) {
	return async (request: NextRequest, context?: RouteContext): Promise<NextResponse> => {
		const requestId = getRequestId(request);
		const startedAt = Date.now();
		try {
			const user = await getApiUser(request);
			if (!user) {
				return withRequestId(apiError('Unauthorized', 401), requestId);
			}
			return withRequestId(await handler(request, user, context), requestId);
		} catch (error) {
			const response = handleCaughtError(error);
			logApiFailure(request, error, response, requestId, startedAt);
			return withRequestId(response, requestId);
		}
	};
}

/**
 * Wraps a route handler with admin-only authentication + error handling.
 *
 * - Checks for a valid session AND admin role.
 * - Returns 401 if unauthenticated, 403 if not admin.
 * - Catches errors and returns a standardized error response.
 */
export function withAdmin(handler: AuthenticatedHandler) {
	return async (request: NextRequest, context?: RouteContext): Promise<NextResponse> => {
		const requestId = getRequestId(request);
		const startedAt = Date.now();
		try {
			const user = await getApiUser(request);
			if (!user) {
				return withRequestId(apiError('Unauthorized', 401), requestId);
			}
			if (user.role !== 'admin') {
				return withRequestId(apiError('Forbidden', 403), requestId);
			}
			return withRequestId(await handler(request, user, context), requestId);
		} catch (error) {
			const response = handleCaughtError(error);
			logApiFailure(request, error, response, requestId, startedAt);
			return withRequestId(response, requestId);
		}
	};
}

/**
 * Wraps a public route handler with error handling only (no auth).
 *
 * Useful for routes like GET /api/posts that are accessible to everyone.
 */
export function withErrorHandling(handler: PublicHandler) {
	return async (request: NextRequest, context?: RouteContext): Promise<NextResponse> => {
		const requestId = getRequestId(request);
		const startedAt = Date.now();
		try {
			return withRequestId(await handler(request, context), requestId);
		} catch (error) {
			const response = handleCaughtError(error);
			logApiFailure(request, error, response, requestId, startedAt);
			return withRequestId(response, requestId);
		}
	};
}

/**
 * Feature gate for every group-board route. It runs outside the auth and
 * request-body wrappers so disabled routes do not authenticate, rate-limit,
 * parse input, query the database, or start a stream.
 */
export function withTeachingGroupBoard(handler: PublicHandler): PublicHandler;
export function withTeachingGroupBoard(handler: ResponseHandler): ResponseHandler;
export function withTeachingGroupBoard(handler: ResponseHandler) {
	return async (request: NextRequest, context?: RouteContext) => {
		if (!isTeachingGroupBoardEnabled()) {
			return withRequestId(
				apiError('Not found', 404, { code: 'NOT_FOUND' }),
				getRequestId(request),
			);
		}
		return handler(request, context);
	};
}
