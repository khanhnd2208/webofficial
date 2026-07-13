import { describe, expect, it } from 'vitest';

import { isPublicCatalogCourse } from '@/features/courses/visibility';

describe('isPublicCatalogCourse', () => {
	it('returns true only for PUBLISHED + CATALOG', () => {
		expect(isPublicCatalogCourse({ status: 'PUBLISHED', visibility: 'CATALOG' })).toBe(true);
	});

	it('returns false for PUBLISHED + PRIVATE', () => {
		expect(isPublicCatalogCourse({ status: 'PUBLISHED', visibility: 'PRIVATE' })).toBe(false);
	});

	it('returns false for DRAFT + CATALOG', () => {
		expect(isPublicCatalogCourse({ status: 'DRAFT', visibility: 'CATALOG' })).toBe(false);
	});

	it('returns false for ARCHIVED + CATALOG', () => {
		expect(isPublicCatalogCourse({ status: 'ARCHIVED', visibility: 'CATALOG' })).toBe(false);
	});
});
