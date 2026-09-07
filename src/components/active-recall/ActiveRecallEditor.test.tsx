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
		canDelete: false,
		updatedAt: '2026-09-01T00:00:00.000Z',
		createdAt: '2026-09-01T00:00:00.000Z',
		publishedAt: null,
		cards: [
			{
				id: 'card-1',
				question: 'What is HRM?',
				answer: 'Human resource management',
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

	it('keeps create mode to title and cards only', () => {
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
		expect(screen.queryByText('Nhập nhiều')).not.toBeInTheDocument();
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
				cards: [{ question: 'What is HRM?', answer: 'Human resource management' }],
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
});
