/**
 * Internal-only redirect sanitization for Auth.js v5 (`redirectTo`) and login pages.
 * Edge-safe: no Node-only APIs.
 */

const LOGIN_PATHS = new Set(['/dang-nhap', '/login']);

export const AUTH_DEFAULT_AFTER_LOGIN = '/tai-khoan';
export const AUTH_DEFAULT_AFTER_LOGIN_ADMIN = '/admin';

export type AuthRedirectRole = 'admin' | 'student';

function fallbackFor(role?: AuthRedirectRole): string {
	return role === 'admin' ? AUTH_DEFAULT_AFTER_LOGIN_ADMIN : AUTH_DEFAULT_AFTER_LOGIN;
}

function stripOrigin(raw: string): string | null {
	if (!raw) return null;
	const trimmed = raw.trim();
	if (!trimmed) return null;

	if (/^https?:\/\//i.test(trimmed)) {
		try {
			const url = new URL(trimmed);
			return `${url.pathname}${url.search}`;
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
	const pathname = path.split('?')[0] ?? path;
	const search = path.slice(pathname.length);
	if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
		return `/tai-khoan/hoc${search}`;
	}
	if (pathname === '/giang-day' || pathname.startsWith('/giang-day/')) {
		return `/admin/teaching${search}`;
	}
	if (pathname === '/my-space/teaching' || pathname.startsWith('/my-space/teaching/')) {
		return `/admin/teaching${pathname.slice('/my-space/teaching'.length)}${search}`;
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
	options?: { role?: AuthRedirectRole; fallback?: string },
): string {
	const fallback = options?.fallback ?? fallbackFor(options?.role);
	const extracted = stripOrigin(raw ?? '');
	if (!extracted || !isSafeInternalPath(extracted)) return fallback;

	const aliased = applyLegacyAliases(extracted);
	const pathname = aliased.split('?')[0] ?? aliased;
	if (LOGIN_PATHS.has(pathname) || pathname.startsWith('/api/auth')) return fallback;

	return aliased;
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
			candidate = `${parsed.pathname}${parsed.search}`;
		}
	} catch {
		return origin.origin;
	}

	const safe = sanitizeAuthRedirect(candidate, { fallback: '/' });
	return `${origin.origin}${safe}`;
}

export function destinationLabel(from: string): string | null {
	if (!from || from === '/' || from.startsWith('http')) return null;
	if (from.startsWith('/admin')) return 'khu quản trị';
	if (from.startsWith('/ghi-chep') || from.startsWith('/bai-viet')) return 'ghi chép';
	if (from.startsWith('/tai-khoan')) return 'tài khoản';
	if (from.startsWith('/my-space')) return 'My Space';
	return 'trang bạn vừa mở';
}
