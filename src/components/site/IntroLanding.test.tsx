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
	beforeEach(() => {
		vi.stubGlobal('ResizeObserver', ResizeObserverStub);
		vi.stubGlobal(
			'matchMedia',
			vi.fn().mockImplementation((query: string) => ({
				matches: query.includes('1024px'),
				media: query,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			})),
		);
		window.sessionStorage.clear();
		window.history.replaceState({}, '', '/?mode=dawn');
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('renders the canonical book-cover copy, primary TOC link, and atmosphere toggle', () => {
		render(<IntroLanding />);

		expect(screen.getByText('Nguyễn Duy Khánh')).toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 1, name: 'Trở thành' })).toBeInTheDocument();
		expect(screen.getByTestId('intro-open-toc')).toHaveAttribute('href', '/muc-luc');
		expect(screen.getByTestId('intro-home')).toHaveAttribute('data-atmosphere', 'dawn');
		expect(screen.getByTestId('cover-atmosphere-toggle')).toHaveTextContent('Chạm để gọi đêm sao');
	});

	it('toggles between Dawn and Night and remembers the visitor choice in sessionStorage', () => {
		render(<IntroLanding />);

		const toggle = screen.getByTestId('cover-atmosphere-toggle');
		fireEvent.click(toggle);

		expect(screen.getByTestId('intro-home')).toHaveAttribute('data-atmosphere', 'night');
		expect(toggle).toHaveTextContent('Chạm để gọi bình minh');
		expect(window.sessionStorage.getItem(COVER_ATMOSPHERE_STORAGE_KEY)).toBe('night');

		fireEvent.click(toggle);
		expect(screen.getByTestId('intro-home')).toHaveAttribute('data-atmosphere', 'dawn');
		expect(window.sessionStorage.getItem(COVER_ATMOSPHERE_STORAGE_KEY)).toBe('dawn');
	});

	it('unfolds sincere author marginalia whispers on demand and closes them on Escape', () => {
		render(<IntroLanding />);

		expect(screen.queryByTestId('cover-author-whisper')).not.toBeInTheDocument();

		const posTrigger = screen.getByRole('button', { name: '[động từ]' });
		fireEvent.click(posTrigger);

		const whisper = screen.getByTestId('cover-author-whisper');
		expect(whisper).toHaveTextContent('Tôi vẫn đang học cách trở thành một người thầy tốt hơn.');

		fireEvent.keyDown(document, { key: 'Escape' });
		expect(screen.queryByTestId('cover-author-whisper')).not.toBeInTheDocument();
	});

	it('exposes both bookplate marginalia links and closes an open note on Escape', () => {
		render(<IntroLanding />);

		const personSummary = screen.getByLabelText('Ghi chú về người trong tranh');
		const details = personSummary.closest('details') as HTMLDetailsElement;
		details.open = true;
		fireEvent(details, new Event('toggle'));

		expect(screen.getByRole('link', { name: /Về tôi/ })).toHaveAttribute('href', '/lien-he');
		expect(screen.getByRole('link', { name: /Học tập/ })).toHaveAttribute('href', '/khoa-hoc');

		fireEvent.keyDown(document, { key: 'Escape' });
		expect(details.open).toBe(false);
	});
});
