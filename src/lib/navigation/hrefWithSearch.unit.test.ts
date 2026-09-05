import { describe, expect, it } from 'vitest';

import { hrefWithSearch } from './hrefWithSearch';

describe('hrefWithSearch', () => {
	it('appends search parameters to a plain pathname', () => {
		expect(hrefWithSearch('/my-space/teaching', { tab: 'cp', week: '2' })).toBe(
			'/my-space/teaching?tab=cp&week=2',
		);
	});

	it('merges parameters into an href that already contains a query', () => {
		expect(
			hrefWithSearch('/my-space/teaching/class-1?tab=attendance', {
				week: '4',
			}),
		).toBe('/my-space/teaching/class-1?tab=attendance&week=4');
	});

	it('lets incoming parameters replace an existing key and preserves repeated values', () => {
		expect(
			hrefWithSearch('/items?tab=attendance&filter=old', {
				tab: 'cp',
				filter: ['active', 'shared'],
				empty: '',
			}),
		).toBe('/items?tab=cp&filter=active&filter=shared');
	});
});
