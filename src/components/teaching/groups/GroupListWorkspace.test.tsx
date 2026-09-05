import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GroupListWorkspace } from './GroupListWorkspace';

vi.mock('@/components/teaching/admin/api', () => ({
	teachingApi: vi.fn(),
}));

const tutorial = (id: string, code: string, name: string) => ({
	id,
	code,
	name,
	classId: 'class-1',
	displayOrder: 0,
	room: '',
	scheduleNote: '',
	studentCount: 10,
});

describe('GroupListWorkspace', () => {
	it('shows tutorial picker prompt when multiple tutorials exist', () => {
		render(
			<GroupListWorkspace
				classId="class-1"
				tutorials={[tutorial('t1', '01', 'T01'), tutorial('t2', '02', 'T02')]}
				admin
			/>,
		);
		expect(screen.getByText(/Chọn tutorial để xem danh sách nhóm/i)).toBeInTheDocument();
	});

	it('renders configured groups from initial data', () => {
		render(
			<GroupListWorkspace
				classId="class-1"
				tutorials={[tutorial('t1', '02', 'Tutorial 2')]}
				initial={{
					classId: 'class-1',
					tutorialClassId: 't1',
					tutorialCode: '02',
					tutorialName: 'Tutorial 2',
					groupCount: 1,
					defaultGroupSize: 5,
					version: 1,
					configured: true,
					activeStudentCount: 2,
					assignedCount: 1,
					groups: [
						{
							id: 'g1',
							displayOrder: 0,
							maxSize: null,
							effectiveMaxSize: 5,
							assignments: [
								{
									enrollmentId: 'e1',
									groupId: 'g1',
									groupOrder: 0,
									memberOrder: 0,
									studentCode: '2200000001',
									familyName: 'Nguyen',
									givenName: 'An',
									learningExperience: 'SUPPORT',
								},
							],
						},
					],
					unassigned: [],
				}}
				admin
			/>,
		);
		expect(screen.getByText(/DANH SÁCH PHÂN CHIA NHÓM/i)).toBeInTheDocument();
		expect(screen.getByText(/Nhóm 1 · 1\/5 sinh viên/i)).toBeInTheDocument();
		expect(screen.getByText(/Hỗ trợ \(Support\)/i)).toBeInTheDocument();
	});
});
