import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { TeachingGradebook } from '@/features/teaching/types';

const api = vi.hoisted(() => ({ teachingApi: vi.fn() }));
vi.mock('./api', () => api);

import { mutationKey, useGradebookMutations } from './useGradebookMutations';

function initialGradebook(): TeachingGradebook {
	return {
		class: {
			id: 'c1',
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

function Harness() {
	const state = useGradebookMutations(initialGradebook());
	const key = mutationKey('attendance', 'e1', 's1');
	return (
		<div>
			<button
				type="button"
				onClick={() =>
					state.persistMark({ enrollmentId: 'e1', sessionId: 's1', status: 'LATE', note: '' })
				}
			>
				mark
			</button>
			<button type="button" onClick={() => state.retryMark('e1', 's1', 'attendance')}>
				retry
			</button>
			<button
				type="button"
				onClick={() => void state.updateSessionDate('s1', '2026-09-15').catch(() => undefined)}
			>
				date
			</button>
			<span data-testid="status">{state.gradebook.students[0]?.marks.s1?.status}</span>
			<span data-testid="date">{state.gradebook.sessions[0]?.heldOn ?? 'empty'}</span>
			<span data-testid="toast">{state.toast}</span>
			<span data-testid="save-state">{state.saveStates[key] ?? 'idle'}</span>
			<span data-testid="saving">{state.isSaving ? 'saving' : 'idle'}</span>
		</div>
	);
}

describe('useGradebookMutations', () => {
	it('rolls a failed optimistic attendance save back and retries the same payload', async () => {
		api.teachingApi.mockRejectedValueOnce(new Error('network down'));
		render(<Harness />);

		fireEvent.click(screen.getByRole('button', { name: 'mark' }));
		expect(screen.getByTestId('status')).toHaveTextContent('LATE');
		await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('PRESENT'));
		expect(screen.getByTestId('save-state')).toHaveTextContent('error');

		api.teachingApi.mockResolvedValueOnce({
			session: {
				id: 's1',
				classId: 'c1',
				tutorialClassId: 't1',
				weekNumber: 1,
				heldOn: null,
				topic: '',
				method: 'ROLL_CALL',
				isCancelled: false,
				attendanceTakenAt: '2026-09-01T00:00:00.000Z',
				participationTakenAt: null,
			},
			students: [
				{ ...initialGradebook().students[0], marks: { s1: { status: 'LATE', note: '' } } },
			],
			stats: initialGradebook().stats,
		});
		fireEvent.click(screen.getByRole('button', { name: 'retry' }));
		await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('LATE'));
		expect(screen.getByTestId('save-state')).toHaveTextContent('saved');
		expect(api.teachingApi).toHaveBeenLastCalledWith(
			'/api/admin/teaching/sessions/s1/attendance',
			expect.objectContaining({
				method: 'PUT',
				body: JSON.stringify({
					marks: [{ enrollmentId: 'e1', status: 'LATE', note: '' }],
				}),
			}),
		);
	});

	it('optimistically saves a session date and confirms success', async () => {
		api.teachingApi.mockResolvedValueOnce({
			...initialGradebook().sessions[0],
			heldOn: '2026-09-15',
		});
		render(<Harness />);

		fireEvent.click(screen.getByRole('button', { name: 'date' }));
		expect(screen.getByTestId('date')).toHaveTextContent('2026-09-15');
		await waitFor(() => expect(screen.getByTestId('toast')).toHaveTextContent('Đã lưu ngày học'));
		expect(api.teachingApi).toHaveBeenLastCalledWith(
			'/api/admin/teaching/sessions/s1',
			expect.objectContaining({
				method: 'PATCH',
				body: JSON.stringify({ heldOn: '2026-09-15' }),
			}),
		);
	});

	it('rolls a failed session date save back', async () => {
		api.teachingApi.mockRejectedValueOnce(new Error('network down'));
		render(<Harness />);

		fireEvent.click(screen.getByRole('button', { name: 'date' }));
		expect(screen.getByTestId('date')).toHaveTextContent('2026-09-15');
		await waitFor(() => expect(screen.getByTestId('date')).toHaveTextContent('empty'));
		expect(screen.getByTestId('toast')).toHaveTextContent('Lỗi lưu ngày: network down');
	});
});

describe('finalize while saving', () => {
	it.each(['attendance', 'participation'] as const)(
		'blocks %s finalization when an in-flight save fails',
		async (kind) => {
			api.teachingApi.mockReset();
			api.teachingApi.mockResolvedValue({
				session: initialGradebook().sessions[0],
				students: initialGradebook().students,
				stats: initialGradebook().stats,
			});
			let rejectSave!: (error: Error) => void;
			api.teachingApi.mockImplementationOnce(
				() =>
					new Promise((_, reject) => {
						rejectSave = reject;
					}),
			);
			const { result } = renderHook(() => useGradebookMutations(initialGradebook()));
			act(() => {
				if (kind === 'attendance')
					result.current.persistMark({
						enrollmentId: 'e1',
						sessionId: 's1',
						status: 'LATE',
						note: '',
					});
				else
					result.current.persistParticipation({
						enrollmentId: 'e1',
						sessionId: 's1',
						points: 1,
						note: '',
					});
			});
			await waitFor(() => expect(api.teachingApi).toHaveBeenCalledTimes(1));
			let finalization!: Promise<unknown>;
			act(() => {
				finalization = (
					kind === 'attendance'
						? result.current.setAttendanceLifecycle('s1', 'finalize')
						: result.current.setParticipationLifecycle('s1', 'finalize')
				).catch((error) => error);
			});
			await act(async () => {
				rejectSave(new Error('network down'));
				await finalization;
			});
			expect(api.teachingApi).toHaveBeenCalledTimes(1);
			expect(result.current.toast).toContain('chưa lưu thành công');
		},
	);
});

it.each(['attendance', 'participation'] as const)(
	'waits for %s saving, suppresses duplicate finalize, releases the busy state after success',
	async (kind) => {
		api.teachingApi.mockReset();
		let resolveSave!: (value: unknown) => void;
		const saved = {
			session: initialGradebook().sessions[0],
			students: initialGradebook().students,
			stats: initialGradebook().stats,
		};
		api.teachingApi
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						resolveSave = resolve;
					}),
			)
			.mockResolvedValue(saved);
		const { result } = renderHook(() => useGradebookMutations(initialGradebook()));
		const persist = () =>
			kind === 'attendance'
				? result.current.persistMark({
						enrollmentId: 'e1',
						sessionId: 's1',
						status: 'LATE',
						note: '',
					})
				: result.current.persistParticipation({
						enrollmentId: 'e1',
						sessionId: 's1',
						points: 1,
						note: '',
					});
		const finalize = () =>
			kind === 'attendance'
				? result.current.setAttendanceLifecycle('s1', 'finalize')
				: result.current.setParticipationLifecycle('s1', 'finalize');
		act(persist);
		await waitFor(() => expect(api.teachingApi).toHaveBeenCalledTimes(1));
		let pending!: Promise<void>;
		act(() => {
			pending = finalize();
			void finalize();
			persist();
		});
		expect(api.teachingApi).toHaveBeenCalledTimes(1);
		await act(async () => {
			resolveSave(saved);
			await pending;
		});
		expect(api.teachingApi).toHaveBeenCalledTimes(2);
		expect(api.teachingApi.mock.calls[1]?.[0]).toContain('/lock');
		expect(result.current.togglingSessionId).toBeNull();
	},
);
