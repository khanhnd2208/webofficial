import { NextResponse } from 'next/server';

import { withErrorHandling } from '@/lib/apiUtils';

import { GET, POST as authPost } from '@/lib/auth';
import { isSafeInternalPath } from '@/lib/auth/safeRedirect';

export { GET };

/** Auth.js owns CSRF validation and cookie deletion; only successful native sign-out redirects
 * use the original request origin, so previews do not navigate to production's AUTH_URL. */
export const POST = withErrorHandling(async (request) => {
	const nativeSignOut =
		request.nextUrl.pathname === '/api/auth/signout' &&
		!request.headers.has('x-auth-return-redirect');
	const fields = nativeSignOut ? await request.clone().formData() : null;
	const authResponse = await authPost(request);
	const response = new NextResponse(authResponse.body, {
		status: authResponse.status,
		statusText: authResponse.statusText,
		headers: authResponse.headers,
	});
	const location = response.headers.get('location');
	if (!fields || !location || response.status < 300 || response.status >= 400) return response;
	const redirect = new URL(location, request.url);
	// Keep Auth.js failures intact, including CSRF failures.
	if (redirect.searchParams.has('error') || redirect.pathname === '/api/auth/error')
		return response;
	const callback = fields.get('callbackUrl');
	if (typeof callback !== 'string') return response;
	const origin = request.nextUrl.origin;
	let destination: URL;
	try {
		destination = new URL(callback, origin);
	} catch {
		return response;
	}
	const path = `${destination.pathname}${destination.search}${destination.hash}`;
	if (
		destination.origin !== origin ||
		!isSafeInternalPath(path) ||
		destination.pathname.startsWith('/api/auth')
	)
		return response;
	response.headers.set('location', destination.href);
	return response;
});
