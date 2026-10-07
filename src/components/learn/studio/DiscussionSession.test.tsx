import { useEffect, useRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { LearnDiscussion } from '@/features/learn/types';
import LearnDiscussionEditor, {
	DiscussionSession,
	useDiscussionSession,
} from './LearnDiscussionEditor';
import { registerEditorFlush } from './useStudioSaver';

vi.mock('./LearnRichEditor', () => ({
	default: function MockRichEditor({
		value,
		onChange,
		label,
	}: {
		value: string;
		onChange: (value: string) => void;
		label: string;
	}) {
		const [draft, setDraft] = useState(value);
		const pending = useRef<string | null>(null);
		const change = useRef(onChange);
		useEffect(() => {
			change.current = onChange;
		}, [onChange]);
		useEffect(() => {
			const flush = () => {
				if (pending.current === null) return;
				const next = pending.current;
				pending.current = null;
				change.current(next);
			};
			const unregister = registerEditorFlush(flush);
			return () => {
				flush();
				unregister();
			};
		}, []);
		return (
			<textarea
				aria-label={label}
				value={draft}
				onChange={(event) => {
					pending.current = event.target.value;
					setDraft(event.target.value);
				}}
			/>
		);
	},
}));

const initial: LearnDiscussion = {
	questions: [
		{ id: 'q1', question: 'Câu một', answer: 'Đáp một' },
		{ id: 'q2', question: 'Câu hai', answer: 'Đáp hai' },
	],
};

function Actions() {
	const session = useDiscussionSession()!;
	return (
		<>
			<button onClick={() => session.duplicate('q1')}>Nhân bản câu một</button>
			<button onClick={session.add}>Thêm câu thử</button>
			<button onClick={() => session.remove('q1')}>Xóa câu một</button>
			<button onClick={() => session.remove('q2')}>Xóa câu hai</button>
			<button onClick={() => session.select('q2')}>Chọn câu hai</button>
			<button onClick={() => session.reorder(['q2', 'q1'])}>Đổi thứ tự</button>
		</>
	);
}

function Harness() {
	const [discussion, setDiscussion] = useState(initial);
	return (
		<>
			<output data-testid="model">{JSON.stringify(discussion)}</output>
			<DiscussionSession discussion={discussion} onChange={setDiscussion}>
				<Actions />
				<LearnDiscussionEditor
					sectionId="s1"
					discussion={discussion}
					onChange={setDiscussion}
					onOpenImport={() => undefined}
					onOpenHelp={() => undefined}
				/>
			</DiscussionSession>
		</>
	);
}

const model = () => JSON.parse(screen.getByTestId('model').textContent!) as LearnDiscussion;

describe('discussion structural edits with pending visual text', () => {
	it('duplicates the latest draft without losing either question', () => {
		render(<Harness />);
		fireEvent.change(screen.getByRole('textbox', { name: 'Đề bài' }), {
			target: { value: 'Bản mới nhất' },
		});
		fireEvent.click(screen.getByText('Nhân bản câu một'));
		expect(model().questions.map((item) => item.question)).toEqual([
			'Bản mới nhất',
			'Bản mới nhất',
			'Câu hai',
		]);
	});
	it('keeps a new question when the old editor flushes during unmount', () => {
		render(<Harness />);
		fireEvent.change(screen.getByRole('textbox', { name: 'Đề bài' }), {
			target: { value: 'Bản mới nhất' },
		});
		fireEvent.click(screen.getByText('Thêm câu thử'));
		expect(model().questions).toHaveLength(3);
		expect(model().questions[0].question).toBe('Bản mới nhất');
	});
	it('reorders without reverting the pending draft', () => {
		render(<Harness />);
		fireEvent.change(screen.getByRole('textbox', { name: 'Đề bài' }), {
			target: { value: 'Bản mới nhất' },
		});
		fireEvent.click(screen.getByText('Đổi thứ tự'));
		expect(model().questions.map((item) => item.question)).toEqual(['Câu hai', 'Bản mới nhất']);
	});
	it('removes from the saved model immediately and undo preserves later edits', () => {
		render(<Harness />);
		fireEvent.click(screen.getByText('Xóa câu một'));
		expect(model().questions.map((item) => item.id)).toEqual(['q2']);
		fireEvent.change(screen.getByRole('textbox', { name: 'Đề bài' }), {
			target: { value: 'Câu hai đã sửa' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Hoàn tác' }));
		expect(model().questions.map((item) => item.question)).toEqual(['Câu một', 'Câu hai đã sửa']);
	});
	it('does not keep editing a question after deleting the last one', () => {
		render(<Harness />);
		fireEvent.click(screen.getByText('Xóa câu một'));
		fireEvent.click(screen.getByText('Xóa câu hai'));
		expect(screen.queryByRole('textbox', { name: 'Đề bài' })).not.toBeInTheDocument();
		expect(model().questions).toEqual([]);
	});
});
