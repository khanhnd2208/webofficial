import { describe, expect, it } from 'vitest';

import { readRecentClasses, withRecentClass } from './recentClasses';

const visit = (slug: string, visitedAt: number) => ({ slug, title: slug, code: 'HRM', visitedAt });

describe('recent classes', () => {
	it('reads only well-formed entries and survives bad storage', () => {
		expect(readRecentClasses(null)).toEqual([]);
		expect(readRecentClasses('not json')).toEqual([]);
		expect(readRecentClasses(JSON.stringify([visit('a', 1), { slug: 2 }]))).toEqual([
			visit('a', 1),
		]);
	});

	it('moves a revisited class to the front and keeps four', () => {
		const list = [visit('a', 1), visit('b', 2), visit('c', 3), visit('d', 4)];
		expect(withRecentClass(list, visit('c', 9)).map((entry) => entry.slug)).toEqual([
			'c',
			'a',
			'b',
			'd',
		]);
		expect(withRecentClass(list, visit('e', 9)).map((entry) => entry.slug)).toEqual([
			'e',
			'a',
			'b',
			'c',
		]);
	});
});
