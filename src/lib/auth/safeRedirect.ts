/**
 * Internal-only redirect sanitization for Auth.js v5 (`redirectTo`) and login pages.
 * Edge-safe: no Node-only APIs.
 *
 * Signing in only adds a session, so everyone (admin or student) returns to the page where they
 * pressed "Đăng nhập", including its query and #section. The homepage is the fallback only when
 * the sign-in has no origin at all.
 */

const LOGIN_PATHS = new Set(['/dang-nhap', '/login']);

export const AUTH_DEFAULT_AFTER_LOGIN = '/';

/** Path part of an in-app URL, without query or hash. */
function pathnameOf(path: string): string {
	return path.split(/[?#]/)[0] ?? path;
}

function stripOrigin(raw: string): string | null {
	if (!raw) return null;
	const trimmed = raw.trim();
	if (!trimmed) return null;

	if (/^https?:\/\//i.test(trimmed)) {
		try {
			const url = new URL(trimmed);
			return `${url.pathname}${url.search}${url.hash}`;
		} catch {
			return null;
		}
	}

	return trimmed;
}

/** True when the value is a same-app path (no scheme, no protocol-relative URL). */
export function isSafeInternalPath(value: string): boolean {
	if (!value.startsWith('/')) return false;
	if (value.startsWith('//') || value.startsWith('/\\')) return false;
	if (value.includes('\\')) return false;
	if (value.includes('://')) return false;
	return true;
}

function applyLegacyAliases(path: string): string {
	const pathname = pathnameOf(path);
	const search = path.slice(pathname.length);
	if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
		return `/tai-khoan/hoc${search}`;
	}
	if (pathname === '/giang-day' || pathname.startsWith('/giang-day/')) {
		return `/my-space/teaching${search}`;
	}
	if (pathname === '/admin/teaching' || pathname.startsWith('/admin/teaching/')) {
		return `/my-space/teaching${pathname.slice('/admin/teaching'.length)}${search}`;
	}
	if (pathname === '/messages' || pathname.startsWith('/messages/')) {
		return `/admin/tools/messages${pathname.slice('/messages'.length)}${search}`;
	}
	if (pathname === '/profile' || pathname.startsWith('/profile/')) {
		return `/tai-khoan${search}`;
	}
	return path;
}

/**
 * Keep only in-app destinations. External URLs, auth loops, and API callbacks are rejected.
 */
export function sanitizeAuthRedirect(
	raw: string | null | undefined,
	options?: { fallback?: string },
): string {
	const fallback = options?.fallback ?? AUTH_DEFAULT_AFTER_LOGIN;
	const extracted = stripOrigin(raw ?? '');
	if (!extracted || !isSafeInternalPath(extracted)) return fallback;

	const aliased = applyLegacyAliases(extracted);
	const pathname = pathnameOf(aliased);
	if (LOGIN_PATHS.has(pathname) || pathname.startsWith('/api/auth')) return fallback;

	return aliased;
}

/**
 * Where to go after signing in, from the first usable candidate: the explicit `from` /
 * `callbackUrl`, then fallbacks such as the Auth.js callback cookie or a same-site referrer.
 */
export function loginRedirectTarget(...candidates: Array<string | null | undefined>): string {
	for (const candidate of candidates) {
		const safe = sanitizeAuthRedirect(candidate, { fallback: '' });
		if (safe) return safe;
	}
	return AUTH_DEFAULT_AFTER_LOGIN;
}

/** The referrer's in-app path, or null when it came from another site. */
export function sameSiteReferrerPath(
	referrer: string | null | undefined,
	host: string | null | undefined,
): string | null {
	if (!referrer || !host) return null;
	try {
		const url = new URL(referrer);
		if (url.host !== host) return null;
		return `${url.pathname}${url.search}${url.hash}`;
	} catch {
		return null;
	}
}

/** Auth.js `redirect` callback: always return an absolute URL on this origin. */
export function resolveAuthJsRedirect(url: string, baseUrl: string): string {
	let origin: URL;
	try {
		origin = new URL(baseUrl);
	} catch {
		return baseUrl;
	}

	let candidate = url;
	try {
		if (url.startsWith('/')) {
			candidate = url;
		} else {
			const parsed = new URL(url);
			if (parsed.origin !== origin.origin) return origin.origin;
			candidate = `${parsed.pathname}${parsed.search}${parsed.hash}`;
		}
	} catch {
		return origin.origin;
	}

	const safe = sanitizeAuthRedirect(candidate, { fallback: '/' });
	return `${origin.origin}${safe}`;
}

export function destinationLabel(from: string): string | null {
	if (!from || from === '/' || from.startsWith('http')) return null;
	const pathname = pathnameOf(from);
	if (pathname.startsWith('/my-space/teaching')) return 'Teaching';
	if (pathname.startsWith('/my-space/courses') || pathname.startsWith('/khoa-hoc')) {
		return 'khóa học';
	}
	if (pathname.startsWith('/my-space/board-game')) return 'Board Game';
	if (pathname.startsWith('/lop/')) return 'trang lớp';
	if (pathname.startsWith('/admin')) return 'khu quản trị';
	if (pathname.startsWith('/ghi-chep') || pathname.startsWith('/bai-viet')) return 'ghi chép';
	if (pathname.startsWith('/tai-khoan')) return 'tài khoản';
	if (pathname === '/muc-luc') return 'Mục lục';
	if (pathname.startsWith('/my-space')) return 'My Space';
	return 'trang bạn vừa mở';
}
