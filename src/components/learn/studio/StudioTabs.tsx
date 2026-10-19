'use client';

import { useSyncExternalStore, type KeyboardEvent } from 'react';

const query = '(min-width: 64rem)';

export type StudioArea = 'outline' | 'content' | 'info';

/** Arrow keys move between tabs and activate the destination. Home and End jump to the ends. */
export function onTabListKeyDown(event: KeyboardEvent<HTMLElement>) {
	const key = event.key;
	if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'Home' && key !== 'End') return;
	const tabs = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')].filter(
		(tab) => !tab.disabled,
	);
	const index = tabs.indexOf(event.target as HTMLButtonElement);
	if (index < 0 || !tabs.length) return;
	event.preventDefault();
	const nextIndex =
		key === 'Home'
			? 0
			: key === 'End'
				? tabs.length - 1
				: key === 'ArrowLeft'
					? (index + tabs.length - 1) % tabs.length
					: (index + 1) % tabs.length;
	const next = tabs[nextIndex];
	next.focus();
	next.click();
}
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
