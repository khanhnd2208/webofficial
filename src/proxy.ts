import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_PREFIX = '/admin';

/**
 * Admin access is protected by ADMIN_SECRET token (env variable).
 * 
 * To access admin:
 *   1. Visit /admin?token=YOUR_ADMIN_SECRET  (sets cookie automatically)
 *   2. Or set cookie 'admin_token' = YOUR_ADMIN_SECRET manually
 * 
 * No OAuth/login required — simple, secure, works behind any proxy.
 */
export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Only protect /admin page routes (not /api)
	if (!pathname.startsWith(ADMIN_PREFIX)) {
		return NextResponse.next();
	}

	const adminSecret = process.env.ADMIN_SECRET;
	if (!adminSecret) {
		// No ADMIN_SECRET configured — block all admin access
		return new NextResponse('Admin access not configured', { status: 403 });
	}

	// Check for token in query param (first-time access / bookmark)
	const queryToken = request.nextUrl.searchParams.get('token');
	if (queryToken === adminSecret) {
		// Valid token in URL — set cookie and redirect to clean URL
		const cleanUrl = request.nextUrl.clone();
		cleanUrl.searchParams.delete('token');
		const response = NextResponse.redirect(cleanUrl);
		response.cookies.set('admin_token', adminSecret, {
			httpOnly: true,
			secure: request.nextUrl.protocol === 'https:',
			sameSite: 'lax',
			path: '/',       // Must be '/' so cookie is sent to /api/* routes too
			maxAge: 60 * 60 * 24 * 30, // 30 days
		});
		return response;
	}

	// Check for token in cookie (subsequent visits)
	const cookieToken = request.cookies.get('admin_token')?.value;
	if (cookieToken === adminSecret) {
		return NextResponse.next();
	}

	// Not authenticated — show 403
	return new NextResponse(
		'<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#121110;color:#f0ece4"><div style="text-align:center"><h1 style="font-size:2rem;margin:0">403</h1><p style="opacity:0.6;margin-top:0.5rem">Admin access requires authentication token.</p></div></body></html>',
		{ status: 403, headers: { 'Content-Type': 'text/html' } }
	);
}

export const config = {
	matcher: ['/admin/:path*'],
};
