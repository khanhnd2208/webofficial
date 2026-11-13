/** Small fetch helper for the FMT 2026 pages: unwraps `{ ok, data, error }`. */

export class BoothApiError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly code?: string,
	) {
		super(message);
		this.name = 'BoothApiError';
	}
}

export async function boothFetch<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, {
		...init,
		cache: 'no-store',
		headers: { 'content-type': 'application/json', ...init?.headers },
	});
	const body = (await response.json().catch(() => null)) as {
		ok?: boolean;
		data?: T;
		error?: string;
		code?: string;
	} | null;
	if (!response.ok || !body?.ok) {
		throw new BoothApiError(
			body?.error ?? 'Không kết nối được máy chủ',
			response.status,
			body?.code,
		);
	}
	return body.data as T;
}

export const boothEndpoints = {
	state: '/api/fmt2026/state',
	unlock: '/api/fmt2026/unlock',
	draw: '/api/fmt2026/draw',
	admin: '/api/admin/fmt2026',
	adminPrizes: '/api/admin/fmt2026/prizes',
	adminPrize: (id: string) => `/api/admin/fmt2026/prizes/${encodeURIComponent(id)}`,
	adminSettings: '/api/admin/fmt2026/settings',
	adminVoid: '/api/admin/fmt2026/draws/void',
} as const;
