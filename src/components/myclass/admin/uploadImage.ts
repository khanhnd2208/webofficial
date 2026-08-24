export async function uploadMyClassImage(file: File): Promise<string> {
	const form = new FormData();
	form.append('file', file);
	const response = await fetch('/api/uploads', { method: 'POST', body: form });
	const payload = (await response.json()) as {
		ok: boolean;
		data?: { url: string };
		error?: string;
	};
	if (!response.ok || !payload.ok || !payload.data?.url) {
		throw new Error(payload.error ?? 'Không tải ảnh lên được');
	}
	return payload.data.url;
}
