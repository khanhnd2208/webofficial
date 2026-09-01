import { headers } from 'next/headers';

import { sanitizeAuthRedirect } from '@/lib/auth/safeRedirect';

export async function incomingAdminPath(): Promise<string> {
	const headerList = await headers();
	const candidates = [
		headerList.get('x-pathname'),
		headerList.get('next-url'),
		headerList.get('x-url'),
		headerList.get('x-invoke-path'),
	];
	for (const raw of candidates) {
		if (!raw) continue;
		const path = raw.startsWith('http') ? new URL(raw).pathname + new URL(raw).search : raw;
		const safe = sanitizeAuthRedirect(path, { role: 'admin', fallback: '' });
		if (safe) return safe;
	}
	return '/admin';
}
