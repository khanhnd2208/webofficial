import { describe, expect, it } from 'vitest';

import { resolveReadingLevel } from '../domain/readingLevel';
import {
	flattenLearnerItems,
	learnerState,
	resolveLearnerState,
	seedsFromCourseOutline,
	type MyClassOutlineSeed,
} from '../domain/learnerState';
import { legacyResolverKey, legacyUiDoneKey, progressQueueKey } from '../domain/progressKeys';

function seed(partial: Partial<MyClassOutlineSeed> & Pick<MyClassOutlineSeed, 'knowledgeUnitId' | 'knowledgeUnitSlug' | 'title'>): MyClassOutlineSeed {
	return {
		courseId: 'c1',
		courseSlug: 'hrm',
		lessonId: 'l1',
		lessonSlug: 'lesson-1',
		lessonTitle: 'Bài 1',
		sectionId: 's1',
		sectionSlug: 'chu-de-a',
		sectionTitle: 'Chủ đề A',
		availableLevels: ['readable'],
		...partial,
	};
}

describe('legacy progress key mismatch', () => {
	it('reproduces the v1 UI vs resolver key mismatch', () => {
		const course = {
			slug: 'hrm',
			lessons: [
				{
					slug: 'selection',
					title: 'Selection',
					sections: [
						{
							id: 's1',
							title: 'Quality',
							knowledgeUnits: [{ slug: 'reliability', title: 'Reliability' }],
						},
					],
				},
			],
		};
		const uiKey = legacyUiDoneKey('hrm', 'reliability');
		const resolverKey = legacyResolverKey('hrm', 'reliability');
		expect(uiKey).not.toBe(resolverKey);
		expect(flattenLearnerItems(course)[0]?.key).toBe(resolverKey);

		const completedByUi = new Set([uiKey]);
		const broken = learnerState(course, completedByUi);
		expect(broken.completedItems).toBe(0);
		expect(broken.percent).toBe(0);
	});
});

describe('resolveLearnerState', () => {
	it('returns 0% for 0/0 and never NaN', () => {
		const state = resolveLearnerState({ seeds: [], completedUnitIds: [] });
		expect(state.totalItems).toBe(0);
		expect(state.completedItems).toBe(0);
		expect(state.percent).toBe(0);
		expect(Number.isNaN(state.percent)).toBe(false);
		expect(state.isComplete).toBe(false);
		expect(state.nextItem).toBeNull();
	});

	it('counts a completed KU once', () => {
		const seeds = [
			seed({ knowledgeUnitId: 'k1', knowledgeUnitSlug: 'a', title: 'A' }),
			seed({ knowledgeUnitId: 'k2', knowledgeUnitSlug: 'b', title: 'B', sectionId: 's2' }),
		];
		const state = resolveLearnerState({ seeds, completedUnitIds: ['k1'] });
		expect(state.totalItems).toBe(2);
		expect(state.completedItems).toBe(1);
		expect(state.percent).toBe(50);
		expect(state.currentItem?.knowledgeUnitId).toBe('k2');
	});

	it('is idempotent: completing the same KU twice does not increase the count', () => {
		const seeds = [seed({ knowledgeUnitId: 'k1', knowledgeUnitSlug: 'a', title: 'A' })];
		const once = resolveLearnerState({ seeds, completedUnitIds: ['k1'] });
		const twice = resolveLearnerState({ seeds, completedUnitIds: ['k1', 'k1'] });
		expect(once.completedItems).toBe(1);
		expect(twice.completedItems).toBe(1);
		expect(twice.percent).toBe(100);
	});

	it('counts a reused KU only once', () => {
		const seeds = [
			seed({ knowledgeUnitId: 'k1', knowledgeUnitSlug: 'reliability', title: 'Reliability', sectionId: 's1' }),
			seed({ knowledgeUnitId: 'k1', knowledgeUnitSlug: 'reliability', title: 'Reliability', sectionId: 's2', sectionTitle: 'Methods' }),
			seed({ knowledgeUnitId: 'k2', knowledgeUnitSlug: 'validity', title: 'Validity', lessonId: 'l2', lessonSlug: 'lesson-2', lessonTitle: 'Bài 2' }),
		];
		const empty = resolveLearnerState({ seeds, completedUnitIds: [] });
		expect(empty.totalItems).toBe(2);
		const done = resolveLearnerState({ seeds, completedUnitIds: ['k1'] });
		expect(done.completedItems).toBe(1);
		expect(done.percent).toBe(50);
	});

	it('ignores completed ids that are not in the published curriculum', () => {
		const seeds = [seed({ knowledgeUnitId: 'k1', knowledgeUnitSlug: 'a', title: 'A' })];
		const state = resolveLearnerState({ seeds, completedUnitIds: ['other', 'k1'] });
		expect(state.completedItems).toBe(1);
		expect(state.completedUnitIds).toEqual(['k1']);
	});

	it('does not let extra seeds that represent tests or vocab exist in the unique set', () => {
		const course = {
			id: 'c1',
			slug: 'hrm',
			lessons: [
				{
					id: 'l1',
					slug: 'l',
					title: 'Bài',
					sections: [
						{
							id: 's1',
							title: 'S',
							knowledgeUnits: [{ id: 'k1', slug: 'a', title: 'A', availableLevels: ['readable' as const] }],
						},
					],
				},
			],
		};
		const seeds = seedsFromCourseOutline(course);
		expect(seeds).toHaveLength(1);
		const state = resolveLearnerState({ seeds, completedUnitIds: ['k1'] });
		expect(state.percent).toBe(100);
	});

	it('walks next-item across sections and lessons, skipping completed and duplicate mappings', () => {
		const seeds = [
			seed({ knowledgeUnitId: 'k1', knowledgeUnitSlug: 'a', title: 'A', sectionId: 's1' }),
			seed({ knowledgeUnitId: 'k1', knowledgeUnitSlug: 'a', title: 'A', sectionId: 's2' }),
			seed({
				knowledgeUnitId: 'k2',
				knowledgeUnitSlug: 'b',
				title: 'B',
				lessonId: 'l2',
				lessonSlug: 'lesson-2',
				lessonTitle: 'Bài 2',
				sectionId: 's3',
			}),
			seed({
				knowledgeUnitId: 'k3',
				knowledgeUnitSlug: 'c',
				title: 'C',
				lessonId: 'l2',
				lessonSlug: 'lesson-2',
				lessonTitle: 'Bài 2',
				sectionId: 's3',
			}),
		];
		const fromStart = resolveLearnerState({ seeds, completedUnitIds: [] });
		expect(fromStart.currentItem?.knowledgeUnitId).toBe('k1');
		expect(fromStart.nextItem?.knowledgeUnitId).toBe('k2');
		expect(fromStart.nextItem?.lessonSlug).toBe('lesson-2');

		const afterFirst = resolveLearnerState({ seeds, completedUnitIds: ['k1'] });
		expect(afterFirst.currentItem?.knowledgeUnitId).toBe('k2');
		expect(afterFirst.nextItem?.knowledgeUnitId).toBe('k3');

		const skipCompleted = resolveLearnerState({ seeds, completedUnitIds: ['k1', 'k2'] });
		expect(skipCompleted.currentItem?.knowledgeUnitId).toBe('k3');
		expect(skipCompleted.nextItem).toBeNull();
	});

	it('prefers the opened uncompleted KU as current', () => {
		const seeds = [
			seed({ knowledgeUnitId: 'k1', knowledgeUnitSlug: 'a', title: 'A' }),
			seed({ knowledgeUnitId: 'k2', knowledgeUnitSlug: 'b', title: 'B', sectionId: 's2' }),
			seed({ knowledgeUnitId: 'k3', knowledgeUnitSlug: 'c', title: 'C', sectionId: 's3' }),
		];
		const state = resolveLearnerState({ seeds, completedUnitIds: [], openedUnitId: 'k2' });
		expect(state.currentItem?.knowledgeUnitId).toBe('k2');
		expect(state.nextItem?.knowledgeUnitId).toBe('k3');
	});

	it('marks the course complete and clears next when every unique KU is done', () => {
		const seeds = [
			seed({ knowledgeUnitId: 'k1', knowledgeUnitSlug: 'a', title: 'A' }),
			seed({ knowledgeUnitId: 'k1', knowledgeUnitSlug: 'a', title: 'A', sectionId: 's2' }),
		];
		const state = resolveLearnerState({ seeds, completedUnitIds: ['k1'] });
		expect(state.isComplete).toBe(true);
		expect(state.nextItem).toBeNull();
		expect(state.percent).toBe(100);
	});
});

describe('reading level fallback', () => {
	it('uses preferred when available, otherwise first populated in Dễ hiểu → Học thuật → Chuyên sâu', () => {
		expect(resolveReadingLevel('deep', ['academic', 'deep'])).toBe('deep');
		expect(resolveReadingLevel('readable', ['academic', 'deep'])).toBe('academic');
		expect(resolveReadingLevel('academic', ['deep'])).toBe('deep');
		expect(resolveReadingLevel('readable', [])).toBeNull();
	});
});

describe('progressQueueKey', () => {
	it('is the only local identity and does not use slugs', () => {
		expect(progressQueueKey('course-1', 'ku-1')).toBe('course-1:ku-1');
		expect(progressQueueKey('course-1', 'ku-1')).not.toContain('hrm');
	});
});
