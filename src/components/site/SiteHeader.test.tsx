import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SiteHeader from './SiteHeader';

const pathname = vi.hoisted(() => ({ current: '/gioi-thieu' }));
const observer = vi.hoisted(() => ({
	callback: null as ((entries: Array<{ isIntersecting: boolean }>) => void) | null,
}));

vi.mock('next/navigation', () => ({
	usePathname: () => pathname.current,
	useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('next-auth/react', () => ({
	useSession: () => ({ data: null, status: 'unauthenticated' }),
}));
vi.mock('@/lib/auth/startGoogleSignIn', () => ({ startGoogleSignIn: vi.fn() }));

beforeEach(() => {
	pathname.current = '/gioi-thieu';
	observer.callback = null;
	vi.stubGlobal(
		'IntersectionObserver',
		class {
			constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
				observer.callback = callback;
			}
			observe() {}
			unobserve() {}
			disconnect() {}
			takeRecords() {
				return [];
			}
		},
	);
});

describe('SiteHeader', () => {
	it('renders the trail and marks the current page', () => {
		render(<SiteHeader />);
		expect(screen.getByTestId('site-header-home')).toHaveAttribute('href', '/muc-luc');
		expect(screen.getByRole('navigation', { name: 'Đường dẫn' })).toBeVisible();
		expect(screen.getByText('Giới thiệu')).toHaveAttribute('aria-current', 'page');
		const contact = screen.getByTestId('site-header-contact');
		expect(contact).toHaveTextContent('Nhắn tin');
		expect(contact).toHaveTextContent('Gửi lời nhắn');
	});

	it('links a detail page back to its parent and does not mark that parent as current', () => {
		pathname.current = '/my-space/board-game';
		render(<SiteHeader />);
		expect(screen.getByRole('link', { name: 'Không gian của tôi' })).toHaveAttribute(
			'href',
			'/my-space',
		);
		expect(screen.getByText('Board Game')).toHaveAttribute('aria-current', 'page');
	});

	it('hides the contact action on the contact page', () => {
		pathname.current = '/lien-he';
		render(<SiteHeader />);
		expect(screen.queryByTestId('site-header-contact')).toBeNull();
		expect(screen.getByText('Liên hệ')).toHaveAttribute('aria-current', 'page');
	});

	it.each(['/khoa-hoc', '/kham-pha-khoa-hoc'])(
		'keeps the public course header and trail at %s',
		(path) => {
			pathname.current = path;
			render(<SiteHeader />);
			expect(screen.getByTestId('site-header-home')).toHaveAttribute('href', '/muc-luc');
			expect(screen.getByText('Khóa học')).toHaveAttribute('aria-current', 'page');
		},
	);

	it('renders nothing on the intro', () => {
		pathname.current = '/';
		render(<SiteHeader />);
		expect(screen.queryByTestId('site-header')).toBeNull();
	});

	it('turns the bar to glass once the sentinel leaves the viewport', () => {
		render(<SiteHeader />);
		expect(screen.getByTestId('site-header')).toHaveAttribute('data-scrolled', 'false');
		act(() => {
			observer.callback?.([{ isIntersecting: false }]);
		});
		expect(screen.getByTestId('site-header')).toHaveAttribute('data-scrolled', 'true');
	});
});
