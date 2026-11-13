export async function api(path, body) {
	const options =
		body === undefined
			? { cache: 'no-store' }
			: {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
				};
	const response = await fetch('/api/fmt2026/' + path, options);
	const result = await response.json().catch(() => null);
	if (!response.ok || !result?.ok) {
		throw new Error(result?.error || 'Không kết nối được máy chủ.');
	}
	return result.data;
}
