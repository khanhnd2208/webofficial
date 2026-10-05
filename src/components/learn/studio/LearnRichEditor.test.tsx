import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LearnRichEditor from './LearnRichEditor';

const { adminFetch } = vi.hoisted(() => ({ adminFetch: vi.fn() }));
vi.mock('@/lib/admin/client', () => ({ adminFetch }));

describe('LearnRichEditor mode guard', () => {
	it('uploads a file dropped on a placeholder once and replaces that image', async () => {
		adminFetch.mockReset();
		adminFetch.mockResolvedValue({ url: '/uploads/replaced.webp' });
		render(<LearnRichEditor value="![x](hinh-1.png)" onChange={vi.fn()} />);
		const placeholder = await screen.findByText('Chưa có ảnh: hinh-1.png');
		fireEvent.drop(placeholder.closest('div')!, {
			dataTransfer: { files: [new File(['x'], 'hinh-1.png', { type: 'image/png' })] },
		});
		await waitFor(() =>
			expect(screen.getByRole('img', { name: 'x' })).toHaveAttribute(
				'src',
				'/uploads/replaced.webp',
			),
		);
		expect(adminFetch).toHaveBeenCalledTimes(1);
	});
	it('renders unresolved image placeholders with an upload action', async () => {
		render(<LearnRichEditor value='![x](hinh-1.png "Hình 1")' onChange={vi.fn()} />);
		await waitFor(() => expect(screen.getByText('Chưa có ảnh: hinh-1.png')).toBeInTheDocument());
		expect(screen.getByRole('button', { name: 'Tải ảnh lên' })).toBeInTheDocument();
		expect(screen.queryByRole('img', { name: 'x' })).not.toBeInTheDocument();
	});
	it('closes link and academic popovers with Escape and outside clicks', async () => {
		render(<LearnRichEditor value="Text" onChange={vi.fn()} />);
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Chèn liên kết' })).toBeInTheDocument(),
		);
		fireEvent.click(screen.getByRole('button', { name: 'Chèn liên kết' }));
		expect(screen.getByRole('button', { name: 'Hủy' })).toBeInTheDocument();
		fireEvent.keyDown(document, { key: 'Escape' });
		expect(screen.queryByRole('textbox', { name: 'Đường dẫn' })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Khối học thuật' }));
		const callout = screen.getByRole('button', { name: 'Khối học thuật' });
		expect(callout).toHaveAttribute('aria-expanded', 'true');
		const menu = screen.getByRole('group', { name: 'Chọn khối học thuật' });
		await waitFor(() => expect(menu.querySelector('button')).toHaveFocus());
		fireEvent.keyDown(document, { key: 'Escape' });
		expect(screen.queryByRole('group', { name: 'Chọn khối học thuật' })).not.toBeInTheDocument();
		expect(callout).toHaveAttribute('aria-expanded', 'false');
	});
	it('opens in Markdown mode with a warning when the stored content has raw HTML', async () => {
		render(<LearnRichEditor value={'Chữ <u>gạch chân</u>.'} onChange={vi.fn()} />);

		const markdownTab = screen.getByRole('tab', { name: /markdown/i });
		expect(markdownTab).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('alert')).toHaveTextContent(/thẻ HTML/i);
		expect(screen.queryByRole('toolbar', { name: 'Định dạng' })).not.toBeInTheDocument();
	});

	it('blocks switching to visual mode on unsupported syntax until the user confirms', async () => {
		const onChange = vi.fn();
		render(<LearnRichEditor value="Đoạn văn bình thường." onChange={onChange} />);

		await waitFor(() =>
			expect(screen.getByRole('toolbar', { name: 'Định dạng' })).toBeInTheDocument(),
		);

		fireEvent.click(screen.getByRole('tab', { name: /markdown/i }));
		const textarea = screen.getByPlaceholderText(/Tiêu đề/);
		fireEvent.change(textarea, { target: { value: '- [ ] việc cần làm' } });

		fireEvent.click(screen.getByRole('tab', { name: 'Soạn trực quan' }));
		expect(screen.getByRole('alert')).toHaveTextContent(/việc cần làm/i);
		expect(screen.getByRole('tab', { name: /markdown/i })).toHaveAttribute('aria-selected', 'true');

		fireEvent.click(screen.getByRole('button', { name: /vẫn chuyển sang soạn trực quan/i }));
		await waitFor(() =>
			expect(screen.getByRole('tab', { name: 'Soạn trực quan' })).toHaveAttribute(
				'aria-selected',
				'true',
			),
		);
	});
});
