'use client';

import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<div className="inline-flex items-center rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-800">
			<button
				type="button"
				onClick={() => setTheme('light')}
				className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
					theme === 'light'
						? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50'
						: 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50'
				}`}
				aria-label="Light mode"
			>
				<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
				</svg>
			</button>
			<button
				type="button"
				onClick={() => setTheme('dark')}
				className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
					theme === 'dark'
						? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50'
						: 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50'
				}`}
				aria-label="Dark mode"
			>
				<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
				</svg>
			</button>
			<button
				type="button"
				onClick={() => setTheme('system')}
				className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
					theme === 'system'
						? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50'
						: 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50'
				}`}
				aria-label="System mode"
			>
				<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
				</svg>
			</button>
		</div>
	);
}
