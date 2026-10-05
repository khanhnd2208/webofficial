import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AdminLearnCourse } from '@/features/learn/adminCatalog';

import LearnCourseAdminList from './LearnCourseAdminList';

const courses: AdminLearnCourse[] = [
	{
		id: '1',
		slug: 'khoa-a',
		title: 'Khóa một',
		status: 'DRAFT',
		lessonCount: 2,
		sectionCount: 4,
		questionCount: 3,
		lastEditedAt: '2026-10-05T10:00:00.000Z',
	},
	{
		id: '2',
		slug: 'archived',
		title: 'Đã cất',
		status: 'ARCHIVED',
		lessonCount: 1,
		sectionCount: 1,
		questionCount: 0,
		lastEditedAt: '2026-10-01T10:00:00.000Z',
	},
];

describe('LearnCourseAdminList', () => {
	it('filters by status and ignores accents in the query', () => {
		render(<LearnCourseAdminList courses={courses} />);
		expect(screen.getByText('Khóa một')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('tab', { name: /Lưu trữ/ }));
		expect(screen.getByText('Đã cất')).toBeInTheDocument();
		expect(screen.queryByText('Khóa một')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('tab', { name: /Tất cả/ }));
		fireEvent.change(screen.getByRole('textbox', { name: 'Tìm khóa học' }), {
			target: { value: 'khoa' },
		});
		expect(screen.getByText('Khóa một')).toBeInTheDocument();
		expect(screen.queryByText('Đã cất')).not.toBeInTheDocument();
	});
});
