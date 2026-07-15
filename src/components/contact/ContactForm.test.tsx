import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ContactForm from './ContactForm';

vi.mock('next/navigation', () => ({
	useSearchParams: () => new URLSearchParams('type=training&ref=about'),
}));

describe('ContactForm', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('renders only the short, conversation-first fields', () => {
		render(<ContactForm formEnabled />);

		expect(screen.getByLabelText('Họ tên')).toBeInTheDocument();
		expect(screen.getByLabelText('Email')).toBeInTheDocument();
		expect(screen.getByLabelText('Chủ đề bạn muốn trao đổi')).toHaveValue('training');
		expect(screen.getByLabelText('Đôi nét về điều bạn muốn chia sẻ')).toBeInTheDocument();
		expect(screen.getByLabelText('Thời gian phù hợp, nếu cần')).toBeInTheDocument();
		expect(screen.queryByLabelText(/Ngân sách/i)).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/Hệ quả/i)).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/Kết quả mong muốn/i)).not.toBeInTheDocument();
	});

	it('submits the minimal payload and shows a personal confirmation', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ ok: true, data: { accepted: true } }),
		});
		vi.stubGlobal('fetch', fetchMock);
		const user = userEvent.setup();
		render(<ContactForm formEnabled />);

		await user.type(screen.getByLabelText('Họ tên'), 'Nguyễn Văn A');
		await user.type(screen.getByLabelText('Email'), 'a@example.com');
		await user.type(
			screen.getByLabelText('Đôi nét về điều bạn muốn chia sẻ'),
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
			agreedPrivacy: true,
		});
		expect(payload).not.toHaveProperty('agreedScope');
		expect(payload).not.toHaveProperty('budgetOptional');
		expect(await screen.findByText('Khánh đã nhận được lời nhắn')).toBeInTheDocument();
	});
});
