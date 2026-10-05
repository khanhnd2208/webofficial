import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { LearnQuiz } from '@/features/learn/types';

import LearnQuizEditor from './LearnQuizEditor';

const { adminFetch } = vi.hoisted(() => ({ adminFetch: vi.fn() }));
vi.mock('@/lib/admin/client', async () => {
	const actual = await vi.importActual<typeof import('@/lib/admin/client')>('@/lib/admin/client');
	return { ...actual, adminFetch };
});

const initial: LearnQuiz = {
	passingScorePercent: 70,
	timeLimitMinutes: null,
	questions: [
		{ id: 'q1', question: 'Câu đầu?', options: ['Đúng', 'Sai'], correctIndex: 0, explanation: '' },
		{ id: 'q2', question: 'Câu hai?', options: ['', 'Sai'], correctIndex: 0, explanation: '' },
	],
};

function Harness({ onChange }: { onChange: (quiz: LearnQuiz) => void }) {
	const [quiz, setQuiz] = useState(initial);
	return (
		<LearnQuizEditor
			sectionId="s1"
			quiz={quiz}
			onChange={(next) => {
				setQuiz(next);
				onChange(next);
			}}
			onOpenImport={() => undefined}
		/>
	);
}

describe('LearnQuizEditor', () => {
	afterEach(() => vi.useRealTimers());

	it('flags a question whose correct answer is blank', () => {
		render(<Harness onChange={() => undefined} />);
		expect(screen.getByText('Đáp án đúng đang trống')).toBeInTheDocument();
	});

	it('duplicates a question right after the original with a new id', () => {
		const onChange = vi.fn();
		render(<Harness onChange={onChange} />);
		fireEvent.click(screen.getByRole('button', { name: 'Thao tác câu 1' }));
		fireEvent.click(screen.getByRole('menuitem', { name: 'Nhân bản' }));
		const questions = onChange.mock.calls.at(-1)?.[0].questions as LearnQuiz['questions'];
		expect(questions.map((item) => item.question)).toEqual(['Câu đầu?', 'Câu đầu?', 'Câu hai?']);
		expect(questions[1].id).not.toBe('q1');
	});

	it('hides a deleted question and brings it back with Hoàn tác', () => {
		vi.useFakeTimers();
		const onChange = vi.fn();
		render(<Harness onChange={onChange} />);
		fireEvent.click(screen.getByRole('button', { name: 'Thao tác câu 2' }));
		fireEvent.click(screen.getByRole('menuitem', { name: 'Xóa' }));
		expect(screen.queryByText('Câu hai?')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Hoàn tác' }));
		act(() => {
			vi.advanceTimersByTime(10_000);
		});
		expect(onChange).not.toHaveBeenCalled();
		expect(screen.getByRole('button', { name: /Câu hai\?/ })).toBeInTheDocument();
	});

	it('previews a question without calling the API', () => {
		render(<Harness onChange={() => undefined} />);
		fireEvent.click(screen.getByRole('tab', { name: 'Xem trước' }));
		fireEvent.click(screen.getAllByRole('radio', { name: /Đúng/ })[0]);
		expect(adminFetch).not.toHaveBeenCalled();
	});
});
