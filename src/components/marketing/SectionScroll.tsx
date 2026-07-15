'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const ALLOWED = new Set([
	'dich-vu',
	'giang-day-workshop',
	'thiet-ke-chuong-trinh',
	'tu-van-phat-trien',
	'dau-moc',
	'quy-trinh',
]);

/** Scrolls to `?section=` targets used by permanent redirects (hashes are not HTTP-safe). */
export default function SectionScroll() {
	const searchParams = useSearchParams();
	const section = searchParams.get('section');

	useEffect(() => {
		if (!section || !ALLOWED.has(section)) return;
		const el = document.getElementById(section);
		if (!el) return;
		const frame = window.requestAnimationFrame(() => {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
		return () => window.cancelAnimationFrame(frame);
	}, [section]);

	return null;
}
