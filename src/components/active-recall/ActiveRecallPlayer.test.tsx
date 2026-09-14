import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ActiveRecallPlayer from './ActiveRecallPlayer';
import { DEFAULT_READING_SIZE, READING_SIZE_STORAGE_KEY } from './readingSize';

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
	canDelete: false,
	classLinkCount: 0,
	updatedAt: new Date().toISOString(),
	createdAt: new Date().toISOString(),
	publishedAt: new Date().toISOString(),
	cards: [
		{
			id: 'a',
			question: 'Question one',
			answer: 'Answer one',
			position: 0,
			createdAt: '',
			updatedAt: '',
		},
		{
			id: 'b',
			question: 'Question two',
			answer: 'Answer two',
			position: 1,
			createdAt: '',
			updatedAt: '',
		},
	],
};

describe('ActiveRecallPlayer', () => {
	const originalRequestFullscreen = HTMLElement.prototype.requestFullscreen;
	const originalExitFullscreen = Document.prototype.exitFullscreen;
	const fullscreenDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'fullscreenElement');

	beforeEach(() => localStorage.clear());

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
			}),
		);

		expect(screen.getByText('Question one')).toBeVisible();
		expect(screen.getByText('1/2')).toBeVisible();
		expect(screen.getByRole('button', { name: 'Xáo câu' })).toHaveAttribute('aria-pressed', 'false');

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
			}),
		);

		fireEvent.click(screen.getByRole('button', { name: 'Hiện đáp án' }));
		expect(screen.getByText('Answer two')).toBeVisible();

		fireEvent.click(screen.getByRole('button', { name: 'Về thứ tự ban đầu' }));
		expect(screen.getByText('Question one')).toBeVisible();
		expect(screen.getByText('Câu hỏi')).toBeVisible();
		expect(screen.queryByText('Answer one')).not.toBeInTheDocument();
		expect(screen.getByText('1/2')).toBeVisible();
		expect(screen.getByRole('button', { name: 'Xáo câu' })).toHaveAttribute('aria-pressed', 'false');
		await waitFor(() =>
			expect(JSON.parse(localStorage.getItem('active-recall:deck-1') ?? '{}')).toEqual({
				currentId: 'a',
				shuffled: false,
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
							position: 0,
							createdAt: '',
							updatedAt: '',
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
							position: 0,
							createdAt: '',
							updatedAt: '',
						},
					],
				}}
			/>,
		);

		expect(screen.getByText('Safe')).toBeVisible();
		expect(document.querySelector('.recall-text script')).toBeNull();
		expect((window as Window & { __xss?: number }).__xss).toBeUndefined();
	});

	it('defaults to medium reading size and remembers a new choice across decks', async () => {
		const { unmount } = render(<ActiveRecallPlayer deck={deck} />);
		expect(screen.getByRole('main')).toHaveAttribute('data-reading-size', DEFAULT_READING_SIZE);
		expect(screen.getByRole('radio', { name: 'Vừa' })).toHaveAttribute('aria-checked', 'true');

		fireEvent.click(screen.getByRole('radio', { name: 'Lớn' }));
		expect(screen.getByRole('main')).toHaveAttribute('data-reading-size', 'large');
		expect(localStorage.getItem(READING_SIZE_STORAGE_KEY)).toBe('large');
		unmount();

		render(<ActiveRecallPlayer deck={{ ...deck, id: 'deck-2', title: 'Other' }} />);
		await waitFor(() =>
			expect(screen.getByRole('main')).toHaveAttribute('data-reading-size', 'large'),
		);
		expect(screen.getByRole('radio', { name: 'Lớn' })).toHaveAttribute('aria-checked', 'true');
	});

	it('falls back to medium reading size when stored data is invalid', async () => {
		localStorage.setItem(READING_SIZE_STORAGE_KEY, 'huge');
		render(<ActiveRecallPlayer deck={deck} />);
		await waitFor(() =>
			expect(screen.getByRole('main')).toHaveAttribute('data-reading-size', 'medium'),
		);
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
		await waitFor(() =>
			expect(screen.getByRole('main')).toHaveClass('recall-player-presentation'),
		);
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
		expect(screen.getByRole('dialog', { name: 'Chế độ trình chiếu Active Recall' })).toHaveAttribute(
			'aria-modal',
			'true',
		);

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
});
