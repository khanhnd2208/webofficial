import { describe, expect, it } from 'vitest';

import { foldSearchText, testMatchesSearch } from '../search';
import { compareTestsByDisplayOrder } from '../displayOrder';

describe('foldSearchText', () => {
	it('strips Vietnamese diacritics and lowercases', () => {
		expect(foldSearchText('Tuyển Dụng')).toBe('tuyen dung');
		expect(foldSearchText('QUẢN TRỊ')).toBe('quan tri');
	});
});

describe('testMatchesSearch', () => {
	const test = {
		title: 'Chapter 2 — Foundations',
		subject: 'Introduction to Management',
		topics: ['Tổ chức', 'Leadership'],
		description: 'Ôn tập vai trò quản trị',
	};

	it('matches title, subject, topic, and description without accents', () => {
		expect(testMatchesSearch('foundations', test)).toBe(true);
		expect(testMatchesSearch('introduction', test)).toBe(true);
		expect(testMatchesSearch('to chuc', test)).toBe(true);
		expect(testMatchesSearch('quan tri', test)).toBe(true);
		expect(testMatchesSearch('zzz', test)).toBe(false);
	});
});

describe('compareTestsByDisplayOrder', () => {
	it('orders by displayOrder then numeric-aware title', () => {
		const items = [
			{ displayOrder: 10, title: 'Chapter 10' },
			{ displayOrder: 2, title: 'Chapter 2' },
			{ displayOrder: 2, title: 'Chapter 2b' },
			{ displayOrder: 1, title: 'Chapter 1' },
		];
		const sorted = [...items].sort(compareTestsByDisplayOrder);
		expect(sorted.map((item) => item.title)).toEqual([
			'Chapter 1',
			'Chapter 2',
			'Chapter 2b',
			'Chapter 10',
		]);
	});
});
