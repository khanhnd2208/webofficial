import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LearningExperienceMark } from './LearningExperienceMark';

describe('LearningExperienceMark', () => {
	it('uses a quiet determination mark for challenge mode in attendance', () => {
		const { container } = render(<LearningExperienceMark choice="CHALLENGE" appearance="quiet" />);

		const mark = screen.getByLabelText('Quyết tâm');
		expect(mark).toHaveAttribute('data-appearance', 'quiet');
		expect(container.querySelector('.lx-mark-quiet-icon')).toBeInTheDocument();
		expect(container.querySelector('.lx-mark-label')).not.toBeInTheDocument();
	});

	it('uses a quiet self-directed enjoyment mark for support mode in attendance', () => {
		render(<LearningExperienceMark choice="SUPPORT" appearance="quiet" size="sm" />);

		expect(screen.getByLabelText('Tự giác và enjoy')).toHaveAttribute('data-size', 'sm');
	});

	it('keeps the descriptive badge in roster contexts', () => {
		const { container } = render(<LearningExperienceMark choice="CHALLENGE" />);

		expect(screen.getByLabelText('Challenge mode')).toHaveTextContent('Challenge');
		expect(container.querySelector('[data-icon="bolt"]')).toBeInTheDocument();
	});
});
