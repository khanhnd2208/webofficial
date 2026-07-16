import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ContactLink from './ContactLink';
import { ContactDialogProvider } from './ContactDialogProvider';

vi.mock('next-auth/react', () => ({
	useSession: () => ({ data: null, status: 'unauthenticated' }),
}));
vi.mock('next/navigation', () => ({
	usePathname: () => window.location.pathname,
	useSearchParams: () => new URLSearchParams(window.location.search),
}));

describe('ContactDialogProvider', () => {
	beforeEach(() => {
		window.history.replaceState({}, '', '/');
		Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
			configurable: true,
			value(this: HTMLDialogElement) {
				this.setAttribute('open', '');
			},
		});
		Object.defineProperty(HTMLDialogElement.prototype, 'close', {
			configurable: true,
			value(this: HTMLDialogElement) {
				this.removeAttribute('open');
				this.dispatchEvent(new Event('close'));
			},
		});
	});

	it('keeps a semantic fallback href and intercepts only a plain primary click', async () => {
		render(
			<ContactDialogProvider availability={{ enabled: true }}>
				<ContactLink contactContext={{ inquiryType: 'training', sourcePage: '/gioi-thieu' }}>
					Gửi lời nhắn
				</ContactLink>
				<ContactLink target="_blank">Mở trang liên hệ</ContactLink>
			</ContactDialogProvider>,
		);

		const link = screen.getByRole('link', { name: 'Gửi lời nhắn' });
		const fallbackUrl = new URL(link.getAttribute('href')!, 'https://example.com');
		expect(fallbackUrl.pathname).toBe('/lien-he');
		expect(fallbackUrl.searchParams.get('type')).toBe('training');
		expect(fallbackUrl.searchParams.get('sourcePage')).toBe('/gioi-thieu');

		fireEvent.click(screen.getByRole('link', { name: 'Mở trang liên hệ' }));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		const preventBrowserNavigation = (event: MouseEvent) => event.preventDefault();
		window.addEventListener('click', preventBrowserNavigation);
		fireEvent.click(link, { button: 0, ctrlKey: true });
		window.removeEventListener('click', preventBrowserNavigation);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

		await userEvent.click(link);
		expect(await screen.findByRole('dialog')).toBeInTheDocument();
		expect(screen.getByLabelText('Chủ đề')).toHaveValue('training');
		expect(document.body.style.overflow).toBe('hidden');

		await userEvent.click(screen.getByRole('button', { name: 'Đóng' }));
		expect(document.body.style.overflow).toBe('');
	});

	it('keeps a draft across close/reopen, then clears it after a successful send and close', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ ok: true }),
		});
		vi.stubGlobal('fetch', fetchMock);
		const user = userEvent.setup();
		render(
			<ContactDialogProvider availability={{ enabled: true }}>
				<ContactLink contactContext={{ sourcePage: '/bai-viet' }}>Gửi lời nhắn</ContactLink>
			</ContactDialogProvider>,
		);

		await user.click(screen.getByRole('link', { name: 'Gửi lời nhắn' }));
		await user.type(screen.getByLabelText('Họ và tên'), 'Nguyễn An');
		await user.type(screen.getByLabelText('Email nhận phản hồi'), 'an@example.com');
		await user.type(screen.getByLabelText('Bạn muốn trao đổi điều gì?'), 'Nội dung bản nháp.');
		await user.click(screen.getByRole('button', { name: 'Đóng' }));

		await user.click(screen.getByRole('link', { name: 'Gửi lời nhắn' }));
		expect(screen.getByLabelText('Họ và tên')).toHaveValue('Nguyễn An');
		expect(screen.getByLabelText('Bạn muốn trao đổi điều gì?')).toHaveValue('Nội dung bản nháp.');

		await user.click(screen.getByRole('checkbox'));
		await user.click(screen.getByRole('button', { name: 'Gửi lời nhắn' }));
		expect(await screen.findByText('Lời nhắn đã được gửi.')).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: /Về trang chủ/i })).not.toBeInTheDocument();
		expect(document.body.style.overflow).toBe('hidden');
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		await user.click(screen.getByRole('button', { name: 'Đóng' }));

		await user.click(screen.getByRole('link', { name: 'Gửi lời nhắn' }));
		expect(screen.getByLabelText('Họ và tên')).toHaveValue('');
		expect(screen.getByLabelText('Bạn muốn trao đổi điều gì?')).toHaveValue('');
	});

	it('keeps the current source and campaign in the real href used by a new tab', async () => {
		window.history.replaceState(
			{},
			'',
			'/bai-viet?utm_source=ban-tin&gclid=google-click&fbclid=facebook-click',
		);
		render(
			<ContactDialogProvider availability={{ enabled: true }}>
				<ContactLink target="_blank">Mở trang liên hệ</ContactLink>
			</ContactDialogProvider>,
		);

		const link = screen.getByRole('link', { name: 'Mở trang liên hệ' });
		await waitFor(() => {
			const url = new URL(link.getAttribute('href')!, window.location.origin);
			expect(url.searchParams.get('sourcePage')).toBe('/bai-viet');
			expect(url.searchParams.get('utm_source')).toBe('ban-tin');
			expect(url.searchParams.get('gclid')).toBe('google-click');
			expect(url.searchParams.get('fbclid')).toBe('facebook-click');
		});
	});

	it('closes from the backdrop and Escape while retaining the semantic trigger', async () => {
		const user = userEvent.setup();
		render(
			<ContactDialogProvider availability={{ enabled: true }}>
				<ContactLink>Gửi lời nhắn</ContactLink>
			</ContactDialogProvider>,
		);

		const trigger = screen.getByRole('link', { name: 'Gửi lời nhắn' });
		await user.click(trigger);
		fireEvent.click(screen.getByRole('dialog'));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

		await user.click(trigger);
		fireEvent(
			screen.getByRole('dialog'),
			new Event('cancel', { bubbles: true, cancelable: true }),
		);
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});
});
