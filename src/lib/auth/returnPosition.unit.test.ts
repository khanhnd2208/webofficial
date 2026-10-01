import { describe, expect, it } from 'vitest';

import { loginHrefFrom, rememberReturnPosition, takeReturnPosition } from './returnPosition';

function memoryStorage() {
	const data = new Map<string, string>();
	return {
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => void data.set(key, value),
		removeItem: (key: string) => void data.delete(key),
		size: () => data.size,
	};
}

const NOW = 1_800_000_000_000;

describe('loginHrefFrom', () => {
	it('encodes the full location, #section included', () => {
		expect(loginHrefFrom('/dang-nhap', '/muc-luc?x=1#du-an')).toBe(
			'/dang-nhap?from=%2Fmuc-luc%3Fx%3D1%23du-an',
		);
	});
});

describe('takeReturnPosition', () => {
	it('returns the saved offset once for the same page', () => {
		const storage = memoryStorage();
		rememberReturnPosition(storage, { path: '/gioi-thieu', y: 1480 }, NOW);
		expect(takeReturnPosition(storage, '/gioi-thieu', NOW + 60_000)).toBe(1480);
		expect(takeReturnPosition(storage, '/gioi-thieu', NOW + 60_000)).toBeNull();
	});

	it('keeps the entry while another page (the login page) loads in between', () => {
		const storage = memoryStorage();
		rememberReturnPosition(storage, { path: '/gioi-thieu', y: 900 }, NOW);
		expect(takeReturnPosition(storage, '/dang-nhap', NOW + 1_000)).toBeNull();
		expect(takeReturnPosition(storage, '/gioi-thieu', NOW + 2_000)).toBe(900);
	});

	it('drops an abandoned sign-in', () => {
		const storage = memoryStorage();
		rememberReturnPosition(storage, { path: '/gioi-thieu', y: 900 }, NOW);
		expect(takeReturnPosition(storage, '/muc-luc', NOW + 60 * 60_000)).toBeNull();
		expect(storage.size()).toBe(0);
	});

	it('ignores malformed entries', () => {
		const storage = memoryStorage();
		storage.setItem('auth:return-position', '{not json');
		expect(takeReturnPosition(storage, '/gioi-thieu', NOW)).toBeNull();
	});
});
