import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Page from './page';
const list = vi.hoisted(() => vi.fn());
const counts = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() =>
	vi.fn((url: string) => {
		throw new Error(`redirect:${url}`);
	}),
);
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/services/inquiryService', () => ({
	listInquiries: list,
	countInquiriesByStatus: counts,
}));
describe('inbox page', () => {
	beforeEach(() => {
		list.mockReset();
		counts.mockReset();
		redirect.mockClear();
		list.mockResolvedValue({ items: [], total: 0, totalPages: 1, page: 1, limit: 20 });
		counts.mockResolvedValue({
			all: 0,
			byStatus: {
				NEW: 0,
				REVIEWING: 0,
				NEED_MORE_INFO: 0,
				QUALIFIED: 0,
				CALL_SCHEDULED: 0,
				PROPOSAL_SENT: 0,
				WON: 0,
				CLOSED: 0,
			},
		});
	});
	it('distinguishes an empty inbox from filtered results', async () => {
		render(await Page({ searchParams: Promise.resolve({}) }));
		expect(screen.getByText('Chưa có lời nhắn nào')).toBeInTheDocument();
	});
	it('offers filter reset when nothing matches', async () => {
		render(await Page({ searchParams: Promise.resolve({ status: 'NEW', search: 'Không có' }) }));
		expect(screen.getByText('Không tìm thấy liên hệ phù hợp')).toBeInTheDocument();
		expect(
			screen
				.getAllByRole('link', { name: 'Xóa bộ lọc' })
				.every((link) => link.getAttribute('href') === '/admin/inquiries'),
		).toBe(true);
	});
	it('clamps a page past the end back into the filtered list', async () => {
		list.mockResolvedValue({ items: [], total: 24, totalPages: 2, page: 99, limit: 20 });
		await expect(
			Page({ searchParams: Promise.resolve({ page: '99', status: 'NEW' }) }),
		).rejects.toThrow('redirect:/admin/inquiries?page=2&status=NEW');
	});
	it('offers the first page without dropping filters when the current page is empty', async () => {
		list.mockResolvedValue({ items: [], total: 24, totalPages: 2, page: 2, limit: 20 });
		render(await Page({ searchParams: Promise.resolve({ page: '2', status: 'NEW' }) }));
		expect(screen.getByText('Trang này không còn liên hệ')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Về trang đầu' })).toHaveAttribute(
			'href',
			'/admin/inquiries?status=NEW',
		);
	});
	it('preserves supported filters on both desktop and mobile detail links', async () => {
		list.mockResolvedValue({
			items: [
				{
					id: 'contact-1',
					name: 'Liên hệ kiểm thử',
					email: 'test@example.test',
					status: 'NEW',
					inquiryType: 'ai',
					context: 'Cần trao đổi về chương trình.',
					adminEmailStatus: 'sent',
					createdAt: '2026-09-30T00:00:00Z',
				},
			],
			total: 21,
			totalPages: 2,
			page: 2,
			limit: 20,
		});
		render(
			await Page({ searchParams: Promise.resolve({ page: '2', status: 'NEW', search: 'A&B' }) }),
		);
		const links = screen.getAllByRole('link', { name: 'Liên hệ kiểm thử' });
		expect(links).toHaveLength(2);
		for (const link of links)
			expect(link).toHaveAttribute(
				'href',
				'/admin/inquiries/contact-1?page=2&status=NEW&search=A%26B',
			);
		expect(screen.getByText('Hiển thị 21–21 trong 21 liên hệ')).toBeInTheDocument();
		expect(screen.getByText('Cần trao đổi về chương trình.')).toBeInTheDocument();
	});
	it('rejects unsupported filters and invalid page values before querying', async () => {
		render(
			await Page({
				searchParams: Promise.resolve({
					page: 'Infinity',
					status: 'invalid',
					inquiryType: 'invalid',
				}),
			}),
		);
		expect(list).toHaveBeenCalledWith({
			page: 1,
			limit: 20,
			status: undefined,
			inquiryType: undefined,
			search: undefined,
		});
	});
	it('lists only stages that have inquiries, plus Mới and the selected stage', async () => {
		counts.mockResolvedValue({
			all: 5,
			byStatus: {
				NEW: 0,
				REVIEWING: 3,
				NEED_MORE_INFO: 0,
				QUALIFIED: 0,
				CALL_SCHEDULED: 0,
				PROPOSAL_SENT: 0,
				WON: 0,
				CLOSED: 2,
			},
		});
		render(await Page({ searchParams: Promise.resolve({ status: 'WON' }) }));
		const chips = screen.getByRole('navigation', { name: 'Lọc theo trạng thái' });
		const names = Array.from(chips.querySelectorAll('a')).map((link) => link.textContent);
		expect(names).toEqual(['Tất cả5', 'Mới0', 'Đang xem3', 'Đã nhận công việc0', 'Đã đóng2']);
	});
	it('shows and lets the admin remove the failed-notification filter', async () => {
		render(await Page({ searchParams: Promise.resolve({ notice: 'failed', status: 'NEW' }) }));
		expect(screen.getByText('Chỉ hiện liên hệ có thông báo gửi lỗi')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Bỏ lọc này' })).toHaveAttribute(
			'href',
			'/admin/inquiries?status=NEW',
		);
		expect(counts).toHaveBeenCalledWith({
			search: undefined,
			inquiryType: undefined,
			failedNotification: true,
		});
	});
});
