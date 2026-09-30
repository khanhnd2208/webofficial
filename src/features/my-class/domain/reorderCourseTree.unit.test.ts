import { describe, expect, it } from 'vitest';

import { moveOrderedIds, reorderCourseTree } from './reorderCourseTree';
import type { MyClassCourseDetail } from '@/features/my-class/types';

const stamp = '2026-08-15T00:00:00.000Z';
const authoring = { status: 'PUBLISHED' as const, updatedAt: stamp };

function course(): MyClassCourseDetail {
	return {
		id: 'c1',
		slug: 'hrm',
		title: 'HRM',
		summary: '',
		description: '',
		thumbnailUrl: null,
		level: null,
		tags: [],
		tests: [],
		vocabSets: [],
		authoring,
		lessons: [
			{
				id: 'l1',
				slug: 'l1',
				title: 'Bài 1',
				summary: '',
				position: 0,
				tests: [],
				authoring,
				sections: [
					{
						id: 's1',
						slug: 's1',
						title: 'Phần 1',
						summary: '',
						position: 0,
						tests: [],
						authoring,
						knowledgeUnits: [
							{
								id: 'k1',
								slug: 'k1',
								title: 'A',
								summary: '',
								position: 0,
								availableLevels: ['readable'],
								authoring,
							},
							{
								id: 'k2',
								slug: 'k2',
								title: 'B',
								summary: '',
								position: 1,
								availableLevels: ['readable'],
								authoring,
							},
						],
					},
					{
						id: 's2',
						slug: 's2',
						title: 'Phần 2',
						summary: '',
						position: 1,
						tests: [],
						authoring,
						knowledgeUnits: [],
					},
				],
			},
			{
				id: 'l2',
				slug: 'l2',
				title: 'Bài 2',
				summary: '',
				position: 1,
				tests: [],
				authoring,
				sections: [],
			},
		],
	};
}

describe('moveOrderedIds', () => {
	it('moves an id to a new index', () => {
		expect(moveOrderedIds(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b']);
	});

	it('returns null when nothing changes or ids are unknown', () => {
		expect(moveOrderedIds(['a', 'b'], 'a', 'a')).toBeNull();
		expect(moveOrderedIds(['a', 'b'], 'z', 'a')).toBeNull();
	});
});

describe('reorderCourseTree', () => {
	it('reorders lessons under the course', () => {
		const next = reorderCourseTree(course(), 'course', 'c1', ['l2', 'l1']);
		expect(next.lessons.map((lesson) => lesson.id)).toEqual(['l2', 'l1']);
		expect(next.lessons.map((lesson) => lesson.position)).toEqual([0, 1]);
	});

	it('reorders sections under a lesson', () => {
		const next = reorderCourseTree(course(), 'lesson', 'l1', ['s2', 's1']);
		expect(next.lessons[0]?.sections.map((section) => section.id)).toEqual(['s2', 's1']);
	});

	it('reorders units under a section', () => {
		const next = reorderCourseTree(course(), 'section', 's1', ['k2', 'k1']);
		expect(next.lessons[0]?.sections[0]?.knowledgeUnits.map((unit) => unit.id)).toEqual([
			'k2',
			'k1',
		]);
	});

	it('returns the original course when ids do not match', () => {
		const original = course();
		expect(reorderCourseTree(original, 'course', 'c1', ['l1', 'missing'])).toBe(original);
		expect(reorderCourseTree(original, 'course', 'other', ['l2', 'l1'])).toBe(original);
		expect(reorderCourseTree(original, 'lesson', 'l1', ['s1'])).toBe(original);
	});
});
