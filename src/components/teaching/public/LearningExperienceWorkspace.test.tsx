import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { teachingApi } from '@/components/teaching/admin/api';

import { LearningExperienceWorkspace } from './LearningExperienceWorkspace';

vi.mock('@/components/teaching/admin/api', () => ({ teachingApi: vi.fn() }));

const apiMock = vi.mocked(teachingApi);
const students = [
	{
		enrollmentId: 'enrollment-1',
		studentCode: '********45',
		fullName: 'Nguyễn Minh Anh',
		accessMode: 'DOB_PASSWORD' as const,
	},
	{
		enrollmentId: 'enrollment-2',
		studentCode: '********99',
		fullName: 'Trần Bình',
		accessMode: 'OPEN' as const,
	},
];

describe('LearningExperienceWorkspace', () => {
	beforeEach(() => {
		apiMock.mockReset();
	});

	it('authenticates with student code and an eight-digit birth date password', async () => {
		apiMock.mockResolvedValueOnce({ authenticated: false }).mockResolvedValueOnce({
			authenticated: true,
			student: {
				enrollmentId: 'enrollment-1',
				studentCode: '2406090045',
				fullName: 'Nguyễn Minh Anh',
			},
			choice: null,
			selectedAt: null,
		});

		render(
			<LearningExperienceWorkspace
				slug="hrm-01"
				courseName="Human Resource Management"
				students={students}
			/>,
		);

		expect(
			await screen.findByRole('heading', { name: /mở trải nghiệm học tập/i }),
		).toBeInTheDocument();
		fireEvent.focus(screen.getByLabelText('Chọn sinh viên trong lớp'));
		fireEvent.click(screen.getByRole('option', { name: /\*{8}45.*Nguyễn Minh Anh/i }));
		fireEvent.change(screen.getByLabelText('Mật khẩu ngày sinh'), {
			target: { value: '05092006' },
		});
		const enterButton = screen.getByRole('button', { name: /enter experience/i });
		expect(enterButton).toBeEnabled();
		fireEvent.click(enterButton);

		await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(2));
		expect(screen.getByText('Nguyễn Minh Anh')).toBeInTheDocument();
		expect(apiMock).toHaveBeenLastCalledWith('/api/teaching/classes/hrm-01/learning-experience', {
			method: 'POST',
			body: JSON.stringify({ enrollmentId: 'enrollment-1', password: '05092006' }),
		});
	});

	it('persists and marks the selected learning style', async () => {
		apiMock
			.mockResolvedValueOnce({
				authenticated: true,
				student: {
					enrollmentId: 'enrollment-1',
					studentCode: '2406090045',
					fullName: 'Nguyễn Minh Anh',
				},
				choice: null,
				selectedAt: null,
			})
			.mockResolvedValueOnce({
				authenticated: true,
				student: {
					enrollmentId: 'enrollment-1',
					studentCode: '2406090045',
					fullName: 'Nguyễn Minh Anh',
				},
				choice: 'SUPPORT',
				selectedAt: '2026-08-23T09:00:00.000Z',
			});

		render(
			<LearningExperienceWorkspace
				slug="hrm-01"
				courseName="Human Resource Management"
				students={students}
			/>,
		);

		fireEvent.click(await screen.findByRole('button', { name: /chọn hỗ trợ/i }));

		await waitFor(() => expect(screen.getByText('Lựa chọn của bạn')).toBeInTheDocument());
		expect(screen.getByText(/royal support unlocked/i)).toBeInTheDocument();
		expect(apiMock).toHaveBeenLastCalledWith('/api/teaching/classes/hrm-01/learning-experience', {
			method: 'PUT',
			body: JSON.stringify({ choice: 'SUPPORT' }),
		});
	});

	it('lets a profile without a birth date enter without a password', async () => {
		apiMock.mockResolvedValueOnce({ authenticated: false }).mockResolvedValueOnce({
			authenticated: true,
			accessMode: 'OPEN',
			student: {
				enrollmentId: 'enrollment-2',
				studentCode: '2406090099',
				fullName: 'Trần Bình',
			},
			choice: null,
		});
		render(
			<LearningExperienceWorkspace
				slug="hrm-01"
				courseName="Human Resource Management"
				students={students}
			/>,
		);

		const picker = await screen.findByLabelText('Chọn sinh viên trong lớp');
		fireEvent.focus(picker);
		fireEvent.change(picker, { target: { value: 'Trần Bình' } });
		fireEvent.click(screen.getByRole('option', { name: /\*{8}99.*Trần Bình/i }));

		expect(screen.getByText('Có thể vào ngay')).toBeInTheDocument();
		expect(screen.queryByLabelText('Mật khẩu ngày sinh')).not.toBeInTheDocument();
		const enterButton = screen.getByRole('button', { name: /vào trải nghiệm/i });
		expect(enterButton).toBeEnabled();
		fireEvent.click(enterButton);

		await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(2));
		expect(apiMock).toHaveBeenLastCalledWith('/api/teaching/classes/hrm-01/learning-experience', {
			method: 'POST',
			body: JSON.stringify({ enrollmentId: 'enrollment-2' }),
		});
	});

	it('uses the selected enrollment when masked student codes are identical', async () => {
		apiMock.mockResolvedValueOnce({ authenticated: false }).mockResolvedValueOnce({
			authenticated: true,
			student: {
				enrollmentId: 'enrollment-3',
				studentCode: '2304010045',
				fullName: 'Lê Minh',
			},
			choice: null,
			selectedAt: null,
		});
		render(
			<LearningExperienceWorkspace
				slug="hrm-01"
				courseName="Human Resource Management"
				students={[
					students[0]!,
					{
						enrollmentId: 'enrollment-3',
						studentCode: '********45',
						fullName: 'Lê Minh',
						accessMode: 'DOB_PASSWORD',
					},
				]}
			/>,
		);

		await screen.findByRole('heading', { name: /mở trải nghiệm học tập/i });
		fireEvent.focus(screen.getByLabelText('Chọn sinh viên trong lớp'));
		fireEvent.click(screen.getByRole('option', { name: /\*{8}45.*Lê Minh/i }));
		fireEvent.change(screen.getByLabelText('Mật khẩu ngày sinh'), {
			target: { value: '01012006' },
		});
		fireEvent.click(screen.getByRole('button', { name: /enter experience/i }));

		await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(2));
		expect(apiMock).toHaveBeenLastCalledWith('/api/teaching/classes/hrm-01/learning-experience', {
			method: 'POST',
			body: JSON.stringify({ enrollmentId: 'enrollment-3', password: '01012006' }),
		});
	});

	it('keeps touch selection before blur and supports keyboard and formatted password input', async () => {
		apiMock.mockResolvedValueOnce({ authenticated: false }).mockResolvedValueOnce({
			authenticated: true,
			accessMode: 'DOB_PASSWORD',
			student: {
				enrollmentId: 'enrollment-1',
				studentCode: '2406090045',
				fullName: 'Nguyễn Minh Anh',
			},
			choice: null,
		});
		const user = userEvent.setup();

		render(
			<LearningExperienceWorkspace
				slug="hrm-01"
				courseName="Human Resource Management"
				students={students}
			/>,
		);

		const picker = await screen.findByLabelText('Chọn sinh viên trong lớp');
		fireEvent.focus(picker);
		fireEvent.pointerDown(screen.getByRole('option', { name: /\*{8}45.*Nguyễn Minh Anh/i }), {
			pointerType: 'touch',
		});
		const password = screen.getByLabelText('Mật khẩu ngày sinh');
		expect(password).toBeEnabled();
		expect(password).toHaveAttribute('autocomplete', 'off');

		await user.clear(password);
		await user.type(password, '05/09/2006');
		expect(screen.getByRole('button', { name: /enter experience/i })).toBeEnabled();
		await user.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
		expect(password).toHaveAttribute('type', 'text');
	});

	it('selects the first student with ArrowDown and Enter', async () => {
		apiMock.mockResolvedValueOnce({ authenticated: false });
		render(
			<LearningExperienceWorkspace
				slug="hrm-01"
				courseName="Human Resource Management"
				students={students}
			/>,
		);

		const picker = await screen.findByLabelText('Chọn sinh viên trong lớp');
		fireEvent.focus(picker);
		fireEvent.keyDown(picker, { key: 'ArrowDown' });
		fireEvent.keyDown(picker, { key: 'Enter' });

		expect(screen.getByLabelText('Mật khẩu ngày sinh')).toBeEnabled();
	});

	it('finds a masked roster option from a full numeric code without a network search', async () => {
		apiMock.mockResolvedValueOnce({ authenticated: false });
		render(
			<LearningExperienceWorkspace
				slug="hrm-01"
				courseName="Human Resource Management"
				students={students}
			/>,
		);

		const picker = await screen.findByLabelText('Chọn sinh viên trong lớp');
		fireEvent.change(picker, { target: { value: '2406090045' } });

		expect(
			await screen.findByRole('option', { name: /\*{8}45.*Nguyễn Minh Anh/i }),
		).toBeInTheDocument();
		expect(apiMock).toHaveBeenCalledTimes(1);
		expect(
			screen.queryByText('Không tìm thấy sinh viên phù hợp trong lớp.'),
		).not.toBeInTheDocument();
	});
});
