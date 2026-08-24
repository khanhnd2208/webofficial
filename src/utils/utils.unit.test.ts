import { describe, it, expect } from 'vitest';

import { slugify } from '@/utils/slugify';
import { formatDate, formatDateShort, formatDistanceToNow, timeAgo } from '@/utils/formatDate';
import { formatNumber } from '@/utils/formatNumber';

describe('slugify', () => {
	it('lowercases and replaces spaces with hyphens', () => {
		expect(slugify('Hello World')).toBe('hello-world');
	});

	it('removes special characters', () => {
		expect(slugify('Hello, World!')).toBe('hello-world');
	});

	it('collapses multiple hyphens', () => {
		expect(slugify('hello   world')).toBe('hello-world');
	});

	it('trims leading and trailing hyphens', () => {
		expect(slugify('  hello world  ')).toBe('hello-world');
	});

	it('handles Vietnamese diacritics', () => {
		expect(slugify('Tiếng Việt')).toBe('tieng-viet');
		expect(slugify('Định nghĩa HRM')).toBe('dinh-nghia-hrm');
	});
});

describe('formatDate', () => {
	it('formats Date object as dd/mm/yyyy', () => {
		const result = formatDate(new Date('2026-03-19T12:00:00Z'));
		expect(result).toMatch(/\d{2}\/\d{2}\/2026/);
	});
});

describe('formatDateShort', () => {
	it('formats ISO string with vi-VN locale', () => {
		const result = formatDateShort('2026-03-19T12:00:00.000Z');
		expect(result).toContain('2026');
	});
});

describe('formatDistanceToNow', () => {
	it('returns "vừa xong" for recent dates', () => {
		expect(formatDistanceToNow(new Date())).toBe('vừa xong');
	});

	it('timeAgo is an alias', () => {
		expect(timeAgo(new Date())).toBe('vừa xong');
	});
});

describe('formatNumber', () => {
	it('formats small numbers as-is', () => {
		expect(formatNumber(950)).toBe('950');
	});

	it('formats thousands with k suffix', () => {
		expect(formatNumber(1200)).toBe('1.2k');
	});

	it('formats millions with M suffix', () => {
		expect(formatNumber(2_500_000)).toBe('2.5M');
	});
});
