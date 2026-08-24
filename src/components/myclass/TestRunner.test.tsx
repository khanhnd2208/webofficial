import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TestRunner from './TestRunner';
import type { MyClassTestForPlay } from '@/features/my-class';

const test: MyClassTestForPlay = {
	slug: 'demo',
	title: 'Demo',
	description: '',
	questionCount: 2,
	scope: 'COURSE',
	courseSlug: 'hrm',
	returnTo: { href: '/my-space/my-class/hrm', label: 'Course' },
	questions: [
		{ id: 'q1', type: 'MCQ_SINGLE', stem: 'One?', options: [{ key: 'A', text: 'Yes' }, { key: 'B', text: 'No' }], position: 0 },
		{ id: 'q2', type: 'MCQ_SINGLE', stem: 'Two?', options: [{ key: 'A', text: 'Yes' }, { key: 'B', text: 'No' }], position: 1 },
	],
};

describe('TestRunner', () => {
	beforeEach(() => localStorage.clear());
	it('uses dismiss instead of a page link when embedded', () => {
		const onDismiss = vi.fn();
		const resultTest = {
			...test,
			questions: test.questions,
		};
		render(<TestRunner test={resultTest} embedded onDismiss={onDismiss} />);
		expect(screen.queryByRole('link', { name: 'Về bài học' })).not.toBeInTheDocument();
	});

	it('shows review cards after submit and dismisses with onDismiss', async () => {
		const onDismiss = vi.fn();
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			json: async () => ({
				ok: true,
				data: {
					attemptId: 'r1',
					saved: true,
					score: 1,
					total: 2,
					review: [
						{ questionId: 'q1', type: 'MCQ_SINGLE', stem: 'One?', options: test.questions[0]!.options, chosenKey: 'A', correctKey: 'A', explanation: '<p>Because</p>', isCorrect: true, response: { type: 'MCQ_SINGLE', key: 'A' }, answer: { type: 'MCQ_SINGLE', correctKey: 'A' }, earned: 1, max: 1 },
						{ questionId: 'q2', type: 'MCQ_SINGLE', stem: 'Two?', options: test.questions[1]!.options, chosenKey: 'A', correctKey: 'B', explanation: '', isCorrect: false, response: { type: 'MCQ_SINGLE', key: 'A' }, answer: { type: 'MCQ_SINGLE', correctKey: 'B' }, earned: 0, max: 1 },
					],
					kuBreakdown: [],
				},
			}),
		}));
		render(<TestRunner test={test} embedded onDismiss={onDismiss} />);
		fireEvent.click(screen.getByLabelText(/A\. Yes/));
		fireEvent.click(screen.getByRole('button', { name: /Tiếp/ }));
		fireEvent.click(screen.getByLabelText(/A\. Yes/));
		fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }));
		expect(await screen.findByTestId('my-class-test-result')).toBeVisible();
		expect(screen.getByRole('heading', { name: 'Xem câu trả lời' })).toBeVisible();
		expect(screen.getByText('Đúng')).toBeVisible();
		expect(screen.getByText('Bạn chọn Yes · Đáp án No')).toBeVisible();
		fireEvent.click(screen.getByRole('button', { name: 'Về bài học' }));
		expect(onDismiss).toHaveBeenCalled();
		vi.unstubAllGlobals();
	});

	it('fills jump cells green when answered and leaves unanswered cells empty', () => {
		render(<TestRunner test={test} />);
		fireEvent.click(screen.getByLabelText(/A\. Yes/));
		fireEvent.click(screen.getByRole('button', { name: /Tiếp/ }));

		const answered = screen.getByRole('button', { name: 'Câu 1, đã chọn' });
		const current = screen.getByRole('button', { name: 'Câu 2, chưa chọn' });
		expect(answered).toHaveClass('bg-mc-done-subtle', 'text-mc-done');
		expect(answered).not.toHaveAttribute('aria-current');
		expect(current).toHaveClass('bg-ink', 'text-paper');
		expect(current).toHaveAttribute('aria-current', 'true');
	});

	it('moves one question at a time and only enables submit at the end', () => {
		render(<TestRunner test={test} />);
		expect(screen.getByText('Câu 1/2')).toBeVisible();
		expect(screen.getByText('0/2 đã chọn')).toBeVisible();
		fireEvent.click(screen.getByLabelText(/A\. Yes/));
		expect(screen.getByText('1/2 đã chọn')).toBeVisible();
		fireEvent.click(screen.getByRole('button', { name: /Tiếp/ }));
		expect(screen.getByText('Câu 2/2')).toBeVisible();
		expect(screen.getByText('1/2 đã chọn')).toBeVisible();
		fireEvent.click(screen.getByLabelText(/A\. Yes/));
		expect(screen.getByRole('button', { name: 'Nộp bài' })).toBeEnabled();
	});

	it('saves guest attempts without asking for login', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			json: async () => ({
				ok: true,
				data: {
					attemptId: 'g1',
					saved: true,
					score: 2,
					total: 2,
					review: [
						{ questionId: 'q1', type: 'MCQ_SINGLE', stem: 'One?', options: test.questions[0]!.options, chosenKey: 'A', correctKey: 'A', explanation: 'Because', isCorrect: true, response: { type: 'MCQ_SINGLE', key: 'A' }, answer: { type: 'MCQ_SINGLE', correctKey: 'A' }, earned: 1, max: 1 },
						{ questionId: 'q2', type: 'MCQ_SINGLE', stem: 'Two?', options: test.questions[1]!.options, chosenKey: 'A', correctKey: 'A', explanation: '', isCorrect: true, response: { type: 'MCQ_SINGLE', key: 'A' }, answer: { type: 'MCQ_SINGLE', correctKey: 'A' }, earned: 1, max: 1 },
					],
					kuBreakdown: [{ slug: 'r', title: 'Reliability', questions: 1, correct: 1, accuracy: 100, evidenceLabel: 'Đúng 1 / 1 evidence (100%)' }],
				},
			}),
		}));
		render(<TestRunner test={test} authenticated={false} />);
		fireEvent.click(screen.getByLabelText(/A\. Yes/));
		fireEvent.click(screen.getByRole('button', { name: /Tiếp/ }));
		fireEvent.click(screen.getByLabelText(/A\. Yes/));
		fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }));
		expect(await screen.findByTestId('my-class-test-result')).toBeVisible();
		 expect(screen.getByText(/Đã lưu kết quả/)).toBeVisible();
		expect(screen.queryByText(/Đăng nhập/)).not.toBeInTheDocument();
		vi.unstubAllGlobals();
	});

	it('confirms saved state for authenticated users', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			json: async () => ({
				ok: true,
				data: {
					attemptId: 'a1',
					saved: true,
					score: 1,
					total: 2,
					review: [
						{ questionId: 'q1', type: 'MCQ_SINGLE', stem: 'One?', options: test.questions[0]!.options, chosenKey: 'A', correctKey: 'A', explanation: '', isCorrect: true, response: { type: 'MCQ_SINGLE', key: 'A' }, answer: { type: 'MCQ_SINGLE', correctKey: 'A' }, earned: 1, max: 1 },
						{ questionId: 'q2', type: 'MCQ_SINGLE', stem: 'Two?', options: test.questions[1]!.options, chosenKey: 'A', correctKey: 'B', explanation: '', isCorrect: false, response: { type: 'MCQ_SINGLE', key: 'A' }, answer: { type: 'MCQ_SINGLE', correctKey: 'B' }, earned: 0, max: 1 },
					],
					kuBreakdown: [],
				},
			}),
		}));
		render(<TestRunner test={test} authenticated />);
		fireEvent.click(screen.getByLabelText(/A\. Yes/));
		fireEvent.click(screen.getByRole('button', { name: /Tiếp/ }));
		fireEvent.click(screen.getByLabelText(/A\. Yes/));
		fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }));
		 expect(await screen.findByText(/Đã lưu kết quả/)).toBeVisible();
		vi.unstubAllGlobals();
	});

	it('shows an empty state instead of crashing when the test has no questions', () => {
		render(
			<TestRunner
				test={{
					...test,
					questionCount: 0,
					questions: [],
				}}
			/>,
		);
		expect(screen.getByTestId('my-class-test-runner')).toBeVisible();
		expect(screen.getByText('Chưa có câu hỏi')).toBeVisible();
		expect(screen.queryByText('Câu 1/0')).not.toBeInTheDocument();
	});

	it('renders character boxes for fill-in-the-blank questions', () => {
		render(
			<TestRunner
				test={{
					...test,
					questionCount: 1,
					questions: [
						{
							id: 'q-blank',
							type: 'FILL_BLANK',
							stem: 'HRM is [[1]]',
							options: [],
							blanks: [{ id: '1', length: 3, hint: '3 letters' }],
							position: 0,
						},
					],
				}}
			/>,
		);
		expect(screen.getByTestId('fill-blank-1')).toBeInTheDocument();
		expect(screen.getAllByLabelText(/Ô \d+ chỗ trống 1/)).toHaveLength(3);
	});

	it('shows a countdown when the test has a time limit', () => {
		render(<TestRunner test={{ ...test, timeLimitMinutes: 10 }} />);
		expect(screen.getByTestId('my-class-test-timer')).toHaveTextContent(/10:0\d/);
	});

	it('blocks a new attempt when the learner is out of tries', () => {
		render(<TestRunner test={{ ...test, maxAttempts: 1, attemptsUsed: 1 }} />);
		expect(screen.getByText('Hết lượt làm bài')).toBeVisible();
		expect(screen.queryByText('Câu 1/2')).not.toBeInTheDocument();
	});

	it('hides the answer review when revealPolicy is NEVER', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			json: async () => ({
				ok: true,
				data: {
					attemptId: 'n1',
					saved: true,
					score: 1,
					total: 2,
					review: [],
					kuBreakdown: [],
				},
			}),
		}));
		render(<TestRunner test={{ ...test, revealPolicy: 'NEVER' }} />);
		fireEvent.click(screen.getByLabelText(/A\. Yes/));
		fireEvent.click(screen.getByRole('button', { name: /Tiếp/ }));
		fireEvent.click(screen.getByLabelText(/A\. Yes/));
		fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }));
		expect(await screen.findByTestId('my-class-test-result')).toBeVisible();
		expect(screen.queryByRole('heading', { name: 'Xem câu trả lời' })).not.toBeInTheDocument();
		vi.unstubAllGlobals();
	});

	it('keeps the same shuffled order after a refresh when the seed is stored', () => {
		localStorage.setItem(
			'my-class:test:hrm:demo',
			JSON.stringify({ seed: 'stable-seed', answers: {}, current: 0 }),
		);
		const shuffled = {
			...test,
			shuffleQuestions: true,
			questions: [
				...test.questions,
				{ id: 'q3', type: 'MCQ_SINGLE' as const, stem: 'Three?', options: [{ key: 'A' as const, text: 'Yes' }, { key: 'B' as const, text: 'No' }], position: 2 },
			],
			questionCount: 3,
		};
		const first = render(<TestRunner test={shuffled} />);
		const firstStem = screen.getByText(/1\./).textContent;
		first.unmount();
		render(<TestRunner test={shuffled} />);
		expect(screen.getByText(/1\./).textContent).toBe(firstStem);
	});
});
