import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import RecallRichTextEditor from './RecallRichTextEditor';

async function readyEditor(value = '<p>Sample text</p>', onChange = vi.fn()) {
	const view = render(<RecallRichTextEditor value={value} onChange={onChange} labelledBy="q" />);
	await waitFor(() => expect(screen.getByRole('button', { name: 'Màu chữ' })).toBeInTheDocument());
	return { ...view, onChange };
}

describe('RecallRichTextEditor', () => {
	it('exposes compact formatting controls including a simple color palette', async () => {
		await readyEditor();

		expect(screen.getByRole('button', { name: 'Đậm' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Nghiêng' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Gạch chân' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Danh sách chấm' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Danh sách số' })).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Màu chữ' }));
		expect(screen.getByRole('group', { name: 'Màu chữ' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Màu chữ: Đỏ' })).toBeInTheDocument();
	});

	it('loads stored bold, italic, underline and color marks', async () => {
		await readyEditor(
			'<p><strong>Bold</strong> <em>italic</em> <u>under</u> <span style="color: #dc2626">red</span></p>',
		);

		await waitFor(() => {
			const html = document.querySelector('.recall-card-editor')?.innerHTML ?? '';
			expect(html).toContain('<strong>Bold</strong>');
			expect(html).toContain('<em>italic</em>');
			expect(html).toContain('<u>under</u>');
			expect(html).toMatch(/color:\s*(#dc2626|rgb\(220,\s*38,\s*38\))/i);
		});
	});

	it('activates formatting controls from the keyboard', async () => {
		await readyEditor();
		const bold = screen.getByRole('button', { name: 'Đậm' });
		bold.focus();
		fireEvent.click(bold);
		expect(bold).toBeInTheDocument();
	});

	it('selects a preset text color from the palette', async () => {
		await readyEditor();
		fireEvent.click(screen.getByRole('button', { name: 'Màu chữ' }));
		fireEvent.click(screen.getByRole('button', { name: 'Màu chữ: Đỏ' }));
		expect(screen.getByRole('button', { name: 'Màu chữ' })).toBeInTheDocument();
	});
});
