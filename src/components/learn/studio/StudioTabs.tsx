'use client';

import { useSyncExternalStore } from 'react';

const query = '(min-width: 64rem)';
function subscribe(onChange: () => void) {
	const media = window.matchMedia(query);
	media.addEventListener('change', onChange);
	return () => media.removeEventListener('change', onChange);
}
const getSnapshot = () => window.matchMedia(query).matches;
const getServerSnapshot = () => false;

export function useWideStudio() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
