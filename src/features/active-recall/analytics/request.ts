import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';

export type RecallRouteHandler = (
	request: NextRequest,
	context: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;
import type { ZodType } from 'zod';
import { AppError } from '@/lib/appError';
import { getApiUser } from '@/lib/apiAuth';
import { assertScopedRateLimit } from '@/lib/inquiryRateLimit';
import { parseSchema } from '@/lib/validation/parse';
import { recallVisitorHash } from './collection';

export const RECALL_COOKIE = 'recall_visitor';
export async function recallRequest<T>(request: NextRequest, schema: ZodType<T>, begin: boolean) {
	if (
		request.headers.get('origin') !== request.nextUrl.origin ||
		request.headers.get('sec-fetch-site') === 'cross-site'
	)
		throw new AppError('Nguồn yêu cầu không hợp lệ', 403);
	if (Number(request.headers.get('content-length') || 0) > 4096)
		throw new AppError('Yêu cầu quá lớn', 413);
	const raw = await request.text();
	if (new TextEncoder().encode(raw).length > 4096) throw new AppError('Yêu cầu quá lớn', 413);
	let body: unknown;
	try {
		body = JSON.parse(raw);
	} catch {
		throw new AppError('Dữ liệu không hợp lệ', 400);
	}
	const input = parseSchema(schema, body);
	if ((await getApiUser(request))?.role === 'admin') return { excluded: true as const, input };
	await assertScopedRateLimit(
		request,
		begin ? 'recall-begin' : 'recall-heartbeat',
		begin ? 120 : 600,
		60_000,
	);
	const jar = await cookies();
	let cookie = jar.get(RECALL_COOKIE)?.value;
	if (
		!cookie ||
		!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cookie)
	) {
		if (!begin) throw new AppError('Không tìm thấy khách ẩn danh', 403);
		cookie = randomUUID();
		jar.set(RECALL_COOKIE, cookie, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
			maxAge: 365 * 24 * 60 * 60,
		});
	}
	return { excluded: false as const, visitorId: recallVisitorHash(cookie), input };
}
