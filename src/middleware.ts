import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * Middleware — protects /admin routes.
 *
 * Admin access requires:
 *   1. Authenticated via Google OAuth (Auth.js session)
 *   2. User role === 'admin' in database
 *
 * Non-admin users see a 403 page.
 * Unauthenticated users are redirected to /login.
 */
export default auth((req) => {
	const { pathname } = req.nextUrl;

	// Only protect /admin page routes
	if (!pathname.startsWith('/admin')) {
		return NextResponse.next();
	}

	// Not logged in → redirect to login
	if (!req.auth?.user) {
		const loginUrl = req.nextUrl.clone();
		loginUrl.pathname = '/login';
		loginUrl.searchParams.set('from', pathname);
		return NextResponse.redirect(loginUrl);
	}

	// Logged in but not admin → 403
	const role = (req.auth.user as { role?: string }).role;
	if (role !== 'admin') {
		return new NextResponse(
			'<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#121110;color:#f0ece4"><div style="text-align:center"><h1 style="font-size:2rem;margin:0">403</h1><p style="opacity:0.6;margin-top:0.5rem">Bạn không có quyền truy cập trang quản trị.</p><a href="/" style="color:#f0ece4;margin-top:1rem;display:inline-block;opacity:0.8">← Về trang chủ</a></div></body></html>',
			{ status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
		);
	}

	return NextResponse.next();
});

export const config = {
	matcher: ['/admin/:path*'],
};
