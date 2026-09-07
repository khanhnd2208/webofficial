'use client';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { teachingApi } from '@/components/teaching/admin/api';
import { routes } from '@/config/routes';

import { NewTeachingClassWorkspace } from './NewTeachingClassWorkspace';

const navigation = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn() }));

vi.mock('next/navigation', () => ({
	useRouter: () => navigation,
}));
vi.mock('@/components/teaching/admin/api', () => ({
	teachingApi: vi.fn(),
	AdminApiError: class AdminApiError extends Error {},
}));

const apiMock = vi.mocked(teachingApi);

const course = {
	id: 'course-1',
	courseCode: 'HRM101',
	courseName: 'Human Resource Management',
	status: 'ACTIVE',
} as never;

describe('NewTeachingClassWorkspace', () => {
	beforeEach(() => {
		apiMock.mockReset();
		navigation.push.mockReset();
		navigation.back.mockReset();
	});

	it('locks the preselected course and creates an empty class with three required fields', async () => {
		apiMock.mockResolvedValueOnce({ id: 'class-1' });
		render(
			<NewTeachingClassWorkspace initialCourseId="course-1" courses={[course]} termSuggestions={['HK1']} />,
		);

		expect(screen.getByLabelText('Môn học')).toHaveValue('course-1');
		expect(screen.getByLabelText('Môn học')).toBeDisabled();
		fireEvent.change(screen.getByPlaceholderText('39-01'), { target: { value: ' 39-01 ' } });
		fireEvent.change(screen.getByPlaceholderText('HỌC KỲ 1 - NĂM HỌC 2026 - 2027'), {
			target: { value: 'HK1' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Tạo lớp trống' }));

		await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1));
		expect(apiMock).toHaveBeenCalledWith('/api/admin/teaching/classes', {
			method: 'POST',
			body: JSON.stringify({ courseId: 'course-1', groupNo: ' 39-01 ', term: 'HK1' }),
		});
		expect(navigation.push).toHaveBeenCalledWith(routes.mySpaceTeachingClassTab('class-1', 'students'));
	});

	it('requires a course, class code and term before submitting', () => {
		render(<NewTeachingClassWorkspace courses={[course]} />);
		fireEvent.click(screen.getByRole('button', { name: 'Tạo lớp trống' }));
		expect(screen.getByText('Hãy chọn môn, nhập mã lớp và học kỳ.')).toBeInTheDocument();
		expect(apiMock).not.toHaveBeenCalled();
	});
});
