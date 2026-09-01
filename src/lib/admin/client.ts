/**
 * Admin client fetch — one contract, one 401/403 policy.
 *
 * Success: `{ ok: true, data }`
 * Failure: `{ ok: false, error, code?, fields?, requestId? }`
 * Empty: HTTP 204 returns `undefined`
 */

import { routes } from '@/config/routes';

export class AdminApiError extends Error {
	status: number;
	code?: string;
	fields?: Record<string, string>;
	requestId?: string;

	constructor(
		message: string,
		init: { status: number; code?: string; fields?: Record<string, string>; requestId?: string },
	) {
		super(message);
		this.name = 'AdminApiError';
		this.status = init.status;
		this.code = init.code;
		this.fields = init.fields;
		this.requestId = init.requestId;
	}
}

type Envelope<T> = {
	ok?: boolean;
	data?: T;
	error?: string;
	code?: string;
	fields?: Record<string, string>;
	requestId?: string;
};

export function clientLoginHref(from?: string): string {
	if (typeof window === 'undefined') {
		return from ? `${routes.login}?from=${encodeURIComponent(from)}` : routes.login;
	}
	const path = from ?? `${window.location.pathname}${window.location.search}`;
	return `${routes.login}?from=${encodeURIComponent(path)}`;
}

function isFormDataBody(body: BodyInit | null | undefined): boolean {
	return typeof FormData !== 'undefined' && body instanceof FormData;
}

function requestHeaders(init?: RequestInit): Headers {
	const headers = new Headers(init?.headers);
	const method = (init?.method ?? 'GET').toUpperCase();
	const body = init?.body;
	if (body && !isFormDataBody(body) && !headers.has('Content-Type') && method !== 'GET' && method !== 'HEAD') {
		headers.set('Content-Type', 'application/json');
	}
	return headers;
}

function readHeader(res: Response, name: string): string | null {
	try {
		return res.headers?.get?.(name) ?? null;
	} catch {
		return null;
	}
}

export async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, {
		...init,
		credentials: 'same-origin',
		headers: requestHeaders(init),
	});
	const requestId = readHeader(res, 'x-request-id') ?? undefined;
	const status = typeof res.status === 'number' ? res.status : 200;

	if (status === 204) {
		return undefined as T;
	}

	let json: Envelope<T> = {};
	try {
		json = (await res.json()) as Envelope<T>;
	} catch {
		json = {};
	}

	if (status === 401) {
		if (typeof window !== 'undefined') {
			window.location.assign(clientLoginHref());
		}
		throw new AdminApiError(json.error ?? 'Phiên đăng nhập đã hết hạn', {
			status: 401,
			code: json.code ?? 'UNAUTHORIZED',
			requestId: json.requestId ?? requestId,
		});
	}

	if (status === 403) {
		throw new AdminApiError(json.error ?? 'Bạn không có quyền thực hiện thao tác này', {
			status: 403,
			code: json.code ?? 'FORBIDDEN',
			requestId: json.requestId ?? requestId,
		});
	}

	const httpFailed = res.ok === false || status >= 400;
	if (httpFailed || json.ok === false) {
		throw new AdminApiError(json.error ?? 'Yêu cầu thất bại', {
			status,
			code: json.code,
			fields: json.fields,
			requestId: json.requestId ?? requestId,
		});
	}

	return json.data as T;
}
