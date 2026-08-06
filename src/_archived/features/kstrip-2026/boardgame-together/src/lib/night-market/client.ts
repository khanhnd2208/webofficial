'use client';

import { withBasePath } from '@/lib/basePath';
import type {
	CreateNightMarketRoomInput,
	NightMarketActionInput,
	NightMarketRoomDTO,
} from '@/types/nightMarket';

type Envelope<T> = { ok: boolean; data?: T; code?: string; error?: string };

async function parse<T>(response: Response): Promise<T> {
	const envelope = (await response.json()) as Envelope<T>;
	if (!envelope.ok) throw new Error(envelope.code ?? envelope.error ?? 'UNKNOWN');
	return envelope.data as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
	return parse<T>(await fetch(withBasePath(path), {
		method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
	}));
}

export function createNightMarket(input: CreateNightMarketRoomInput) {
	return post<{ state: NightMarketRoomDTO; playerToken: string }>('/api/night-market/rooms', input);
}

export function joinNightMarket(code: string, name: string, playerToken?: string) {
	return post<{ state: NightMarketRoomDTO; playerToken: string }>(`/api/night-market/rooms/${code}/join`, { name, playerToken });
}

export async function fetchNightMarketState(code: string, token: string | null) {
	const query = token ? `?token=${encodeURIComponent(token)}` : '';
	return parse<NightMarketRoomDTO>(await fetch(withBasePath(`/api/night-market/rooms/${code}/state${query}`), { cache: 'no-store' }));
}

export function sendNightMarketAction(code: string, input: NightMarketActionInput) {
	return post<NightMarketRoomDTO>(`/api/night-market/rooms/${code}/actions`, input);
}

const tokenKey = (code: string) => `night-market-token:${code.toUpperCase()}`;
export const getNightMarketToken = (code: string) => typeof window === 'undefined' ? null : localStorage.getItem(tokenKey(code));
export const storeNightMarketToken = (code: string, token: string) => localStorage.setItem(tokenKey(code), token);
