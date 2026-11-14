import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { routes } from '@/config/routes';
import TocDoors from './TocDoors';

function doorIds() {
	return screen.getAllByTestId(/^gate-item-/).map((door) => door.getAttribute('data-testid'));
}

describe('TocDoors', () => {
	it('shows the same two doors to everyone: Về tôi and Học tập', () => {
		render(<TocDoors />);

		expect(doorIds()).toEqual(['gate-item-about', 'gate-item-learning']);
		expect(screen.getByTestId('gate-item-about')).toHaveAttribute('href', routes.contact);
		expect(screen.getByTestId('gate-item-about')).toHaveTextContent('Về tôi');
		expect(screen.getByTestId('gate-item-learning')).toHaveAttribute('href', routes.learnCourses);
		expect(screen.getByTestId('gate-item-learning')).toHaveTextContent('Học tập');
		expect(screen.queryByText('Quản trị')).not.toBeInTheDocument();
		expect(screen.queryByText('Lớp học')).not.toBeInTheDocument();
	});

	it('marks both on-site doors with an inward arrow', () => {
		render(<TocDoors />);

		expect(screen.getByTestId('gate-item-about')).toHaveTextContent('→');
		expect(screen.getByTestId('gate-item-learning')).toHaveTextContent('→');
	});
});
