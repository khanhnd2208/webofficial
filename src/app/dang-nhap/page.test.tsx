import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage from './page';
import SwitchAccountButton from './switch-account-button';

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	start: vi.fn(),
	signOut: vi.fn(),
	redirect: vi.fn(),
	session: vi.fn(),
}));
vi.mock('next-auth/react', () => ({ useSession: mocks.session }));
vi.mock('@/lib/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/auth/startGoogleSignIn', () => ({ startGoogleSignIn: mocks.start }));
vi.mock('@/lib/auth/signOutTo', () => ({ signOutTo: mocks.signOut }));
vi.mock('next/headers', () => ({
	headers: async () => new Headers({ host: 'localhost' }),
	cookies: async () => ({ get: () => undefined }),
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

beforeEach(() => {
	vi.clearAllMocks();
	mocks.auth.mockResolvedValue(null);
	mocks.session.mockReturnValue({ status: 'authenticated' });
	mocks.start.mockResolvedValue(undefined);
	vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Chrome/123');
});

async function show(params: { from?: string; error?: string; chon?: string } = {}) {
	render(await LoginPage({ searchParams: Promise.resolve(params) }));
}

describe('login page', () => {
	it('offers the compact Google flow and a safe return link', async () => {
		await show({ from: '/khoa-hoc/ai50' });
		expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
		expect(screen.getByTestId('login-back')).toHaveAttribute('href', '/muc-luc');
		expect(screen.getByText(/Chỉ dùng tên và email Google/)).toBeVisible();
		fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục với Google' }));
		await waitFor(() =>
			expect(mocks.start).toHaveBeenCalledWith('/khoa-hoc/ai50', { chooseAccount: false }),
		);
	});
	it('leaves an auth error visible with a retry button', async () => {
		await show({ error: 'OAuthCallbackError', from: '/gioi-thieu' });
		expect(screen.getByRole('alert')).toHaveTextContent('Không đăng nhập được');
		expect(screen.getByRole('button', { name: 'Tiếp tục với Google' })).toBeEnabled();
		expect(mocks.start).not.toHaveBeenCalled();
	});
	it('chooses an account when explicitly requested', async () => {
		await show({ chon: '1', from: '/tai-khoan' });
		fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục với Google' }));
		await waitFor(() =>
			expect(mocks.start).toHaveBeenCalledWith('/tai-khoan', { chooseAccount: true }),
		);
	});
	it('shows a directly opened signed-in page and switches accounts at the same destination', async () => {
		mocks.auth.mockResolvedValue({ user: { email: 'teacher@example.com', role: 'admin' } });
		await show();
		expect(screen.getByTestId('login-signed-in')).toHaveTextContent(
			'teacher@example.com với quyền admin',
		);
		expect(screen.getByTestId('login-continue')).toHaveAttribute('href', '/muc-luc');
		expect(screen.queryByRole('button', { name: 'Tiếp tục với Google' })).toBeNull();
		fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất để dùng tài khoản khác' }));
		expect(mocks.signOut).toHaveBeenCalledWith('/dang-nhap?from=%2F&chon=1');
	});
	it('returns a signed-in user to an explicit destination', async () => {
		mocks.auth.mockResolvedValue({ user: { email: 'student@example.com', role: 'student' } });
		mocks.redirect.mockImplementationOnce(() => {
			throw new Error('NEXT_REDIRECT');
		});
		await expect(
			LoginPage({ searchParams: Promise.resolve({ from: '/gioi-thieu' }) }),
		).rejects.toThrow('NEXT_REDIRECT');
		expect(mocks.redirect).toHaveBeenCalledWith('/gioi-thieu');
	});
	it('permits retry after a network failure and resets after browser Back', async () => {
		mocks.start.mockRejectedValueOnce(new Error('Network'));
		await show();
		fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục với Google' }));
		await waitFor(() =>
			expect(screen.getByRole('alert')).toHaveTextContent('Không mở được Google'),
		);
		fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục với Google' }));
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Đang mở Google…' })).toBeDisabled(),
		);
		const event = new Event('pageshow');
		Object.defineProperty(event, 'persisted', { value: true });
		fireEvent(window, event);
		expect(screen.getByRole('button', { name: 'Tiếp tục với Google' })).toBeEnabled();
	});
	it('waits for the browser session to initialize before allowing account switching', () => {
		mocks.session.mockReturnValue({ status: 'loading' });
		render(<SwitchAccountButton loginHref="/dang-nhap" />);
		expect(screen.getByRole('button')).toBeDisabled();
	});
	it('can add the account choice to a bare login URL', () => {
		render(<SwitchAccountButton loginHref="/dang-nhap" />);
		fireEvent.click(screen.getByRole('button'));
		expect(mocks.signOut).toHaveBeenCalledWith('/dang-nhap?chon=1');
	});
});
