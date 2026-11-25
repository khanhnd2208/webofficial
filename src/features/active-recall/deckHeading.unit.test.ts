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
		expect(parseDeckHeading('HRM - Lecture 2 — Work Analysis and Job Design')).toEqual({
			number: '2',
			title: 'Work Analysis and Job Design',
		});
		expect(parseDeckHeading('Bài 10: Quản trị hiệu suất')).toEqual({
			number: '10',
			title: 'Quản trị hiệu suất',
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
		expect(parseDeckHeading('Key terms', 'Lesson 4')).toEqual({ number: '4', title: 'Key terms' });
		expect(parseDeckHeading('Lecture 5')).toEqual({ number: null, title: 'Lecture 5' });
		expect(parseDeckHeading('Tổng hợp')).toEqual({ number: null, title: 'Tổng hợp' });
	});
});
