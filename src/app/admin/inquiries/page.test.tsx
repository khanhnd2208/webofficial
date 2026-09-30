import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Page from './page';
const list = vi.hoisted(() => vi.fn());
vi.mock('@/services/inquiryService', () => ({ listInquiries: list }));
describe('inbox page', () => {
	beforeEach(() => {
		list.mockReset();
		list.mockResolvedValue({ items: [], total: 0, totalPages: 1 });
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
	it('offers the first page without dropping filters when a page is exhausted', async () => {
		list.mockResolvedValue({ items: [], total: 24, totalPages: 2 });
		render(await Page({ searchParams: Promise.resolve({ page: '99', status: 'NEW' }) }));
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
					adminEmailStatus: 'sent',
					createdAt: '2026-09-30T00:00:00Z',
				},
			],
			total: 21,
			totalPages: 2,
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
		expect(
			screen.getByText('Hiển thị 21–21 trong 21 liên hệ · 1 mới trên trang này'),
		).toBeInTheDocument();
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
});
