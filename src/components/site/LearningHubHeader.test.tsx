import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LearningHubHeader from './LearningHubHeader';

describe('LearningHubHeader', () => {
	it('links both tabs and marks the open one', () => {
		render(<LearningHubHeader active="classes" title="Lớp học của bạn" />);
		const courses = screen.getByRole('link', { name: 'Khóa học' });
		const classes = screen.getByRole('link', { name: 'Lớp học' });
		expect(courses).toHaveAttribute('href', '/khoa-hoc');
		expect(courses).not.toHaveAttribute('aria-current');
		expect(classes).toHaveAttribute('href', '/lop');
		expect(classes).toHaveAttribute('aria-current', 'page');
		expect(screen.getByRole('heading', { level: 1, name: 'Lớp học của bạn' })).toBeVisible();
	});

	it('shows admin actions only when given', () => {
		const { rerender } = render(<LearningHubHeader active="courses" title="Khóa học" />);
		expect(screen.queryByRole('button')).toBeNull();
		rerender(
			<LearningHubHeader
				active="courses"
				title="Khóa học"
				actions={<button type="button">Tạo</button>}
			/>,
		);
		expect(screen.getByRole('button', { name: 'Tạo' })).toBeVisible();
	});
});
