import { type NextRequest, NextResponse } from 'next/server';

import { getLockedPublicLearningFeature } from '@/config/publicFeatureAccess';

export function proxy(request: NextRequest) {
	const lockedFeature = getLockedPublicLearningFeature(request.nextUrl.pathname);
	if (!lockedFeature) {
		const response = NextResponse.next();
		const pathname = request.nextUrl.pathname;
		if (
			pathname.startsWith('/admin') ||
			pathname.startsWith('/messages') ||
			pathname.startsWith('/my-space/teaching')
		) {
			response.headers.set('x-pathname', `${pathname}${request.nextUrl.search}`);
		}
		return response;
	}

	const headers = {
		'cache-control': 'no-store',
		'x-robots-tag': 'noindex, nofollow',
	};
	if (request.nextUrl.pathname.startsWith('/api/')) {
		return NextResponse.json(
			{
				ok: false,
				error: 'Not found',
				code: 'FEATURE_NOT_AVAILABLE',
			},
			{ status: 404, headers },
		);
	}

	return new NextResponse('Not Found', {
		status: 404,
		headers: { ...headers, 'content-type': 'text/plain; charset=utf-8' },
	});
}

export const config = {
	matcher: [
		'/my-space/tests/:path*',
		'/my-space/my-class/:path*',
		'/api/myspace-tests/:path*',
		'/api/my-class/:path*',
		'/admin',
		'/admin/:path*',
		'/messages',
		'/messages/:path*',
		'/my-space/teaching',
		'/my-space/teaching/:path*',
	],
};
