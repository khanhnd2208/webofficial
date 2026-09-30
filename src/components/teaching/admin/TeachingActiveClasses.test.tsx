import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { TeachingClassListItem, TeachingCourseListItem } from '@/features/teaching/types';

import { collectActiveClasses, TeachingActiveClasses } from './TeachingActiveClasses';

function teachingClass(overrides: Partial<TeachingClassListItem> = {}): TeachingClassListItem {
	return {
		id: 'class-1',
		courseId: 'course-1',
		courseCode: '61MGT3HRM',
		courseName: 'Quản trị nhân sự',
		groupNo: '01',
		classCode: 'HRM01',
		term: 'HK1 2026-2027',
		credits: 3,
		lecturerName: '',
		lecturerCode: '',
		totalWeeks: 15,
		attendanceMaxPoints: 10,
		cpMaxPoints: 10,
		absenceDeductionPoints: 1,
		lateDeductionPoints: 0.5,
		lateCountsTowardAbsenceThreshold: false,
		giftDeductionPoints: 0,
		absenceThresholdPercent: 20,
		lateGraceMinutes: 10,
		status: 'ACTIVE',
		publicSlug: 'hrm-01',
		publicTitle: '',
		publicSummary: '',
		publicDescription: '',
		publicAnnouncement: '',
		attendanceVisible: true,
		classRules: '',
		createdAt: '2026-09-01T00:00:00.000Z',
		updatedAt: '2026-09-10T00:00:00.000Z',
		studentCount: 42,
		tutorialCount: 1,
		sessionsTaken: 2,
		sessionCount: 15,
		averageAttendance: null,
		averageCp: null,
		averageTotal: null,
		atRiskCount: 1,
		bannedCount: 1,
		canDelete: false,
		deleteBlockers: {},
		...overrides,
	};
}

function course(
	classes: TeachingClassListItem[],
	overrides: Partial<TeachingCourseListItem> = {},
): TeachingCourseListItem {
	return {
		id: 'course-1',
		courseCode: '61MGT3HRM',
		courseName: 'Quản trị nhân sự',
		status: 'ACTIVE',
		createdAt: '2026-09-01T00:00:00.000Z',
		updatedAt: '2026-09-01T00:00:00.000Z',
		classCount: classes.length,
		activeClassCount: classes.length,
		tutorialCount: 1,
		deckCount: 0,
		publishedDeckCount: 0,
		activeDeckCount: 0,
		canDelete: false,
		canArchive: false,
		archiveBlockers: {},
		deleteBlockers: {},
		classes,
		...overrides,
	};
}

describe('collectActiveClasses', () => {
	it('flattens active classes from active courses, newest first', () => {
		const older = teachingClass({ id: 'older', updatedAt: '2026-09-01T00:00:00.000Z' });
		const newer = teachingClass({ id: 'newer', updatedAt: '2026-09-20T00:00:00.000Z' });
		const archived = teachingClass({ id: 'archived', status: 'ARCHIVED' });
		const inArchivedCourse = teachingClass({ id: 'in-archived-course' });
		const result = collectActiveClasses([
			course([older, archived]),
			course([newer], { id: 'course-2' }),
			course([inArchivedCourse], { id: 'course-3', status: 'ARCHIVED' }),
		]);
		expect(result.map((row) => row.id)).toEqual(['newer', 'older']);
	});
});

describe('TeachingActiveClasses', () => {
	it('opens a class straight into attendance and exposes the unchanged student link', () => {
		render(<TeachingActiveClasses courses={[course([teachingClass()])]} />);
		expect(screen.getByTestId('teaching-active-class-class-1')).toHaveAttribute(
			'href',
			'/my-space/teaching/class-1?tab=attendance',
		);
		expect(screen.getByText('2 cảnh báo')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Mở trang sinh viên lớp HRM01' })).toHaveAttribute(
			'href',
			'/lop/hrm-01',
		);
		expect(
			screen.getByRole('button', { name: 'Sao chép link sinh viên lớp HRM01' }),
		).toBeInTheDocument();
	});

	it('points private classes to the share settings instead of a public link', () => {
		render(
			<TeachingActiveClasses courses={[course([teachingClass({ attendanceVisible: false })])]} />,
		);
		expect(screen.queryByRole('link', { name: /Mở trang sinh viên/ })).toBeNull();
		expect(screen.getByRole('link', { name: /chưa chia sẻ/ })).toHaveAttribute(
			'href',
			'/my-space/teaching/class-1?tab=share',
		);
	});

	it('renders nothing without active classes', () => {
		const { container } = render(<TeachingActiveClasses courses={[course([])]} />);
		expect(container).toBeEmptyDOMElement();
	});
});
