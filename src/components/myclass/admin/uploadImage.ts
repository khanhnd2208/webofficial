import { adminFetch } from '@/lib/admin/client';

export async function uploadMyClassImage(file: File): Promise<string> {
	const form = new FormData();
	form.append('file', file);
	const payload = await adminFetch<{ url: string }>('/api/uploads', { method: 'POST', body: form });
	if (!payload?.url) {
		throw new Error('Không tải ảnh lên được');
	}
	return payload.url;
}
