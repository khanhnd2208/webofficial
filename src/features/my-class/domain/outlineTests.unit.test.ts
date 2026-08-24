import { describe, expect, it } from 'vitest';

import type { MyClassTestListItem } from '../types';
import {
	combinedPublishStatus,
	isLearnerVisibleTest,
	outlineTestKey,
	testsForOutline,
	unpublishedOutlineTests,
} from './outlineTests';

const published: MyClassTestListItem = {
	id: 'pub',
	slug: 'lesson-test',
	title: 'Test bài 1',
	description: '',
	questionCount: 10,
	scope: 'LESSON',
	placementId: 'place-pub',
	position: 1,
	authoring: { status: 'PUBLISHED', updatedAt: '2026-08-16T00:00:00.000Z' },
};

const draft: MyClassTestListItem = {
	id: 'draft',
	slug: 'progress-test',
	title: 'Progress Test',
	description: '',
	questionCount: 3,
	scope: 'LESSON',
	placementId: 'place-draft',
	position: 0,
	authoring: { status: 'DRAFT', updatedAt: '2026-08-16T00:00:00.000Z', hasDraft: true },
};

const sectionDraft: MyClassTestListItem = {
	...draft,
	id: 'section-draft',
	slug: 'section-draft',
	scope: 'SECTION',
	placementId: 'place-section',
};

const learnerFacing: MyClassTestListItem = {
	slug: 'public-only',
	title: 'Progress Test',
	description: '',
	questionCount: 10,
	scope: 'LESSON',
	placementId: 'place-public',
};

describe('outlineTests', () => {
	it('treats a published test on a draft placement as unpublished', () => {
		expect(combinedPublishStatus('PUBLISHED', 'DRAFT')).toBe('DRAFT');
		expect(combinedPublishStatus('DRAFT', 'PUBLISHED')).toBe('DRAFT');
		expect(combinedPublishStatus('PUBLISHED', 'PUBLISHED')).toBe('PUBLISHED');
		expect(combinedPublishStatus('PUBLISHED', undefined)).toBe('PUBLISHED');
		expect(combinedPublishStatus('ARCHIVED', 'PUBLISHED')).toBe('ARCHIVED');
	});

	it('keeps the learner outline on published placements only', () => {
		const rows = [draft, published, sectionDraft, learnerFacing];
		expect(testsForOutline(rows, 'LESSON').map((item) => item.placementId)).toEqual([
			'place-public',
			'place-pub',
		]);
		expect(unpublishedOutlineTests(rows, 'LESSON').map((item) => item.placementId)).toEqual([
			'place-draft',
		]);
	});

	it('does not hoist section drafts onto the lesson list', () => {
		expect(testsForOutline([draft, sectionDraft], 'LESSON', { includeUnpublished: true })).toEqual([
			draft,
		]);
		expect(isLearnerVisibleTest(learnerFacing)).toBe(true);
		expect(isLearnerVisibleTest(draft)).toBe(false);
	});

	it('keys outline rows by placement so reused library tests do not collapse', () => {
		expect(outlineTestKey(published)).toBe('place-pub');
		expect(outlineTestKey({ ...published, placementId: undefined, id: 'same' })).toBe(
			'LESSON:same',
		);
	});
});
