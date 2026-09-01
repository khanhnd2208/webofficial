export { AdminApiError, adminFetch as myClassApi } from '@/lib/admin/client';

export function unwrapList<T>(data: T[] | { items: T[] } | null | undefined): T[] {
	if (!data) return [];
	if (Array.isArray(data)) return data;
	return Array.isArray(data.items) ? data.items : [];
}

export async function myClassList<T>(url: string, init?: RequestInit): Promise<T[]> {
	const { adminFetch } = await import('@/lib/admin/client');
	return unwrapList(await adminFetch<T[] | { items: T[] }>(url, init));
}
