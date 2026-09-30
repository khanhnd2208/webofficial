import { act, fireEvent, render, screen } from '@testing-library/react';
import Link from 'next/link';
import { teachingApi } from './api';
import { describe, expect, it, vi } from 'vitest';

import type { TeachingClassRecord } from '@/features/teaching/types';

import { SettingsForm } from './SettingsForm';

vi.mock('next/navigation', () => ({
	useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock('@/components/teaching/admin/api', () => ({ teachingApi: vi.fn() }));

const teachingClass: TeachingClassRecord = {
	id: 'class-1',
	courseId: 'course-1',
	courseCode: 'HRM101',
	courseName: 'HRM',
	groupNo: '01',
	classCode: '01',
	term: 'HK1',
	credits: 3,
	lecturerName: '',
	lecturerCode: '',
	totalWeeks: 10,
	attendanceMaxPoints: 5,
	cpMaxPoints: 5,
	absenceDeductionPoints: 0.5,
	lateDeductionPoints: 0.5,
	lateCountsTowardAbsenceThreshold: true,
	giftDeductionPoints: 1,
	absenceThresholdPercent: 20,
	lateGraceMinutes: 15,
	status: 'ACTIVE',
	publicSlug: null,
	publicTitle: '',
	publicSummary: '',
	publicDescription: '',
	publicAnnouncement: '',
	attendanceVisible: false,
	classRules: '',
	createdAt: '2026-09-01T00:00:00.000Z',
	updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('SettingsForm', () => {
	it('keeps class status separate from unsaved setup fields', () => {
		render(<SettingsForm teachingClass={teachingClass} />);
		fireEvent.change(screen.getByLabelText('Trạng thái lớp'), { target: { value: 'ARCHIVED' } });
		expect(screen.getByRole('button', { name: 'Lưu thiết lập' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Cập nhật trạng thái' })).toBeEnabled();
	});
	it('warns on closing and restores the form URL when browser history changes with unsaved edits', () => {
		const previous = window.location.href;
		window.history.replaceState({}, '', '/my-space/teaching/class-1?tab=setup');
		render(<SettingsForm teachingClass={teachingClass} />);
		fireEvent.change(screen.getByLabelText('Mã lớp'), { target: { value: '02' } });
		const unload = new Event('beforeunload', { cancelable: true });
		window.dispatchEvent(unload);
		expect(unload.defaultPrevented).toBe(true);
		act(() => {
			window.history.replaceState({}, '', '/my-space/teaching/class-1?tab=students');
			window.dispatchEvent(new PopStateEvent('popstate'));
		});
		expect(window.location.search).toBe('?tab=setup');
		expect(screen.getByRole('dialog', { name: 'Thay đổi chưa lưu' })).toBeVisible();
		expect(screen.getByLabelText('Mã lớp')).toHaveValue('02');
		window.history.replaceState({}, '', previous);
	});
	it('guards internal navigation and keeps the form when save fails', async () => {
		vi.mocked(teachingApi).mockRejectedValueOnce(new Error('offline'));
		render(
			<>
				<Link href="/my-space/teaching/class-1?tab=students">Sinh viên</Link>
				<SettingsForm teachingClass={teachingClass} />
			</>,
		);
		fireEvent.change(screen.getByLabelText('Mã lớp'), { target: { value: '02' } });
		fireEvent.click(screen.getByRole('link', { name: 'Sinh viên' }));
		expect(screen.getByRole('button', { name: 'Ở lại' })).toBeVisible();
		expect(screen.getByRole('button', { name: 'Bỏ thay đổi' })).toBeVisible();
		fireEvent.click(screen.getByRole('button', { name: 'Lưu và rời trang' }));
		await act(async () => {});
		expect(screen.getByRole('button', { name: 'Thử lại' })).toBeVisible();
		expect(screen.getByLabelText('Mã lớp')).toHaveValue('02');
	});
	it('keeps advanced scoring fields closed by default without dropping values', () => {
		render(<SettingsForm teachingClass={teachingClass} />);
		expect(screen.getByLabelText('Mã lớp')).toHaveValue('01');
		expect(screen.queryByLabelText('Chuyên cần tối đa')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Thiết lập nâng cao' }));
		expect(screen.getByLabelText('Chuyên cần tối đa')).toHaveValue(5);
		fireEvent.change(screen.getByLabelText('Chuyên cần tối đa'), { target: { value: '6' } });
		fireEvent.click(screen.getByRole('button', { name: 'Thu gọn thiết lập nâng cao' }));
		expect(screen.queryByLabelText('Chuyên cần tối đa')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Thiết lập nâng cao' }));
		expect(screen.getByLabelText('Chuyên cần tối đa')).toHaveValue(6);
		expect(screen.getByText('Hành động nguy hiểm')).toBeInTheDocument();
	});
});
