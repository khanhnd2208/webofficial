'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextType = {
	theme: Theme;
	actualTheme: 'light' | 'dark';
	setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>('system');
	const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

	useEffect(() => {
		// Load theme from localStorage
		const stored = localStorage.getItem('theme') as Theme | null;
		if (stored && ['light', 'dark', 'system'].includes(stored)) {
			setThemeState(stored);
		}
	}, []);

	useEffect(() => {
		const root = document.documentElement;
		
		if (theme === 'system') {
			const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
			setActualTheme(systemTheme);
			root.classList.remove('light', 'dark');
			root.classList.add(systemTheme);
		} else {
			setActualTheme(theme);
			root.classList.remove('light', 'dark');
			root.classList.add(theme);
		}
	}, [theme]);

	useEffect(() => {
		if (theme === 'system') {
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			const handleChange = (e: MediaQueryListEvent) => {
				const newTheme = e.matches ? 'dark' : 'light';
				setActualTheme(newTheme);
				document.documentElement.classList.remove('light', 'dark');
				document.documentElement.classList.add(newTheme);
			};
			mediaQuery.addEventListener('change', handleChange);
			return () => mediaQuery.removeEventListener('change', handleChange);
		}
	}, [theme]);

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme);
		localStorage.setItem('theme', newTheme);
	};

	return (
		<ThemeContext.Provider value={{ theme, actualTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used within ThemeProvider');
	}
	return context;
}
