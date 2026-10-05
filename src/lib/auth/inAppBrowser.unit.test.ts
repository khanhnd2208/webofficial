import { describe, expect, it } from 'vitest';
import { chromeIntentHref, inAppBrowserName } from './inAppBrowser';

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

describe('Chrome intent links', () => {
	it('preserves the destination and account choice on HTTPS Android', () => {
		expect(
			chromeIntentHref(
				'https://toiladuykhanh.com/dang-nhap?from=%2Fkhoa-hoc&chon=1#ignored',
				'Android Zalo',
			),
		).toBe(
			'intent://toiladuykhanh.com/dang-nhap?from=%2Fkhoa-hoc&chon=1#Intent;scheme=https;package=com.android.chrome;end',
		);
	});
	it('does not offer an intent for iOS or HTTP', () => {
		expect(chromeIntentHref('https://toiladuykhanh.com/dang-nhap', 'iPhone Zalo')).toBeNull();
		expect(chromeIntentHref('http://localhost/dang-nhap', 'Android Zalo')).toBeNull();
	});
});
