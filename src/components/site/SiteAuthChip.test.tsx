import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SiteAuthChip from './SiteAuthChip';

const mocks = vi.hoisted(() => ({ start: vi.fn(), push: vi.fn(), session: vi.fn() }));
vi.mock('next/navigation', () => ({
	usePathname: () => '/lien-he',
	useRouter: () => ({ push: mocks.push }),
}));
vi.mock('next-auth/react', () => ({ useSession: mocks.session }));
vi.mock('@/lib/auth/startGoogleSignIn', () => ({ startGoogleSignIn: mocks.start }));

beforeEach(() => {
	vi.clearAllMocks();
	mocks.session.mockReturnValue({ data: null, status: 'unauthenticated' });
	mocks.start.mockResolvedValue(undefined);
	window.history.replaceState({}, '', '/lien-he?ref=class#form');
	window.sessionStorage.clear();
	vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Chrome/123');
});

describe('SiteAuthChip sign-in', () => {
	it('starts Google directly with the live location and saves the scroll position', async () => {
		render(<SiteAuthChip />);
		fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
		await waitFor(() => expect(mocks.start).toHaveBeenCalledWith('/lien-he?ref=class#form'));
		expect(JSON.parse(sessionStorage.getItem('auth:return-position')!)).toMatchObject({
			path: '/lien-he?ref=class',
			y: 0,
		});
		expect(screen.getByRole('button', { name: 'Đang mở Google…' })).toBeDisabled();
		expect(mocks.push).not.toHaveBeenCalled();
	});
	it('sends embedded browsers to the page with opening instructions', () => {
		vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Zalo/123');
		render(<SiteAuthChip />);
		fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
		expect(mocks.start).not.toHaveBeenCalled();
		expect(mocks.push).toHaveBeenCalledWith('/dang-nhap?from=%2Flien-he%3Fref%3Dclass%23form');
	});
	it('resets a waiting button when restored from the browser cache', async () => {
		render(<SiteAuthChip />);
		fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
		await act(async () => {});
		const event = new Event('pageshow');
		Object.defineProperty(event, 'persisted', { value: true });
		fireEvent(window, event);
		expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeEnabled();
	});
	it('falls back to the login page when starting Google fails', async () => {
		mocks.start.mockRejectedValue(new Error('Network unavailable'));
		render(<SiteAuthChip />);
		fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
		await waitFor(() => expect(mocks.push).toHaveBeenCalled());
		expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeEnabled();
	});
	it('does not flash sign-in while loading, or offer it in a game room', () => {
		mocks.session.mockReturnValue({ data: null, status: 'loading' });
		const { rerender } = render(<SiteAuthChip />);
		expect(screen.queryByRole('button')).toBeNull();
		mocks.session.mockReturnValue({ data: null, status: 'unauthenticated' });
		rerender(<SiteAuthChip showSignIn={false} />);
		expect(screen.queryByTestId('site-auth-chip')).toBeNull();
	});
});
