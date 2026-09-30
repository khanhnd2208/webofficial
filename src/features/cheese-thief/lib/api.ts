import { withBasePath } from '@/features/spy-fall/lib/basePath';
import { resolveErrorMessage } from '@/features/spy-fall/lib/i18n/tLocale';
import {
	DEFAULT_LOCALE,
	isLocale,
	LOCALE_STORAGE_KEY,
	type Locale,
	type MessageParams,
} from '@/features/spy-fall/lib/i18n/types';
import type { RoomStateDTO } from '@/features/cheese-thief/types';

type ApiEnvelope<T> = {
	ok: boolean;
	data?: T;
	error?: string;
	code?: string;
	params?: MessageParams;
};

function readClientLocale(): Locale {
	if (typeof window === 'undefined') return DEFAULT_LOCALE;
	const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
	return isLocale(stored) ? stored : DEFAULT_LOCALE;
}

async function parseResponse<T>(res: Response): Promise<T> {
	const json = (await res.json()) as ApiEnvelope<T>;
	if (!json.ok) {
		const code = json.code ?? json.error ?? 'UNKNOWN';
		throw new Error(resolveErrorMessage(readClientLocale(), code, json.params));
	}
	return json.data as T;
}

export async function fetchRoomState(code: string, token: string | null): Promise<RoomStateDTO> {
	const qs = token ? `?token=${encodeURIComponent(token)}` : '';
	const res = await fetch(withBasePath(`/api/cheese-thief/rooms/${code}/state${qs}`), {
		cache: 'no-store',
	});
	return parseResponse<RoomStateDTO>(res);
}

export async function postCheeseAction<T>(path: string, body: Record<string, unknown>): Promise<T> {
	const res = await fetch(withBasePath(path), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	return parseResponse<T>(res);
}

export async function patchCheeseAction<T>(
	path: string,
	body: Record<string, unknown>,
): Promise<T> {
	const res = await fetch(withBasePath(path), {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	return parseResponse<T>(res);
}
