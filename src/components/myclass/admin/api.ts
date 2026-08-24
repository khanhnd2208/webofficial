export async function myClassApi<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, {
		...init,
		headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
	});
	const json = (await res.json()) as {
		ok: boolean;
		data?: T;
		error?: string;
		fields?: Record<string, string>;
		code?: string;
	};
	if (!json.ok) {
		const err = new Error(json.error ?? 'Yêu cầu thất bại') as Error & {
			fields?: Record<string, string>;
			code?: string;
		};
		err.fields = json.fields;
		err.code = json.code;
		throw err;
	}
	return json.data as T;
}

export function unwrapList<T>(data: T[] | { items: T[] } | null | undefined): T[] {
	if (!data) return [];
	if (Array.isArray(data)) return data;
	return Array.isArray(data.items) ? data.items : [];
}

export async function myClassList<T>(url: string, init?: RequestInit): Promise<T[]> {
	return unwrapList(await myClassApi<T[] | { items: T[] }>(url, init));
}
