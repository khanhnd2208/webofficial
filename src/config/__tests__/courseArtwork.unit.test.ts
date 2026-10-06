import { describe, expect, it } from 'vitest';

import { courseArtworkKey, DEFAULT_COURSE_ARTWORK } from '../courseArtwork';

describe('courseArtworkKey', () => {
	it('uses the cover assigned to a known slug', () => {
		expect(courseArtworkKey('itm')).toBe('business');
		expect(courseArtworkKey('hrm')).toBe('growth');
	});

	it('falls back for unknown, missing and inherited property slugs', () => {
		for (const slug of [undefined, '', 'new-course', 'constructor', 'toString', '__proto__']) {
			expect(courseArtworkKey(slug)).toBe(DEFAULT_COURSE_ARTWORK);
		}
	});
});
