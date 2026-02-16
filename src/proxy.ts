import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const ADMIN_PREFIX = '/admin';
const DASHBOARD_PREFIX = '/dashboard';
const VOCAB_PREFIX = '/vocabulary';
const LOGIN_PATH = '/login';

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Skip all API routes and auth routes
	if (pathname.startsWith('/api/')) {
		return NextResponse.next();
	}

	// secureCookie=true: must match auth.ts useSecureCookies:true
	// Cookies use __Secure- prefix (e.g. __Secure-authjs.session-token)
	const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET, secureCookie: true });

	// Optional: already logged in -> don't go back to /login
	if (pathname === LOGIN_PATH) {
		if (token) {
			const url = request.nextUrl.clone();
			url.pathname = DASHBOARD_PREFIX;
			url.search = '';
			return NextResponse.redirect(url);
		}
		return NextResponse.next();
	}

	const isProtected = pathname.startsWith(ADMIN_PREFIX)
		|| pathname.startsWith(DASHBOARD_PREFIX)
		|| pathname.startsWith(VOCAB_PREFIX);
	if (!isProtected) return NextResponse.next();

	if (!token) {
		const url = request.nextUrl.clone();
		url.pathname = LOGIN_PATH;
		url.searchParams.set('from', pathname);
		return NextResponse.redirect(url);
	}

	if (pathname.startsWith(ADMIN_PREFIX)) {
		const role = (token as { role?: unknown }).role;
		if (role !== 'admin') {
			const url = request.nextUrl.clone();
			url.pathname = DASHBOARD_PREFIX;
			url.search = '';
			return NextResponse.redirect(url);
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		'/admin/:path*',
		'/dashboard/:path*',
		'/vocabulary/:path*',
		'/login',
	],
};
