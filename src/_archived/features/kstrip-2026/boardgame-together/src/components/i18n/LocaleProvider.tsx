'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { tLocale } from '@/lib/i18n/tLocale';
import {
	DEFAULT_LOCALE,
	isLocale,
	LOCALE_STORAGE_KEY,
	type Locale,
	type MessageParams,
} from '@/lib/i18n/types';

interface LocaleContextValue {
	locale: Locale;
	setLocale: (locale: Locale) => void;
	t: (key: string, params?: MessageParams) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function applyHtmlLang(locale: Locale) {
	document.documentElement.lang = locale;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

	const setLocale = useCallback((next: Locale) => {
		setLocaleState(next);
		localStorage.setItem(LOCALE_STORAGE_KEY, next);
		applyHtmlLang(next);
	}, []);

	useEffect(() => {
		const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
		const next = isLocale(stored) ? stored : DEFAULT_LOCALE;
		setLocaleState(next);
		applyHtmlLang(next);
	}, []);

	const t = useCallback(
		(key: string, params?: MessageParams) => tLocale(locale, key, params),
		[locale],
	);

	const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

	return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
	const ctx = useContext(LocaleContext);
	if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
	return ctx;
}

export function useT() {
	return useLocale().t;
}
