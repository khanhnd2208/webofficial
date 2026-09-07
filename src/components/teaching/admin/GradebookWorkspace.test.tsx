import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TeachingGradebook } from '@/features/teaching/types';
import { GradebookWorkspace } from './GradebookWorkspace';
vi.mock('next/navigation', () => ({ useRouter: () => ({push: vi.fn()}), useSearchParams: () => new URLSearchParams() }));
vi.mock('./AttendanceGrid', () => ({ AttendanceGrid: ({students,sessions}: Pick<TeachingGradebook,'students'|'sessions'>) => <output data-testid="scoped">{JSON.stringify({students,sessions})}</output> }));
vi.mock('./ParticipationGrid', () => ({ ParticipationGrid: ({students,sessions}: Pick<TeachingGradebook,'students'|'sessions'>) => <output data-testid="scoped">{JSON.stringify({students,sessions})}</output> }));
function initialGradebook(): TeachingGradebook {
	return {
		class: {
			id: 'c1',
			courseId: 'course-1',
			courseCode: 'HRM',
			courseName: 'HRM',
			groupNo: '1',
			term: 'HK1',
			credits: null,
			lecturerName: '',
			lecturerCode: '',
			totalWeeks: 1,
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
			createdAt: '',
			updatedAt: '',
		},
		policy: { totalWeeks: 1, absenceThresholdPercent: 20 },
		tutorials: [],
		sessions: [
			{
				id: 's1',
				classId: 'c1',
				tutorialClassId: 't1',
				weekNumber: 1,
				heldOn: null,
				topic: '',
				method: 'ROLL_CALL',
				isCancelled: false,
				attendanceTakenAt: '2026-09-01T00:00:00.000Z',
				attendanceOpen: true,
				participationTakenAt: '2026-09-01T00:00:00.000Z',
				participationOpen: true,
			},
		],
		students: [
			{
				enrollmentId: 'e1',
				studentId: 'st1',
				orderNo: 1,
				tutorialClassId: 't1',
				enrolledFromWeek: 1,
				status: 'ACTIVE',
				giftCount: 0,
				studentCode: 'SV01',
				familyName: 'Nguyễn',
				givenName: 'An',
				homeClassCode: '',
				majorName: '',
				dateOfBirth: null,
				email: null,
				note: '',
				marks: { s1: { status: 'PRESENT', note: '' } },
				participation: {},
				cp: {
					takenSessions: 1,
					unexcusedAbsences: 0,
					excusedAbsences: 0,
					lateCount: 0,
					presentCount: 1,
					makeupCount: 0,
					participationTotal: 0,
					giftDeduction: 0,
					absenceDeduction: 0,
					attendanceScore: 5,
					banLimit: 0.2,
					banned: false,
					examEligible: true,
					cp: 0,
					totalScore: 5,
					riskLevel: 'OK',
				},
			},
		],
		stats: {
			studentCount: 1,
			sessionsTaken: 1,
			averageAttendance: 5,
			averageCp: 0,
			averageTotal: 5,
			atRiskCount: 0,
			bannedCount: 0,
		},
	};
}

describe('tutorial isolation', () => {
 for (const view of ['attendance', 'participation'] as const) {
  it('isolates same-week sessions and student marks in ' + view, () => {
   const initial = initialGradebook();
   initial.tutorials = ['t1','t2'].map((id,index) => ({id,classId:'c1',code:id,name:id,room:'',scheduleNote:'',displayOrder:index,studentCount:1}));
   initial.sessions[0]!.heldOn = '2026-09-01';
   initial.sessions.push({...initial.sessions[0]!,id:'s2',tutorialClassId:'t2',heldOn:'2026-09-03'});
   initial.students.push({...initial.students[0]!,enrollmentId:'e2',studentId:'st2',studentCode:'SV02',tutorialClassId:'t2',marks:{s2:{status:'ABSENT_UNEXCUSED',note:''}},participation:{s2:{points:3,note:''}}});
   render(<GradebookWorkspace initial={initial} initialView={view} />);
   let scoped = JSON.parse(screen.getByTestId('scoped').textContent!);
   expect(scoped.sessions.map((item: {id:string})=>item.id)).toEqual(['s1']);
   expect(scoped.students.map((item: {enrollmentId:string})=>item.enrollmentId)).toEqual(['e1']);
   fireEvent.click(screen.getByRole('button',{name:/Tutorial Class/}));
   fireEvent.click(screen.getByRole('option',{name:'t2 · t2'}));
   scoped = JSON.parse(screen.getByTestId('scoped').textContent!);
   expect(scoped.sessions).toHaveLength(1);
   expect(scoped.sessions[0]).toMatchObject({id:'s2',heldOn:'2026-09-03',weekNumber:1});
   expect(scoped.students).toHaveLength(1);
   expect(scoped.students[0].participation.s2.points).toBe(3);
   expect(new URLSearchParams(window.location.search).get('tutorial')).toBe('t2');
  });
 }
});
