import { NextRequest, type NextResponse } from 'next/server';

type RouteHandler = (
	request: NextRequest,
	context?: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

/**
 * Invoke an App Router route handler in tests.
 */
export async function invokeRoute(
	handler: RouteHandler,
	options: {
		method?: string;
		url?: string;
		body?: unknown;
		headers?: Record<string, string>;
		params?: Record<string, string>;
	} = {},
): Promise<NextResponse> {
	const {
		method = 'GET',
		url = 'http://localhost:3000/api/test',
		body,
		headers = {},
		params = {},
	} = options;

	const init: RequestInit = { method, headers: { ...headers } };
	if (body !== undefined) {
		init.body = JSON.stringify(body);
		(init.headers as Record<string, string>)['Content-Type'] = 'application/json';
	}

	const request = new NextRequest(url, init as ConstructorParameters<typeof NextRequest>[1]);
	const context = { params: Promise.resolve(params) };
	return handler(request, context);
}

/** Parse JSON body from a NextResponse. */
export async function parseJson<T = unknown>(response: NextResponse): Promise<T> {
	return response.json() as Promise<T>;
}
