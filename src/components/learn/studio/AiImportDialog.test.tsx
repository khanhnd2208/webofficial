import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LEARN_FORMAT_PROMPTS } from '@/features/learn/prompts';
import type { LearnStudioLesson, LearnStudioSection } from '@/features/learn/types';

import AiImportDialog from './AiImportDialog';

const { adminFetch } = vi.hoisted(() => ({ adminFetch: vi.fn() }));
vi.mock('@/lib/admin/client', () => ({ adminFetch }));

function section(id: string, title: string): LearnStudioSection {
	return {
		id,
		lessonId: 'lesson-1',
		type: 'READING',
		title,
		durationMinutes: null,
		summary: '',
		keyTakeaways: [],
		markdown: '',
		discussion: null,
		estimatedMinutes: 1,
		updatedAt: '2026-09-25T00:00:00.000Z',
	};
}

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
				courseTitle="Khóa demo"
				lessons={lessons}
				selectedLessonId="lesson-1"
				onClose={vi.fn()}
				onSave={onSave}
			/>,
		);
		fireEvent.change(screen.getByRole('textbox', { name: 'Nội dung dán' }), {
			target: { value: '# Bài\n\n## Mục\n\n![Sơ đồ](hinh-1.png#w=50 "Hình 1")' },
		});
		await vi.waitFor(() =>
			expect(screen.getByLabelText('Chọn ảnh khớp tên file')).toBeInTheDocument(),
		);
		fireEvent.change(screen.getByLabelText('Chọn ảnh khớp tên file'), {
			target: { files: [new File(['x'], 'HINH-1.jpg', { type: 'image/jpeg' })] },
		});
		await vi.waitFor(() =>
			expect(screen.getByRole('textbox', { name: 'Nội dung dán' })).toHaveValue(
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
				courseTitle="Khóa demo"
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
				courseTitle="Khóa demo"
				lessons={lessons}
				selectedLessonId="lesson-1"
				onClose={vi.fn()}
				onSave={onSave}
			/>,
		);

		fireEvent.change(screen.getByRole('textbox', { name: 'Nội dung dán' }), {
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

	it('previews questions as the learner sees them and blocks saving on errors', async () => {
		render(
			<AiImportDialog
				kind="discussion"
				courseTitle="Khóa demo"
				lessons={lessons}
				selectedLessonId="lesson-1"
				onClose={vi.fn()}
				onSave={vi.fn()}
			/>,
		);
		const box = screen.getByRole('textbox', { name: 'Nội dung dán' });

		fireEvent.change(box, { target: { value: DISCUSSION } });
		expect(screen.getAllByText(/Thêm một dòng trống ngay trước/)).toHaveLength(2);

		fireEvent.change(box, { target: { value: DISCUSSION.replace(/— (Một|Hai)\n/g, '— $1\n\n') } });
		expect(screen.getByRole('region', { name: 'Câu 1' })).toHaveTextContent('Câu hỏiMột?');
		expect(screen.getAllByText('Đáp án mẫu').length).toBeGreaterThan(0);
		expect(screen.getByText(/đúng định dạng/)).toBeInTheDocument();

		fireEvent.change(box, { target: { value: 'Một đoạn văn không có câu nào.' } });
		expect(screen.getByText('Không tìm thấy câu nào.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Lưu 0 câu' })).toBeDisabled();
	});

	it('names the sections a replace would delete and waits for confirmation', async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		render(
			<AiImportDialog
				kind="lesson"
				courseTitle="Khóa demo"
				lessons={[
					{
						...lessons[0],
						sections: [section('keep', 'Giữ lại'), section('drop', 'Sẽ mất')],
					},
				]}
				selectedLessonId="lesson-1"
				onClose={vi.fn()}
				onSave={onSave}
			/>,
		);
		fireEvent.change(screen.getByRole('combobox', { name: 'Cách nhập' }), {
			target: { value: 'replace' },
		});
		fireEvent.change(screen.getByRole('textbox', { name: 'Nội dung dán' }), {
			target: { value: '# Bài\n\n## Mục mới\n\nNội dung mới.' },
		});
		expect(screen.getByText(/1 mục bị xóa/)).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Lưu 1 mục' }));
		const dialog = await screen.findByRole('dialog', { name: 'Xóa 1 mục khỏi “Bài 1”?' });
		expect(dialog).toHaveTextContent('“Sẽ mất”');
		expect(onSave).not.toHaveBeenCalled();
		fireEvent.click(within(dialog).getByRole('button', { name: 'Hủy' }));
		expect(onSave).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Lưu 1 mục' }));
		fireEvent.click(await screen.findByRole('button', { name: 'Thay và xóa' }));
		await vi.waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
	});

	it('states how many questions a replace removes', async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		render(
			<AiImportDialog
				kind="discussion"
				lockKind
				courseTitle="Khóa demo"
				lessons={[
					{
						...lessons[0],
						sections: [{ ...section('disc', 'Phản biện 1'), type: 'DISCUSSION' }],
					},
				]}
				selectedLessonId="lesson-1"
				target={{ sectionId: 'disc', count: 2 }}
				onClose={vi.fn()}
				onSave={onSave}
			/>,
		);
		expect(
			screen.getByText(/Thêm câu vào sau 2 câu hiện có trong “Phản biện 1”/),
		).toBeInTheDocument();
		fireEvent.change(screen.getByRole('combobox', { name: 'Cách nhập' }), {
			target: { value: 'replace' },
		});
		fireEvent.change(screen.getByRole('textbox', { name: 'Nội dung dán' }), {
			target: { value: DISCUSSION.replace(/— (Một|Hai)\n/g, '— $1\n\n') },
		});
		expect(
			screen.getByText(/Thay 2 câu hiện có trong “Phản biện 1” bằng 2 câu/),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Lưu 2 câu' }));
		expect(
			await screen.findByRole('dialog', { name: 'Thay 2 câu trong “Phản biện 1”?' }),
		).toHaveTextContent('2 câu hiện có sẽ bị thay bằng 2 câu vừa dán');
		expect(onSave).not.toHaveBeenCalled();
	});
});
