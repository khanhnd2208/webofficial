import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ActiveRecallPlayer from './ActiveRecallPlayer';
import { DEFAULT_READING_SIZE, READING_SIZE_STORAGE_KEY } from './readingSize';

const { createRecallTracker, study, stop } = vi.hoisted(() => ({
	createRecallTracker: vi.fn(),
	study: vi.fn(),
	stop: vi.fn(),
}));
vi.mock('./recallTracker', () => ({ createRecallTracker }));

const deck = {
	id: 'deck-1',
	slug: 'demo',
	title: 'Demo',
	courseId: 'course-1',
	courseCode: 'HRM101',
	courseName: 'Human Resource Management',
	subject: 'HRM',
	lessonLabel: 'Lesson 1',
	description: '',
	status: 'PUBLISHED' as const,
	position: 0,
	cardCount: 2,
	classLinkCount: 0,
	updatedAt: new Date().toISOString(),
	createdAt: new Date().toISOString(),
	publishedAt: new Date().toISOString(),
	cards: [
		{
			id: 'a',
			question: 'Question one',
			answer: 'Answer one',
			questionVi: '',
			answerVi: '',
			position: 0,
			createdAt: '',
			updatedAt: '',
		},
		{
			id: 'b',
			question: 'Question two',
			answer: 'Answer two',
			questionVi: '',
			answerVi: '',
			position: 1,
			createdAt: '',
			updatedAt: '',
		},
	],
};

describe('ActiveRecallPlayer', () => {
	const originalRequestFullscreen = HTMLElement.prototype.requestFullscreen;
	const originalExitFullscreen = Document.prototype.exitFullscreen;
	const fullscreenDescriptor = Object.getOwnPropertyDescriptor(
		Document.prototype,
		'fullscreenElement',
	);

	beforeEach(() => {
		localStorage.clear();
		createRecallTracker.mockReset().mockReturnValue({ study, stop });
		study.mockClear();
		stop.mockClear();
	});

	afterEach(() => {
		HTMLElement.prototype.requestFullscreen = originalRequestFullscreen;
		if (originalExitFullscreen) {
			Document.prototype.exitFullscreen = originalExitFullscreen;
		} else {
			Reflect.deleteProperty(Document.prototype, 'exitFullscreen');
		}
		if (fullscreenDescriptor) {
			Object.defineProperty(document, 'fullscreenElement', fullscreenDescriptor);
		} else {
			Reflect.deleteProperty(document, 'fullscreenElement');
		}
		document.body.style.overflow = '';
		document.body.style.paddingRight = '';
		vi.restoreAllMocks();
	});

	it('reveals an answer only when requested and resets on navigation', () => {
		render(<ActiveRecallPlayer deck={deck} />);
		expect(screen.getByText('Question one')).toBeVisible();
		expect(screen.getByText('Câu hỏi')).toBeVisible();
		expect(screen.queryByText('Answer one')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Hiện đáp án' }));
		expect(screen.getByText('Answer one')).toBeVisible();
		expect(screen.getByText('Đáp án')).toBeVisible();
		fireEvent.click(screen.getByRole('button', { name: 'Tiếp →' }));
		expect(screen.getByText('Question two')).toBeVisible();
		expect(screen.queryByText('Answer two')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Hiện đáp án' })).toBeVisible();
	});

	it('records class study and answer reveals while using the Teaching theme', async () => {
		const { container, unmount } = render(
			<ActiveRecallPlayer deck={deck} classSlug="hrm-class" surface="teaching" />,
		);
		await waitFor(() =>
			expect(createRecallTracker).toHaveBeenCalledWith(
				'deck-1',
				'hrm-class',
				expect.any(String),
				expect.any(String),
			),
		);
		expect(container.querySelector('[data-surface="teaching"]')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Hiện đáp án' }));
		expect(study).toHaveBeenCalledWith(true);
		unmount();
		expect(stop).toHaveBeenCalledOnce();
	});

	it('supports keyboard flip and navigation', () => {
		render(<ActiveRecallPlayer deck={deck} />);
		fireEvent.keyDown(window, { key: ' ' });
		expect(screen.getByText('Answer one')).toBeVisible();
		fireEvent.keyDown(window, { key: 'ArrowRight' });
		expect(screen.getByText('Question two')).toBeVisible();
	});

	it('does not hijack Enter or Space from interactive controls', () => {
		render(<ActiveRecallPlayer deck={deck} />);
		const nextButton = screen.getByRole('button', { name: 'Tiếp →' });
		fireEvent.keyDown(nextButton, { key: 'Enter' });
		expect(screen.queryByText('Answer one')).not.toBeInTheDocument();
		expect(screen.getByText('Question one')).toBeVisible();
	});

	it('restores the last card from this device', async () => {
		localStorage.setItem(
			'active-recall:deck-1',
			JSON.stringify({ currentId: 'b', shuffled: false }),
		);
		render(<ActiveRecallPlayer deck={deck} />);
		await waitFor(() => expect(screen.getByText('Question two')).toBeVisible());
	});

	it('shuffles then restores the original order, first question, and stored state', async () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		const { unmount } = render(<ActiveRecallPlayer deck={deck} />);
		await waitFor(() =>
			expect(JSON.parse(localStorage.getItem('active-recall:deck-1') ?? '{}')).toEqual({
				currentId: 'a',
				shuffled: false,
				viMode: false,
				splitView: false,
			}),
		);

		expect(screen.getByText('Question one')).toBeVisible();
		expect(screen.getByText('1/2')).toBeVisible();
		expect(screen.getByRole('button', { name: 'Xáo câu' })).toHaveAttribute(
			'aria-pressed',
			'false',
		);

		fireEvent.click(screen.getByRole('button', { name: 'Xáo câu' }));
		expect(screen.getByText('Question two')).toBeVisible();
		expect(screen.getByText('Câu hỏi')).toBeVisible();
		expect(screen.getByText('1/2')).toBeVisible();
		expect(screen.getByRole('button', { name: 'Về thứ tự ban đầu' })).toHaveAttribute(
			'aria-pressed',
			'true',
		);
		await waitFor(() =>
			expect(JSON.parse(localStorage.getItem('active-recall:deck-1') ?? '{}')).toEqual({
				currentId: 'b',
				shuffled: true,
				viMode: false,
				splitView: false,
			}),
		);

		fireEvent.click(screen.getByRole('button', { name: 'Hiện đáp án' }));
		expect(screen.getByText('Answer two')).toBeVisible();

		fireEvent.click(screen.getByRole('button', { name: 'Về thứ tự ban đầu' }));
		expect(screen.getByText('Question one')).toBeVisible();
		expect(screen.getByText('Câu hỏi')).toBeVisible();
		expect(screen.queryByText('Answer one')).not.toBeInTheDocument();
		expect(screen.getByText('1/2')).toBeVisible();
		expect(screen.getByRole('button', { name: 'Xáo câu' })).toHaveAttribute(
			'aria-pressed',
			'false',
		);
		await waitFor(() =>
			expect(JSON.parse(localStorage.getItem('active-recall:deck-1') ?? '{}')).toEqual({
				currentId: 'a',
				shuffled: false,
				viMode: false,
				splitView: false,
			}),
		);

		unmount();
		render(<ActiveRecallPlayer deck={deck} />);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
		expect(screen.getByText('Question one')).toBeVisible();
		expect(screen.getByText('Câu hỏi')).toBeVisible();
		expect(screen.getByText('1/2')).toBeVisible();
		expect(screen.getByRole('button', { name: 'Xáo câu' })).toBeVisible();
		expect(JSON.parse(localStorage.getItem('active-recall:deck-1') ?? '{}')).toEqual({
			currentId: 'a',
			shuffled: false,
			viMode: false,
			splitView: false,
		});
	});

	it('renders stored HTML formatting on both sides of a card', () => {
		render(
			<ActiveRecallPlayer
				deck={{
					...deck,
					cards: [
						{
							id: 'formatted',
							question: '<p>What is <strong>HRM</strong>?</p>',
							answer:
								'<p>A <em>system</em> with <u>policies</u> and <span style="color: #dc2626">risk</span>.</p>',
							questionVi: '',
							answerVi: '',
						},
					],
				}}
			/>,
		);

		expect(screen.getByText('HRM').tagName).toBe('STRONG');
		fireEvent.click(screen.getByRole('button', { name: 'Hiện đáp án' }));
		expect(screen.getByText('system').tagName).toBe('EM');
		expect(screen.getByText('policies').tagName).toBe('U');
		expect(screen.getByText('risk')).toHaveStyle({ color: 'rgb(220, 38, 38)' });
	});

	it('does not render injected scripts from card HTML', () => {
		render(
			<ActiveRecallPlayer
				deck={{
					...deck,
					cards: [
						{
							id: 'unsafe',
							question: '<p>Safe<script>window.__xss = 1</script></p>',
							answer: 'Answer',
							questionVi: '',
							answerVi: '',
						},
					],
				}}
			/>,
		);

		expect(screen.getByText('Safe')).toBeVisible();
		expect(document.querySelector('.recall-text script')).toBeNull();
		expect((window as Window & { __xss?: number }).__xss).toBeUndefined();
	});

	it('defaults to large reading size and remembers a new choice across decks', async () => {
		const { unmount } = render(<ActiveRecallPlayer deck={deck} />);
		expect(screen.getByRole('main')).toHaveAttribute('data-reading-size', DEFAULT_READING_SIZE);
		expect(screen.queryByRole('radio', { name: 'Vừa' })).not.toBeInTheDocument();
		expect(screen.getByRole('radio', { name: 'Lớn' })).toHaveAttribute('aria-checked', 'true');

		fireEvent.click(screen.getByRole('radio', { name: 'Nhỏ' }));
		expect(screen.getByRole('main')).toHaveAttribute('data-reading-size', 'small');
		expect(localStorage.getItem(READING_SIZE_STORAGE_KEY)).toBe('small');
		expect(screen.getByText('Cỡ chữ nhỏ')).toBeInTheDocument();
		expect(screen.getByText('Cỡ chữ lớn')).toBeInTheDocument();
		expect(screen.getByText('Trình chiếu toàn màn hình')).toBeInTheDocument();
		unmount();

		render(<ActiveRecallPlayer deck={{ ...deck, id: 'deck-2', title: 'Other' }} />);
		await waitFor(() =>
			expect(screen.getByRole('main')).toHaveAttribute('data-reading-size', 'small'),
		);
		expect(screen.getByRole('radio', { name: 'Nhỏ' })).toHaveAttribute('aria-checked', 'true');
	});

	it('falls back to large reading size when stored data is invalid', async () => {
		localStorage.setItem(READING_SIZE_STORAGE_KEY, 'huge');
		render(<ActiveRecallPlayer deck={deck} />);
		await waitFor(() =>
			expect(screen.getByRole('main')).toHaveAttribute('data-reading-size', 'large'),
		);
	});

	it('treats a stored medium size as large after vừa was removed', async () => {
		localStorage.setItem(READING_SIZE_STORAGE_KEY, 'medium');
		render(<ActiveRecallPlayer deck={deck} />);
		await waitFor(() =>
			expect(screen.getByRole('main')).toHaveAttribute('data-reading-size', 'large'),
		);
		expect(screen.getByRole('radio', { name: 'Lớn' })).toHaveAttribute('aria-checked', 'true');
	});

	it('renders a class back link when the page provides one', () => {
		render(
			<ActiveRecallPlayer
				deck={deck}
				backHref="/lop/hrm-fall-2026?tab=recall"
				backLabel="Active Recall của lớp"
			/>,
		);
		expect(screen.getByRole('link', { name: /Active Recall của lớp/ })).toHaveAttribute(
			'href',
			'/lop/hrm-fall-2026?tab=recall',
		);
		expect(screen.getByRole('main')).toHaveAttribute('data-has-back', 'true');
	});

	it('flips from the card itself unless the learner is selecting text', () => {
		render(<ActiveRecallPlayer deck={deck} />);
		const card = screen.getByRole('button', { name: /Thẻ câu hỏi/ });
		fireEvent.click(card);
		expect(screen.getByText('Answer one')).toBeVisible();
		fireEvent.click(screen.getByRole('button', { name: /Thẻ đáp án/ }));
		expect(screen.getByText('Question one')).toBeVisible();

		const original = window.getSelection.bind(window);
		window.getSelection = () =>
			({
				isCollapsed: false,
				toString: () => 'Question one',
			}) as Selection;
		fireEvent.click(screen.getByRole('button', { name: /Thẻ câu hỏi/ }));
		expect(screen.getByText('Question one')).toBeVisible();
		expect(screen.queryByText('Answer one')).not.toBeInTheDocument();
		window.getSelection = original;
	});

	it('does not flip the card after a drag or scroll gesture', () => {
		render(<ActiveRecallPlayer deck={deck} />);
		const card = screen.getByRole('button', { name: /Thẻ câu hỏi/ });
		fireEvent.pointerDown(card, { clientX: 40, clientY: 40 });
		fireEvent.pointerMove(card, { clientX: 40, clientY: 80 });
		fireEvent.pointerUp(card, { clientX: 40, clientY: 80 });
		fireEvent.click(card);
		expect(screen.queryByText('Answer one')).not.toBeInTheDocument();
		expect(screen.getByText('Question one')).toBeVisible();
	});

	it('enters native fullscreen and keeps presentation controls available', async () => {
		let fullscreen = false;
		Object.defineProperty(document, 'fullscreenElement', {
			configurable: true,
			get: () => (fullscreen ? document.querySelector('.recall-player') : null),
		});
		HTMLElement.prototype.requestFullscreen = vi.fn(async () => {
			fullscreen = true;
			document.dispatchEvent(new Event('fullscreenchange'));
		});

		render(<ActiveRecallPlayer deck={deck} />);
		fireEvent.click(screen.getByRole('button', { name: 'Trình chiếu' }));
		await waitFor(() => expect(screen.getByRole('main')).toHaveClass('recall-player-presentation'));
		expect(screen.getByRole('button', { name: 'Thoát' })).toBeVisible();
		expect(screen.getByRole('button', { name: 'Hiện đáp án' })).toBeVisible();
		expect(screen.getByRole('button', { name: '← Trước' })).toBeVisible();
		expect(screen.getByRole('button', { name: 'Tiếp →' })).toBeVisible();
		expect(screen.getByRole('main')).toHaveAttribute('data-mode', 'presentation');
	});

	it('uses a fallback presentation when fullscreen is denied and exits with Escape', async () => {
		HTMLElement.prototype.requestFullscreen = vi.fn(async () => {
			throw new Error('denied');
		});

		render(<ActiveRecallPlayer deck={deck} />);
		const presentButton = screen.getByRole('button', { name: 'Trình chiếu' });
		presentButton.focus();
		fireEvent.click(presentButton);
		await waitFor(() =>
			expect(screen.getByRole('dialog', { name: 'Chế độ trình chiếu Active Recall' })).toHaveClass(
				'recall-player-presentation',
			),
		);
		expect(document.body.style.overflow).toBe('hidden');
		expect(screen.getByRole('button', { name: 'Thoát' })).toBeVisible();
		expect(
			screen.getByRole('dialog', { name: 'Chế độ trình chiếu Active Recall' }),
		).toHaveAttribute('aria-modal', 'true');

		fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() =>
			expect(screen.getByRole('main')).not.toHaveClass('recall-player-presentation'),
		);
		expect(document.body.style.overflow).toBe('');
		expect(screen.queryByRole('button', { name: 'Thoát' })).not.toBeInTheDocument();
		await waitFor(() => expect(presentButton).toHaveFocus());
	});

	it('keeps presentation controls when native fullscreen exit is rejected', async () => {
		let fullscreen = false;
		Object.defineProperty(document, 'fullscreenElement', {
			configurable: true,
			get: () => (fullscreen ? document.querySelector('.recall-player') : null),
		});
		HTMLElement.prototype.requestFullscreen = vi.fn(async () => {
			fullscreen = true;
			document.dispatchEvent(new Event('fullscreenchange'));
		});
		Document.prototype.exitFullscreen = vi.fn(async () => {
			throw new Error('exit denied');
		});

		render(<ActiveRecallPlayer deck={deck} />);
		fireEvent.click(screen.getByRole('button', { name: 'Trình chiếu' }));
		await waitFor(() => expect(screen.getByRole('button', { name: 'Thoát' })).toBeVisible());
		fireEvent.click(screen.getByRole('button', { name: 'Thoát' }));
		await waitFor(() => expect(screen.getByRole('button', { name: 'Thoát' })).toBeVisible());
		expect(screen.getByRole('main')).toHaveClass('recall-player-presentation');
	});

	it('hides the language switch unless showViToggle is set', () => {
		render(<ActiveRecallPlayer deck={deck} />);
		expect(screen.queryByRole('radiogroup', { name: 'Ngôn ngữ' })).not.toBeInTheDocument();
		expect(screen.queryByRole('radio', { name: 'Hai ngôn ngữ' })).not.toBeInTheDocument();
	});

	it('switches between English and Vietnamese and falls back when a card has none', () => {
		render(
			<ActiveRecallPlayer
				deck={{
					...deck,
					cards: [
						{
							id: 'a',
							question: 'What is HRM?',
							answer: 'A system of policies.',
							questionVi: 'HRM là gì?',
							answerVi: 'Một hệ thống chính sách.',
						},
						{
							id: 'b',
							question: 'Question two',
							answer: 'Answer two',
							questionVi: '',
							answerVi: '',
						},
					],
				}}
				showViToggle
			/>,
		);

		const english = screen.getByRole('radio', { name: 'EN' });
		const vietnamese = screen.getByRole('radio', { name: 'VI' });
		expect(english).toHaveAttribute('aria-checked', 'true');
		expect(vietnamese).toHaveAttribute('aria-checked', 'false');
		expect(vietnamese).toHaveClass('is-nudge');
		expect(screen.getByText('What is HRM?')).toBeVisible();

		fireEvent.click(vietnamese);
		expect(vietnamese).toHaveAttribute('aria-checked', 'true');
		expect(english).toHaveAttribute('aria-checked', 'false');
		expect(vietnamese).not.toHaveClass('is-nudge');
		expect(screen.getByRole('main')).toHaveAttribute('data-lang', 'vi');
		expect(screen.getByText('HRM là gì?')).toBeVisible();
		fireEvent.click(screen.getByRole('button', { name: 'Hiện đáp án' }));
		expect(screen.getByText('Một hệ thống chính sách.')).toBeVisible();

		fireEvent.click(screen.getByRole('button', { name: 'Tiếp →' }));
		expect(screen.getByText('Question two')).toBeVisible();

		fireEvent.click(english);
		expect(english).toHaveAttribute('aria-checked', 'true');
		expect(screen.getByRole('main')).toHaveAttribute('data-lang', 'en');
	});

	it('shows English and Vietnamese together in split view', async () => {
		const bilingual = {
			...deck,
			cards: [
				{
					id: 'a',
					question: 'What is HRM?',
					answer: 'A system of policies.',
					questionVi: 'HRM là gì?',
					answerVi: 'Một hệ thống chính sách.',
					position: 0,
					createdAt: '',
					updatedAt: '',
				},
				{
					id: 'b',
					question: 'Question two',
					answer: 'Answer two',
					questionVi: '',
					answerVi: '',
					position: 1,
					createdAt: '',
					updatedAt: '',
				},
			],
		};
		const { unmount } = render(<ActiveRecallPlayer deck={bilingual} showViToggle />);
		const splitOption = screen.getByRole('radio', { name: 'Hai ngôn ngữ' });
		expect(splitOption).toHaveAttribute('aria-checked', 'false');
		expect(screen.queryByRole('region', { name: 'EN' })).not.toBeInTheDocument();

		fireEvent.click(splitOption);
		expect(splitOption).toHaveAttribute('aria-checked', 'true');
		expect(screen.getByRole('main')).toHaveAttribute('data-lang', 'split');
		expect(screen.getByRole('region', { name: 'EN' })).toBeVisible();
		expect(screen.getByRole('region', { name: 'VI' })).toBeVisible();
		expect(screen.getByText('What is HRM?')).toBeVisible();
		expect(screen.getByText('HRM là gì?')).toBeVisible();

		fireEvent.click(screen.getByRole('button', { name: 'Hiện đáp án' }));
		expect(screen.getByText('A system of policies.')).toBeVisible();
		expect(screen.getByText('Một hệ thống chính sách.')).toBeVisible();

		fireEvent.click(screen.getByRole('button', { name: 'Tiếp →' }));
		expect(screen.getByText('Question two')).toBeVisible();
		expect(screen.getByText('Chưa có bản tiếng Việt')).toBeVisible();

		fireEvent.click(screen.getByRole('radio', { name: 'VI' }));
		expect(splitOption).toHaveAttribute('aria-checked', 'false');
		expect(screen.queryByRole('region', { name: 'EN' })).not.toBeInTheDocument();
		expect(screen.getByText('Question two')).toBeVisible();
		expect(screen.queryByText('Chưa có bản tiếng Việt')).not.toBeInTheDocument();

		await waitFor(() =>
			expect(JSON.parse(localStorage.getItem('active-recall:deck-1') ?? '{}')).toEqual({
				currentId: 'b',
				shuffled: false,
				viMode: true,
				splitView: false,
			}),
		);

		unmount();
		localStorage.setItem(
			'active-recall:deck-1',
			JSON.stringify({ currentId: 'a', shuffled: false, viMode: false, splitView: true }),
		);
		render(<ActiveRecallPlayer deck={bilingual} showViToggle />);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
		expect(screen.getByRole('radio', { name: 'Hai ngôn ngữ' })).toHaveAttribute(
			'aria-checked',
			'true',
		);
		expect(screen.getByText('What is HRM?')).toBeVisible();
		expect(screen.getByText('HRM là gì?')).toBeVisible();
	});

	it('does not overwrite stored language view when the VI controls are hidden', async () => {
		localStorage.setItem(
			'active-recall:deck-1',
			JSON.stringify({ currentId: 'a', shuffled: false, viMode: true, splitView: true }),
		);
		render(<ActiveRecallPlayer deck={deck} />);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
		expect(screen.queryByRole('radiogroup', { name: 'Ngôn ngữ' })).not.toBeInTheDocument();
		expect(screen.getByText('Question one')).toBeVisible();
		await waitFor(() =>
			expect(JSON.parse(localStorage.getItem('active-recall:deck-1') ?? '{}')).toEqual({
				currentId: 'a',
				shuffled: false,
				viMode: true,
				splitView: true,
			}),
		);
	});

	it('keeps the question in view above the revealed answer', () => {
		render(<ActiveRecallPlayer deck={deck} />);
		expect(document.querySelector('.recall-card-recap')).toBeNull();
		fireEvent.click(screen.getByRole('button', { name: 'Hiện đáp án' }));
		expect(document.querySelector('.recall-card-recap')).toHaveTextContent('Câu hỏi: Question one');
		expect(screen.getByText('Answer one')).toBeVisible();
	});

	it('ends the deck with a summary and lets the learner start again', () => {
		render(
			<ActiveRecallPlayer
				deck={deck}
				backHref="/lop/hrm-fall-2026?tab=recall"
				backLabel="Ôn tập của lớp"
			/>,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Tiếp →' }));
		expect(screen.queryByRole('button', { name: 'Học lại từ đầu' })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành' }));

		expect(screen.getByRole('heading', { name: 'Bạn đã ôn hết 2 thẻ.' })).toBeVisible();
		expect(screen.queryByText('Question two')).not.toBeInTheDocument();
		expect(screen.getAllByRole('link', { name: /Ôn tập của lớp/ })).toHaveLength(2);

		fireEvent.click(screen.getByRole('button', { name: '← Trước' }));
		expect(screen.getByText('Question two')).toBeVisible();
		fireEvent.keyDown(window, { key: 'ArrowRight' });
		expect(screen.getByRole('heading', { name: 'Bạn đã ôn hết 2 thẻ.' })).toBeVisible();

		fireEvent.click(screen.getByRole('button', { name: 'Học lại từ đầu' }));
		expect(screen.getByText('Question one')).toBeVisible();
		expect(screen.getByText('1/2')).toBeVisible();
	});

	it('shuffles and restarts from the summary', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		render(<ActiveRecallPlayer deck={deck} />);
		fireEvent.click(screen.getByRole('button', { name: 'Tiếp →' }));
		fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành' }));
		fireEvent.click(screen.getByRole('button', { name: 'Xáo thứ tự rồi học lại' }));
		expect(screen.getByText('Question two')).toBeVisible();
		expect(screen.getByRole('button', { name: 'Về thứ tự ban đầu' })).toHaveAttribute(
			'aria-pressed',
			'true',
		);
	});

	it('changes card with a sideways touch swipe but not with a mouse drag', () => {
		render(<ActiveRecallPlayer deck={deck} />);
		const card = () => screen.getByRole('button', { name: /Thẻ câu hỏi/ });

		fireEvent.pointerDown(card(), { pointerType: 'mouse', clientX: 200, clientY: 100 });
		fireEvent.pointerMove(card(), { pointerType: 'mouse', clientX: 80, clientY: 104 });
		fireEvent.pointerUp(card(), { pointerType: 'mouse', clientX: 80, clientY: 104 });
		fireEvent.click(card());
		expect(screen.getByText('Question one')).toBeVisible();

		fireEvent.pointerDown(card(), { pointerType: 'touch', clientX: 200, clientY: 100 });
		fireEvent.pointerMove(card(), { pointerType: 'touch', clientX: 80, clientY: 108 });
		fireEvent.pointerUp(card(), { pointerType: 'touch', clientX: 80, clientY: 108 });
		fireEvent.click(card());
		expect(screen.getByText('Question two')).toBeVisible();
		expect(screen.queryByText('Answer two')).not.toBeInTheDocument();

		fireEvent.pointerDown(card(), { pointerType: 'touch', clientX: 80, clientY: 100 });
		fireEvent.pointerUp(card(), { pointerType: 'touch', clientX: 200, clientY: 104 });
		expect(screen.getByText('Question one')).toBeVisible();
	});

	it('does not change card on a mostly vertical touch drag', () => {
		render(<ActiveRecallPlayer deck={deck} />);
		const card = screen.getByRole('button', { name: /Thẻ câu hỏi/ });
		fireEvent.pointerDown(card, { pointerType: 'touch', clientX: 100, clientY: 100 });
		fireEvent.pointerUp(card, { pointerType: 'touch', clientX: 40, clientY: 260 });
		expect(screen.getByText('Question one')).toBeVisible();
	});

	it('opens the options menu and closes it from outside or with Escape', () => {
		render(<ActiveRecallPlayer deck={deck} />);
		const toggle = screen.getByRole('button', { name: 'Tùy chọn' });
		const menu = document.getElementById(toggle.getAttribute('aria-controls')!)!;
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		expect(menu).toHaveAttribute('data-open', 'false');

		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute('aria-expanded', 'true');
		expect(menu).toHaveAttribute('data-open', 'true');
		fireEvent.pointerDown(screen.getByRole('radio', { name: 'Nhỏ' }));
		expect(toggle).toHaveAttribute('aria-expanded', 'true');

		fireEvent.pointerDown(document.body);
		expect(toggle).toHaveAttribute('aria-expanded', 'false');

		fireEvent.click(toggle);
		fireEvent.keyDown(window, { key: 'Escape' });
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		expect(toggle).toHaveFocus();

		fireEvent.click(toggle);
		fireEvent.click(screen.getByRole('button', { name: 'Xáo câu' }));
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
	});

	it('closes the options menu without flipping the card that was tapped', () => {
		render(<ActiveRecallPlayer deck={deck} />);
		const toggle = screen.getByRole('button', { name: 'Tùy chọn' });
		fireEvent.click(toggle);
		const card = screen.getByRole('button', { name: /Thẻ câu hỏi/ });
		fireEvent.pointerDown(card, { pointerType: 'touch', clientX: 50, clientY: 50 });
		fireEvent.pointerUp(card, { pointerType: 'touch', clientX: 50, clientY: 50 });
		fireEvent.click(card);
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		expect(screen.getByText('Question one')).toBeVisible();
		expect(screen.queryByText('Answer one')).not.toBeInTheDocument();

		fireEvent.pointerDown(card, { pointerType: 'touch', clientX: 50, clientY: 50 });
		fireEvent.pointerUp(card, { pointerType: 'touch', clientX: 50, clientY: 50 });
		fireEvent.click(card);
		expect(screen.getByText('Answer one')).toBeVisible();
	});
});
