import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import RecallTestYourself from './RecallTestYourself';

vi.mock('@/components/teaching/arena/arenaSound', () => ({
	isArenaMuted: () => true,
	playArenaSound: vi.fn(),
	setArenaMuted: vi.fn(),
	subscribeArenaMuted: () => () => {},
}));

const card = (id: string, question: string, answer: string) => ({
	id,
	question,
	answer,
	questionVi: '',
	answerVi: '',
});

const decks = [
	{
		id: 'd1',
		slug: 'bai-1',
		title: 'Bài 1',
		subject: 'HRM',
		lessonLabel: 'Lesson 1',
		cards: [card('a', 'Question A', 'Answer A'), card('b', 'Question B', 'Answer B')],
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
	return screen.getByText(/^Question [ABC]$/).closest('section')!;
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

	it('preselects the deck from the link and counts its questions', () => {
		renderTest('bai-2');
		expect(screen.getByRole('checkbox', { name: /Bài 2/ })).toBeChecked();
		expect(screen.getByRole('checkbox', { name: /Bài 1/ })).not.toBeChecked();
		expect(screen.getByRole('button', { name: 'Gặp boss · 1 câu' })).toBeEnabled();
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
		expect(screen.queryByText('Đáp án')).toBeNull();
		fireEvent.click(screen.getByRole('button', { name: 'Xem đáp án' }));
		expect(screen.getByText('Đáp án')).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: /Chưa hiểu, kiểm tra lại tôi sau/ }));
		expect(within(bubble()).getByText(/^Question/).textContent).not.toBe(firstQuestion);
		expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '3');

		for (let turn = 0; turn < 3; turn += 1) {
			fireEvent.click(screen.getByRole('button', { name: 'Xem đáp án' }));
			fireEvent.click(screen.getByRole('button', { name: /Đã hiểu, không hỏi lại/ }));
		}
		expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0');

		act(() => {
			vi.runAllTimers();
		});
		expect(screen.getByRole('heading', { name: 'Boss đã gục!' })).toBeInTheDocument();
		expect(screen.getByText('Những câu cần ôn thêm')).toBeInTheDocument();
		expect(screen.getByText(firstQuestion)).toBeInTheDocument();
	});

	it('moves on with the keyboard and can stop mid-fight', () => {
		renderTest('bai-1');
		fireEvent.click(screen.getByRole('button', { name: 'Gặp boss · 2 câu' }));
		const first = within(bubble()).getByText(/^Question/).textContent;
		fireEvent.keyDown(window, { key: ' ' });
		expect(screen.getByText('Đáp án')).toBeInTheDocument();
		fireEvent.keyDown(window, { key: '2' });
		expect(within(bubble()).getByText(/^Question/).textContent).not.toBe(first);

		fireEvent.click(screen.getByRole('button', { name: 'Dừng trận' }));
		expect(screen.getByRole('heading', { name: 'Tạm dừng trận đấu' })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Chọn bộ câu hỏi khác' }));
		expect(screen.getByRole('heading', { name: 'Test yourself' })).toBeInTheDocument();
	});
});
