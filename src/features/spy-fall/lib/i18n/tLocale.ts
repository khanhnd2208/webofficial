import { en, vi } from '@/features/spy-fall/lib/i18n/messages';
import { translate, type Locale, type MessageParams } from '@/features/spy-fall/lib/i18n/types';

const CATALOGS = { vi, en } as const;

/** Server-safe / non-React translate by locale. */
export function tLocale(locale: Locale, key: string, params?: MessageParams): string {
	return translate(CATALOGS[locale], key, params);
}

export function resolveErrorMessage(
	locale: Locale,
	code: string,
	params?: MessageParams,
): string {
	const key = `errors.${code}`;
	const msg = tLocale(locale, key, params);
	if (msg === key) return tLocale(locale, 'errors.UNKNOWN');
	return msg;
}
