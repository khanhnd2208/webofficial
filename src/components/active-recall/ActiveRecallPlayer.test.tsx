import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import ActiveRecallPlayer from './ActiveRecallPlayer';

const deck = {
	id: 'deck-1',
	slug: 'demo',
	title: 'Demo',
	subject: 'HRM',
	lessonLabel: 'Lesson 1',
	description: '',
	status: 'PUBLISHED' as const,
	position: 0,
	cardCount: 2,
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

	it('restores the last card from this device', async () => {
		localStorage.setItem(
			'active-recall:deck-1',
			JSON.stringify({ currentId: 'b', shuffled: false }),
		);
		render(<ActiveRecallPlayer deck={deck} />);
		await waitFor(() => expect(screen.getByText('Question two')).toBeVisible());
	});
});
