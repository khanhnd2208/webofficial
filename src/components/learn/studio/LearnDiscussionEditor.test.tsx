import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LearnDiscussionEditor from './LearnDiscussionEditor';

describe('LearnDiscussionEditor', () => {
	it('inserts a question block at the caret and does not write storage while previewing', () => {
		const setItem = vi.spyOn(Storage.prototype, 'setItem');
		const onChange = vi.fn();
		render(
			<LearnDiscussionEditor
				discussion={{
					questions: [
						{
							id: 'q1',
							question: 'Xin chào',
							answer: '',
						},
					],
				}}
				onChange={onChange}
				onOpenImport={() => undefined}
			/>,
		);
		const prompt = screen.getByRole('textbox', { name: 'Đề bài' });
		fireEvent.select(prompt, { target: { selectionStart: 8, selectionEnd: 8 } });
		fireEvent.click(screen.getByRole('button', { name: 'Câu hỏi' }));
		expect(onChange).toHaveBeenCalled();
		const next = onChange.mock.calls.at(-1)?.[0].questions[0].question as string;
		expect(next).toContain('> [!REFLECT] Câu hỏi:');
		expect(setItem).not.toHaveBeenCalled();
		setItem.mockRestore();
	});
});
