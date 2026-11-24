import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { teachingApi } from '@/components/teaching/admin/api';
import type { PublicClassBoard } from '@/features/teaching/types';

import { StudentHome } from './StudentHome';

vi.mock('@/components/teaching/admin/api', () => ({ teachingApi: vi.fn() }));

const apiMock = vi.mocked(teachingApi);

function sampleBoard(): PublicClassBoard {
	return {
		slug: 'hrm-39-01',
		title: 'Quản trị nhân sự',
		summary: 'Tổng quan ngắn cho lớp.',
		description: 'Chuẩn bị chương 1.',
		announcement: 'Buổi học ngày mai bắt đầu lúc 08:00.',
		courseCode: '61MGT3HRM',
		courseName: 'Quản trị nhân sự',
		groupNo: '39-01',
		term: 'Học kỳ 1 - Năm học 2026 - 2027',
		credits: 3,
		lecturerName: 'Nguyễn Duy Khánh',
		rules: 'Mang thẻ sinh viên',
		updatedAt: '2026-09-01T00:00:00.000Z',
		policy: { totalWeeks: 2, absenceThresholdPercent: 20, attendanceMaxPoints: 5, cpMaxPoints: 5 },
		tutorials: [
			{
				id: 't1',
				classId: 'c1',
				code: 'T01',
				name: 'Nhóm 01',
				room: '',
				scheduleNote: '',
				displayOrder: 0,
				studentCount: 2,
			},
		],
		sessions: [
			{
				id: 's1',
				classId: 'c1',
				tutorialClassId: 't1',
				weekNumber: 1,
				heldOn: '2026-09-01',
				topic: '',
				method: 'ROLL_CALL',
				isCancelled: false,
				attendanceTakenAt: '2026-09-01T00:00:00.000Z',
				attendanceOpen: false,
				participationTakenAt: '2026-09-01T00:00:00.000Z',
				participationOpen: false,
			},
			{
				id: 's2',
				classId: 'c1',
				tutorialClassId: 't1',
				weekNumber: 2,
				heldOn: null,
				topic: '',
				method: 'ROLL_CALL',
				isCancelled: false,
				attendanceTakenAt: null,
				attendanceOpen: true,
				participationTakenAt: null,
				participationOpen: true,
			},
		],
		students: [
			{
				enrollmentId: 'e1',
				orderNo: 1,
				tutorialClassId: 't1',
				studentCode: '********45',
				familyName: 'Nguyễn',
				givenName: 'An',
				hasDateOfBirth: true,
				enrolledFromWeek: 1,
				marks: { s1: { status: 'PRESENT' } },
				participation: { s1: { points: 1, note: '' } },
				learningExperience: null,
				cp: {
					takenSessions: 1,
					unexcusedAbsences: 0,
					excusedAbsences: 0,
					lateCount: 0,
					presentCount: 1,
					makeupCount: 0,
					participationTotal: 1,
					giftDeduction: 0,
					absenceDeduction: 0,
					attendanceScore: 5,
					banLimit: 2,
					banned: false,
					examEligible: true,
					cp: 1,
					totalScore: 6,
					riskLevel: 'OK',
				},
			},
			{
				enrollmentId: 'e2',
				orderNo: 2,
				tutorialClassId: 't1',
				studentCode: '********99',
				familyName: 'Trần',
				givenName: 'Bình',
				hasDateOfBirth: false,
				enrolledFromWeek: 1,
				marks: { s1: { status: 'ABSENT_UNEXCUSED' } },
				participation: {},
				learningExperience: 'CHALLENGE',
				cp: {
					takenSessions: 1,
					unexcusedAbsences: 1,
					excusedAbsences: 0,
					lateCount: 0,
					presentCount: 0,
					makeupCount: 0,
					participationTotal: 0,
					giftDeduction: 0,
					absenceDeduction: 0.5,
					attendanceScore: 4.5,
					banLimit: 2,
					banned: false,
					examEligible: true,
					cp: 0,
					totalScore: 4.5,
					riskLevel: 'AT_RISK',
				},
			},
		],
		links: [
			{
				id: 'l1',
				label: 'Đề cương',
				url: 'https://example.edu/syllabus',
				description: 'Bản mới nhất',
				displayOrder: 0,
			},
		],
		notes: [],
		recallDecks: [
			{
				id: 'd1',
				slug: 'lesson-1',
				title: 'Lesson 1',
				lessonLabel: 'Bài 1',
				description: '',
				cardCount: 15,
			},
		],
	};
}

describe('StudentHome', () => {
	beforeEach(() => {
		apiMock.mockReset();
	});

	it('shows the announcement and identity picker before a student is chosen', () => {
		const onSelectMe = vi.fn();
		const onOpenGradebook = vi.fn();
		render(
			<StudentHome
				board={sampleBoard()}
				me={null}
				learningChoice={null}
				groupBoardEnabled={false}
				recallCount={1}
				onSelectMe={onSelectMe}
				onClearMe={vi.fn()}
				onOpenGradebook={onOpenGradebook}
				onOpenGroups={vi.fn()}
				onOpenRecall={vi.fn()}
				onOpenLearning={vi.fn()}
			/>,
		);

		expect(screen.getByRole('note')).toHaveTextContent('Buổi học ngày mai bắt đầu lúc 08:00.');
		expect(screen.getByRole('heading', { name: 'Bạn là ai trong lớp?' })).toBeInTheDocument();
		expect(screen.getByText(/Lựa chọn chỉ lưu\s+trên thiết bị này\./)).toBeInTheDocument();

		fireEvent.change(screen.getByPlaceholderText('Tìm theo tên hoặc 2 số cuối MSV'), {
			target: { value: '45' },
		});
		expect(screen.getByRole('button', { name: /Nguyễn An/ })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Trần Bình/ })).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: /Nguyễn An/ }));
		expect(onSelectMe).toHaveBeenCalledWith('e1');
	});

	it('shows status, week strip, pending learning style task, recall task, and group card when identified', async () => {
		const board = sampleBoard();
		apiMock.mockResolvedValueOnce({
			classId: 'c1',
			tutorialClassId: 't1',
			tutorialCode: 'T01',
			tutorialName: 'Nhóm 01',
			groupCount: 1,
			defaultGroupSize: 5,
			version: 1,
			configured: true,
			activeStudentCount: 2,
			assignedCount: 2,
			groups: [
				{
					id: 'g1',
					displayOrder: 1,
					maxSize: null,
					effectiveMaxSize: 5,
					assignments: [
						{
							enrollmentId: 'e1',
							groupId: 'g1',
							groupOrder: 1,
							memberOrder: 0,
							studentCode: '********45',
							familyName: 'Nguyễn',
							givenName: 'An',
						},
						{
							enrollmentId: 'e2',
							groupId: 'g1',
							groupOrder: 1,
							memberOrder: 1,
							studentCode: '********99',
							familyName: 'Trần',
							givenName: 'Bình',
						},
					],
				},
			],
			unassigned: [],
		});

		render(
			<StudentHome
				board={board}
				me={board.students[0]!}
				learningChoice={null}
				groupBoardEnabled
				recallCount={1}
				onSelectMe={vi.fn()}
				onClearMe={vi.fn()}
				onOpenGradebook={vi.fn()}
				onOpenGroups={vi.fn()}
				onOpenRecall={vi.fn()}
				onOpenLearning={vi.fn()}
			/>,
		);

		expect(screen.getByRole('heading', { name: 'Chào Nguyễn An' })).toBeInTheDocument();
		expect(screen.getByText('Đủ điều kiện')).toBeInTheDocument();
		expect(screen.getByLabelText('Tuần 1: Có mặt')).toBeInTheDocument();
		expect(screen.getByLabelText('Tuần 2: Chưa điểm danh')).toBeInTheDocument();
		expect(
			screen.getByText('Tổng kết mở khi khoá đủ 2 tuần (đã khoá 1/2)'),
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Chọn phong cách học/ })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /1 bộ thẻ và Test yourself/ })).toBeInTheDocument();

		expect(await screen.findByText('Nhóm 2')).toBeInTheDocument();
		expect(screen.getByText('2 người')).toBeInTheDocument();
		expect(screen.getByText('Trần Bình')).toBeInTheDocument();
	});

	it('moves a chosen learning style out of the task callout into the Học tập card', () => {
		const board = sampleBoard();
		render(
			<StudentHome
				board={board}
				me={board.students[1]!}
				learningChoice="CHALLENGE"
				groupBoardEnabled={false}
				recallCount={0}
				onSelectMe={vi.fn()}
				onClearMe={vi.fn()}
				onOpenGradebook={vi.fn()}
				onOpenGroups={vi.fn()}
				onOpenRecall={vi.fn()}
				onOpenLearning={vi.fn()}
			/>,
		);

		expect(screen.queryByRole('button', { name: /Chọn phong cách học/ })).not.toBeInTheDocument();
		expect(screen.getByRole('region', { name: 'Học tập' })).toHaveTextContent(
			'Phong cách họcTeach me a lesson',
		);
		expect(screen.getByRole('button', { name: 'Đổi' })).toBeInTheDocument();
		expect(screen.getByText('Có nguy cơ')).toBeInTheDocument();
	});
});
