export type Locale = 'vi' | 'en';

export const LOCALES: Locale[] = ['vi', 'en'];
export const DEFAULT_LOCALE: Locale = 'vi';
export const LOCALE_STORAGE_KEY = 'spy-fall-locale';

export type MessageParams = Record<string, string | number>;

/** Nested message tree — leaf values are strings. */
export type MessageTree = { [key: string]: string | MessageTree };

export function isLocale(value: string | null | undefined): value is Locale {
	return value === 'vi' || value === 'en';
}

export function translate(
	tree: MessageTree,
	key: string,
	params?: MessageParams,
): string {
	const parts = key.split('.');
	let cur: string | MessageTree | undefined = tree;
	for (const part of parts) {
		if (!cur || typeof cur === 'string') return key;
		cur = cur[part];
	}
	if (typeof cur !== 'string') return key;
	if (!params) return cur;
	return cur.replace(/\{(\w+)\}/g, (_, name: string) =>
		params[name] !== undefined ? String(params[name]) : `{${name}}`,
	);
}
