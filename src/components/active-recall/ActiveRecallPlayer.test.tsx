import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import ActiveRecallPlayer from './ActiveRecallPlayer';

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
	canDelete: false,
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
	beforeEach(() => localStorage.clear());
	it('reveals an answer only when requested and resets on navigation', () => {
		render(<ActiveRecallPlayer deck={deck} />);
		expect(screen.getByText('Question one')).toBeVisible();
		expect(screen.queryByText('Answer one')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Hiện đáp án' }));
		expect(screen.getByText('Answer one')).toBeVisible();
		fireEvent.click(screen.getByRole('button', { name: 'Tiếp →' }));
		expect(screen.getByText('Question two')).toBeVisible();
		expect(screen.queryByText('Answer two')).not.toBeInTheDocument();
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
});
