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

		const name = screen.getByLabelText('Tên');
		const email = screen.getByLabelText('Email');
		expect(name).toBeInTheDocument();
		expect(name).toHaveValue('');
		expect(email).toBeRequired();
		expect(email).toHaveValue('');
		expect(email).not.toHaveAttribute('readonly');
		expect(screen.getByLabelText('Bạn muốn trao đổi về điều gì?')).toHaveValue('training');
		expect(
			screen.getByLabelText('Bối cảnh hoặc điều đang khiến bạn băn khoăn'),
		).toBeInTheDocument();
		expect(screen.getByLabelText(/Kết quả bạn mong muốn/)).toBeInTheDocument();
		expect(screen.getByLabelText(/Thời gian dự kiến/)).toBeInTheDocument();
		expect(screen.getByText('Email bạn thường dùng để nhận phản hồi.')).toBeInTheDocument();
		expect(screen.queryByLabelText(/Ngân sách/i)).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/Tổ chức/)).not.toBeInTheDocument();
	});

	it('keeps guest name and email empty when the app has no session data', () => {
		session.data = null;
		session.status = 'unauthenticated';
		render(<ContactForm formEnabled />);

		expect(screen.getByLabelText('Tên')).toHaveValue('');
		expect(screen.getByLabelText('Email')).toHaveValue('');
		expect(
			screen.queryByText('Tôi sẽ phản hồi vào email của tài khoản này.'),
		).not.toBeInTheDocument();
	});

	it('reuses the same form with context from the direct contact URL', () => {
		navigation.searchParams = new URLSearchParams(
			'type=learning-design&sourcePage=%2Fhoc&course=facilitation&utm_source=newsletter',
		);
		render(<ContactFormFromUrl formEnabled />);

		expect(screen.getByLabelText('Bạn muốn trao đổi về điều gì?')).toHaveValue('learning-design');
		expect(
			screen.getByLabelText('Bối cảnh hoặc điều đang khiến bạn băn khoăn'),
		).toBeInTheDocument();
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

		await user.type(screen.getByLabelText('Tên'), 'Nguyễn Văn A');
		await user.type(screen.getByLabelText('Email'), 'a@example.com');
		await user.type(
			screen.getByLabelText('Bối cảnh hoặc điều đang khiến bạn băn khoăn'),
			'Tôi muốn trao đổi về một lớp học.',
		);
		await user.type(screen.getByLabelText(/Kết quả bạn mong muốn/), 'Hiểu rõ bước tiếp theo.');
		await user.selectOptions(screen.getByLabelText(/Thời gian dự kiến/), '1-3-months');
		await user.click(screen.getByRole('checkbox'));
		await user.click(screen.getByRole('button', { name: 'Gửi lời nhắn' }));

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
		const payload = JSON.parse(String(request.body));
		expect(payload).toMatchObject({
			name: 'Nguyễn Văn A',
			email: 'a@example.com',
			inquiryType: 'training',
			context:
				'Tôi muốn trao đổi về một lớp học.\n\nKết quả mong muốn: Hiểu rõ bước tiếp theo.',
			sourcePage: '/gioi-thieu',
			sourceCourseSlug: 'leadership-101',
			campaignParams: { ref: 'about' },
			agreedPrivacy: true,
			timeframe: '1-3-months',
		});
		expect(await screen.findByText('Cảm ơn bạn đã chia sẻ.')).toBeInTheDocument();
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

		const name = await screen.findByLabelText('Tên');
		const email = screen.getByLabelText('Email');
		expect(name).toHaveValue('Nguyễn An');
		expect(email).toHaveValue('account@example.com');
		expect(email).toHaveAttribute('readonly');
		expect(screen.getByText('Tôi sẽ phản hồi vào email của tài khoản này.')).toBeInTheDocument();

		await user.clear(name);
		await user.type(name, 'Tên tôi muốn dùng');
		await user.type(
			screen.getByLabelText('Bối cảnh hoặc điều đang khiến bạn băn khoăn'),
			'Một lời nhắn đủ dài.',
		);
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

		expect(screen.getByRole('button', { name: 'Gửi lời nhắn' })).toBeDisabled();
		expect(screen.queryByText(/Đang kiểm tra thông tin tài khoản/i)).not.toBeInTheDocument();
	});

	it('explains invalid guest fields before making a request', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		const user = userEvent.setup();
		render(<ContactForm formEnabled />);

		await user.type(screen.getByLabelText('Tên'), 'Nguyễn An');
		await user.type(screen.getByLabelText('Email'), 'email-sai');
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

		await user.type(screen.getByLabelText('Tên'), 'Nguyễn An');
		await user.type(screen.getByLabelText('Email'), 'an@example.com');
		await user.type(
			screen.getByLabelText('Bối cảnh hoặc điều đang khiến bạn băn khoăn'),
			'Tôi muốn hỏi thêm.',
		);
		await user.click(screen.getByRole('checkbox'));
		await user.click(screen.getByRole('button', { name: 'Gửi lời nhắn' }));

		expect(
			await screen.findByText(
				'Lời nhắn chưa được gửi. Vui lòng thử lại hoặc liên hệ trực tiếp qua email.',
			),
		).toBeInTheDocument();
		expect(screen.queryByText('Internal server error')).not.toBeInTheDocument();
	});
});
