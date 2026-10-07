import { describe, expect, it } from 'vitest';

import {
	destinationLabel,
	isSafeInternalPath,
	loginRedirectTarget,
	resolveAuthJsRedirect,
	sameSiteReferrerPath,
	sanitizeAuthRedirect,
} from './safeRedirect';

describe('sanitizeAuthRedirect', () => {
	it('keeps internal admin destinations', () => {
		expect(sanitizeAuthRedirect('/admin/website')).toBe('/admin/website');
		expect(sanitizeAuthRedirect('/my-space/teaching?tab=cp')).toBe('/my-space/teaching?tab=cp');
	});

	it('keeps the #section so the page opens where sign-in started', () => {
		expect(sanitizeAuthRedirect('/gioi-thieu?view=full#du-an')).toBe('/gioi-thieu?view=full#du-an');
		expect(sanitizeAuthRedirect('https://toiladuykhanh.com/muc-luc#trai-nghiem')).toBe(
			'/muc-luc#trai-nghiem',
		);
	});

	it('rejects protocol-relative URLs and only keeps the path of absolute URLs', () => {
		expect(sanitizeAuthRedirect('https://evil.example/phish')).toBe('/phish');
		expect(sanitizeAuthRedirect('//evil.example')).toBe('/');
		expect(sanitizeAuthRedirect('/\\evil')).toBe('/');
	});

	it('extracts the path from a same-looking absolute URL then still rejects other origins via Auth.js helper', () => {
		expect(resolveAuthJsRedirect('https://evil.example/admin', 'https://toiladuykhanh.com')).toBe(
			'https://toiladuykhanh.com',
		);
		expect(
			resolveAuthJsRedirect('https://toiladuykhanh.com/admin/posts', 'https://toiladuykhanh.com'),
		).toBe('https://toiladuykhanh.com/admin/posts');
		expect(
			resolveAuthJsRedirect('https://toiladuykhanh.com/muc-luc#du-an', 'https://toiladuykhanh.com'),
		).toBe('https://toiladuykhanh.com/muc-luc#du-an');
	});

	it('does not loop back to the login page', () => {
		expect(sanitizeAuthRedirect('/dang-nhap?error=CallbackRouteError')).toBe('/');
		expect(sanitizeAuthRedirect('/dang-nhap#top')).toBe('/');
	});

	it('rewrites retired account aliases', () => {
		expect(sanitizeAuthRedirect('/dashboard')).toBe('/khoa-hoc');
		expect(sanitizeAuthRedirect('/giang-day')).toBe('/my-space/teaching');
		expect(sanitizeAuthRedirect('/admin/teaching')).toBe('/my-space/teaching');
		expect(sanitizeAuthRedirect('/admin/teaching/class-1?tab=cp&week=2')).toBe(
			'/my-space/teaching/class-1?tab=cp&week=2',
		);
		expect(sanitizeAuthRedirect('/profile')).toBe('/tai-khoan');
		expect(sanitizeAuthRedirect('/my-space/teaching/class-1?tab=cp')).toBe(
			'/my-space/teaching/class-1?tab=cp',
		);
		expect(sanitizeAuthRedirect('/messages/hello')).toBe('/admin/tools/messages/hello');
	});

	it('falls back to the homepage, for admins and students alike', () => {
		expect(sanitizeAuthRedirect(undefined)).toBe('/');
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
		expect(loginRedirectTarget('/')).toBe('/');
	});

	it('uses the first usable candidate', () => {
		expect(loginRedirectTarget(undefined, '/ghi-chep/bai-1#y-chinh', '/muc-luc')).toBe(
			'/ghi-chep/bai-1#y-chinh',
		);
		expect(loginRedirectTarget(null, null, 'https://toiladuykhanh.com/admin/posts?tab=draft')).toBe(
			'/admin/posts?tab=draft',
		);
		expect(loginRedirectTarget('/dang-nhap', '//evil.example', '/gioi-thieu')).toBe('/gioi-thieu');
	});

	it('returns to the homepage when no candidate is usable', () => {
		expect(loginRedirectTarget()).toBe('/');
		expect(loginRedirectTarget(undefined, '/dang-nhap', '//evil.example')).toBe('/');
	});
});

describe('sameSiteReferrerPath', () => {
	it('keeps the path of a referrer on this site only', () => {
		expect(sameSiteReferrerPath('https://toiladuykhanh.com/muc-luc?x=1', 'toiladuykhanh.com')).toBe(
			'/muc-luc?x=1',
		);
		expect(sameSiteReferrerPath('https://accounts.google.com/o', 'toiladuykhanh.com')).toBeNull();
		expect(sameSiteReferrerPath(null, 'toiladuykhanh.com')).toBeNull();
		expect(sameSiteReferrerPath('not a url', 'toiladuykhanh.com')).toBeNull();
	});
});

describe('destinationLabel', () => {
	it('names common destinations in Vietnamese', () => {
		expect(destinationLabel('/my-space/teaching')).toBe('Teaching');
		expect(destinationLabel('/khoa-hoc/itm?s=1')).toBe('khóa học');
		expect(destinationLabel('/my-space/courses/hrm')).toBe('khóa học');
		expect(destinationLabel('/my-space/board-game/spy-fall/room/AB12')).toBe('Fun');
		expect(destinationLabel('/admin/posts')).toBe('khu quản trị');
		expect(destinationLabel('/tai-khoan')).toBe('tài khoản');
		expect(destinationLabel('/')).toBeNull();
	});
});
