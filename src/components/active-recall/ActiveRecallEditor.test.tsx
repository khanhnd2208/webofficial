import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { adminFetch } from '@/lib/admin/client';
import type { ActiveRecallDeckDTO } from '@/features/active-recall';

import ActiveRecallEditor from './ActiveRecallEditor';

const navigation = vi.hoisted(() => ({
	replace: vi.fn(),
	push: vi.fn(),
	refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
	useRouter: () => navigation,
}));

vi.mock('@/lib/admin/client', () => ({
	adminFetch: vi.fn(),
}));

vi.mock('./RecallRichTextEditor', () => ({
	default: ({
		value,
		onChange,
		labelledBy,
		placeholder,
	}: {
		value: string;
		onChange: (value: string) => void;
		labelledBy?: string;
		placeholder?: string;
	}) => (
		<textarea
			aria-labelledby={labelledBy}
			placeholder={placeholder}
			value={value}
			onChange={(event) => onChange(event.target.value)}
		/>
	),
}));

const fetchMock = vi.mocked(adminFetch);

function deck(overrides: Partial<ActiveRecallDeckDTO> = {}): ActiveRecallDeckDTO {
	return {
		id: 'deck-1',
		slug: 'lesson-1',
		title: 'Lesson 1',
		courseId: 'course-1',
		courseCode: 'HRM101',
		courseName: 'Human Resource Management',
		subject: 'HRM',
		lessonLabel: 'Lesson 1',
		description: 'Hidden on compact list',
		status: 'DRAFT',
		position: 0,
		cardCount: 1,
		classLinkCount: 0,
		updatedAt: '2026-09-01T00:00:00.000Z',
		createdAt: '2026-09-01T00:00:00.000Z',
		publishedAt: null,
		cards: [
			{
				id: 'card-1',
				question: 'What is HRM?',
				answer: 'Human resource management',
				questionVi: '',
				answerVi: '',
				position: 0,
				createdAt: '2026-09-01T00:00:00.000Z',
				updatedAt: '2026-09-01T00:00:00.000Z',
			},
		],
		...overrides,
	};
}

describe('ActiveRecallEditor', () => {
	beforeEach(() => {
		fetchMock.mockReset();
		navigation.replace.mockReset();
		navigation.push.mockReset();
		navigation.refresh.mockReset();
	});

	it('offers bulk import immediately in create mode', () => {
		render(
			<ActiveRecallEditor
				initialDeck={null}
				courseId="course-1"
				courseName="Human Resource Management"
			/>,
		);
		expect(screen.getByRole('heading', { name: 'Tạo bộ thẻ' })).toBeInTheDocument();
		expect(screen.getByText(/Môn: Human Resource Management/)).toBeInTheDocument();
		expect(screen.queryByText('Chi tiết')).not.toBeInTheDocument();
		expect(screen.getByText('Nhập nhiều')).toBeInTheDocument();
		expect(screen.queryByText('Trạng thái')).not.toBeInTheDocument();
	});

	it('blocks one-sided cards and creates a deck with valid cards in one save', async () => {
		fetchMock.mockResolvedValueOnce({ id: 'deck-1' });
		render(
			<ActiveRecallEditor
				initialDeck={null}
				courseId="course-1"
				courseName="Human Resource Management"
			/>,
		);
		fireEvent.change(screen.getByPlaceholderText('HRM · Lesson 1'), {
			target: { value: 'Lesson 1' },
		});
		fireEvent.change(screen.getByPlaceholderText('What is **HRM**?'), {
			target: { value: 'What is HRM?' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Tạo bộ thẻ' }));
		expect(screen.getByText('Thẻ thiếu đáp án')).toBeInTheDocument();
		expect(fetchMock).not.toHaveBeenCalled();

		fireEvent.change(screen.getByPlaceholderText('A *system*…'), {
			target: { value: 'Human resource management' },
		});
		fireEvent.click(screen.getByRole('button', { name: '+ Thêm thẻ' }));
		fireEvent.click(screen.getByRole('button', { name: 'Tạo bộ thẻ' }));

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		expect(fetchMock).toHaveBeenCalledWith('/api/admin/teaching/courses/course-1/recall', {
			method: 'POST',
			body: JSON.stringify({
				title: 'Lesson 1',
				courseId: 'course-1',
				subject: 'Human Resource Management',
				lessonLabel: '',
				description: '',
				status: 'DRAFT',
				cards: [
					{
						question: 'What is HRM?',
						answer: 'Human resource management',
						questionVi: '',
						answerVi: '',
					},
				],
			}),
		});
	});

	it('lets a removed card be undone before save', () => {
		render(
			<ActiveRecallEditor
				initialDeck={deck()}
				courseId="course-1"
				courseName="Human Resource Management"
			/>,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Xóa thẻ' }));
		expect(screen.getByText(/Đã bỏ thẻ/)).toBeInTheDocument();
		expect(screen.queryByDisplayValue('What is HRM?')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Hoàn tác' }));
		expect(screen.getByDisplayValue('What is HRM?')).toBeInTheDocument();
	});

	it('ignores overlapping save clicks and Cmd+S while a save is in flight', async () => {
		let resolveSave: ((value: ActiveRecallDeckDTO) => void) | undefined;
		fetchMock.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveSave = resolve;
				}),
		);
		render(
			<ActiveRecallEditor
				initialDeck={deck()}
				courseId="course-1"
				courseName="Human Resource Management"
			/>,
		);
		const saveButtons = screen.getAllByRole('button', { name: 'Lưu thay đổi' });
		fireEvent.click(saveButtons[0]!);
		fireEvent.click(saveButtons[0]!);
		fireEvent.click(saveButtons[1] ?? saveButtons[0]!);
		fireEvent.keyDown(window, { key: 's', metaKey: true });
		expect(fetchMock).toHaveBeenCalledTimes(1);
		resolveSave?.(deck({ updatedAt: '2026-09-02T00:00:00.000Z' }));
		await waitFor(() => expect(screen.getByText('Đã lưu thay đổi.')).toBeInTheDocument());
	});

	it('stages bulk input while dirty and saves everything in one request', async () => {
		const saved = deck({ title: 'Edited' });
		fetchMock.mockResolvedValue(saved);
		render(<ActiveRecallEditor initialDeck={deck()} />);
		fireEvent.change(screen.getByLabelText('Tên bộ thẻ'), { target: { value: 'Edited' } });
		fireEvent.change(screen.getByLabelText('Dữ liệu nhập'), {
			target: { value: 'Q: New\nA: New answer\nQVI: Mới\nAVI: Đáp án' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra dữ liệu' }));
		expect(fetchMock).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Đưa vào bộ: 1 mới' }));
		await waitFor(() => expect(screen.getByLabelText('Dữ liệu nhập')).toHaveValue(''));
		expect(fetchMock).not.toHaveBeenCalled();
		fireEvent.click(screen.getAllByRole('button', { name: 'Lưu thay đổi' })[0]!);
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
		expect(body).toMatchObject({ title: 'Edited', expectedUpdatedAt: deck().updatedAt });
		expect(body.cards).toHaveLength(2);
		expect(body.cards[1]).toMatchObject({
			question: '<p>New</p>',
			questionVi: '<p>Mới</p>',
			answerVi: '<p>Đáp án</p>',
		});
	});

	it('imports before creating a deck and can undo staging', async () => {
		render(<ActiveRecallEditor initialDeck={null} courseId="course-1" />);
		fireEvent.change(screen.getByLabelText('Dữ liệu nhập'), {
			target: { value: 'Q: New\nA: Answer' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra dữ liệu' }));
		fireEvent.click(screen.getByRole('button', { name: 'Đưa vào bộ: 1 mới' }));
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Hoàn tác nhập' })).toBeInTheDocument(),
		);
		expect(screen.getByDisplayValue('<p>New</p>')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Hoàn tác nhập' }));
		expect(screen.queryByDisplayValue('<p>New</p>')).not.toBeInTheDocument();
		expect(screen.getByLabelText('Dữ liệu nhập')).toHaveValue('Q: New\nA: Answer');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('blocks pending pasted input and orphan answers without losing it', async () => {
		render(<ActiveRecallEditor initialDeck={deck()} />);
		fireEvent.change(screen.getByLabelText('Dữ liệu nhập'), { target: { value: 'A: Orphan' } });
		fireEvent.click(screen.getAllByRole('button', { name: 'Lưu thay đổi' })[0]!);
		await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Bạn còn dữ liệu'));
		fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra dữ liệu' }));
		expect(screen.queryByRole('button', { name: /Đưa vào bộ/ })).not.toBeInTheDocument();
		expect(screen.getByLabelText('Dữ liệu nhập')).toHaveValue('A: Orphan');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('preserves edits across card pages and sends all cards', async () => {
		const initial = deck({
			cards: Array.from({ length: 21 }, (_, index) => ({
				...deck().cards[0]!,
				id: `c${index}`,
				question: `Question ${index}`,
				position: index,
			})),
		});
		fetchMock.mockResolvedValue(initial);
		render(<ActiveRecallEditor initialDeck={initial} />);
		expect(screen.getAllByRole('button', { name: 'Xóa thẻ' })).toHaveLength(20);
		fireEvent.change(screen.getByDisplayValue('Question 0'), {
			target: { value: 'Edited question' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
		expect(screen.getByDisplayValue('Question 20')).toBeInTheDocument();
		fireEvent.click(screen.getAllByRole('button', { name: 'Lưu thay đổi' })[0]!);
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
		expect(body.cards).toHaveLength(21);
		expect(body.cards[0].question).toBe('Edited question');
	});

	it('warns before leaving with only pending paste', async () => {
		render(<ActiveRecallEditor initialDeck={deck()} />);
		fireEvent.change(screen.getByLabelText('Dữ liệu nhập'), { target: { value: 'Q: Pending' } });
		const event = new Event('beforeunload', { cancelable: true });
		window.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
		fireEvent.click(screen.getByRole('link', { name: 'Danh sách' }));
		expect(await screen.findByRole('dialog')).toHaveTextContent('Thay đổi chưa lưu');
		expect(navigation.push).not.toHaveBeenCalled();
	});

	it('archives current edits in the same optimistic save', async () => {
		fetchMock.mockResolvedValue(deck({ status: 'ARCHIVED', title: 'Edited' }));
		render(<ActiveRecallEditor initialDeck={deck()} />);
		fireEvent.change(screen.getByLabelText('Tên bộ thẻ'), { target: { value: 'Edited' } });
		fireEvent.click(screen.getByRole('button', { name: 'Lưu trữ' }));
		fireEvent.click(await screen.findByRole('button', { name: 'Lưu và lưu trữ' }));
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
		expect(body).toMatchObject({
			title: 'Edited',
			status: 'ARCHIVED',
			expectedUpdatedAt: deck().updatedAt,
		});
		expect(body.cards).toHaveLength(1);
	});

	it('does not offer publishing an empty deck', async () => {
		render(<ActiveRecallEditor initialDeck={deck({ cards: [] })} />);
		fireEvent.change(screen.getByLabelText('Trạng thái', { exact: false }), {
			target: { value: 'PUBLISHED' },
		});
		fireEvent.click(screen.getAllByRole('button', { name: 'Lưu và công khai' })[0]!);
		expect(await screen.findByRole('alert')).toHaveTextContent('ít nhất một thẻ');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('keeps the editor intact when a stale save is rejected', async () => {
		fetchMock.mockRejectedValue(new Error('Bộ thẻ đã được cập nhật ở nơi khác.'));
		render(<ActiveRecallEditor initialDeck={deck()} />);
		fireEvent.change(screen.getByLabelText('Tên bộ thẻ'), { target: { value: 'Keep this edit' } });
		fireEvent.click(screen.getAllByRole('button', { name: 'Lưu thay đổi' })[0]!);
		expect(await screen.findByRole('alert')).toHaveTextContent('cập nhật ở nơi khác');
		expect(screen.getByLabelText('Tên bộ thẻ')).toHaveValue('Keep this edit');
		expect(screen.getByDisplayValue('What is HRM?')).toBeInTheDocument();
	});

	it('requires confirmation before replacing and preserves the original card ID', async () => {
		render(<ActiveRecallEditor initialDeck={deck()} />);
		fireEvent.change(screen.getByLabelText('Dữ liệu nhập'), {
			target: { value: 'id,question,answer\ncard-1,Revised,Revised answer' },
		});
		fireEvent.change(screen.getByLabelText('Cách nhập'), { target: { value: 'replace' } });
		fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra dữ liệu' }));
		fireEvent.click(screen.getByRole('button', { name: 'Thay bằng 1 thẻ' }));
		expect(await screen.findByRole('dialog')).toHaveTextContent('Thay thế thẻ trong bản chỉnh sửa');
		expect(screen.getByDisplayValue('What is HRM?')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Thay thế' }));
		await waitFor(() => expect(screen.getByDisplayValue('<p>Revised</p>')).toBeInTheDocument());
		expect(fetchMock).not.toHaveBeenCalled();
		expect(document.querySelector('#recall-card-1-question')).toBeInTheDocument();
	});

	it('creates a draft from staged bulk data in a single request', async () => {
		fetchMock.mockResolvedValue(deck());
		render(<ActiveRecallEditor initialDeck={null} courseId="course-1" />);
		fireEvent.change(screen.getByLabelText('Tên bộ thẻ'), { target: { value: 'Bulk draft' } });
		fireEvent.change(screen.getByLabelText('Dữ liệu nhập'), {
			target: { value: 'Q: New\nA: Answer' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra dữ liệu' }));
		fireEvent.click(screen.getByRole('button', { name: 'Đưa vào bộ: 1 mới' }));
		await waitFor(() => expect(screen.getByLabelText('Dữ liệu nhập')).toHaveValue(''));
		fireEvent.click(screen.getByRole('button', { name: 'Tạo bộ thẻ' }));
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
		expect(body).toMatchObject({
			title: 'Bulk draft',
			status: 'DRAFT',
			cards: [{ question: '<p>New</p>', answer: '<p>Answer</p>' }],
		});
		expect(navigation.replace).toHaveBeenCalled();
	});
});
