'use client';

import { useCallback, useEffect, useState } from 'react';

export default function ScrollToTop() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		function onScroll() {
			setVisible(window.scrollY > 500);
		}
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	const scrollUp = useCallback(() => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, []);

	if (!visible) return null;

	return (
		<button
			onClick={scrollUp}
			className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-paper shadow-md transition duration-200 hover:bg-surface-hover hover:shadow-lg active:scale-95"
			aria-label="Lên đầu trang"
		>
			<svg className="h-4 w-4 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
			</svg>
		</button>
	);
}
