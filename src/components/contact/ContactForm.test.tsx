import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ContactForm, { ContactFormFromUrl } from './ContactForm';

const session = vi.hoisted(() => ({
	data: null as null | {
		user: { name?: string | null; email?: string | null };
	},
	status: 'unauthenticated' as 'loading' | 'authenticated' | 'unauthenticated',
}));
const navigation = vi.hoisted(() => ({
	searchParams: new URLSearchParams(),
}));

vi.mock('next-auth/react', () => ({
	useSession: () => session,
}));
vi.mock('next/navigation', () => ({
	useSearchParams: () => navigation.searchParams,
}));

describe('ContactForm', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		session.data = null;
		session.status = 'unauthenticated';
		navigation.searchParams = new URLSearchParams();
	});

	it('renders the concise Vietnamese fields for a guest', () => {
		render(<ContactForm formEnabled />);

		expect(screen.getByLabelText('Họ và tên')).toBeInTheDocument();
		expect(screen.getByLabelText('Email nhận phản hồi')).toBeRequired();
		expect(screen.getByLabelText('Chủ đề')).toHaveValue('unsure');
		expect(screen.getByLabelText('Bạn muốn trao đổi điều gì?')).toBeInTheDocument();
		expect(screen.getByLabelText('Thời điểm bạn mong muốn (không bắt buộc)')).toBeInTheDocument();
		expect(
			screen.getByText('Vui lòng nhập email bạn thường dùng để tôi có thể liên lạc.'),
		).toBeInTheDocument();
		expect(screen.queryByLabelText(/Ngân sách/i)).not.toBeInTheDocument();
	});

	it('reuses the same form with context from the direct contact URL', () => {
		navigation.searchParams = new URLSearchParams(
			'type=learning-design&sourcePage=%2Fhoc&course=facilitation&utm_source=newsletter',
		);
		render(<ContactFormFromUrl formEnabled />);

		expect(screen.getByLabelText('Chủ đề')).toHaveValue('learning-design');
		expect(screen.getByLabelText('Bạn muốn trao đổi điều gì?')).toBeInTheDocument();
	});

	it('submits the direct context and shows a clear confirmation', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ ok: true, data: { accepted: true } }),
		});
		vi.stubGlobal('fetch', fetchMock);
		const user = userEvent.setup();
		render(
			<ContactForm
				formEnabled
				contactContext={{
					inquiryType: 'training',
					sourcePage: '/gioi-thieu',
					sourceCourseSlug: 'leadership-101',
					campaignParams: { ref: 'about' },
				}}
			/>,
		);

		await user.type(screen.getByLabelText('Họ và tên'), 'Nguyễn Văn A');
		await user.type(screen.getByLabelText('Email nhận phản hồi'), 'a@example.com');
		await user.type(
			screen.getByLabelText('Bạn muốn trao đổi điều gì?'),
			'Tôi muốn trao đổi về một lớp học.',
		);
		await user.click(screen.getByRole('checkbox'));
		await user.click(screen.getByRole('button', { name: 'Gửi lời nhắn' }));

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
		const payload = JSON.parse(String(request.body));
		expect(payload).toMatchObject({
			name: 'Nguyễn Văn A',
			email: 'a@example.com',
			inquiryType: 'training',
			context: 'Tôi muốn trao đổi về một lớp học.',
			sourcePage: '/gioi-thieu',
			sourceCourseSlug: 'leadership-101',
			campaignParams: { ref: 'about' },
			agreedPrivacy: true,
		});
		expect(await screen.findByText('Lời nhắn đã được gửi.')).toBeInTheDocument();
	});

	it('prefills an account and prevents changing its reply email', async () => {
		session.data = { user: { name: 'Nguyễn An', email: 'account@example.com' } };
		session.status = 'authenticated';
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ ok: true }),
		});
		vi.stubGlobal('fetch', fetchMock);
		const user = userEvent.setup();
		render(<ContactForm formEnabled />);

		const name = await screen.findByLabelText('Họ và tên');
		const email = screen.getByLabelText('Email nhận phản hồi');
		expect(name).toHaveValue('Nguyễn An');
		expect(email).toHaveValue('account@example.com');
		expect(email).toHaveAttribute('readonly');
		expect(screen.getByText('Tôi sẽ phản hồi vào email của tài khoản này.')).toBeInTheDocument();

		await user.clear(name);
		await user.type(name, 'Tên tôi muốn dùng');
		await user.type(screen.getByLabelText('Bạn muốn trao đổi điều gì?'), 'Một lời nhắn đủ dài.');
		await user.click(screen.getByRole('checkbox'));
		await user.click(screen.getByRole('button', { name: 'Gửi lời nhắn' }));

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		const payload = JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit).body));
		expect(payload.email).toBe('account@example.com');
		expect(payload.name).toBe('Tên tôi muốn dùng');
	});

	it('does not allow submission while the session is loading', () => {
		session.status = 'loading';
		render(<ContactForm formEnabled />);

		expect(screen.getByRole('button', { name: 'Đang kiểm tra tài khoản…' })).toBeDisabled();
	});

	it('explains invalid guest fields before making a request', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		const user = userEvent.setup();
		render(<ContactForm formEnabled />);

		await user.type(screen.getByLabelText('Họ và tên'), 'Nguyễn An');
		await user.type(screen.getByLabelText('Email nhận phản hồi'), 'email-sai');
		await user.click(screen.getByRole('button', { name: 'Gửi lời nhắn' }));

		expect(
			await screen.findByText('Vui lòng nhập email hợp lệ để tôi có thể phản hồi.'),
		).toBeInTheDocument();
		expect(
			screen.getByText('Vui lòng chia sẻ vài dòng về điều bạn muốn trao đổi.'),
		).toBeInTheDocument();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('uses a natural Vietnamese message instead of exposing a generic server error', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				json: async () => ({ ok: false, error: 'Internal server error' }),
			}),
		);
		const user = userEvent.setup();
		render(<ContactForm formEnabled />);

		await user.type(screen.getByLabelText('Họ và tên'), 'Nguyễn An');
		await user.type(screen.getByLabelText('Email nhận phản hồi'), 'an@example.com');
		await user.type(screen.getByLabelText('Bạn muốn trao đổi điều gì?'), 'Tôi muốn hỏi thêm.');
		await user.click(screen.getByRole('checkbox'));
		await user.click(screen.getByRole('button', { name: 'Gửi lời nhắn' }));

		expect(
			await screen.findByText(
				'Máy chủ chưa thể nhận lời nhắn lúc này. Vui lòng thử lại sau ít phút.',
			),
		).toBeInTheDocument();
		expect(screen.queryByText('Internal server error')).not.toBeInTheDocument();
	});
});
