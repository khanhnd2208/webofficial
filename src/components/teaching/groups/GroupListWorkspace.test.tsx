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
		expect(screen.getByRole('heading', { name: 'Nhóm 1' })).toBeInTheDocument();
		expect(screen.queryByText(/Hỗ trợ \(Support\)/i)).not.toBeInTheDocument();
		expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual([
			'MSV',
			'Tên sinh viên',
		]);
		expect(document.querySelector('.group-list-grid')).toBeTruthy();
	});

	it('uses Vietnamese labels and pins the student group first in public mode', () => {
		render(
			<GroupListWorkspace
				slug="hrm-39-01"
				tutorials={[tutorial('t1', 'T01', 'Tutorial 1')]}
				highlightedEnrollmentId="e2"
				initial={{
					classId: 'class-1',
					tutorialClassId: 't1',
					tutorialCode: 'T01',
					tutorialName: 'Tutorial 1',
					groupCount: 2,
					defaultGroupSize: 5,
					version: 1,
					configured: true,
					activeStudentCount: 2,
					assignedCount: 2,
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
									studentCode: '********01',
									familyName: 'Nguyễn',
									givenName: 'An',
								},
							],
						},
						{
							id: 'g2',
							displayOrder: 1,
							maxSize: null,
							effectiveMaxSize: 5,
							assignments: [
								{
									enrollmentId: 'e2',
									groupId: 'g2',
									groupOrder: 1,
									memberOrder: 0,
									studentCode: '********02',
									familyName: 'Trần',
									givenName: 'Bình',
								},
							],
						},
					],
					unassigned: [],
				}}
			/>,
		);

		expect(screen.getByRole('heading', { name: 'Danh sách nhóm · T01' })).toBeInTheDocument();
		expect(screen.queryByText(/GROUP DIRECTORY/i)).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Tutorial T01/ })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Tutorial Class/ })).not.toBeInTheDocument();

		const headings = screen.getAllByRole('heading', { level: 3 }).map((el) => el.textContent);
		expect(headings).toEqual(['Nhóm 2', 'Nhóm 1']);
		expect(screen.getByText('Nhóm của bạn')).toBeInTheDocument();
		expect(document.querySelector('section[data-my-group="true"]')).toBeTruthy();
		expect(document.querySelector('tr[data-me="true"]')).toHaveTextContent('Trần Bình');
	});
});
