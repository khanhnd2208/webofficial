import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { routes } from '@/config/routes';
import TocDoors, { buildTocItems } from './TocDoors';

const about = {
	href: '/gioi-thieu',
	label: 'Về tôi',
	description: 'Người thầy.',
	icon: '/brand/toc/about-v1.webp',
	eyebrow: 'About me',
};

function doorIds() {
	return screen
		.getAllByTestId(/^(gate-item-about|myspace-tile-)/)
		.map((door) => door.getAttribute('data-testid'));
}

describe('TocDoors', () => {
	it('shows every visitor door at once, without Teaching', () => {
		render(<TocDoors about={about} items={buildTocItems(null)} />);

		expect(doorIds()).toEqual([
			'gate-item-about',
			'myspace-tile-courses',
			'myspace-tile-board-game',
		]);
		expect(screen.getByTestId('gate-item-about')).toHaveAttribute('href', '/gioi-thieu');
		expect(screen.queryByTestId('myspace-tile-teaching')).not.toBeInTheDocument();
		expect(screen.queryByTestId('myspace-tile-admin')).not.toBeInTheDocument();
		expect(screen.queryByTestId('toc-open-myspace')).not.toBeInTheDocument();
	});

	it('keeps Board Game clickable, muted, and names the new address in bold', () => {
		render(<TocDoors about={about} items={buildTocItems('student')} />);

		const game = screen.getByTestId('myspace-tile-board-game');
		expect(game).toHaveAttribute('href', routes.funGames);
		expect(game).toHaveAttribute('data-muted', '');
		expect(game.className).toMatch(/muted/);
		expect(within(game).getByText('fun.toiladuykhanh.com').tagName).toBe('STRONG');
	});

	it('adds Lớp học and Quản trị only for an admin, before the games door', () => {
		render(<TocDoors about={about} items={buildTocItems('admin')} />);

		expect(doorIds()).toEqual([
			'gate-item-about',
			'myspace-tile-courses',
			'myspace-tile-teaching',
			'myspace-tile-admin',
			'myspace-tile-board-game',
		]);
		expect(screen.getByTestId('myspace-tile-teaching')).toHaveAttribute(
			'href',
			routes.mySpaceTeaching,
		);
		expect(screen.getByTestId('myspace-tile-admin')).toHaveAttribute('href', routes.admin.home);
		expect(screen.getByTestId('myspace-tile-admin')).not.toHaveAttribute('data-muted');
	});
});
