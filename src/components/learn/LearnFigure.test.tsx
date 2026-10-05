import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LearnFigure from './LearnFigure';

describe('learner figures', () => {
	it('hides unresolved images from learners while retaining Studio previews', () => {
		const { rerender } = render(<LearnFigure src="hinh-1.png" alt="x" />);
		expect(screen.queryByRole('img')).not.toBeInTheDocument();
		expect(screen.queryByText(/Chưa có ảnh/)).not.toBeInTheDocument();
		rerender(<LearnFigure src="hinh-1.png" showMissingImages />);
		expect(screen.getByText('Chưa có ảnh: hinh-1.png')).toBeInTheDocument();
	});
	it('hides an entire broken figure and recovers when its source changes', () => {
		const { rerender } = render(
			<LearnFigure src="/uploads/lost.webp" alt="image" title="caption" />,
		);
		fireEvent.error(screen.getByRole('img'));
		expect(screen.queryByText('caption')).not.toBeInTheDocument();
		rerender(<LearnFigure src="/uploads/new.webp" alt="image" title="caption" />);
		expect(screen.getByRole('img')).toHaveAttribute('src', '/uploads/new.webp');
	});
});
