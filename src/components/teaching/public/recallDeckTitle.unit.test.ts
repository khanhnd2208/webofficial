import { describe, expect, it } from 'vitest';

import { parseDeckTitle } from './recallDeckTitle';

describe('parseDeckTitle', () => {
	it('moves the lecture number out of the title', () => {
		expect(parseDeckTitle('HRM - Lecture 3 - Planning for and Recruiting Human Resources')).toEqual({
			number: '3',
			title: 'Planning for and Recruiting Human Resources',
		});
		expect(parseDeckTitle('HRM - Lecture 2 — Work Analysis and Job Design')).toEqual({
			number: '2',
			title: 'Work Analysis and Job Design',
		});
		expect(parseDeckTitle('Bài 10: Quản trị hiệu suất')).toEqual({
			number: '10',
			title: 'Quản trị hiệu suất',
		});
	});

	it('keeps other titles whole and may borrow the number from the label', () => {
		expect(parseDeckTitle('Ôn tập giữa kỳ')).toEqual({ number: null, title: 'Ôn tập giữa kỳ' });
		expect(parseDeckTitle('Key terms', 'Lesson 4')).toEqual({ number: '4', title: 'Key terms' });
		expect(parseDeckTitle('Lecture 5')).toEqual({ number: null, title: 'Lecture 5' });
	});
});
