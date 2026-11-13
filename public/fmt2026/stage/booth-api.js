export async function api(path, body, method = 'POST', setupToken) {
	const options =
		body === undefined
			? { cache: 'no-store' }
			: {
					method,
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
				};
	const headers = new Headers(options.headers);
	if (setupToken) headers.set('x-fmt-setup', setupToken);
	const response = await fetch('/api/' + path, { ...options, headers });
	const result = await response.json().catch(() => null);
	if (!response.ok || !result?.ok) {
		throw new Error(result?.error || 'Không kết nối được máy chủ.');
	}
	return result.data;
}
