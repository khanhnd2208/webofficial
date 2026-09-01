import { describe, expect, it } from 'vitest';

import {
	destinationLabel,
	isSafeInternalPath,
	resolveAuthJsRedirect,
	sanitizeAuthRedirect,
} from './safeRedirect';

describe('sanitizeAuthRedirect', () => {
	it('keeps internal admin destinations', () => {
		expect(sanitizeAuthRedirect('/admin/teaching?tab=cp', { role: 'admin' })).toBe(
			'/admin/teaching?tab=cp',
		);
	});

	it('rejects protocol-relative URLs and only keeps the path of absolute URLs', () => {
		expect(sanitizeAuthRedirect('https://evil.example/phish')).toBe('/phish');
		expect(sanitizeAuthRedirect('//evil.example')).toBe('/tai-khoan');
		expect(sanitizeAuthRedirect('/\\evil')).toBe('/tai-khoan');
	});

	it('extracts the path from a same-looking absolute URL then still rejects other origins via Auth.js helper', () => {
		expect(resolveAuthJsRedirect('https://evil.example/admin', 'https://toiladuykhanh.com')).toBe(
			'https://toiladuykhanh.com',
		);
		expect(resolveAuthJsRedirect('https://toiladuykhanh.com/admin/posts', 'https://toiladuykhanh.com')).toBe(
			'https://toiladuykhanh.com/admin/posts',
		);
	});

	it('does not loop back to the login page', () => {
		expect(sanitizeAuthRedirect('/dang-nhap?error=CallbackRouteError', { role: 'admin' })).toBe(
			'/admin',
		);
	});

	it('rewrites retired account aliases', () => {
		expect(sanitizeAuthRedirect('/dashboard')).toBe('/tai-khoan/hoc');
		expect(sanitizeAuthRedirect('/giang-day')).toBe('/admin/teaching');
		expect(sanitizeAuthRedirect('/profile')).toBe('/tai-khoan');
		expect(sanitizeAuthRedirect('/my-space/teaching?tab=cp', { role: 'admin' })).toBe(
			'/admin/teaching?tab=cp',
		);
		expect(sanitizeAuthRedirect('/my-space/teaching/class-1?tab=cp', { role: 'admin' })).toBe(
			'/admin/teaching/class-1?tab=cp',
		);
		expect(sanitizeAuthRedirect('/messages/hello', { role: 'admin' })).toBe(
			'/admin/tools/messages/hello',
		);
	});

	it('uses the admin home when the signed-in role is admin and no destination exists', () => {
		expect(sanitizeAuthRedirect(undefined, { role: 'admin' })).toBe('/admin');
	});
});

describe('isSafeInternalPath', () => {
	it('accepts app paths only', () => {
		expect(isSafeInternalPath('/admin')).toBe(true);
		expect(isSafeInternalPath('admin')).toBe(false);
		expect(isSafeInternalPath('https://toiladuykhanh.com')).toBe(false);
	});
});

describe('destinationLabel', () => {
	it('names common destinations in Vietnamese', () => {
		expect(destinationLabel('/admin/posts')).toBe('khu quản trị');
		expect(destinationLabel('/tai-khoan')).toBe('tài khoản');
		expect(destinationLabel('/')).toBeNull();
	});
});
