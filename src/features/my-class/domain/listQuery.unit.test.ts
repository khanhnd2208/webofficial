import { describe, expect, it } from 'vitest';

import {
	ADMIN_TABLE_DEFAULT_PAGE_SIZE,
	currentTableParams,
	listSkip,
	parseListQuery,
	parsePageSize,
	parsePositiveInt,
	parseSortBy,
	parseSortDir,
	parseOptionalSortDir,
	studioTableHref,
	toListPage,
	unwrapItems,
	ensureListPage,
} from './listQuery';

describe('listQuery', () => {
	it('parses page, pageSize and allow-listed sort fields', () => {
		const query = parseListQuery(new URLSearchParams('q=hrm&page=2&pageSize=50&sortBy=title&sortDir=asc'), {
			sortFields: ['updatedAt', 'title'] as const,
			defaultSortBy: 'updatedAt',
		});
		expect(query).toEqual({
			q: 'hrm',
			page: 2,
			pageSize: 50,
			sortBy: 'title',
			sortDir: 'asc',
		});
	});

	it('falls back when sort, page or pageSize are invalid', () => {
		expect(parseSortBy('hack', ['updatedAt', 'title'] as const, 'updatedAt')).toBe('updatedAt');
		expect(parseSortBy('title', undefined, 'updatedAt')).toBe('updatedAt');
		expect(parseSortDir('sideways')).toBe('desc');
		expect(parseOptionalSortDir('asc')).toBe('asc');
		expect(parseOptionalSortDir('nope')).toBeUndefined();
		expect(parsePositiveInt('0', 1)).toBe(1);
		expect(parsePageSize('999')).toBe(50);
		expect(parsePageSize(undefined)).toBe(ADMIN_TABLE_DEFAULT_PAGE_SIZE);
	});

	it('builds pagination metadata and skip offsets', () => {
		expect(listSkip(3, 20)).toBe(40);
		expect(toListPage(['a'], 45, 2, 20)).toEqual({
			items: ['a'],
			total: 45,
			page: 2,
			pageSize: 20,
			totalPages: 3,
		});
		expect(toListPage([], 0, 4, 20).page).toBe(1);
		expect(unwrapItems({ items: ['a'], total: 1, page: 1, pageSize: 20, totalPages: 1 })).toEqual(['a']);
		expect(unwrapItems(['b'])).toEqual(['b']);
		expect(ensureListPage(['x', 'y']).total).toBe(2);
	});

	it('omits default page and pageSize from shareable URLs', () => {
		expect(
			studioTableHref('/admin/my-class', { q: 'hrm', page: '1', pageSize: '20', status: 'DRAFT' }, { page: '2' }),
		).toBe('/admin/my-class?q=hrm&page=2&status=DRAFT');
		expect(currentTableParams({ q: '  a ', empty: '' }, ['q', 'empty', 'missing'])).toEqual({ q: 'a' });
	});
});
