/**
 * Browser-side memory of where a person pressed "Đăng nhập", so the page can scroll back to the
 * same spot once Google returns them. Kept in sessionStorage: one tab, gone when it closes.
 */

const STORAGE_KEY = 'auth:return-position';
/** A sign-in that takes longer than this is treated as abandoned. */
const MAX_AGE_MS = 15 * 60 * 1000;

export type ReturnPosition = { path: string; y: number; at: number };

type PositionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** The login link that always brings the person back to `from`. */
export function loginHrefFrom(loginPath: string, from: string): string {
	return `${loginPath}?from=${encodeURIComponent(from)}`;
}

export function rememberReturnPosition(
	storage: PositionStorage,
	position: Omit<ReturnPosition, 'at'>,
	now: number = Date.now(),
): void {
	try {
		storage.setItem(STORAGE_KEY, JSON.stringify({ ...position, at: now }));
	} catch {
		// Private mode or blocked storage: the page still returns, just at the top.
	}
}

/**
 * The saved scroll offset for `path`, consumed once. Entries for other pages stay put (the login
 * page itself loads in between), and stale ones are dropped.
 */
export function takeReturnPosition(
	storage: PositionStorage,
	path: string,
	now: number = Date.now(),
): number | null {
	let saved: Partial<ReturnPosition> | null;
	try {
		const raw = storage.getItem(STORAGE_KEY);
		if (!raw) return null;
		saved = JSON.parse(raw) as Partial<ReturnPosition> | null;
	} catch {
		return null;
	}

	const valid =
		saved !== null &&
		typeof saved.path === 'string' &&
		typeof saved.y === 'number' &&
		typeof saved.at === 'number' &&
		now - saved.at <= MAX_AGE_MS;
	if (valid && saved!.path !== path) return null;

	try {
		storage.removeItem(STORAGE_KEY);
	} catch {
		// Nothing to clean up if storage is blocked.
	}
	return valid ? saved!.y! : null;
}
