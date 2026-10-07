import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LEARN_FORMAT_PROMPTS } from '@/features/learn/prompts';
import type { LearnStudioLesson } from '@/features/learn/types';

import AiImportDialog from './AiImportDialog';

const { adminFetch } = vi.hoisted(() => ({ adminFetch: vi.fn() }));
vi.mock('@/lib/admin/client', () => ({ adminFetch }));

const lessons: LearnStudioLesson[] = [
	{
		id: 'lesson-1',
		title: 'Bài 1',
		description: '',
		sections: [],
	},
];

const DISCUSSION = [
	'Câu 1:',
	'### Hiểu — Một',
	'> [!REFLECT] Câu hỏi:',
	'> Một?',
	'',
	'Đáp án mẫu:',
	'Vì một.',
	'',
	'Câu 2:',
	'### Áp dụng — Hai',
	'> [!REFLECT] Câu hỏi:',
	'> Hai?',
	'',
	'Đáp án mẫu:',
	'Vì hai.',
].join('\n');

describe('AiImportDialog', () => {
	it('uploads matching images and preserves title and width in saved markdown', async () => {
		adminFetch.mockResolvedValue({ url: '/uploads/hinh.webp' });
		const onSave = vi.fn().mockResolvedValue(undefined);
		render(
			<AiImportDialog
				kind="lesson"
				lessons={lessons}
				selectedLessonId="lesson-1"
				onClose={vi.fn()}
				onSave={onSave}
			/>,
		);
		fireEvent.change(screen.getByRole('textbox', { name: 'Kết quả AI' }), {
			target: { value: '# Bài\n\n## Mục\n\n![Sơ đồ](hinh-1.png#w=50 "Hình 1")' },
		});
		await vi.waitFor(() =>
			expect(screen.getByLabelText('Chọn ảnh khớp tên file')).toBeInTheDocument(),
		);
		fireEvent.change(screen.getByLabelText('Chọn ảnh khớp tên file'), {
			target: { files: [new File(['x'], 'HINH-1.jpg', { type: 'image/jpeg' })] },
		});
		await vi.waitFor(() =>
			expect(screen.getByRole('textbox', { name: 'Kết quả AI' })).toHaveValue(
				'# Bài\n\n## Mục\n\n![Sơ đồ](/uploads/hinh.webp#w=50 "Hình 1")',
			),
		);
		fireEvent.click(screen.getByRole('button', { name: 'Lưu 1 mục' }));
		await vi.waitFor(() =>
			expect(onSave).toHaveBeenCalledWith(
				expect.objectContaining({
					markdown: expect.stringContaining('/uploads/hinh.webp#w=50 "Hình 1"'),
				}),
			),
		);
	});
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

		fireEvent.click(screen.getByRole('radio', { name: 'Phản biện' }));
		fireEvent.click(copy());
		await vi.waitFor(() =>
			expect(writeText).toHaveBeenLastCalledWith(LEARN_FORMAT_PROMPTS.discussion),
		);
	});

	it('saves two parsed critical questions', async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		render(
			<AiImportDialog
				kind="discussion"
				lessons={lessons}
				selectedLessonId="lesson-1"
				onClose={vi.fn()}
				onSave={onSave}
			/>,
		);

		fireEvent.change(screen.getByRole('textbox', { name: 'Kết quả AI' }), {
			target: { value: DISCUSSION },
		});
		const save = screen.getByRole('button', { name: 'Lưu 2 câu' });
		expect(save).toBeEnabled();
		fireEvent.click(save);

		await vi.waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
		const input = onSave.mock.calls[0][0];
		expect(input).toMatchObject({
			kind: 'discussion',
			mode: 'create',
			lessonId: 'lesson-1',
			title: 'Câu hỏi phản biện',
		});
		expect(input.questions).toHaveLength(2);
		expect(input.questions[1].answer).toContain('Vì hai.');
	});
});
