import { describe, expect, it } from 'vitest';

import type { LearnStudioLesson } from '@/features/learn/types';

import { findSection, networkPatch, validateSectionPatch } from './sectionPatch';

const lessons: LearnStudioLesson[] = [
	{
		id: 'lesson-1',
		title: 'Bài 1',
		description: '',
		sections: [
			{
				id: 'section-1',
				lessonId: 'lesson-1',
				type: 'READING',
				title: 'Mục 1',
				durationMinutes: null,
				summary: '',
				keyTakeaways: [],
				markdown: '',
				checkpoint: null,
				discussion: null,
				estimatedMinutes: 1,
				updatedAt: '2026-09-25T00:00:00.000Z',
			},
		],
	},
];

describe('validateSectionPatch', () => {
	it('keeps a blank title local and names the field', () => {
		const result = validateSectionPatch({ title: '   ' });
		expect(result.errors.title).toBe('Tên mục không được để trống');
		expect(result.body).not.toHaveProperty('title');
		expect(networkPatch({ title: '  ' })).toEqual({});
	});

	it('trims a real title and drops empty takeaway rows', () => {
		expect(
			validateSectionPatch({ title: '  Mục mới  ', keyTakeaways: ['  Ý  ', ' '] }).body,
		).toEqual({
			title: 'Mục mới',
			keyTakeaways: ['Ý'],
		});
	});

	it('sends the valid fields when one field fails the schema', () => {
		const checkpoint = { question: 'Câu', options: ['chỉ một'], correctIndex: 0, explanation: '' };
		const result = validateSectionPatch({ markdown: 'Nội dung', checkpoint });
		expect(result.body).toEqual({ markdown: 'Nội dung' });
		expect(result.errors.checkpoint).toBe('Cần ít nhất 2 phương án');
	});

	it('reports markdown that is too long and omits it', () => {
		const result = validateSectionPatch({ markdown: 'x'.repeat(200_001), summary: 'Ổn' });
		expect(result.errors.markdown).toBe('Nội dung quá dài');
		expect(result.body).toEqual({ summary: 'Ổn' });
	});
});

describe('findSection', () => {
	it('returns the section or null', () => {
		expect(findSection(lessons, 'section-1')?.title).toBe('Mục 1');
		expect(findSection(lessons, 'missing')).toBeNull();
		expect(findSection(lessons, null)).toBeNull();
	});
});
