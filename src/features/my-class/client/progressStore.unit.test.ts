import { beforeEach, describe, expect, it } from 'vitest';

import {
	enqueueComplete,
	mergeLearnerState,
	pendingCount,
	readLocalCompleted,
	writeLocalCompleted,
} from './progressStore';
import { progressQueueKey } from '../domain/progressKeys';
import type { MyClassCourseDetail } from '../types';

const memory = new Map<string, string>();

beforeEach(() => {
	memory.clear();
	const localStorage = {
		getItem: (key: string) => memory.get(key) ?? null,
		setItem: (key: string, value: string) => {
			memory.set(key, value);
		},
		removeItem: (key: string) => {
			memory.delete(key);
		},
		clear: () => memory.clear(),
		key: (index: number) => [...memory.keys()][index] ?? null,
		get length() {
			return memory.size;
		},
	};
	Object.defineProperty(globalThis, 'localStorage', { value: localStorage, configurable: true });
});

const course = {
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
	lessons: [
		{
			id: 'l1',
			slug: 'l1',
			title: 'Bài 1',
			summary: '',
			position: 0,
			tests: [],
			sections: [
				{
					id: 's1',
					slug: 'chu-de',
					title: 'Chủ đề',
					summary: '',
					position: 0,
					tests: [],
					knowledgeUnits: [
						{
							id: 'k1',
							slug: 'a',
							title: 'A',
							summary: '',
							position: 0,
							availableLevels: ['readable'],
						},
						{
							id: 'k2',
							slug: 'b',
							title: 'B',
							summary: '',
							position: 1,
							availableLevels: ['readable'],
						},
					],
				},
			],
		},
	],
} satisfies MyClassCourseDetail;

describe('progressStore', () => {
	it('updates x/y immediately from local completed ids', () => {
		writeLocalCompleted('c1', ['k1']);
		const state = mergeLearnerState(course, null, readLocalCompleted('c1'));
		expect(state.completedItems).toBe(1);
		expect(state.totalItems).toBe(2);
		expect(state.percent).toBe(50);
	});

	it('dedupes the retry queue by courseId + knowledgeUnitId', () => {
		enqueueComplete({
			courseId: 'c1',
			knowledgeUnitId: 'k1',
			courseSlug: 'hrm',
			kuSlug: 'a',
		});
		enqueueComplete({
			courseId: 'c1',
			knowledgeUnitId: 'k1',
			courseSlug: 'hrm',
			kuSlug: 'a',
		});
		expect(pendingCount()).toBe(1);
		expect(progressQueueKey('c1', 'k1')).toBe('c1:k1');
	});
});
