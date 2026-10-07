'use client';

import { useEffect, useState } from 'react';

export function useWideStudio() {
	const [wide, setWide] = useState(
		() => typeof window !== 'undefined' && window.matchMedia('(min-width: 64rem)').matches,
	);
	useEffect(() => {
		const query = window.matchMedia('(min-width: 64rem)');
		const apply = () => setWide(query.matches);
		query.addEventListener('change', apply);
		return () => query.removeEventListener('change', apply);
	}, []);
	return wide;
}
