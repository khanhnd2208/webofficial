import { describe, expect, it } from 'vitest';

import type { LearnStudioLesson, LearnStudioSection } from '@/features/learn/types';

import { applyOrder, copyTitle, insertAfter, outlineOrder, sectionCopyBody } from './outlineOps';

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
		checkpoint: null,
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

describe('copies', () => {
	it('gives copied questions new ids and drops blank takeaways', () => {
		const source = section('q', 'l1', {
			type: 'DISCUSSION',
			keyTakeaways: ['Ý chính', '  '],
			discussion: { questions: [{ id: 'q_old', question: 'Hỏi?', answer: 'Đáp' }] },
		});
		const body = sectionCopyBody(source, copyTitle(source.title));
		expect(body.title).toBe('q (bản sao)');
		expect(body.keyTakeaways).toEqual(['Ý chính']);
		expect(body.discussion?.questions[0].id).not.toBe('q_old');
		expect(body.discussion?.questions[0].question).toBe('Hỏi?');
	});

	it('inserts right after the original', () => {
		const items = [{ id: 'a' }, { id: 'b' }];
		expect(insertAfter(items, 'a', { id: 'c' }).map((item) => item.id)).toEqual(['a', 'c', 'b']);
		expect(insertAfter(items, 'missing', { id: 'c' }).map((item) => item.id)).toEqual([
			'a',
			'b',
			'c',
		]);
	});
});
