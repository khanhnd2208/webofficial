import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COVER_ATMOSPHERE_STORAGE_KEY } from './cover/coverAtmosphere';
import IntroLanding from './IntroLanding';

vi.mock('./SiteAuthChip', () => ({
	default: () => <button type="button">Đăng nhập</button>,
}));

vi.mock('@/components/motion/MotionProvider', () => ({
	useMotionTier: () => ({
		tier: 'reduced',
		reduced: true,
		allowsAmbient: false,
		allowsReveal: false,
	}),
}));

class ResizeObserverStub {
	observe() {}
	disconnect() {}
}

describe('IntroLanding', () => {
	let desktopMatch = true;

	beforeEach(() => {
		desktopMatch = true;
		vi.stubGlobal('ResizeObserver', ResizeObserverStub);
		vi.stubGlobal(
			'matchMedia',
			vi.fn().mockImplementation((query: string) => ({
				matches: query.includes('1024px') ? desktopMatch : false,
				media: query,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			})),
		);
		delete document.documentElement.dataset.coverAtmosphere;
		window.sessionStorage.clear();
		window.history.replaceState({}, '', '/?mode=dawn');
	});

	afterEach(() => {
		delete document.documentElement.dataset.coverAtmosphere;
		vi.unstubAllGlobals();
	});

	it('renders the canonical book-cover copy, colophon, TOC link, and atmosphere toggle', () => {
		render(<IntroLanding />);

		expect(screen.getByText('Nguyễn Duy Khánh')).toBeInTheDocument();
		expect(screen.getByText('Hà Nội · 2026')).toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 1, name: 'Trở thành' })).toBeInTheDocument();
		expect(screen.getByTestId('intro-open-toc')).toHaveAttribute('href', '/muc-luc');
		expect(screen.getByTestId('intro-home')).toHaveAttribute('data-atmosphere', 'dawn');
		expect(screen.getByTestId('cover-atmosphere-toggle')).toHaveTextContent('Đón đêm sao');
	});

	it('honors pre-paint html[data-cover-atmosphere] without flash and cleans up on unmount', () => {
		document.documentElement.dataset.coverAtmosphere = 'night';
		const { unmount } = render(<IntroLanding />);

		expect(screen.getByTestId('intro-home')).toHaveAttribute('data-atmosphere', 'night');
		expect(screen.getByTestId('cover-atmosphere-toggle')).toHaveTextContent('Đón nắng sớm');

		unmount();
		expect(document.documentElement.dataset.coverAtmosphere).toBeUndefined();
	});

	it('toggles between Dawn and Night and remembers the visitor choice in sessionStorage', () => {
		render(<IntroLanding />);

		const toggle = screen.getByTestId('cover-atmosphere-toggle');
		fireEvent.click(toggle);

		expect(screen.getByTestId('intro-home')).toHaveAttribute('data-atmosphere', 'night');
		expect(toggle).toHaveTextContent('Đón nắng sớm');
		expect(window.sessionStorage.getItem(COVER_ATMOSPHERE_STORAGE_KEY)).toBe('night');

		fireEvent.click(toggle);
		expect(screen.getByTestId('intro-home')).toHaveAttribute('data-atmosphere', 'dawn');
		expect(window.sessionStorage.getItem(COVER_ATMOSPHERE_STORAGE_KEY)).toBe('dawn');

		// Rapid consecutive clicks never drop state updates (6 clicks from dawn -> dawn)
		for (let i = 0; i < 6; i += 1) {
			fireEvent.click(toggle);
		}
		expect(screen.getByTestId('intro-home')).toHaveAttribute('data-atmosphere', 'dawn');
	});

	it('unfolds sincere author marginalia whispers from [động từ] and closes via Escape or close button', () => {
		render(<IntroLanding />);

		expect(screen.queryByTestId('cover-author-whisper')).not.toBeInTheDocument();

		const posTrigger = screen.getByRole('button', { name: '[động từ]' });
		fireEvent.click(posTrigger);

		expect(screen.getByTestId('intro-home')).toHaveAttribute('data-whisper-open', 'true');
		const whisper = screen.getByTestId('cover-author-whisper');
		expect(whisper).toHaveTextContent('Tôi vẫn đang học cách trở thành một người thầy tốt hơn.');

		fireEvent.keyDown(document, { key: 'Escape' });
		expect(screen.queryByTestId('cover-author-whisper')).not.toBeInTheDocument();
		expect(screen.getByTestId('intro-home')).not.toHaveAttribute('data-whisper-open');
	});

	it('docks marginalia notes cleanly beneath the artwork on mobile viewports', () => {
		desktopMatch = false;
		render(<IntroLanding />);

		const journeySummary = screen.getByLabelText('Ghi chú về con đường phía trước');
		const details = journeySummary.closest('details') as HTMLDetailsElement;
		details.open = true;
		fireEvent(details, new Event('toggle'));

		const docked = screen.getByTestId('cover-docked-note');
		expect(docked).toHaveTextContent('Những khóa học và lớp học đang mở.');
		expect(docked.querySelector('a')).toHaveAttribute('href', '/khoa-hoc');

		fireEvent.click(screen.getByRole('button', { name: 'Đóng ghi chú' }));
		expect(screen.queryByTestId('cover-docked-note')).not.toBeInTheDocument();
		expect(details.open).toBe(false);
	});
});
