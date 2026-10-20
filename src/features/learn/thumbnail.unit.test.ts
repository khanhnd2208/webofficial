import { describe, expect, it } from 'vitest';

import { updateLearnCourseSchema } from './schemas';
import { learnCourseThumbnailSrc } from './thumbnail';

describe('learn course thumbnail paths', () => {
	it('keeps same-site images and rejects everything else', () => {
		expect(learnCourseThumbnailSrc('/uploads/cover.webp')).toBe('/uploads/cover.webp');
		expect(learnCourseThumbnailSrc('https://toiladuykhanh.com/uploads/cover.webp')).toBe(
			'/uploads/cover.webp',
		);
		expect(learnCourseThumbnailSrc('https://www.toiladuykhanh.com/learn/hrm/cover.jpg')).toBe(
			'/learn/hrm/cover.jpg',
		);
		expect(learnCourseThumbnailSrc(null)).toBeNull();
		expect(learnCourseThumbnailSrc('')).toBeNull();
		expect(learnCourseThumbnailSrc('   ')).toBeNull();
		expect(learnCourseThumbnailSrc('https://evil.test/a.png')).toBeNull();
		expect(learnCourseThumbnailSrc('http://toiladuykhanh.com/uploads/a.png')).toBeNull();
		expect(learnCourseThumbnailSrc('//evil.test/a.png')).toBeNull();
		expect(learnCourseThumbnailSrc('javascript:alert(1)')).toBeNull();
		expect(learnCourseThumbnailSrc('/uploads/../secret.webp')).toBeNull();
		expect(learnCourseThumbnailSrc('/kham-pha-khoa-hoc')).toBeNull();
	});

	it('treats an omitted cover as unchanged and null as the default artwork', () => {
		expect(updateLearnCourseSchema.parse({})).toEqual({});
		expect(updateLearnCourseSchema.parse({ thumbnailUrl: null })).toEqual({ thumbnailUrl: null });
		expect(updateLearnCourseSchema.parse({ thumbnailUrl: '' })).toEqual({ thumbnailUrl: null });
		expect(
			updateLearnCourseSchema.parse({
				thumbnailUrl: 'https://toiladuykhanh.com/uploads/cover.webp',
			}),
		).toEqual({ thumbnailUrl: '/uploads/cover.webp' });
		expect(() =>
			updateLearnCourseSchema.parse({ thumbnailUrl: 'https://evil.test/a.png' }),
		).toThrow(/website/);
	});
});
