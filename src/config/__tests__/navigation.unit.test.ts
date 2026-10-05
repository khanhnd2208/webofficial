import { describe, expect, it } from 'vitest';

import {
	afterSignOutPath,
	CONTACT_CTA,
	GATE_NAV_ITEMS,
	getDesktopNavLinks,
	getGateNavItems,
	getMobileNavLinks,
	getPublishedContactCta,
	getPublishedFooterGroups,
	isFullBleedPublicPath,
	isLopPath,
	isActiveRecallPath,
	isGateItemLocked,
	isInternalChromePath,
	isIntroPath,
	isPublished,
	isSignInRequiredPath,
	isTocPath,
	PUBLIC_NAV_ITEMS,
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

describe('publication gates', () => {
	it('treats only published as visible', () => {
		expect(isPublished('published')).toBe(true);
		expect(isPublished('draft')).toBe(false);
	});

	it('opens brand destinations and My Space from the mục lục', () => {
		const items = getGateNavItems();
		expect(items).toEqual(GATE_NAV_ITEMS);
		expect(items.map((item) => item.label)).toEqual(['Giới thiệu', 'Trải nghiệm']);
		expect(items.map((item) => item.href)).toEqual([routes.about, routes.experiences]);
		expect(items.every((item) => !isGateItemLocked(item))).toBe(true);
		expect(items.filter((item) => item.status === 'published')).toHaveLength(2);
		expect(items.some((item) => item.href === routes.activeRecall)).toBe(false);
	});

	it('keeps intro, mục lục, and My Space as distinct public shells', () => {
		expect(routes.home).toBe('/');
		expect(routes.toc).toBe('/muc-luc');
		expect(routes.mySpace).toBe('/my-space');
		expect(routes.home).not.toBe(routes.toc);
		expect(isIntroPath('/')).toBe(true);
		expect(isIntroPath('/muc-luc')).toBe(false);
		expect(isTocPath('/muc-luc')).toBe(true);
		expect(isFullBleedPublicPath('/')).toBe(true);
		expect(isFullBleedPublicPath('/muc-luc')).toBe(true);
		expect(isFullBleedPublicPath('/my-space')).toBe(true);
		expect(isFullBleedPublicPath('/my-space/active-recall')).toBe(true);
		expect(isActiveRecallPath('/my-space/active-recall')).toBe(true);
		expect(isActiveRecallPath('/my-space/active-recall/hrm')).toBe(true);
		expect(isActiveRecallPath('/my-space/tests')).toBe(false);
		expect(isFullBleedPublicPath('/gioi-thieu')).toBe(false);
		expect(isLopPath('/lop/hrm-101')).toBe(true);
		expect(isFullBleedPublicPath('/lop/hrm-101')).toBe(true);
		expect(isInternalChromePath('/my-space/teaching')).toBe(true);
		expect(isInternalChromePath('/my-space/teaching/class-1')).toBe(true);
	});

	it('keeps legacy desktop nav helpers for unpublished chrome consumers', () => {
		const links = getDesktopNavLinks();
		const labels = links.map((l) => l.label);
		expect(labels).not.toContain('Trang chủ');
		expect(labels).toEqual(['Giới thiệu', 'Trải nghiệm']);
		expect(labels).not.toContain('Ghi chép');
		expect(labels).not.toContain('Liên hệ');
		expect(labels).not.toContain('Bài viết');
		expect(labels).not.toContain('Podcast');
		expect(
			links.every((l) => PUBLIC_NAV_ITEMS.find((i) => i.href === l.href)?.status === 'published'),
		).toBe(true);
		expect(links.some((l) => l.href === routes.learn)).toBe(false);
		expect(links.some((l) => l.href === routes.accompany)).toBe(false);
	});

	it('publishes a single contact CTA to the contact page', () => {
		expect(CONTACT_CTA.status).toBe('published');
		expect(CONTACT_CTA.label).toBe('Gửi lời nhắn');
		expect(CONTACT_CTA.href).toBe(routes.contact);
		expect(getPublishedContactCta()).toEqual(CONTACT_CTA);
	});

	it('mirrors desktop items on mobile without explore group', () => {
		const mobile = getMobileNavLinks().map((l) => l.label);
		expect(mobile).toEqual(getDesktopNavLinks().map((l) => l.label));
	});

	it('keeps the footer focused on the new public architecture', () => {
		const groups = getPublishedFooterGroups();
		expect(groups.length).toBeGreaterThanOrEqual(1);
		const allHrefs = groups.flatMap((g) => g.links.map((l) => l.href));
		expect(allHrefs).toContain(routes.about);
		expect(allHrefs).not.toContain(routes.projects);
		expect(allHrefs).not.toContain(routes.services);
		expect(allHrefs).toContain(routes.contact);
		expect(allHrefs).toContain(routes.experiences);
		expect(allHrefs).not.toContain(routes.notes);
		expect(allHrefs).not.toContain(routes.posts);
		expect(allHrefs).not.toContain(routes.archive);
		expect(allHrefs).not.toContain(routes.learn);
		expect(allHrefs).not.toContain(routes.accompany);
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
			'/my-space/board-game/test?game=spy-fall',
			'/hoc/khoa-hoc/quan-tri/bai/bai-1',
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
	it('maps retired public UI to the new portfolio architecture', () => {
		const bySource = Object.fromEntries(PUBLIC_REDIRECTS.map((r) => [r.source, r.destination]));
		expect(bySource['/du-an']).toBe(routes.aboutProjects);
		expect(bySource['/dich-vu']).toBe(routes.aboutServices);
		expect(bySource['/du-an/:path*']).toBeUndefined();
		expect(bySource['/dong-hanh']).toBe(routes.aboutServices);
		expect(bySource['/dong-hanh/mentoring']).toBe(routes.aboutServices);
		expect(bySource['/dong-hanh/co-van-doanh-nghiep']).toBe(routes.aboutServices);
		expect(bySource['/dong-hanh/dao-tao-workshop']).toBe(routes.aboutServices);
		expect(bySource['/dong-hanh/ai-ung-dung']).toBe('/trai-nghiem#thu-nghiem');
		expect(bySource['/case-study']).toBe(routes.aboutProjects);
		expect(bySource['/giang-day']).toBe(routes.aboutServices);
		expect(bySource['/goc-cua-khanh']).toBe(routes.aboutProjects);
		expect(bySource['/bai-viet']).toBe(routes.toc);
		expect(bySource['/du-an/moonie-cafe-business-development']).toBe(
			'/du-an/learning-at-moonie-cafe',
		);
		expect(bySource['/hoc']).toBe(routes.toc);
		expect(bySource['/hoc/chuong-trinh']).toBe(routes.toc);
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
	it('includes the portfolio destinations while preserving internal route constants', () => {
		expect(routes.contact).toBe('/lien-he');
		expect(routes.about).toBe('/gioi-thieu');
		expect(routes.projects).toBe('/du-an');
		expect(routes.services).toBe('/dich-vu');
		expect(routes.aboutProjects).toBe('/trai-nghiem#du-an');
		expect(routes.aboutServices).toBe('/gioi-thieu#dich-vu');
		expect(routes.toc).toBe('/muc-luc');
		expect(routes.mySpace).toBe('/my-space');
		expect(routes.notes).toBe('/ghi-chep');
		expect(routes.growth).toBe('/phat-trien-ban-than');
		expect(routes.archive).toBe('/archive');
		expect(routes.accountLearning).toBe('/tai-khoan/hoc');
		expect(routes.admin.website).toBe('/admin/website');
		expect(routes.admin.archive).toBe('/admin/archive');
	});
});
