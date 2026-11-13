// Mạng ở sự kiện hay chập chờn: một yêu cầu treo không được giữ sân khấu đứng yên mãi.
const TIMEOUT_MS = 12000;

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
	const signal = AbortSignal.timeout?.(TIMEOUT_MS);
	let response;
	try {
		response = await fetch('/api/' + path, { ...options, headers, signal });
	} catch {
		throw new Error('Không kết nối được máy chủ.');
	}
	const result = await response.json().catch(() => null);
	if (!response.ok || !result?.ok) {
		throw new Error(result?.error || 'Không kết nối được máy chủ.');
	}
	return result.data;
}
