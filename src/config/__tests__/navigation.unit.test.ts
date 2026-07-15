import { describe, expect, it } from 'vitest';

import {
	CONTACT_CTA,
	getDesktopNavLinks,
	getMobileNavLinks,
	getPublishedContactCta,
	getPublishedFooterGroups,
	isPublished,
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
import { getPublishedServices, getApprovedTestimonials } from '@/content';
import { hasPublishedPodcastEpisodes } from '@/content/podcast';
import { getActivePublicCategories, selectHomeArticles } from '@/features/posts/publicAdapter';
import { PUBLIC_INQUIRY_TYPE_OPTIONS } from '@/features/inquiries/constants';
import type { PostListItemDTO } from '@/types/post';

describe('brand identity', () => {
	it('uses Duy Khánh as master brand with Learning as Becoming positioning', () => {
		expect(SITE_NAME).toBe('Duy Khánh');
		expect(SITE_POSITIONING).toBe('Learning as Becoming');
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

	it('exposes the compact public destinations and gates Podcast', () => {
		const links = getDesktopNavLinks();
		const labels = links.map((l) => l.label);
		expect(labels).not.toContain('Trang chủ');
		expect(labels).toContain('Giới thiệu');
		expect(labels).not.toContain('Trải nghiệm học tập');
		expect(labels).toContain('Bài viết');
		if (hasPublishedPodcastEpisodes()) {
			expect(labels).toContain('Podcast');
			expect(labels).toHaveLength(3);
		} else {
			expect(labels).not.toContain('Podcast');
			expect(labels).toHaveLength(2);
		}
		expect(
			links.every((l) => PUBLIC_NAV_ITEMS.find((i) => i.href === l.href)?.status === 'published'),
		).toBe(true);
		expect(links.some((l) => l.href === routes.learn)).toBe(false);
		expect(links.some((l) => l.href === routes.accompany)).toBe(false);
	});

	it('publishes a quiet message link', () => {
		expect(CONTACT_CTA.status).toBe('published');
		expect(CONTACT_CTA.label).toBe('Gửi lời nhắn');
		expect(getPublishedContactCta()?.href).toBe(routes.contact);
	});

	it('mirrors desktop items on mobile without explore group', () => {
		const mobile = getMobileNavLinks().map((l) => l.label);
		expect(mobile).toEqual(getDesktopNavLinks().map((l) => l.label));
	});

	it('filters footer to published utility links', () => {
		const groups = getPublishedFooterGroups();
		expect(groups.length).toBeGreaterThanOrEqual(1);
		const allHrefs = groups.flatMap((g) => g.links.map((l) => l.href));
		expect(allHrefs).toContain(routes.posts);
		expect(allHrefs).toContain(routes.contact);
		expect(allHrefs).toContain(routes.archive);
		expect(allHrefs).not.toContain(routes.learn);
		expect(allHrefs).not.toContain(routes.accompany);
	});
});

describe('content gates', () => {
	it('publishes exactly three services without inventing testimonials', () => {
		expect(getPublishedServices()).toHaveLength(3);
		expect(getPublishedServices().map((s) => s.slug)).toEqual([
			'giang-day-workshop',
			'thiet-ke-chuong-trinh',
			'tu-van-phat-trien',
		]);
		expect(getApprovedTestimonials()).toHaveLength(0);
	});

	it('keeps podcast nav gated until a real episode exists', () => {
		expect(hasPublishedPodcastEpisodes()).toBe(false);
		const growth = PUBLIC_NAV_ITEMS.find((i) => i.id === 'growth');
		expect(growth?.status).toBe('draft');
	});

	it('exposes additive public inquiry options', () => {
		expect(PUBLIC_INQUIRY_TYPE_OPTIONS.map((o) => o.value)).toEqual([
			'training',
			'learning-design',
			'people-organization',
			'unsure',
			'other',
		]);
	});
});

describe('redirect map', () => {
	it('maps retired marketing URLs to about sections or archive', () => {
		const bySource = Object.fromEntries(PUBLIC_REDIRECTS.map((r) => [r.source, r.destination]));
		expect(bySource['/dong-hanh']).toBe('/gioi-thieu?section=dich-vu');
		expect(bySource['/dong-hanh/mentoring']).toBe('/gioi-thieu?section=tu-van-phat-trien');
		expect(bySource['/dong-hanh/co-van-doanh-nghiep']).toBe(
			'/gioi-thieu?section=tu-van-phat-trien',
		);
		expect(bySource['/dong-hanh/dao-tao-workshop']).toBe('/gioi-thieu?section=giang-day-workshop');
		expect(bySource['/dong-hanh/ai-ung-dung']).toBe('/gioi-thieu?section=dich-vu');
		expect(bySource['/case-study']).toBe('/gioi-thieu?section=dau-moc');
		expect(bySource['/giang-day']).toBe('/gioi-thieu?section=giang-day-workshop');
		expect(bySource['/goc-cua-khanh']).toBe('/archive');
		expect(bySource['/hoc']).toBe('/archive');
		expect(bySource['/hoc/chuong-trinh']).toBe('/archive');
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
	it('includes Explorer Teacher destinations', () => {
		expect(routes.contact).toBe('/lien-he');
		expect(routes.about).toBe('/gioi-thieu');
		expect(routes.growth).toBe('/phat-trien-ban-than');
		expect(routes.archive).toBe('/archive');
		expect(routes.accountLearning).toBe('/tai-khoan/hoc');
		expect(routes.policyPrivacy).toBe('/chinh-sach/bao-mat');
	});
});
