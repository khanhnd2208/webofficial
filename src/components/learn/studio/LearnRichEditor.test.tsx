import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LearnRichEditor from './LearnRichEditor';

describe('LearnRichEditor mode guard', () => {
	it('opens in Markdown mode with a warning when the stored content has a footnote', async () => {
		render(<LearnRichEditor value={'Câu[^1].\n\n[^1]: Nguồn.'} onChange={vi.fn()} />);

		const markdownTab = screen.getByRole('tab', { name: /markdown/i });
		expect(markdownTab).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('alert')).toHaveTextContent(/chú thích nguồn/i);
		expect(screen.queryByRole('toolbar', { name: 'Định dạng' })).not.toBeInTheDocument();
	});

	it('blocks switching to visual mode on unsupported syntax until the user confirms', async () => {
		const onChange = vi.fn();
		render(<LearnRichEditor value="Đoạn văn bình thường." onChange={onChange} />);

		await waitFor(() => expect(screen.getByRole('toolbar', { name: 'Định dạng' })).toBeInTheDocument());

		fireEvent.click(screen.getByRole('tab', { name: /markdown/i }));
		const textarea = screen.getByPlaceholderText(/Tiêu đề/);
		fireEvent.change(textarea, { target: { value: '- [ ] việc cần làm' } });

		fireEvent.click(screen.getByRole('tab', { name: 'Soạn trực quan' }));
		expect(screen.getByRole('alert')).toHaveTextContent(/việc cần làm/i);
		expect(screen.getByRole('tab', { name: /markdown/i })).toHaveAttribute('aria-selected', 'true');

		fireEvent.click(screen.getByRole('button', { name: /vẫn chuyển sang soạn trực quan/i }));
		await waitFor(() =>
			expect(screen.getByRole('tab', { name: 'Soạn trực quan' })).toHaveAttribute('aria-selected', 'true'),
		);
	});
});
