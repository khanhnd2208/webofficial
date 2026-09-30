import { describe, expect, it } from 'vitest';

import {
	attachTargetLabel,
	findPlacementToDetach,
	formatPlacementLabel,
	isTestAttachedAt,
	normalizeTestPlacementBody,
} from './attachTarget';

const course = {
	title: 'HRM',
	lessons: [
		{
			id: 'l1',
			title: 'Bài 03',
			sections: [{ id: 's1', title: 'Chủ đề 3.2' }],
		},
		{
			id: 'l2',
			title: 'Bài 02',
			sections: [{ id: 's2', title: 'Chủ đề 2.1' }],
		},
	],
};

describe('attachTargetLabel', () => {
	it('labels course, lesson, and section destinations', () => {
		expect(attachTargetLabel(course, { kind: 'test', scope: 'COURSE' })).toBe('Toàn khóa');
		expect(attachTargetLabel(course, { kind: 'test', scope: 'LESSON', lessonId: 'l1' })).toBe(
			'Bài 03',
		);
		expect(
			attachTargetLabel(course, {
				kind: 'test',
				scope: 'SECTION',
				lessonId: 'l1',
				sectionId: 's1',
			}),
		).toBe('Bài 03 · Chủ đề 3.2');
		expect(attachTargetLabel(course, { kind: 'vocab' })).toBe('Toàn khóa');
		expect(attachTargetLabel(course, { kind: 'vocab', lessonId: 'l2' })).toBe('Bài 02');
	});
});

describe('normalizeTestPlacementBody', () => {
	it('requires an explicit scope and clears unused parent ids', () => {
		expect(() => normalizeTestPlacementBody('c1', { kind: 'test' })).toThrow(/phạm vi/);
		expect(
			normalizeTestPlacementBody('c1', { kind: 'test', scope: 'COURSE', lessonId: 'l1' }),
		).toEqual({
			courseId: 'c1',
			scope: 'COURSE',
			lessonId: null,
			sectionId: null,
		});
		expect(
			normalizeTestPlacementBody('c1', {
				kind: 'test',
				scope: 'LESSON',
				lessonId: 'l1',
				sectionId: 's1',
			}),
		).toEqual({
			courseId: 'c1',
			scope: 'LESSON',
			lessonId: 'l1',
			sectionId: null,
		});
	});
});

describe('findPlacementToDetach', () => {
	const rows = [
		{ id: 'p-course', scope: 'COURSE', course: { id: 'c1' }, lesson: null, section: null },
		{
			id: 'p-s1',
			scope: 'SECTION',
			course: { id: 'c1' },
			lesson: { id: 'l1' },
			section: { id: 's1' },
		},
		{
			id: 'p-s2',
			scope: 'SECTION',
			course: { id: 'c1' },
			lesson: { id: 'l1' },
			section: { id: 's2' },
		},
	];

	it('does not pick the first course placement when the same test is attached twice', () => {
		expect(findPlacementToDetach(rows, 'c1')).toBeUndefined();
		expect(findPlacementToDetach(rows, 'c1', { scope: 'SECTION', sectionId: 's2' })?.id).toBe(
			'p-s2',
		);
		expect(findPlacementToDetach(rows, 'c1', { scope: 'COURSE' })?.id).toBe('p-course');
	});
});

describe('isTestAttachedAt', () => {
	it('matches the current picker target only', () => {
		const placements = [
			{
				scope: 'SECTION' as const,
				course: { id: 'c1' },
				lesson: { id: 'l1' },
				section: { id: 's1' },
			},
		];
		expect(
			isTestAttachedAt(placements, 'c1', {
				kind: 'test',
				scope: 'SECTION',
				lessonId: 'l1',
				sectionId: 's1',
			}),
		).toBe(true);
		expect(
			isTestAttachedAt(placements, 'c1', {
				kind: 'test',
				scope: 'SECTION',
				lessonId: 'l1',
				sectionId: 's2',
			}),
		).toBe(false);
		expect(isTestAttachedAt(placements, 'c1', { kind: 'test', scope: 'COURSE' })).toBe(false);
	});
});

describe('formatPlacementLabel', () => {
	it('prefers the deepest attached node', () => {
		expect(
			formatPlacementLabel({ lesson: { title: 'Bài 02' }, section: { title: 'Chủ đề 2.1' } }),
		).toBe('Bài 02 · Chủ đề 2.1');
		expect(formatPlacementLabel({ lesson: { title: 'Bài 02' } })).toBe('Bài 02');
		expect(formatPlacementLabel({})).toBe('Toàn khóa');
	});
});
