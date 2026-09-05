import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { teachingApi } from '@/components/teaching/admin/api';
import { routes } from '@/config/routes';

import { NewTeachingClassWorkspace } from './NewTeachingClassWorkspace';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
	useRouter: () => navigation,
}));
vi.mock('@/components/teaching/admin/api', () => ({ teachingApi: vi.fn() }));

const apiMock = vi.mocked(teachingApi);

const preview = {
	metadata: {
		courseCode: 'HRM',
		courseName: 'Human Resource Management',
		groupNo: '01',
		term: 'HK1',
		credits: 3,
		lecturerName: 'Lecturer',
		lecturerCode: 'GV01',
	},
	existingClassId: null,
	summary: {
		total: 1,
		newCount: 1,
		exactCount: 0,
		fillBlankCount: 0,
		conflictCount: 0,
		invalidCount: 0,
		openAccessCount: 0,
	},
	rows: [
		{
			key: '8:SV01',
			status: 'new',
			accessMode: 'DOB_PASSWORD',
			conflicts: [],
			fillBlankFields: [],
			resolution: {},
			existing: null,
			input: {
				sourceRow: 8,
				orderNo: 7,
				studentCode: 'SV01',
				familyName: 'Nguyễn',
				givenName: 'An',
				homeClassCode: 'K66A',
				majorName: 'Quản trị nhân lực',
				dateOfBirth: '2006-05-29',
				phone: '0901234567',
				email: 'sv01@example.edu',
				tutorialCode: null,
				tutorialClassId: null,
				enrolledFromWeek: 1,
				fieldErrors: {},
			},
		},
	],
};

describe('NewTeachingClassWorkspace', () => {
	beforeEach(() => {
		apiMock.mockReset();
		navigation.push.mockReset();
	});

	it('preserves all roster fields from Excel preview when creating the class', async () => {
		apiMock
			.mockResolvedValueOnce(preview)
			.mockResolvedValueOnce({ gradebook: { class: { id: 'class-1' } } });

		const { container } = render(<NewTeachingClassWorkspace />);
		fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }));
		fireEvent.click(screen.getByRole('tab', { name: 'Excel HANU' }));
		const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
		expect(fileInput).not.toBeNull();
		fireEvent.change(fileInput!, {
			target: { files: [new File(['xlsx'], 'students.xlsx')] },
		});

		await screen.findByText('SV01');
		fireEvent.click(screen.getByRole('button', { name: 'Dùng danh sách này' }));
		fireEvent.click(screen.getByRole('button', { name: /tạo lớp và mở workspace/i }));

		await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(2));
		const request = apiMock.mock.calls[1]?.[1];
		const payload = JSON.parse(String(request?.body)) as {
			rows: Array<{ input: Record<string, unknown> }>;
		};
		expect(payload.rows[0]?.input).toMatchObject({
			orderNo: 7,
			studentCode: 'SV01',
			familyName: 'Nguyễn',
			givenName: 'An',
			homeClassCode: 'K66A',
			majorName: 'Quản trị nhân lực',
			dateOfBirth: '2006-05-29',
			phone: '0901234567',
			email: 'sv01@example.edu',
		});
		expect(navigation.push).toHaveBeenCalledWith(
			routes.mySpaceTeachingClassTab('class-1', 'attendance'),
		);
	});
});
