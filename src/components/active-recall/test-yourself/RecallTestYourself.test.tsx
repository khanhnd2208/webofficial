import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import RecallTestYourself from './RecallTestYourself';

vi.mock('@/components/teaching/arena/arenaSound', () => ({
	isArenaMuted: () => true,
	playArenaSound: vi.fn(),
	setArenaMuted: vi.fn(),
	subscribeArenaMuted: () => () => {},
}));

const card = (id: string, question: string, answer: string, vi = false) => ({
	id,
	question,
	answer,
	questionVi: vi ? `Câu hỏi ${id.toUpperCase()}` : '',
	answerVi: vi ? `<p>Đáp án ${id.toUpperCase()}</p><p><strong>Ví dụ:</strong> Hương.</p>` : '',
});

const decks = [
	{
		id: 'd1',
		slug: 'bai-1',
		title: 'Bài 1',
		subject: 'HRM',
		lessonLabel: 'Lesson 1',
		cards: [card('a', 'Question A', 'Answer A', true), card('b', 'Question B', 'Answer B', true)],
	},
	{
		id: 'd2',
		slug: 'bai-2',
		title: 'Bài 2',
		subject: 'HRM',
		lessonLabel: 'Lesson 2',
		cards: [card('c', 'Question C', 'Answer C')],
	},
];

function renderTest(initialDeckSlug?: string) {
	return render(
		<RecallTestYourself
			title="HRM"
			decks={decks}
			initialDeckSlug={initialDeckSlug}
			backHref="/active-recall/course-1"
			backLabel="Các bộ thẻ của môn"
		/>,
	);
}

function bubble() {
	return screen.getByText(/^(Question|Câu hỏi) [ABC]$/).closest('section')!;
}

describe('RecallTestYourself', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.spyOn(Math, 'random').mockReturnValue(0);
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('starts the linked deck by name and folds the other decks away', () => {
		renderTest('bai-2');
		expect(screen.getByRole('button', { name: 'Bắt đầu Bài 2 · 1 câu' })).toBeEnabled();
		expect(screen.getByText('Đổi hoặc chọn thêm bộ').closest('details')).not.toHaveAttribute(
			'open',
		);
		expect(screen.getByRole('checkbox', { name: /Bài 2/, hidden: true })).toBeChecked();
		fireEvent.click(screen.getByRole('checkbox', { name: /Bài 1/, hidden: true }));
		expect(screen.getByRole('button', { name: 'Gặp boss · 3 câu' })).toBeEnabled();
	});

	it('cannot start without a deck', () => {
		renderTest();
		fireEvent.click(screen.getByRole('button', { name: 'Bỏ chọn tất cả' }));
		expect(screen.getByRole('button', { name: 'Chọn ít nhất một bộ' })).toBeDisabled();
	});

	it('quizzes the chosen decks until every card is understood', () => {
		renderTest();
		fireEvent.click(screen.getByRole('button', { name: 'Gặp boss · 3 câu' }));
		expect(screen.getByRole('meter', { name: 'Máu của boss' })).toHaveAttribute(
			'aria-valuenow',
			'3',
		);

		const firstQuestion = within(bubble()).getByText(/^Question/).textContent!;
		expect(screen.queryByText('Ý cần nhớ')).toBeNull();
		expect(screen.getByText(/Thử trả lời thành tiếng/)).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Xem đáp án' }));
		expect(screen.getByText('Ý cần nhớ')).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: /Cần ôn lại/ }));
		expect(within(bubble()).getByText(/^Question/).textContent).not.toBe(firstQuestion);
		expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '3');

		let cheered = false;
		for (let turn = 0; turn < 3; turn += 1) {
			fireEvent.click(screen.getByRole('button', { name: 'Xem đáp án' }));
			fireEvent.click(screen.getByRole('button', { name: /Nhớ được/ }));
			cheered ||= screen.queryByText('Đã nhớ lại!') !== null;
		}
		expect(cheered).toBe(true);
		expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0');

		act(() => {
			vi.runAllTimers();
		});
		expect(screen.getByRole('heading', { name: 'Boss đã gục!' })).toBeInTheDocument();
		expect(screen.getByText('Những câu cần ôn thêm')).toBeInTheDocument();
		expect(screen.getByText(firstQuestion)).toBeInTheDocument();
	});

	it('pauses and resumes on the same card, then ends the session', () => {
		renderTest('bai-1');
		fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu Bài 1 · 2 câu' }));
		const first = within(bubble()).getByText(/^Question/).textContent;
		fireEvent.keyDown(window, { key: ' ' });
		expect(screen.getByText('Ý cần nhớ')).toBeInTheDocument();
		fireEvent.keyDown(window, { key: '2' });
		const second = within(bubble()).getByText(/^Question/).textContent;
		expect(second).not.toBe(first);

		fireEvent.click(screen.getByRole('button', { name: 'Dừng trận' }));
		expect(screen.getByRole('heading', { name: 'Tạm dừng trận đấu' })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục trận' }));
		expect(within(bubble()).getByText(/^Question/).textContent).toBe(second);
		expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '1');

		fireEvent.click(screen.getByRole('button', { name: 'Dừng trận' }));
		fireEvent.click(screen.getByRole('button', { name: 'Kết thúc phiên' }));
		expect(screen.getByRole('heading', { name: 'Kết thúc phiên' })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Chọn bộ câu hỏi khác' }));
		expect(screen.getByRole('heading', { name: 'Test yourself' })).toBeInTheDocument();
	});

	it('keeps the chosen language through the summary and drills the hard cards', () => {
		renderTest('bai-1');
		fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu Bài 1 · 2 câu' }));
		fireEvent.click(screen.getByRole('button', { name: 'VI' }));
		expect(screen.getByRole('button', { name: 'VI' })).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false');
		const hard = within(bubble()).getByText(/^Câu hỏi/).textContent!;

		fireEvent.click(screen.getByRole('button', { name: 'Xem đáp án' }));
		expect(screen.getByText('Ví dụ')).toBeInTheDocument();
		expect(screen.getByText('Hương.')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: /Cần ôn lại/ }));

		fireEvent.click(screen.getByRole('button', { name: 'Dừng trận' }));
		fireEvent.click(screen.getByRole('button', { name: 'Kết thúc phiên' }));
		expect(within(screen.getByRole('list')).getByText(hard)).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Ôn riêng 1 câu này' }));
		expect(screen.getByRole('meter')).toHaveAttribute('aria-valuemax', '1');
		expect(within(bubble()).getByText(hard)).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Xem đáp án' }));
		fireEvent.click(screen.getByRole('button', { name: /Nhớ được/ }));
		act(() => vi.runAllTimers());
		fireEvent.click(screen.getByRole('button', { name: 'Đấu lại với boss mới' }));
		expect(screen.getByRole('meter')).toHaveAttribute('aria-valuemax', '1');
		expect(within(bubble()).getByText(hard)).toBeInTheDocument();
	});
});
