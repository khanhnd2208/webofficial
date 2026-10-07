import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import TocDoors from './TocDoors';

const props = {
	about: {
		href: '/gioi-thieu',
		label: 'Về tôi',
		description: 'Người thầy.',
		icon: '/brand/toc/about-v1.webp',
	},
	space: { href: '/my-space', label: 'My Space', description: '2 góc nhỏ.' },
	items: [
		{
			id: 'courses',
			href: '/khoa-hoc',
			label: 'Khóa học',
			description: 'Học thêm.',
			icon: '/brand/toc/courses-v1.webp',
		},
		{
			id: 'board-game',
			href: '/my-space/board-game',
			label: 'Board Game',
			description: 'Cùng chơi.',
			icon: '/brand/toc/board-game-v1.webp',
		},
	],
};

function trigger() {
	return screen.getByTestId('toc-open-myspace');
}

describe('TocDoors', () => {
	afterEach(() => {
		window.history.replaceState(null, '', '/muc-luc');
	});

	it('starts with My Space closed and its spaces out of reach', () => {
		render(<TocDoors {...props} />);
		expect(screen.getByTestId('gate-item-about')).toHaveAttribute('href', '/gioi-thieu');
		expect(trigger()).toHaveAttribute('aria-expanded', 'false');
		expect(trigger()).toHaveAttribute('href', '/my-space');
		expect(document.getElementById('toc-myspace-panel')).toHaveAttribute('inert');
	});

	it('opens in place, records #my-space and moves focus to the first space', () => {
		render(<TocDoors {...props} />);
		fireEvent.click(trigger());
		expect(trigger()).toHaveAttribute('aria-expanded', 'true');
		expect(window.location.hash).toBe('#my-space');
		expect(document.getElementById('toc-myspace-panel')).not.toHaveAttribute('inert');
		expect(screen.getByTestId('myspace-tile-courses')).toHaveFocus();
	});

	it('closes on Escape and when the browser goes back', () => {
		render(<TocDoors {...props} />);
		fireEvent.click(trigger());
		fireEvent.keyDown(document, { key: 'Escape' });
		// Escape steps back over the pushed entry; jsdom then reports the hash change.
		act(() => {
			window.history.replaceState(null, '', '/muc-luc');
			window.dispatchEvent(new PopStateEvent('popstate'));
		});
		expect(trigger()).toHaveAttribute('aria-expanded', 'false');
		expect(trigger()).toHaveFocus();
	});

	it('opens straight away when the page loads with #my-space', () => {
		window.history.replaceState(null, '', '/muc-luc#my-space');
		render(<TocDoors {...props} />);
		expect(trigger()).toHaveAttribute('aria-expanded', 'true');
	});

	it('closes with the collapse button when the page was opened with #my-space', () => {
		window.history.replaceState(null, '', '/muc-luc#my-space');
		render(<TocDoors {...props} />);
		fireEvent.click(screen.getByTestId('toc-close-myspace'));
		expect(trigger()).toHaveAttribute('aria-expanded', 'false');
		expect(window.location.hash).toBe('');
	});
});
