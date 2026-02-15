'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// Avoid hydration mismatch: only render after mount
	// eslint-disable-next-line react-hooks/set-state-in-effect
	useEffect(() => setMounted(true), []);

	if (!mounted) {
		return (
			<div className="inline-flex items-center rounded-lg bg-surface-secondary p-0.5">
				<div className="h-7 w-20 animate-pulse rounded-md bg-surface-hover" />
			</div>
		);
	}

	const modes = [
		{ key: 'light', label: 'Light mode', icon: (
			<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
			</svg>
		)},
		{ key: 'dark', label: 'Dark mode', icon: (
			<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
			</svg>
		)},
		{ key: 'system', label: 'System mode', icon: (
			<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
			</svg>
		)},
	] as const;

	return (
		<div className="inline-flex items-center rounded-lg bg-surface-secondary p-0.5">
			{modes.map(({ key, label, icon }) => (
				<button
					key={key}
					type="button"
					onClick={() => setTheme(key)}
					className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
						theme === key
							? 'bg-surface-elevated text-foreground shadow-sm'
							: 'text-muted hover:text-foreground'
					}`}
					aria-label={label}
				>
					{icon}
				</button>
			))}
		</div>
	);
}
