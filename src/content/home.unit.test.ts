import { describe, expect, it } from 'vitest';

import { getHomeHeroArticleHref, getHomeSelectedWork, homePageContent } from './home';
import { getHomePodcastEpisode } from './podcast';

describe('Duy Khánh homepage content', () => {
	it('keeps one central message and a concrete teaching identity', () => {
		expect(homePageContent.hero.headline).toEqual([
			'Việc học không dừng ở điều ta biết.',
			'Nó thay đổi cách ta nhìn và cách ta làm.',
		]);
		expect(homePageContent.hero.eyebrow).toBe('Duy Khánh · Giảng viên');
		expect(homePageContent.manifesto.paragraphs).toHaveLength(1);
		expect(homePageContent.manifesto.eyebrow).toBe('Quan niệm giảng dạy');
		expect(homePageContent.principles.map((principle) => principle.title)).toEqual([
			'Bắt đầu từ tình huống thật',
			'Học bằng cách thử',
			'Khép lại bằng một bước tiếp theo',
		]);
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

	it('ends with a source-tagged message invitation and a writing path', () => {
		expect(homePageContent.closing.primaryCta.href).toBe(
			'/lien-he?sourcePage=%2F&ref=home-closing',
		);
		expect(homePageContent.closing.primaryCta.label).toBe('Gửi lời nhắn');
		expect(homePageContent.closing.secondaryCta.href).toBe('/bai-viet');
		expect(homePageContent.closing.secondaryCta.label).toBe('Đọc thêm bài viết');
	});
});
