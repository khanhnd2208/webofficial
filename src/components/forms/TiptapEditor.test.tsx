import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TiptapEditor from './TiptapEditor';

async function readyEditor(onChange = vi.fn()) {
	const view = render(<TiptapEditor content="<p>Sample text</p>" onChange={onChange} />);
	await waitFor(() => expect(screen.getByRole('button', { name: 'Màu chữ' })).toBeInTheDocument());
	return { ...view, onChange };
}

describe('TiptapEditor color tools', () => {
	it('opens one palette at a time and exposes the preset swatches', async () => {
		await readyEditor();

		fireEvent.mouseDown(screen.getByRole('button', { name: 'Màu chữ' }));
		expect(screen.getByRole('group', { name: 'Màu chữ' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Màu chữ: Đỏ' })).toBeInTheDocument();
		expect(screen.queryByRole('group', { name: 'Highlight' })).not.toBeInTheDocument();

		fireEvent.mouseDown(screen.getByRole('button', { name: 'Highlight' }));
		expect(screen.getByRole('group', { name: 'Highlight' })).toBeInTheDocument();
		expect(screen.queryByRole('group', { name: 'Màu chữ' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Highlight: Vàng' })).toBeInTheDocument();
	});

	it('selects and clears a text color from the preset palette', async () => {
		await readyEditor();
		fireEvent.mouseDown(screen.getByRole('button', { name: 'Màu chữ' }));
		fireEvent.mouseDown(screen.getByRole('button', { name: 'Màu chữ: Đỏ' }));
		expect(screen.getByRole('button', { name: 'Màu chữ: Đỏ' })).toBeInTheDocument();
		fireEvent.mouseDown(screen.getByRole('button', { name: 'Màu chữ: Mặc định' }));
		expect(screen.getByRole('button', { name: 'Màu chữ: Mặc định' })).toBeInTheDocument();
	});

	it('selects and clears a multicolor highlight', async () => {
		await readyEditor();
		fireEvent.mouseDown(screen.getByRole('button', { name: 'Highlight' }));
		fireEvent.mouseDown(screen.getByRole('button', { name: 'Highlight: Vàng' }));
		expect(screen.getByRole('button', { name: 'Highlight: Vàng' })).toBeInTheDocument();
		fireEvent.mouseDown(screen.getByRole('button', { name: 'Highlight: Không highlight' }));
		expect(screen.getByRole('button', { name: 'Highlight: Không highlight' })).toBeInTheDocument();
	});

	it('loads saved color and highlight HTML without dropping either mark', async () => {
		const content =
			'<p><span style="color: #2563eb">Blue</span> <mark style="background-color: #bbf7d0">green</mark></p>';
		const onChange = vi.fn();
		const { rerender } = render(<TiptapEditor content={content} onChange={onChange} />);
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Màu chữ' })).toBeInTheDocument(),
		);
		await waitFor(() => {
			const html = document.querySelector('.tiptap-content')?.innerHTML ?? '';
			expect(html).toMatch(/color:/i);
			expect(html).toMatch(/background-color:/i);
		});
		rerender(<TiptapEditor content={content} onChange={onChange} />);
	});
});
