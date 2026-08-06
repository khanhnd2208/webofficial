import { describe, expect, it } from 'vitest';

import { resolveErrorMessage, tLocale } from '@/lib/i18n/tLocale';
import { translate } from '@/lib/i18n/types';

describe('i18n translate', () => {
	it('interpolates params', () => {
		expect(tLocale('vi', 'errors.NEED_MIN_PLAYERS', { min: 4 })).toContain('4');
		expect(tLocale('en', 'errors.NEED_MIN_PLAYERS', { min: 4 })).toContain('4');
	});

	it('falls back to key when missing', () => {
		expect(translate({ a: 'x' }, 'missing.path')).toBe('missing.path');
	});

	it('resolves error codes for both locales', () => {
		expect(resolveErrorMessage('vi', 'ROOM_NOT_FOUND')).toMatch(/phòng/i);
		expect(resolveErrorMessage('en', 'ROOM_NOT_FOUND')).toMatch(/room/i);
		expect(resolveErrorMessage('en', 'NO_SUCH_CODE')).toMatch(/unknown/i);
	});

	it('translates hub and spy brand keys', () => {
		expect(tLocale('vi', 'hub.games.spy.title')).toContain('Gián Điệp');
		expect(tLocale('en', 'hub.games.spy.title')).toMatch(/Spy/i);
		expect(tLocale('en', 'spy.result.playAgain')).toBe('Play again');
	});
});
