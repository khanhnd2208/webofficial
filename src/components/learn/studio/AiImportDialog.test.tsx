import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LEARN_FORMAT_PROMPTS } from '@/features/learn/prompts';
import type { LearnStudioLesson } from '@/features/learn/types';

import AiImportDialog from './AiImportDialog';

const lessons: LearnStudioLesson[] = [
	{
		id: 'lesson-1',
		title: 'Bài 1',
		description: '',
		sections: [],
	},
];

const QUIZ = [
	'Câu 1: Một?',
	'A. a',
	'B. b',
	'Đáp án: A',
	'',
	'Câu 2: Hai?',
	'A. c',
	'B. d',
	'Đáp án: B',
].join('\n');

describe('AiImportDialog', () => {
	it('copies the format prompt for the selected type', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal('navigator', { clipboard: { writeText } });

		render(
			<AiImportDialog
				kind="lesson"
				lessons={lessons}
				selectedLessonId="lesson-1"
				onClose={vi.fn()}
				onSave={vi.fn()}
			/>,
		);

		const copy = () => screen.getByRole('button', { name: /chép prompt/i });

		fireEvent.click(copy());
		await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(LEARN_FORMAT_PROMPTS.lesson));

		fireEvent.click(screen.getByRole('radio', { name: 'Kiểm tra' }));
		fireEvent.click(copy());
		await vi.waitFor(() => expect(writeText).toHaveBeenLastCalledWith(LEARN_FORMAT_PROMPTS.quiz));

		fireEvent.click(screen.getByRole('radio', { name: 'Phản biện' }));
		fireEvent.click(copy());
		await vi.waitFor(() =>
			expect(writeText).toHaveBeenLastCalledWith(LEARN_FORMAT_PROMPTS.discussion),
		);
	});

	it('saves two parsed quiz questions', async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		render(
			<AiImportDialog
				kind="quiz"
				lessons={lessons}
				selectedLessonId="lesson-1"
				onClose={vi.fn()}
				onSave={onSave}
			/>,
		);

		fireEvent.change(screen.getByRole('textbox', { name: 'Kết quả AI' }), {
			target: { value: QUIZ },
		});
		const save = screen.getByRole('button', { name: 'Lưu 2 câu' });
		expect(save).toBeEnabled();
		fireEvent.click(save);

		await vi.waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
		const input = onSave.mock.calls[0][0];
		expect(input).toMatchObject({
			kind: 'quiz',
			mode: 'create',
			lessonId: 'lesson-1',
			title: 'Bài kiểm tra',
		});
		expect(input.questions).toHaveLength(2);
		expect(input.questions[0].correctIndex).toBe(0);
		expect(input.questions[1].correctIndex).toBe(1);
	});
});
