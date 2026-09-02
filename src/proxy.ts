import { type NextRequest, NextResponse } from 'next/server';

import { isArchivedPublicPath } from '@/config/moduleRegistry';
import { getLockedPublicLearningFeature } from '@/config/publicFeatureAccess';

const ARCHIVED_PUBLIC_HEADERS = {
	'cache-control': 'no-store',
	'x-robots-tag': 'noindex, nofollow',
} as const;

export function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname;
	const archivedPublic = isArchivedPublicPath(pathname);
	const lockedFeature = archivedPublic ? null : getLockedPublicLearningFeature(pathname);

	if (archivedPublic || lockedFeature) {
		if (pathname.startsWith('/api/')) {
			return NextResponse.json(
				{
					ok: false,
					error: 'Not found',
					code: 'FEATURE_NOT_AVAILABLE',
				},
				{ status: 404, headers: ARCHIVED_PUBLIC_HEADERS },
			);
		}

		return new NextResponse('Not Found', {
			status: 404,
			headers: { ...ARCHIVED_PUBLIC_HEADERS, 'content-type': 'text/plain; charset=utf-8' },
		});
	}

	const response = NextResponse.next();
	if (
		pathname.startsWith('/admin') ||
		pathname.startsWith('/messages') ||
		pathname.startsWith('/my-space/teaching')
	) {
		response.headers.set('x-pathname', `${pathname}${request.nextUrl.search}`);
	}
	return response;
}

export const config = {
	matcher: [
		'/vocabulary',
		'/vocabulary/:path*',
		'/my-space/tests',
		'/my-space/tests/:path*',
		'/my-space/my-class',
		'/my-space/my-class/:path*',
		'/api/myspace-tests',
		'/api/myspace-tests/:path*',
		'/api/my-class',
		'/api/my-class/:path*',
		'/admin',
		'/admin/:path*',
		'/messages',
		'/messages/:path*',
		'/my-space/teaching',
		'/my-space/teaching/:path*',
	],
};
