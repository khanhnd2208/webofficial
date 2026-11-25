import { describe, expect, it } from 'vitest';

import { parseDeckHeading } from './deckHeading';

describe('parseDeckHeading', () => {
	it('drops the course prefix and lesson number from the title', () => {
		expect(parseDeckHeading('HRM - Lesson 3 - Planning for and Recruiting')).toEqual({
			number: '3',
			title: 'Planning for and Recruiting',
		});
		expect(parseDeckHeading('HRM · Lesson 1 — Introduction to HRM')).toEqual({
			number: '1',
			title: 'Introduction to HRM',
		});
		expect(parseDeckHeading('Bài 02: Phân tích công việc')).toEqual({
			number: '2',
			title: 'Phân tích công việc',
		});
	});

	it('keeps titles without a lesson number and borrows one from the label', () => {
		expect(parseDeckHeading('Ôn tập giữa kỳ', 'Lesson 5')).toEqual({
			number: '5',
			title: 'Ôn tập giữa kỳ',
		});
		expect(parseDeckHeading('Lesson 4')).toEqual({ number: null, title: 'Lesson 4' });
		expect(parseDeckHeading('Tổng hợp')).toEqual({ number: null, title: 'Tổng hợp' });
	});
});
