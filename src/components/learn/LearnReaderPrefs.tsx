'use client';

import { useRef, useSyncExternalStore, type ToggleEvent } from 'react';

const FONT_KEY = 'ln:font-size';
const FONT_EVENT = 'ln:font-size';
const THEME_KEY = 'ln:theme';
const THEME_EVENT = 'ln:theme';

export type LearnFontSize = 'md' | 'lg' | 'xl';
export type LearnTheme = 'light' | 'sepia' | 'dark';

const SIZES: Array<{ id: LearnFontSize; label: string; name: string }> = [
	{ id: 'md', label: 'A', name: 'Cỡ chữ vừa' },
	{ id: 'lg', label: 'A+', name: 'Cỡ chữ lớn' },
	{ id: 'xl', label: 'A++', name: 'Cỡ chữ rất lớn' },
];

const THEMES: Array<{ id: LearnTheme; label: string }> = [
	{ id: 'light', label: 'Sáng' },
	{ id: 'sepia', label: 'Ngà' },
	{ id: 'dark', label: 'Tối' },
];

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
	try {
		const value = window.localStorage.getItem(key);
		if (value && (allowed as readonly string[]).includes(value)) return value as T;
	} catch {
		/* storage unavailable */
	}
	return fallback;
}

function write(key: string, event: string, value: string) {
	try {
		window.localStorage.setItem(key, value);
	} catch {
		/* storage unavailable */
	}
	window.dispatchEvent(new Event(event));
}

function subscribeTo(event: string) {
	return (onChange: () => void) => {
		window.addEventListener('storage', onChange);
		window.addEventListener(event, onChange);
		return () => {
			window.removeEventListener('storage', onChange);
			window.removeEventListener(event, onChange);
		};
	};
}

const subscribeSize = subscribeTo(FONT_EVENT);
const subscribeTheme = subscribeTo(THEME_EVENT);
const SIZE_IDS = SIZES.map((item) => item.id);
const THEME_IDS = THEMES.map((item) => item.id);

export function useLearnFontSize(): LearnFontSize {
	return useSyncExternalStore(
		subscribeSize,
		() => read(FONT_KEY, SIZE_IDS, 'md'),
		() => 'md',
	);
}

export function useLearnTheme(): LearnTheme {
	return useSyncExternalStore(
		subscribeTheme,
		() => read(THEME_KEY, THEME_IDS, 'light'),
		() => 'light',
	);
}

/** Reading settings: text size and page colour. The frame reads the same stores. */
export default function LearnReaderPrefs() {
	const size = useLearnFontSize();
	const theme = useLearnTheme();
	const triggerRef = useRef<HTMLButtonElement>(null);

	// Popovers open in the top layer, away from their trigger: pin this one under the button.
	function place(event: ToggleEvent<HTMLDivElement>) {
		if (event.newState !== 'open') return;
		const trigger = triggerRef.current?.getBoundingClientRect();
		if (!trigger) return;
		const panel = event.currentTarget;
		panel.style.top = `${trigger.bottom + 6}px`;
		panel.style.right = `${Math.max(8, window.innerWidth - trigger.right)}px`;
	}

	return (
		<div className="ln-font">
			<button
				ref={triggerRef}
				type="button"
				className="ln-font__trigger"
				popoverTarget="ln-font-size"
				aria-label="Tùy chỉnh trang đọc"
			>
				Aa
			</button>
			<div id="ln-font-size" popover="auto" className="ln-font__popover" onBeforeToggle={place}>
				<p className="ln-font__label">Cỡ chữ</p>
				<div role="group" aria-label="Cỡ chữ" className="ln-font__group">
					{SIZES.map((item) => (
						<button
							key={item.id}
							type="button"
							className="ln-font__option"
							aria-pressed={size === item.id}
							aria-label={item.name}
							onClick={() => write(FONT_KEY, FONT_EVENT, item.id)}
						>
							{item.label}
						</button>
					))}
				</div>
				<p className="ln-font__label">Màu nền</p>
				<div role="group" aria-label="Màu nền" className="ln-font__group">
					{THEMES.map((item) => (
						<button
							key={item.id}
							type="button"
							className="ln-font__option ln-font__swatch"
							data-theme-option={item.id}
							aria-pressed={theme === item.id}
							onClick={() => write(THEME_KEY, THEME_EVENT, item.id)}
						>
							{item.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
