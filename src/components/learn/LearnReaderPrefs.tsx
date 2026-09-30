'use client';

import { useSyncExternalStore } from 'react';

const FONT_KEY = 'ln:font-size';
const FONT_EVENT = 'ln:font-size';

export type LearnFontSize = 'md' | 'lg' | 'xl';

const SIZES: Array<{ id: LearnFontSize; label: string }> = [
	{ id: 'md', label: 'A' },
	{ id: 'lg', label: 'A+' },
	{ id: 'xl', label: 'A++' },
];

function readSize(): LearnFontSize {
	try {
		const value = window.localStorage.getItem(FONT_KEY);
		if (value === 'lg' || value === 'xl') return value;
	} catch {
		/* storage unavailable */
	}
	return 'md';
}

function subscribeSize(onChange: () => void) {
	window.addEventListener('storage', onChange);
	window.addEventListener(FONT_EVENT, onChange);
	return () => {
		window.removeEventListener('storage', onChange);
		window.removeEventListener(FONT_EVENT, onChange);
	};
}

export function useLearnFontSize(): LearnFontSize {
	return useSyncExternalStore(subscribeSize, readSize, () => 'md');
}

function writeSize(size: LearnFontSize) {
	try {
		window.localStorage.setItem(FONT_KEY, size);
	} catch {
		/* storage unavailable */
	}
	window.dispatchEvent(new Event(FONT_EVENT));
}

/** Segmented A / A+ / A++ control. The frame reads the same store and sets data-size. */
export default function LearnReaderPrefs() {
	const size = useLearnFontSize();

	return (
		<div className="ln-font">
			<button
				type="button"
				className="ln-font__trigger"
				popoverTarget="ln-font-size"
				aria-label="Cỡ chữ"
			>
				Aa
			</button>
			<div id="ln-font-size" popover="auto" className="ln-font__popover">
				<div role="group" aria-label="Cỡ chữ" className="ln-font__group">
					{SIZES.map((item) => (
						<button
							key={item.id}
							type="button"
							className="ln-font__option"
							aria-pressed={size === item.id}
							onClick={() => writeSize(item.id)}
						>
							{item.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
