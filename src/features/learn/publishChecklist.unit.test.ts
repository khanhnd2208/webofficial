import { describe, expect, it } from 'vitest';

import { publishChecklist } from './publishChecklist';
import type { LearnStudioLesson, LearnStudioSection } from './types';

function reading(patch: Partial<LearnStudioSection> = {}): LearnStudioSection {
	return {
		id: 's1',
		lessonId: 'l1',
		type: 'READING',
		title: 'Mục đọc',
		durationMinutes: null,
		summary: '',
		keyTakeaways: [],
		markdown: 'Nội dung',
		discussion: null,
		estimatedMinutes: 1,
		updatedAt: '2026-10-05T00:00:00.000Z',
		...patch,
	};
}

function lesson(sections: LearnStudioSection[], title = 'Bài 1'): LearnStudioLesson {
	return { id: 'l1', title, description: '', sections };
}

describe('publishChecklist', () => {
	it('blocks an empty course and a discussion with no questions', () => {
		expect(
			publishChecklist({ description: 'Có', lessons: [] }).blockers.map((item) => item.id),
		).toEqual(['empty-course']);
		const empty = reading({
			id: 'disc',
			type: 'DISCUSSION',
			title: 'Câu hỏi phản biện',
			discussion: { questions: [] },
		});
		const result = publishChecklist({ description: '', lessons: [lesson([empty])] });
		expect(result.blockers.some((item) => item.message.includes('chưa có câu phản biện'))).toBe(
			true,
		);
		expect(result.warnings.some((item) => item.message === 'Khóa thiếu mô tả')).toBe(true);
		expect(result.warnings.some((item) => item.message.includes('tên mặc định'))).toBe(true);
	});

	it('warns on a missing sample answer without blocking publish', () => {
		const discussion = reading({
			type: 'DISCUSSION',
			title: 'Phản biện',
			discussion: { questions: [{ id: 'd1', question: 'Hỏi?', answer: '' }] },
		});
		const result = publishChecklist({
			description: 'Mô tả',
			lessons: [lesson([discussion])],
		});
		expect(result.blockers).toEqual([]);
		expect(result.warnings.some((item) => item.message.includes('Thiếu đáp án mẫu'))).toBe(true);
	});
});
