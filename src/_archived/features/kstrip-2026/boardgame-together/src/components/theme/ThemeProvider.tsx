'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
	theme: Theme;
	resolved: 'light' | 'dark';
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'kstrip-theme';

function getSystemTheme(): 'light' | 'dark' {
	if (typeof window === 'undefined') return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: 'light' | 'dark') {
	document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>('system');
	const [resolved, setResolved] = useState<'light' | 'dark'>('light');

	const setTheme = useCallback((next: Theme) => {
		setThemeState(next);
		localStorage.setItem(STORAGE_KEY, next);
		const r = next === 'system' ? getSystemTheme() : next;
		setResolved(r);
		applyTheme(r);
	}, []);

	useEffect(() => {
		const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system';
		setThemeState(stored);
		const r = stored === 'system' ? getSystemTheme() : stored;
		setResolved(r);
		applyTheme(r);

		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const onChange = () => {
			const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system';
			if (stored === 'system') {
				const sys = getSystemTheme();
				setResolved(sys);
				applyTheme(sys);
			}
		};
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	}, []);

	return (
		<ThemeContext.Provider value={{ theme, resolved, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
	return ctx;
}
