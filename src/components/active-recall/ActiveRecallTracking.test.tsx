import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActiveRecallDeckDTO } from '@/features/active-recall/types';
import ActiveRecallPlayer from './ActiveRecallPlayer';
const study = vi.hoisted(() => vi.fn());
vi.mock('./useRecallStudy', () => ({ useRecallStudy: () => study }));
const card = {
	question: 'Question A',
	answer: 'Answer A',
	questionVi: '',
	answerVi: '',
	createdAt: '',
	updatedAt: '',
};
const deck: ActiveRecallDeckDTO = {
	id: 'tracked-deck',
	slug: 'tracked',
	title: 'Tracked',
	courseId: 'course',
	courseCode: 'TEST',
	courseName: 'Test',
	subject: 'Test',
	lessonLabel: '',
	description: '',
	status: 'PUBLISHED',
	position: 0,
	cardCount: 2,
	classLinkCount: 0,
	createdAt: '',
	updatedAt: '',
	publishedAt: null,
	cards: [
		{ ...card, id: 'a', position: 0 },
		{ ...card, id: 'b', position: 1, question: 'Question B', answer: 'Answer B' },
	],
};
beforeEach(() => {
	localStorage.clear();
	study.mockClear();
});
describe('semantic Recall tracking actions', () => {
	it('records keyboard flips and real moves once without counting edge navigation', () => {
		render(
			<StrictMode>
				<ActiveRecallPlayer deck={deck} />
			</StrictMode>,
		);
		fireEvent.keyDown(window, { key: 'ArrowLeft' });
		expect(study).not.toHaveBeenCalled();
		fireEvent.keyDown(window, { key: ' ' });
		expect(study).toHaveBeenLastCalledWith(true);
		fireEvent.keyDown(window, { key: ' ' });
		expect(study).toHaveBeenLastCalledWith(false);
		fireEvent.keyDown(window, { key: 'ArrowRight' });
		expect(study).toHaveBeenLastCalledWith(false);
		fireEvent.keyDown(window, { key: 'ArrowRight' });
		expect(study).toHaveBeenCalledTimes(3);
	});
	it('restores the saved bilingual view without creating engagement', async () => {
		localStorage.setItem(
			'active-recall:tracked-deck',
			JSON.stringify({ currentId: 'b', splitView: true }),
		);
		render(<ActiveRecallPlayer deck={deck} showViToggle />);
		await waitFor(() => expect(screen.getByText('Question B')).toBeVisible());
		expect(study).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: '← Trước' }));
		expect(study).toHaveBeenCalledWith(false);
	});
});

it('records bilingual mode as study without falsely recording an answer reveal', () => {
	render(<ActiveRecallPlayer deck={deck} showViToggle />);
	fireEvent.click(screen.getByRole('button', { name: 'Hai ngôn ngữ' }));
	expect(study).toHaveBeenCalledWith(false);
	fireEvent.click(screen.getByRole('button', { name: 'Hiện đáp án' }));
	expect(study).toHaveBeenLastCalledWith(true);
});
