import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InquiryAdminActions from './InquiryAdminActions';
const mocks = vi.hoisted(() => ({
	fetch: vi.fn(),
	refresh: vi.fn(),
	push: vi.fn(),
	confirm: vi.fn(),
}));
vi.mock('next/navigation', () => ({
	useRouter: () => ({ refresh: mocks.refresh, push: mocks.push }),
}));
vi.mock('@/lib/admin/client', () => ({ adminFetch: mocks.fetch }));
vi.mock('@/components/admin/useAdminConfirm', () => ({
	useAdminConfirm: () => ({ confirm: mocks.confirm, dialog: null }),
}));
vi.mock('@/components/ui/Dialog', () => ({
	Dialog: ({ open, title, children }: { open: boolean; title: string; children: ReactNode }) =>
		open ? (
			<div role="dialog" aria-label={title}>
				{children}
			</div>
		) : null,
}));
const props = {
	inquiryId: 'contact-1',
	currentStatus: 'NEW' as const,
	initialNotes: 'Ghi chú đã lưu',
	returnHref: '/admin/inquiries?page=2&status=NEW',
};
describe('inquiry actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.fetch.mockResolvedValue({});
	});
	it('loads existing notes and disables unchanged saves', () => {
		render(<InquiryAdminActions {...props} />);
		expect(screen.getByRole('textbox', { name: 'Ghi chú nội bộ' })).toHaveValue(props.initialNotes);
		expect(screen.getByRole('button', { name: 'Lưu ghi chú' })).toBeDisabled();
	});
	it('saves the draft and retains it across a server refresh', async () => {
		const { rerender } = render(<InquiryAdminActions {...props} />);
		fireEvent.change(screen.getByRole('textbox', { name: 'Ghi chú nội bộ' }), {
			target: { value: 'Ghi chú mới' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Lưu ghi chú' }));
		await screen.findByText('Đã lưu ghi chú.');
		expect(mocks.fetch).toHaveBeenCalledWith('/api/admin/inquiries/contact-1', {
			method: 'PATCH',
			body: JSON.stringify({ internalNotes: 'Ghi chú mới' }),
		});
		expect(screen.getByRole('button', { name: 'Lưu ghi chú' })).toBeDisabled();
		fireEvent.change(screen.getByRole('textbox', { name: 'Ghi chú nội bộ' }), {
			target: { value: 'Bản nháp tiếp theo' },
		});
		rerender(<InquiryAdminActions {...props} initialNotes="Ghi chú mới" />);
		expect(screen.getByRole('textbox', { name: 'Ghi chú nội bộ' })).toHaveValue(
			'Bản nháp tiếp theo',
		);
	});
	it('keeps the draft after failure and allows retry', async () => {
		mocks.fetch.mockRejectedValueOnce(new Error('Không lưu được'));
		render(<InquiryAdminActions {...props} />);
		fireEvent.change(screen.getByRole('textbox', { name: 'Ghi chú nội bộ' }), {
			target: { value: 'Bản nháp' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Lưu ghi chú' }));
		expect(await screen.findByRole('alert')).toHaveTextContent('Không lưu được');
		expect(screen.getByRole('textbox', { name: 'Ghi chú nội bộ' })).toHaveValue('Bản nháp');
		expect(screen.getByRole('button', { name: 'Lưu ghi chú' })).toBeEnabled();
	});
	it('locks all writes while saving and sends once', async () => {
		let resolve!: () => void;
		mocks.fetch.mockImplementation(
			() =>
				new Promise<void>((done) => {
					resolve = done;
				}),
		);
		render(<InquiryAdminActions {...props} />);
		fireEvent.change(screen.getByRole('textbox', { name: 'Ghi chú nội bộ' }), {
			target: { value: 'Đổi' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Lưu ghi chú' }));
		expect(screen.getByRole('button', { name: 'Đang lưu…' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Xóa vĩnh viễn' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Đánh dấu đang xem' })).toBeDisabled();
		resolve();
		await screen.findByText('Đã lưu ghi chú.');
		expect(mocks.fetch).toHaveBeenCalledTimes(1);
	});
	it('updates status without clearing a separate notes draft', async () => {
		render(<InquiryAdminActions {...props} />);
		fireEvent.change(screen.getByRole('textbox', { name: 'Ghi chú nội bộ' }), {
			target: { value: 'Chưa lưu' },
		});
		fireEvent.change(screen.getByRole('combobox', { name: 'Trạng thái' }), {
			target: { value: 'REVIEWING' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Cập nhật trạng thái' }));
		await screen.findByText('Đã cập nhật trạng thái.');
		expect(screen.getByRole('textbox', { name: 'Ghi chú nội bộ' })).toHaveValue('Chưa lưu');
	});
	it('cancels deletion without writing then returns to filtered list on confirmation', async () => {
		mocks.confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
		render(<InquiryAdminActions {...props} />);
		fireEvent.click(screen.getByRole('button', { name: 'Xóa vĩnh viễn' }));
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Xóa vĩnh viễn' })).toBeEnabled(),
		);
		expect(mocks.fetch).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Xóa vĩnh viễn' }));
		await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(props.returnHref));
		expect(mocks.fetch).toHaveBeenCalledWith('/api/admin/inquiries/contact-1', {
			method: 'DELETE',
		});
	});
	it('hides retry after a notification has been sent', () => {
		render(<InquiryAdminActions {...props} adminEmailStatus="sent" />);
		expect(screen.queryByRole('button', { name: 'Gửi lại thông báo' })).not.toBeInTheDocument();
	});
	it('marks a new inquiry as reviewing in one step', async () => {
		render(<InquiryAdminActions {...props} />);
		fireEvent.click(screen.getByRole('button', { name: 'Đánh dấu đang xem' }));
		await screen.findByText('Đã chuyển sang Đang xem.');
		expect(mocks.fetch).toHaveBeenCalledWith('/api/admin/inquiries/contact-1', {
			method: 'PATCH',
			body: JSON.stringify({ status: 'REVIEWING' }),
		});
	});
	it('offers the next statuses for an inquiry already under review', async () => {
		render(<InquiryAdminActions {...props} currentStatus="REVIEWING" />);
		fireEvent.click(screen.getByRole('button', { name: 'Cần thêm thông tin' }));
		await screen.findByText('Đã chuyển sang Cần thêm thông tin.');
		expect(mocks.fetch).toHaveBeenCalledWith('/api/admin/inquiries/contact-1', {
			method: 'PATCH',
			body: JSON.stringify({ status: 'NEED_MORE_INFO' }),
		});
	});
	it('saves notes with the keyboard shortcut', async () => {
		render(<InquiryAdminActions {...props} />);
		const field = screen.getByRole('textbox', { name: 'Ghi chú nội bộ' });
		fireEvent.change(field, { target: { value: 'Lưu nhanh' } });
		fireEvent.keyDown(field, { key: 'Enter', metaKey: true });
		await screen.findByText('Đã lưu ghi chú.');
		expect(mocks.fetch).toHaveBeenCalledWith('/api/admin/inquiries/contact-1', {
			method: 'PATCH',
			body: JSON.stringify({ internalNotes: 'Lưu nhanh' }),
		});
	});
	it('asks before leaving while notes are unsaved', () => {
		render(
			<>
				{/* The guard listens for native anchors before Next handles them. */}
				{/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
				<a href="/admin/inquiries">Rời trang</a>
				<InquiryAdminActions {...props} />
			</>,
		);
		fireEvent.change(screen.getByRole('textbox', { name: 'Ghi chú nội bộ' }), {
			target: { value: 'Chưa lưu' },
		});
		fireEvent.click(screen.getByRole('link', { name: 'Rời trang' }));
		expect(screen.getByRole('dialog', { name: 'Thay đổi chưa lưu' })).toBeInTheDocument();
	});
});
