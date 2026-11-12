import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { routes } from '@/config/routes';
import TocDoors, { buildTocItems } from './TocDoors';

const about = {
	href: '/gioi-thieu',
	label: 'Về tôi',
	description: 'Người thầy.',
	icon: '/brand/toc/about-v1.webp',
};

function doorIds() {
	return screen
		.getAllByTestId(/^(gate-item-about|myspace-tile-)/)
		.map((door) => door.getAttribute('data-testid'));
}

describe('TocDoors', () => {
	it('shows only About and Courses to visitors', () => {
		render(<TocDoors about={about} items={buildTocItems(null)} />);

		expect(doorIds()).toEqual(['gate-item-about', 'myspace-tile-courses']);
		expect(screen.getByTestId('gate-item-about')).toHaveAttribute('href', '/gioi-thieu');
		expect(screen.queryByText('Trải nghiệm')).not.toBeInTheDocument();
		expect(screen.queryByText('Trò chơi')).not.toBeInTheDocument();
		expect(screen.queryByTestId('myspace-tile-teaching')).not.toBeInTheDocument();
		expect(screen.queryByTestId('myspace-tile-admin')).not.toBeInTheDocument();
		expect(screen.queryByTestId('toc-open-myspace')).not.toBeInTheDocument();
	});

	it('marks both on-site doors with an inward arrow', () => {
		render(<TocDoors about={about} items={buildTocItems(null)} />);

		expect(screen.getByTestId('gate-item-about')).toHaveTextContent('→');
		expect(screen.getByTestId('myspace-tile-courses')).toHaveTextContent('→');
	});

	it('adds Lớp học and Quản trị only for an admin', () => {
		render(<TocDoors about={about} items={buildTocItems('admin')} />);

		expect(doorIds()).toEqual([
			'gate-item-about',
			'myspace-tile-courses',
			'myspace-tile-teaching',
			'myspace-tile-admin',
		]);
		expect(screen.getByTestId('myspace-tile-teaching')).toHaveAttribute(
			'href',
			routes.mySpaceTeaching,
		);
		expect(screen.getByTestId('myspace-tile-admin')).toHaveAttribute('href', routes.admin.home);
		expect(screen.queryByText('Trải nghiệm')).not.toBeInTheDocument();
		expect(screen.queryByText('Trò chơi')).not.toBeInTheDocument();
	});
});
