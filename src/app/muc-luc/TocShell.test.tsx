import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COVER_ATMOSPHERE_STORAGE_KEY } from '@/components/site/cover/coverAtmosphere';
import { routes } from '@/config/routes';

import TocDoors from './TocDoors';
import TocShell from './TocShell';

const push = vi.fn();

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push }),
}));

vi.mock('@/components/motion/MotionProvider', () => ({
	useMotionTier: () => ({
		tier: 'reduced',
		reduced: true,
		allowsAmbient: false,
		allowsReveal: false,
	}),
}));

describe('TocShell', () => {
	beforeEach(() => {
		push.mockReset();
		delete document.documentElement.dataset.coverAtmosphere;
		window.sessionStorage.clear();
		window.history.replaceState({}, '', '/muc-luc?mode=dawn');
	});

	afterEach(() => {
		delete document.documentElement.dataset.coverAtmosphere;
	});

	it('renders the editorial index header, cover return link, and synced atmosphere toggle', () => {
		render(
			<TocShell>
				<TocDoors />
			</TocShell>,
		);

		expect(screen.getByTestId('gate-home')).toHaveAttribute('data-atmosphere', 'dawn');
		expect(
			screen.getByRole('heading', { level: 1, name: 'Bạn muốn ghé đâu?' }),
		).toBeInTheDocument();
		expect(screen.getByTestId('toc-back-cover')).toHaveAttribute('href', routes.home);
		expect(screen.getByTestId('toc-atmosphere-toggle')).toHaveTextContent('Gọi đêm sao');
	});

	it('inherits Night atmosphere from the homepage session and toggles cleanly', () => {
		document.documentElement.dataset.coverAtmosphere = 'night';
		const { unmount } = render(
			<TocShell>
				<TocDoors />
			</TocShell>,
		);

		expect(screen.getByTestId('gate-home')).toHaveAttribute('data-atmosphere', 'night');
		const toggle = screen.getByTestId('toc-atmosphere-toggle');
		expect(toggle).toHaveTextContent('Gọi bình minh');

		fireEvent.click(toggle);
		expect(screen.getByTestId('gate-home')).toHaveAttribute('data-atmosphere', 'dawn');
		expect(window.sessionStorage.getItem(COVER_ATMOSPHERE_STORAGE_KEY)).toBe('dawn');

		unmount();
		expect(document.documentElement.dataset.coverAtmosphere).toBeUndefined();
	});

	it('navigates with keyboard shortcuts 1 and 2 when not typing in an input', () => {
		render(
			<TocShell>
				<TocDoors />
			</TocShell>,
		);

		fireEvent.keyDown(document, { key: '1' });
		expect(push).toHaveBeenCalledWith(routes.contact);

		fireEvent.keyDown(document, { key: '2' });
		expect(push).toHaveBeenCalledWith(routes.learnCourses);
	});
});
