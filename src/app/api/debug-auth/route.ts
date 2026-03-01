import { NextResponse, type NextRequest } from 'next/server';

/**
 * TEMPORARY debug endpoint — DELETE after fixing auth.
 *
 * Shows all incoming headers, cookies, and env vars relevant to Auth.js
 * so we can diagnose the exact state on production.
 *
 * Access: GET https://toiladuykhanh.com/api/debug-auth
 */
export async function GET(request: NextRequest) {
	// Collect all headers
	const headers: Record<string, string> = {};
	request.headers.forEach((value, key) => {
		headers[key] = value;
	});

	// Collect all cookies
	const cookies: Record<string, string> = {};
	request.cookies.getAll().forEach((c) => {
		// Truncate long cookie values (just show first 40 chars)
		cookies[c.name] = c.value.length > 40 ? c.value.slice(0, 40) + '…' : c.value;
	});

	// Relevant env vars (values masked)
	const env: Record<string, string> = {
		NODE_ENV: process.env.NODE_ENV ?? '(not set)',
		AUTH_SECRET: process.env.AUTH_SECRET ? '✅ SET (' + process.env.AUTH_SECRET.length + ' chars)' : '❌ NOT SET',
		AUTH_URL: process.env.AUTH_URL ?? '(not set)',
		AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? '(not set)',
		// Check for OLD variable names that Auth.js v5 might still read
		NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? '(not set)',
		NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? '(not set)',
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✅ SET' : '❌ NOT SET',
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✅ SET' : '❌ NOT SET',
		// Auth.js v5 auto-detection vars
		AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID ?? '(not set)',
		AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET ?? '(not set)',
		ADMIN_SECRET: process.env.ADMIN_SECRET ? '✅ SET' : '❌ NOT SET',
		PORT: process.env.PORT ?? '(not set)',
	};

	// Check what URL Auth.js would derive
	const proto = request.headers.get('x-forwarded-proto') ?? 'http';
	const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'unknown';
	const derivedUrl = `${proto}://${host}`;

	return NextResponse.json(
		{
			timestamp: new Date().toISOString(),
			derivedAuthUrl: derivedUrl,
			requestUrl: request.url,
			env,
			headers,
			cookies,
			analysis: {
				hasSecureCookiePrefix: Object.keys(cookies).some((k) => k.startsWith('__Secure-')),
				hasHostCookiePrefix: Object.keys(cookies).some((k) => k.startsWith('__Host-')),
				authCookies: Object.keys(cookies).filter((k) => k.includes('authjs') || k.includes('next-auth')),
				protoIsHttps: proto === 'https',
				hostMatchesDomain: host.includes('toiladuykhanh.com'),
			},
		},
		{ status: 200 },
	);
}
