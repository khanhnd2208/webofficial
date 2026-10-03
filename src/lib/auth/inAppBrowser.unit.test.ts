import { describe, expect, it } from 'vitest';
import { inAppBrowserName } from './inAppBrowser';

describe('inAppBrowserName', () => {
	it.each([
		['Mozilla/5.0 Zalo/123', 'Zalo'],
		['Mozilla/5.0 [FBAN/FBIOS;FBAV/123]', 'Facebook/Messenger'],
		['Mozilla/5.0 Instagram 123', 'Instagram'],
		['Mozilla/5.0 Line/14.0', 'LINE'],
		['Mozilla/5.0 (Linux; Android 14; wv) Chrome/123', 'trình duyệt trong ứng dụng'],
	])('detects %s', (ua, name) => expect(inAppBrowserName(ua)).toBe(name));
	it.each([
		'Mozilla/5.0 (Linux; Android 14) Chrome/123 Mobile Safari/537.36',
		'Mozilla/5.0 (iPhone) Version/17 Mobile Safari/604.1',
		'Mozilla/5.0 Chrome/123 Safari/537.36',
		'',
	])('leaves ordinary browsers alone: %s', (ua) => expect(inAppBrowserName(ua)).toBeNull());
});
