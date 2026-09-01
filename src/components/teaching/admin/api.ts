import { adminFetch, AdminApiError } from '@/lib/admin/client';

export { AdminApiError };

export async function teachingApi<T>(url: string, init?: RequestInit): Promise<T> {
	return adminFetch<T>(url, init);
}
