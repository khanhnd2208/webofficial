import { describe, expect, it } from 'vitest';

import {
	destinationLabel,
	isSafeInternalPath,
	loginRedirectTarget,
	resolveAuthJsRedirect,
	sanitizeAuthRedirect,
} from './safeRedirect';

describe('sanitizeAuthRedirect', () => {
	it('keeps internal admin destinations', () => {
		expect(sanitizeAuthRedirect('/admin/website', { role: 'admin' })).toBe('/admin/website');
		expect(sanitizeAuthRedirect('/my-space/teaching?tab=cp', { role: 'admin' })).toBe(
			'/my-space/teaching?tab=cp',
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
		expect(
			resolveAuthJsRedirect('https://toiladuykhanh.com/admin/posts', 'https://toiladuykhanh.com'),
		).toBe('https://toiladuykhanh.com/admin/posts');
	});

	it('does not loop back to the login page', () => {
		expect(sanitizeAuthRedirect('/dang-nhap?error=CallbackRouteError', { role: 'admin' })).toBe(
			'/my-space/teaching',
		);
	});

	it('rewrites retired account aliases', () => {
		expect(sanitizeAuthRedirect('/dashboard')).toBe('/tai-khoan/hoc');
		expect(sanitizeAuthRedirect('/giang-day')).toBe('/my-space/teaching');
		expect(sanitizeAuthRedirect('/admin/teaching')).toBe('/my-space/teaching');
		expect(sanitizeAuthRedirect('/admin/teaching/class-1?tab=cp&week=2')).toBe(
			'/my-space/teaching/class-1?tab=cp&week=2',
		);
		expect(sanitizeAuthRedirect('/profile')).toBe('/tai-khoan');
		expect(sanitizeAuthRedirect('/my-space/teaching?tab=cp', { role: 'admin' })).toBe(
			'/my-space/teaching?tab=cp',
		);
		expect(sanitizeAuthRedirect('/my-space/teaching/class-1?tab=cp', { role: 'admin' })).toBe(
			'/my-space/teaching/class-1?tab=cp',
		);
		expect(sanitizeAuthRedirect('/messages/hello', { role: 'admin' })).toBe(
			'/admin/tools/messages/hello',
		);
	});

	it('lands admins in Teaching when no destination exists', () => {
		expect(sanitizeAuthRedirect(undefined, { role: 'admin' })).toBe('/my-space/teaching');
	});
});

describe('isSafeInternalPath', () => {
	it('accepts app paths only', () => {
		expect(isSafeInternalPath('/admin')).toBe(true);
		expect(isSafeInternalPath('admin')).toBe(false);
		expect(isSafeInternalPath('https://toiladuykhanh.com')).toBe(false);
	});
});

describe('loginRedirectTarget', () => {
	it('keeps real destinations so shared class links still open after sign-in', () => {
		expect(loginRedirectTarget('/my-space/teaching/class-1?tab=cp')).toBe(
			'/my-space/teaching/class-1?tab=cp',
		);
		expect(loginRedirectTarget('/admin/posts')).toBe('/admin/posts');
	});

	it('returns to the homepage when sign-in started there', () => {
		expect(loginRedirectTarget('/')).toBe('/');
	});

	it('routes missing and unsafe destinations through the role-aware landing', () => {
		expect(loginRedirectTarget(undefined)).toBe('/dang-nhap/tiep-tuc');
		expect(loginRedirectTarget('/dang-nhap')).toBe('/dang-nhap/tiep-tuc');
		expect(loginRedirectTarget('https://evil.example/x')).toBe('/x');
		expect(loginRedirectTarget('//evil.example')).toBe('/dang-nhap/tiep-tuc');
	});
});

describe('destinationLabel', () => {
	it('names common destinations in Vietnamese', () => {
		expect(destinationLabel('/my-space/teaching')).toBe('lớp học');
		expect(destinationLabel('/admin/posts')).toBe('khu quản trị');
		expect(destinationLabel('/tai-khoan')).toBe('tài khoản');
		expect(destinationLabel('/')).toBeNull();
		expect(destinationLabel('/dang-nhap/tiep-tuc')).toBeNull();
	});
});
