import { describe, expect, it } from 'vitest';

import { getHomeHeroArticleHref, getHomeSelectedWork, homePageContent } from './home';
import { getHomePodcastEpisode } from './podcast';

describe('Learning as Becoming homepage content', () => {
	it('keeps one central message and four real learning destinations', () => {
		expect(homePageContent.hero.headline).toEqual(['Không chỉ học để biết.', 'Học để trở thành.']);
		expect(homePageContent.experiences.items).toHaveLength(4);
		expect(
			homePageContent.experiences.items.every((item) => item.href.startsWith('/gioi-thieu#')),
		).toBe(true);
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

	it('uses a non-urgent, source-tagged closing invitation', () => {
		expect(homePageContent.closing.primaryCta.href).toBe(
			'/lien-he?sourcePage=%2F&ref=home-closing',
		);
		expect(homePageContent.closing.primaryCta.label).toBe('Bắt đầu một cuộc trò chuyện');
	});
});
