import { describe, expect, it } from 'vitest';

import {
	CONTACT_CTA,
	FOOTER_GROUPS,
	getDesktopNavLinks,
	getMobileExploreLinks,
	getMobileNavLinks,
	getPublishedContactCta,
	getPublishedFooterGroups,
	isPublished,
	PUBLIC_NAV_ITEMS,
} from '@/config/navigation';
import { EDITORIAL_NAME, PERSONAL_MARK, SITE_NAME, brandHierarchy } from '@/config/site';
import { routes } from '@/config/routes';
import { getPublishedServices, getPublishedResources, getApprovedTestimonials } from '@/content';

describe('brand identity', () => {
	it('uses Duy Khánh as master brand and HANOICAM as editorial', () => {
		expect(SITE_NAME).toBe('Duy Khánh');
		expect(EDITORIAL_NAME).toBe('HANOICAM');
		expect(PERSONAL_MARK).toBe('NDK');
		expect(brandHierarchy.master).toBe(SITE_NAME);
		expect(brandHierarchy.editorial).toBe(EDITORIAL_NAME);
	});
});

describe('publication gates', () => {
	it('treats only published as visible', () => {
		expect(isPublished('published')).toBe(true);
		expect(isPublished('draft')).toBe(false);
	});

	it('exposes published desktop nav links for open surfaces', () => {
		const links = getDesktopNavLinks();
		expect(links.map((l) => l.label)).toEqual([
			'Đồng hành',
			EDITORIAL_NAME,
			'Góc của Khánh',
			'Về Khánh',
		]);
		expect(links.every((l) => PUBLIC_NAV_ITEMS.find((i) => i.href === l.href)?.status === 'published')).toBe(
			true,
		);
		expect(links.some((l) => l.href === routes.learn)).toBe(false);
	});

	it('publishes contact CTA', () => {
		expect(CONTACT_CTA.status).toBe('published');
		expect(getPublishedContactCta()?.href).toBe(routes.contact);
	});

	it('puts journal and lab under mobile explore', () => {
		const primary = getMobileNavLinks();
		const explore = getMobileExploreLinks();
		expect(primary.map((l) => l.label)).toEqual(['Đồng hành', 'Về Khánh']);
		expect(explore.map((l) => l.label)).toEqual([EDITORIAL_NAME, 'Góc của Khánh']);
	});

	it('filters footer groups to published links only', () => {
		const groups = getPublishedFooterGroups();
		expect(groups.length).toBe(4);
		for (const group of groups) {
			expect(group.links.length).toBeGreaterThan(0);
			for (const link of group.links) {
				const source = FOOTER_GROUPS.find((g) => g.id === group.id)?.links.find(
					(l) => l.href === link.href && l.label === link.label,
				);
				expect(source?.status).toBe('published');
			}
		}
		const allHrefs = groups.flatMap((g) => g.links.map((l) => l.href));
		expect(allHrefs).toContain(routes.posts);
		expect(allHrefs).toContain(routes.contact);
		expect(allHrefs).toContain(routes.accompany);
		expect(allHrefs).not.toContain(routes.learn);
	});
});

describe('content gates', () => {
	it('publishes four services without inventing testimonials', () => {
		expect(getPublishedServices()).toHaveLength(4);
		expect(getApprovedTestimonials()).toHaveLength(0);
		expect(getPublishedResources().every((r) => r.productStatus !== 'concept')).toBe(true);
	});
});

describe('route map', () => {
	it('includes the restructure destinations', () => {
		expect(routes.contact).toBe('/lien-he');
		expect(routes.accompany).toBe('/dong-hanh');
		expect(routes.lab).toBe('/goc-cua-khanh');
		expect(routes.accountLearning).toBe('/tai-khoan/hoc');
		expect(routes.learnPrograms).toBe('/hoc/chuong-trinh');
		expect(routes.policyPrivacy).toBe('/chinh-sach/bao-mat');
	});
});
