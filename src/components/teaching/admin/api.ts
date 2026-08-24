export async function teachingApi<T>(url: string, init?: RequestInit): Promise<T> {
	const isForm = typeof FormData !== 'undefined' && init?.body instanceof FormData;
	const res = await fetch(url, {
		...init,
		headers: isForm
			? init?.headers
			: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
	});
	const json = (await res.json()) as {
		ok: boolean;
		data?: T;
		error?: string;
		fields?: Record<string, string>;
		code?: string;
	};
	if (!json.ok) {
		const err = new Error(json.error ?? 'Request failed') as Error & {
			fields?: Record<string, string>;
			code?: string;
		};
		err.fields = json.fields;
		err.code = json.code;
		throw err;
	}
	return json.data as T;
}
