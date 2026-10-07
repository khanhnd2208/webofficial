import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LearnDiscussionEditor, { DiscussionSession } from './LearnDiscussionEditor';
import type { LearnDiscussion } from '@/features/learn/types';

vi.mock('@/lib/admin/client', () => ({ adminFetch: vi.fn() }));

const discussion: LearnDiscussion = {
	questions: [
		{ id: 'q1', question: 'Câu một', answer: 'Đáp một' },
		{ id: 'q2', question: 'Câu hai', answer: 'Đáp hai' },
	],
};

describe('LearnDiscussionEditor', () => {
	it('keeps a typed prompt on the question that was open when switching', async () => {
		const onChange = vi.fn();
		render(
			<DiscussionSession discussion={discussion} onChange={onChange}>
				<LearnDiscussionEditor
					sectionId="s1"
					discussion={discussion}
					onChange={onChange}
					onOpenImport={() => undefined}
					onOpenHelp={() => undefined}
				/>
			</DiscussionSession>,
		);
		fireEvent.click(screen.getByRole('tab', { name: 'Markdown' }));
		const prompt = await screen.findByRole('textbox', { name: 'Đề bài' });
		fireEvent.change(prompt, { target: { value: 'Câu một đã sửa' } });
		fireEvent.click(screen.getByRole('tab', { name: 'Đáp án mẫu' }));
		const last = onChange.mock.calls.at(-1)?.[0] as LearnDiscussion;
		expect(last.questions[0].question).toBe('Câu một đã sửa');
		expect(last.questions[1].question).toBe('Câu hai');
	});
});
