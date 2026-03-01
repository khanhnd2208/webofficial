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
		cookies[c.name] = c.value.length > 40 ? c.value.slice(0, 40) + '…' : c.value;
	});

	// Relevant env vars
	const env: Record<string, string> = {
		NODE_ENV: process.env.NODE_ENV ?? '(not set)',
		AUTH_SECRET: process.env.AUTH_SECRET ? '✅ SET (' + process.env.AUTH_SECRET.length + ' chars)' : '❌ NOT SET',
		AUTH_URL: process.env.AUTH_URL ?? '(not set)',
		AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? '(not set)',
		NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? '(not set)',
		NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '⚠️ SET (OLD v4 var!)' : '(not set)',
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✅ SET' : '❌ NOT SET',
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✅ SET' : '❌ NOT SET',
		ADMIN_SECRET: process.env.ADMIN_SECRET ? '✅ SET' : '❌ NOT SET',
		PORT: process.env.PORT ?? '(not set)',
	};

	const proto = request.headers.get('x-forwarded-proto') ?? 'http';
	const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'unknown';
	const cfConnectingIp = request.headers.get('cf-connecting-ip');
	const cfRay = request.headers.get('cf-ray');

	return NextResponse.json(
		{
			timestamp: new Date().toISOString(),
			// The URL Auth.js will derive for cookie domain/secure decisions
			derivedAuthUrl: `${proto}://${host}`,
			requestUrl: request.url,
			// KEY DIAGNOSTIC: Is Cloudflare involved?
			cloudflare: {
				isCloudflareRequest: !!cfRay,
				cfRay,
				cfConnectingIp,
				cfVisitor: request.headers.get('cf-visitor'),
				cfIpcountry: request.headers.get('cf-ipcountry'),
			},
			// KEY DIAGNOSTIC: What does Auth.js see for HTTPS detection?
			httpsDetection: {
				xForwardedProto: request.headers.get('x-forwarded-proto'),
				xForwardedHost: request.headers.get('x-forwarded-host'),
				xForwardedPort: request.headers.get('x-forwarded-port'),
				forwarded: request.headers.get('forwarded'),
				host: request.headers.get('host'),
				// Auth.js v5 uses this to decide __Secure- prefix
				willUseSecureCookies: proto === 'https',
			},
			env,
			allHeaders: headers,
			cookies,
		},
		{ status: 200 },
	);
}

