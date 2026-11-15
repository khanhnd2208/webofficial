import { describe, expect, it } from 'vitest';

import {
	afterSignOutPath,
	CONTACT_CTA,
	getSiteTrail,
	isInternalChromePath,
	isSignInRequiredPath,
	isSiteHeaderPath,
	isTocPath,
} from '@/config/navigation';
import {
	EDITORIAL_NAME,
	PERSONAL_MARK,
	SITE_NAME,
	SITE_POSITIONING,
	brandHierarchy,
} from '@/config/site';
import { PUBLIC_REDIRECTS, routes } from '@/config/routes';
import { getActivePublicCategories, selectHomeArticles } from '@/features/posts/publicAdapter';
import { PUBLIC_INQUIRY_TYPE_OPTIONS } from '@/features/inquiries/constants';
import type { PostListItemDTO } from '@/types/post';

describe('brand identity', () => {
	it('uses Duy Khánh as the master brand with a personal positioning line', () => {
		expect(SITE_NAME).toBe('Duy Khánh');
		expect(SITE_POSITIONING).toBe('Tôi dạy, học và viết từ Hà Nội.');
		expect(EDITORIAL_NAME).toBe('HANOICAM');
		expect(PERSONAL_MARK).toBe('NDK');
		expect(brandHierarchy.master).toBe(SITE_NAME);
		expect(brandHierarchy.positioning).toBe(SITE_POSITIONING);
	});
});

describe('public chrome', () => {
	it('keeps intro and Mục lục as distinct public shells', () => {
		expect(routes.home).toBe('/');
		expect(routes.toc).toBe('/muc-luc');
		expect(isTocPath('/muc-luc')).toBe(true);
		expect(isTocPath('/')).toBe(false);
	});

	it('gives workspaces their own chrome but keeps the course catalog public', () => {
		expect(isInternalChromePath('/my-space/teaching')).toBe(true);
		expect(isInternalChromePath('/my-space/teaching/class-1')).toBe(true);
		expect(isInternalChromePath('/khoa-hoc/hrm')).toBe(true);
		expect(isInternalChromePath('/khoa-hoc')).toBe(false);
		expect(isInternalChromePath('/lien-he')).toBe(false);
	});

	it('publishes a single contact CTA to the contact page', () => {
		expect(CONTACT_CTA).toEqual({ label: 'Gửi lời nhắn', href: routes.contact });
	});
});

describe('content gates', () => {
	it('exposes the five contact subjects from the portfolio brief', () => {
		expect(PUBLIC_INQUIRY_TYPE_OPTIONS.map((o) => o.value)).toEqual([
			'training',
			'ai',
			'learning-design',
			'business',
			'other',
		]);
	});
});

describe('sign-in gates', () => {
	it('knows every path that sends a signed-out visitor to the login page', () => {
		for (const path of [
			'/admin/inquiries',
			'/messages',
			'/tai-khoan/hoc',
			'/vocabulary/abc',
			'/my-space/teaching/123?tab=cp',
			'/my-space/courses/itm',
			'/my-space/my-class',
			'/khoa-hoc/hrm?s=1',
		]) {
			expect(isSignInRequiredPath(path), path).toBe(true);
		}
		for (const path of [
			'/',
			'/muc-luc',
			'/lop/hrm-1',
			'/hoc/khoa-hoc/quan-tri',
			'/my-space',
			'/khoa-hoc',
			'/kham-pha-khoa-hoc',
			'/my-space/board-game/test?game=spy-fall',
		]) {
			expect(isSignInRequiredPath(path), path).toBe(false);
		}
	});

	it('signs out onto Mục lục only when the page would demand sign-in again', () => {
		expect(afterSignOutPath('/khoa-hoc/itm#bai-2')).toBe(routes.toc);
		expect(afterSignOutPath('/gioi-thieu#dich-vu')).toBe('/gioi-thieu#dich-vu');
	});
});

describe('redirect map', () => {
	it('sends every retired portfolio page to Về tôi', () => {
		const bySource = Object.fromEntries(PUBLIC_REDIRECTS.map((r) => [r.source, r.destination]));
		for (const retired of [
			'/gioi-thieu',
			'/trai-nghiem',
			'/trai-nghiem/:path*',
			'/du-an',
			'/du-an/:path*',
			'/dich-vu',
			'/dong-hanh',
			'/dong-hanh/:path*',
			'/case-study',
			'/giang-day',
			'/goc-cua-khanh',
		]) {
			expect(bySource[retired]).toBe(routes.contact);
		}
		expect(bySource['/bai-viet']).toBe(routes.toc);
		expect(bySource['/hoc']).toBe(routes.toc);
		expect(bySource['/hoc/chuong-trinh']).toBe(routes.toc);
		expect(bySource['/hoc/khoa-hoc/:path*']).toBe(routes.learnCourses);
		expect(bySource['/tai-khoan/hoc']).toBe(routes.learnCourses);
	});
});

describe('writing adapters', () => {
	it('hides categories with fewer than two posts', () => {
		expect(
			getActivePublicCategories(
				[{ category: 'A' }, { category: 'A' }, { category: 'B' }, { category: null }],
				2,
			),
		).toEqual(['A']);
	});

	it('prefers featured post for homepage selection', () => {
		const posts = [
			{ id: '1', isFeatured: false, title: 'a' },
			{ id: '2', isFeatured: true, title: 'b' },
			{ id: '3', isFeatured: false, title: 'c' },
		] as PostListItemDTO[];
		const { featured, latest } = selectHomeArticles(posts);
		expect(featured?.id).toBe('2');
		expect(latest.map((p) => p.id)).toEqual(['1', '3']);
	});
});

describe('route map', () => {
	it('keeps the public destinations and internal route constants', () => {
		expect(routes.contact).toBe('/lien-he');
		expect(routes.toc).toBe('/muc-luc');
		expect(routes.learnCourses).toBe('/khoa-hoc');
		expect(routes.classes).toBe('/lop');
		expect(routes.mySpace).toBe('/my-space');
		expect(routes.notes).toBe('/ghi-chep');
		expect(routes.admin.archive).toBe('/admin/archive');
	});
});

describe('site header trail', () => {
	it('names the page after Mục lục, and only the parent on a detail page', () => {
		expect(getSiteTrail('/muc-luc')).toEqual([]);
		expect(getSiteTrail('/khoa-hoc')).toEqual([{ label: 'Học tập' }]);
		expect(getSiteTrail('/lop')).toEqual([{ label: 'Học tập' }]);
		expect(getSiteTrail('/lien-he')).toEqual([{ label: 'Về tôi' }]);
		expect(getSiteTrail('/dang-nhap')).toEqual([{ label: 'Đăng nhập' }]);
		expect(getSiteTrail('/tai-khoan')).toEqual([{ label: 'Tài khoản' }]);
		expect(getSiteTrail('/tai-khoan/ho-so')).toEqual([{ label: 'Tài khoản', href: '/tai-khoan' }]);
		expect(getSiteTrail('/chinh-sach/bao-mat')).toEqual([{ label: 'Chính sách' }]);
		expect(getSiteTrail('/my-space')).toEqual([]);
		expect(getSiteTrail('/my-space/active-recall')).toEqual([{ label: 'Ôn tập' }]);
		expect(getSiteTrail('/my-space/active-recall/hrm')).toEqual([{ label: 'Ôn tập' }]);
		expect(getSiteTrail('/my-space/tests')).toEqual([{ label: 'Bài kiểm tra' }]);
		expect(getSiteTrail('/my-space/tests/hrm')).toEqual([{ label: 'Bài kiểm tra' }]);
		expect(getSiteTrail('/my-space/tests/hrm/play')).toEqual([]);
		expect(getSiteTrail('/khong-co-trang')).toEqual([]);
	});

	it('shows the header on public catalogs and hides it on intro, teaching, readers and rooms', () => {
		for (const path of [
			'/muc-luc',
			'/khoa-hoc',
			'/khoa-hoc?category=all',
			'/kham-pha-khoa-hoc',
			'/lop',
			'/lien-he',
			'/chinh-sach/dieu-khoan',
			'/dang-nhap',
			'/tai-khoan',
			'/my-space',
			'/my-space/board-game',
			'/my-space/board-game/spy-fall',
			'/my-space/board-game/ma-soi/room/ABCD',
			'/my-space/active-recall',
			'/my-space/active-recall/hrm',
			'/my-space/tests',
			'/my-space/tests/hrm',
			'/khong-co-trang',
		]) {
			expect(isSiteHeaderPath(path), path).toBe(true);
		}
		for (const path of [
			'/',
			'/lop/hrm-101',
			routes.publicCourseRecall('course-1'),
			routes.publicCourseRecallDeck('course-1', 'lesson-9'),
			'/admin',
			'/my-space/my-class/ai50',
			'/my-space/teaching/class-1',
			'/my-space/courses/ai50',
			'/khoa-hoc/ai50',
			'/khoa-hoc/ai50/studio?s=reading',
			'/my-space/tests/hrm/play',
			'/messages',
			'/vocabulary',
			'/unreleased',
			'/unreleasedgift',
			'/unreleasedgift/thank-you',
			'/fmt2026',
		]) {
			expect(isSiteHeaderPath(path), path).toBe(false);
		}
	});
});
