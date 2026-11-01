import { describe, expect, it } from 'vitest';

import type { LearnStudioLesson, LearnStudioSection } from '@/features/learn/types';

import { applyOrder, outlineOrder } from './outlineOps';

function section(id: string, lessonId: string, patch: Partial<LearnStudioSection> = {}) {
	return {
		id,
		lessonId,
		type: 'READING',
		title: id,
		durationMinutes: null,
		summary: '',
		keyTakeaways: [],
		markdown: '',
		discussion: null,
		estimatedMinutes: 1,
		updatedAt: '2026-10-05T00:00:00.000Z',
		...patch,
	} satisfies LearnStudioSection;
}

function lesson(id: string, sections: LearnStudioSection[]): LearnStudioLesson {
	return { id, title: id, description: '', sections };
}

describe('applyOrder', () => {
	it('restores the saved order but keeps text edited after the snapshot', () => {
		const before = [lesson('l1', [section('a', 'l1'), section('b', 'l1')]), lesson('l2', [])];
		const order = outlineOrder(before);
		const moved = [
			lesson('l1', [section('b', 'l1', { title: 'B mới' })]),
			lesson('l2', [section('a', 'l2', { markdown: 'gõ thêm' })]),
		];

		const result = applyOrder(moved, order);

		expect(outlineOrder(result)).toEqual(order);
		const a = result[0].sections[0];
		expect(a).toMatchObject({ id: 'a', lessonId: 'l1', markdown: 'gõ thêm' });
		expect(result[0].sections[1].title).toBe('B mới');
	});

	it('keeps sections created after the snapshot at the end of their lesson', () => {
		const order = outlineOrder([lesson('l1', [section('a', 'l1')])]);
		const result = applyOrder([lesson('l1', [section('new', 'l1'), section('a', 'l1')])], order);
		expect(result[0].sections.map((item) => item.id)).toEqual(['a', 'new']);
	});
});
