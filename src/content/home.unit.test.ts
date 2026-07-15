import { describe, expect, it } from 'vitest';

import { getHomeHeroArticleHref, getHomeSelectedWork, homePageContent } from './home';
import { getHomePodcastEpisode } from './podcast';

describe('Learning as Becoming homepage content', () => {
	it('keeps one central message and a concrete teaching identity', () => {
		expect(homePageContent.hero.headline).toEqual(['Không chỉ học để biết.', 'Học để trở thành.']);
		expect(homePageContent.hero.eyebrow).toBe('Duy Khánh · Giảng viên');
		expect(homePageContent.manifesto.paragraphs).toHaveLength(1);
		expect(homePageContent.principles).toHaveLength(3);
	});

	it('publishes only the two verified homepage projects', () => {
		const works = getHomeSelectedWork();
		expect(works.map((work) => work.resource.slug)).toEqual([
			'classroom-decision-game',
			'learning-outcome-canvas',
		]);
		expect(works.every((work) => work.resource.status === 'published')).toBe(true);
		expect(works.every((work) => work.resource.productStatus !== 'concept')).toBe(true);
	});

	it('keeps podcast hidden until an episode has a transcript', () => {
		expect(getHomePodcastEpisode()).toBeNull();
	});

	it('falls back to the writing index when Lời ngỏ is not published', () => {
		expect(getHomeHeroArticleHref([{ slug: 'loi-ngo' }])).toBe('/bai-viet/loi-ngo');
		expect(getHomeHeroArticleHref([{ slug: 'mot-bai-khac' }])).toBe('/bai-viet');
		expect(getHomeHeroArticleHref([])).toBe('/bai-viet');
	});

	it('ends with writing first and a source-tagged message invitation', () => {
		expect(homePageContent.closing.primaryCta.href).toBe('/bai-viet');
		expect(homePageContent.closing.secondaryCta.href).toBe(
			'/lien-he?sourcePage=%2F&ref=home-closing',
		);
		expect(homePageContent.closing.secondaryCta.label).toBe('Gửi Khánh một lời nhắn');
	});
});
