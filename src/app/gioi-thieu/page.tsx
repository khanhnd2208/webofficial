'use client';

import { useEffect } from 'react';

/**
 * Temporary redirect: about content now lives on the homepage anchor.
 * Client replace preserves the hash (HTTP Location cannot).
 */
export default function AboutRedirectPage() {
	useEffect(() => {
		window.location.replace('/#gioi-thieu');
	}, []);

	return (
		<main className="shell flex min-h-[40vh] items-center justify-center py-16">
			<p className="text-sm text-ink-secondary">Đang chuyển tới giới thiệu…</p>
		</main>
	);
}
