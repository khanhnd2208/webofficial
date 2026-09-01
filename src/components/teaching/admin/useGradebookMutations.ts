'use client';

import { useRef, useState } from 'react';

import {
	computeCp,
	isParticipationCounted,
	sessionsForEnrollment,
	type AttendanceStatus,
} from '@/features/teaching/domain/cp';
import type { SessionLifecycleAction } from '@/features/teaching/schemas';
import type {
	TeachingAttendanceMark,
	TeachingAttendanceMutationResult,
	TeachingGiftMutationResult,
	TeachingGradebook,
	TeachingGradebookStudent,
	TeachingParticipationMark,
	TeachingParticipationMutationResult,
	TeachingSessionRecord,
} from '@/features/teaching/types';

import { teachingApi } from './api';

export type GradebookSaveState = 'saving' | 'saved' | 'error';
export type MutationKind = 'attendance' | 'participation' | 'gift';

export function mutationKey(kind: MutationKind, enrollmentId: string, sessionId: string) {
	return `${kind}:${enrollmentId}:${sessionId}`;
}

export function recomputeStudent(
	gradebook: TeachingGradebook,
	student: TeachingGradebookStudent,
	tutorialSessions = sessionsForEnrollment(
		gradebook.sessions.filter((session) => session.tutorialClassId === student.tutorialClassId),
		student.enrolledFromWeek,
	),
): TeachingGradebookStudent {
	return {
		...student,
		cp: computeCp(
			gradebook.policy,
			tutorialSessions.map((session) => {
				const mark = student.marks[session.id];
				return {
					isCancelled: session.isCancelled,
					attendanceTakenAt: session.attendanceTakenAt,
					attendanceOpen: session.attendanceOpen,
					participationTakenAt: session.participationTakenAt,
					participationOpen: session.participationOpen,
					status: mark?.status ?? null,
				};
			}),
			tutorialSessions
				.filter(isParticipationCounted)
				.map((session) => student.participation[session.id]?.points ?? 0),
			student.giftCount,
		),
	};
}

type AttendancePayload = {
	enrollmentId: string;
	sessionId: string;
	status: AttendanceStatus;
	note: string;
};

type ParticipationPayload = {
	enrollmentId: string;
	sessionId: string;
	points: 0 | 0.5 | 1 | 2;
	note: string;
};

type GiftPayload = {
	enrollmentId: string;
	delta: 1 | -1;
};

type CellSnapshot = {
	kind: MutationKind;
	enrollmentId: string;
	sessionId: string;
	attendance?: TeachingAttendanceMark;
	participation?: TeachingParticipationMark;
	giftCount?: number;
};

function summarizeGradebook(gradebook: TeachingGradebook): TeachingGradebook['stats'] {
	const active = gradebook.students.filter((student) => student.status === 'ACTIVE');
	const average = (selector: (student: TeachingGradebookStudent) => number) =>
		active.length
			? Math.round(
					(active.reduce((sum, student) => sum + selector(student), 0) / active.length) * 100,
				) / 100
			: null;
	return {
		studentCount: active.length,
		sessionsTaken: gradebook.sessions.filter(
			(session) => session.attendanceTakenAt && !session.attendanceOpen && !session.isCancelled,
		).length,
		averageAttendance: average((student) => student.cp.attendanceScore),
		averageCp: average((student) => student.cp.cp),
		averageTotal: average((student) => student.cp.totalScore),
		atRiskCount: active.filter((student) => student.cp.riskLevel === 'AT_RISK').length,
		bannedCount: active.filter((student) => student.cp.banned).length,
	};
}

function mergeCellResult(
	current: TeachingGradebook,
	result: TeachingAttendanceMutationResult | TeachingParticipationMutationResult,
	kind: MutationKind,
): TeachingGradebook {
	const sessions = current.sessions.map((session) =>
		session.id === result.session.id ? result.session : session,
	);
	const serverByEnrollment = new Map(
		result.students.map((student) => [student.enrollmentId, student]),
	);
	const next = {
		...current,
		sessions,
		students: current.students.map((student) => {
			const serverStudent = serverByEnrollment.get(student.enrollmentId);
			if (!serverStudent) return student;
			const nextStudent = { ...student };
			if (kind === 'attendance') {
				const marks = { ...student.marks };
				const mark = serverStudent.marks[result.session.id];
				if (mark) marks[result.session.id] = mark;
				else delete marks[result.session.id];
				nextStudent.marks = marks;
			} else {
				const participation = { ...student.participation };
				const mark = serverStudent.participation[result.session.id];
				if (mark) participation[result.session.id] = mark;
				else delete participation[result.session.id];
				nextStudent.participation = participation;
			}
			return recomputeStudent({ ...current, sessions }, nextStudent);
		}),
	};
	return { ...next, stats: summarizeGradebook(next) };
}

function snapshotFromStudent(
	student: TeachingGradebookStudent | undefined,
	kind: MutationKind,
	enrollmentId: string,
	sessionId: string,
): CellSnapshot {
	return {
		kind,
		enrollmentId,
		sessionId,
		attendance: kind === 'attendance' ? student?.marks[sessionId] : undefined,
		participation: kind === 'participation' ? student?.participation[sessionId] : undefined,
		giftCount: kind === 'gift' ? student?.giftCount : undefined,
	};
}

function restoreSnapshot(current: TeachingGradebook, snapshot: CellSnapshot): TeachingGradebook {
	const next = {
		...current,
		students: current.students.map((student) => {
			if (student.enrollmentId !== snapshot.enrollmentId) return student;
			const nextStudent = { ...student };
			if (snapshot.kind === 'attendance') {
				const marks = { ...student.marks };
				if (snapshot.attendance) marks[snapshot.sessionId] = snapshot.attendance;
				else delete marks[snapshot.sessionId];
				nextStudent.marks = marks;
			} else if (snapshot.kind === 'participation') {
				const participation = { ...student.participation };
				if (snapshot.participation) participation[snapshot.sessionId] = snapshot.participation;
				else delete participation[snapshot.sessionId];
				nextStudent.participation = participation;
			} else if (snapshot.giftCount !== undefined) {
				nextStudent.giftCount = snapshot.giftCount;
			}
			return recomputeStudent(current, nextStudent);
		}),
	};
	return { ...next, stats: summarizeGradebook(next) };
}

export function useGradebookMutations(initial: TeachingGradebook) {
	const [gradebook, setGradebook] = useState(initial);
	const [toast, setToast] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const [saveStates, setSaveStates] = useState<Record<string, GradebookSaveState>>({});
	const [togglingSessionId, setTogglingSessionId] = useState<string | null>(null);
	const queues = useRef(new Map<string, Promise<void>>());
	const revisions = useRef(new Map<string, number>());
	const retryPayloads = useRef(
		new Map<string, AttendancePayload | ParticipationPayload | GiftPayload>(),
	);
	const snapshots = useRef(new Map<string, CellSnapshot>());
	const pendingCount = useRef(0);

	function nextRevision(key: string) {
		const revision = (revisions.current.get(key) ?? 0) + 1;
		revisions.current.set(key, revision);
		setSaveStates((current) => ({ ...current, [key]: 'saving' }));
		pendingCount.current += 1;
		setIsSaving(true);
		return revision;
	}

	function finishRevision(key: string, revision: number, state: GradebookSaveState) {
		pendingCount.current = Math.max(0, pendingCount.current - 1);
		setIsSaving(pendingCount.current > 0);
		if (revisions.current.get(key) === revision) {
			setSaveStates((current) => ({ ...current, [key]: state }));
		}
	}

	function enqueue(key: string, revision: number, runner: () => Promise<void>) {
		const previous = queues.current.get(key) ?? Promise.resolve();
		const tracked = previous
			.catch(() => undefined)
			.then(runner)
			.finally(() => {
				if (queues.current.get(key) === tracked) queues.current.delete(key);
			});
		queues.current.set(key, tracked);
		void tracked.catch(() => finishRevision(key, revision, 'error'));
	}

	function persistMark(payload: AttendancePayload) {
		const key = mutationKey('attendance', payload.enrollmentId, payload.sessionId);
		const revision = nextRevision(key);
		retryPayloads.current.set(key, payload);
		setGradebook((current) => {
			if (!snapshots.current.has(key)) {
				snapshots.current.set(
					key,
					snapshotFromStudent(
						current.students.find((student) => student.enrollmentId === payload.enrollmentId),
						'attendance',
						payload.enrollmentId,
						payload.sessionId,
					),
				);
			}
			return {
				...current,
				students: current.students.map((student) => {
					if (student.enrollmentId !== payload.enrollmentId) return student;
					return recomputeStudent(current, {
						...student,
						marks: {
							...student.marks,
							[payload.sessionId]: { status: payload.status, note: payload.note },
						},
					});
				}),
			};
		});
		enqueue(key, revision, async () => {
			try {
				const result = await teachingApi<TeachingAttendanceMutationResult>(
					`/api/admin/teaching/sessions/${payload.sessionId}/attendance`,
					{
						method: 'PUT',
						body: JSON.stringify({
							marks: [
								{
									enrollmentId: payload.enrollmentId,
									status: payload.status,
									note: payload.note,
								},
							],
						}),
					},
				);
				if (revisions.current.get(key) === revision) {
					setGradebook((current) => mergeCellResult(current, result, 'attendance'));
					snapshots.current.delete(key);
					setToast('Đã lưu điểm danh');
				} else {
					const serverStudent = result.students.find(
						(student) => student.enrollmentId === payload.enrollmentId,
					);
					const mark = serverStudent?.marks[result.session.id];
					if (mark)
						snapshots.current.set(key, { ...snapshots.current.get(key)!, attendance: mark });
				}
				finishRevision(key, revision, 'saved');
			} catch (error) {
				if (revisions.current.get(key) === revision) {
					const snapshot = snapshots.current.get(key);
					if (snapshot) setGradebook((current) => restoreSnapshot(current, snapshot));
					snapshots.current.delete(key);
					setToast(
						error instanceof Error
							? `Lỗi lưu điểm danh: ${error.message}`
							: 'Không thể lưu điểm danh',
					);
				}
				finishRevision(key, revision, 'error');
			}
		});
	}

	function persistParticipation(payload: ParticipationPayload) {
		const key = mutationKey('participation', payload.enrollmentId, payload.sessionId);
		const revision = nextRevision(key);
		retryPayloads.current.set(key, payload);
		setGradebook((current) => {
			if (!snapshots.current.has(key)) {
				snapshots.current.set(
					key,
					snapshotFromStudent(
						current.students.find((student) => student.enrollmentId === payload.enrollmentId),
						'participation',
						payload.enrollmentId,
						payload.sessionId,
					),
				);
			}
			return {
				...current,
				students: current.students.map((student) => {
					if (student.enrollmentId !== payload.enrollmentId) return student;
					const participation = { ...student.participation };
					if (payload.points === 0 && !payload.note) delete participation[payload.sessionId];
					else participation[payload.sessionId] = { points: payload.points, note: payload.note };
					return recomputeStudent(current, { ...student, participation });
				}),
			};
		});
		enqueue(key, revision, async () => {
			try {
				const result = await teachingApi<TeachingParticipationMutationResult>(
					`/api/admin/teaching/sessions/${payload.sessionId}/participation`,
					{
						method: 'PUT',
						body: JSON.stringify({
							marks: [
								{ enrollmentId: payload.enrollmentId, points: payload.points, note: payload.note },
							],
						}),
					},
				);
				if (revisions.current.get(key) === revision) {
					setGradebook((current) => mergeCellResult(current, result, 'participation'));
					snapshots.current.delete(key);
					setToast('Đã lưu CP');
				} else {
					const serverStudent = result.students.find(
						(student) => student.enrollmentId === payload.enrollmentId,
					);
					const mark = serverStudent?.participation[result.session.id];
					if (mark)
						snapshots.current.set(key, { ...snapshots.current.get(key)!, participation: mark });
				}
				finishRevision(key, revision, 'saved');
			} catch (error) {
				if (revisions.current.get(key) === revision) {
					const snapshot = snapshots.current.get(key);
					if (snapshot) setGradebook((current) => restoreSnapshot(current, snapshot));
					snapshots.current.delete(key);
					setToast(error instanceof Error ? `Lỗi lưu CP: ${error.message}` : 'Không thể lưu CP');
				}
				finishRevision(key, revision, 'error');
			}
		});
	}

	function mergeGiftResult(
		current: TeachingGradebook,
		result: TeachingGiftMutationResult,
	): TeachingGradebook {
		const next = {
			...current,
			students: current.students.map((student) =>
				student.enrollmentId === result.student.enrollmentId ? result.student : student,
			),
		};
		return { ...next, stats: summarizeGradebook(next) };
	}

	function persistGift(payload: GiftPayload) {
		const key = mutationKey('gift', payload.enrollmentId, 'aggregate');
		const revision = nextRevision(key);
		retryPayloads.current.set(key, payload);
		setGradebook((current) => {
			if (!snapshots.current.has(key)) {
				snapshots.current.set(
					key,
					snapshotFromStudent(
						current.students.find((student) => student.enrollmentId === payload.enrollmentId),
						'gift',
						payload.enrollmentId,
						'aggregate',
					),
				);
			}
			return {
				...current,
				students: current.students.map((student) => {
					if (student.enrollmentId !== payload.enrollmentId) return student;
					const giftCount = Math.max(0, student.giftCount + payload.delta);
					return recomputeStudent(current, { ...student, giftCount });
				}),
			};
		});
		enqueue(key, revision, async () => {
			try {
				const result = await teachingApi<TeachingGiftMutationResult>(
					`/api/admin/teaching/enrollments/${payload.enrollmentId}/gift`,
					{
						method: 'PATCH',
						body: JSON.stringify({ delta: payload.delta }),
					},
				);
				if (revisions.current.get(key) === revision) {
					setGradebook((current) => mergeGiftResult(current, result));
					snapshots.current.delete(key);
					setToast(payload.delta === 1 ? 'Đã thêm Gift' : 'Đã hoàn tác Gift');
				} else {
					const snapshot = snapshots.current.get(key);
					if (snapshot)
						snapshots.current.set(key, { ...snapshot, giftCount: result.student.giftCount });
				}
				finishRevision(key, revision, 'saved');
			} catch (error) {
				if (revisions.current.get(key) === revision) {
					const snapshot = snapshots.current.get(key);
					if (snapshot) setGradebook((current) => restoreSnapshot(current, snapshot));
					snapshots.current.delete(key);
					setToast(
						error instanceof Error ? `Lỗi lưu Gift: ${error.message}` : 'Không thể lưu Gift',
					);
				}
				finishRevision(key, revision, 'error');
			}
		});
	}

	function retryMark(enrollmentId: string, sessionId: string, kind: MutationKind) {
		const payload = retryPayloads.current.get(mutationKey(kind, enrollmentId, sessionId));
		if (payload) {
			if (kind === 'attendance') persistMark(payload as AttendancePayload);
			else if (kind === 'participation') persistParticipation(payload as ParticipationPayload);
			else persistGift(payload as GiftPayload);
		}
	}

	async function flushPending(kind: 'attendance' | 'participation', sessionId: string) {
		const pending = [...queues.current.entries()]
			.filter(([key]) => key.startsWith(`${kind}:`) && key.endsWith(`:${sessionId}`))
			.map(([, request]) => request);
		if (pending.length) await Promise.all(pending);
		const failed = Object.entries(saveStates).some(
			([key, state]) =>
				key.startsWith(`${kind}:`) && key.endsWith(`:${sessionId}`) && state === 'error',
		);
		if (failed)
			throw new Error('Có ô chưa lưu thành công trong tuần này. Hãy thử lại trước khi chốt.');
	}

	async function setAttendanceLifecycle(
		sessionId: string,
		action: SessionLifecycleAction,
		heldOn?: string | null,
	) {
		setTogglingSessionId(sessionId);
		try {
			await flushPending('attendance', sessionId);
			const result = await teachingApi<TeachingAttendanceMutationResult>(
				`/api/admin/teaching/sessions/${sessionId}/attendance/lock`,
				{
					method: 'PATCH',
					body: JSON.stringify({ action, ...(heldOn !== undefined ? { heldOn } : {}) }),
				},
			);
			setGradebook((current) => mergeCellResult(current, result, 'attendance'));
			const week = result.session.weekNumber;
			setToast(
				action === 'open' || action === 'unfinalize'
					? `Đã mở buổi tuần ${week}`
					: action === 'finalize'
						? `Đã chốt điểm danh tuần ${week}`
						: `Đã khóa buổi tuần ${week}; dữ liệu vẫn được giữ`,
			);
		} catch (error) {
			setToast(
				error instanceof Error ? error.message : 'Không thể cập nhật trạng thái buổi điểm danh',
			);
			throw error;
		} finally {
			setTogglingSessionId(null);
		}
	}

	async function setAttendanceOpen(sessionId: string, open: boolean, heldOn?: string | null) {
		return setAttendanceLifecycle(sessionId, open ? 'open' : 'park', heldOn);
	}

	async function setParticipationLifecycle(sessionId: string, action: SessionLifecycleAction) {
		setTogglingSessionId(sessionId);
		try {
			await flushPending('participation', sessionId);
			const result = await teachingApi<TeachingParticipationMutationResult>(
				`/api/admin/teaching/sessions/${sessionId}/participation/lock`,
				{
					method: 'PATCH',
					body: JSON.stringify({ action }),
				},
			);
			setGradebook((current) => mergeCellResult(current, result, 'participation'));
			const week = result.session.weekNumber;
			setToast(
				action === 'open' || action === 'unfinalize'
					? `Đã mở chấm CP tuần ${week}`
					: action === 'finalize'
						? `Đã chốt CP tuần ${week}`
						: `Đã khóa chấm CP tuần ${week}; dữ liệu vẫn được giữ`,
			);
		} catch (error) {
			setToast(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái chấm CP');
			throw error;
		} finally {
			setTogglingSessionId(null);
		}
	}

	async function setParticipationOpen(sessionId: string, open: boolean) {
		return setParticipationLifecycle(sessionId, open ? 'open' : 'park');
	}

	async function updateSessionDate(sessionId: string, heldOn: string | null) {
		let previousDate: string | null = null;
		setGradebook((current) => {
			const currentSession = current.sessions.find((session) => session.id === sessionId);
			previousDate = currentSession?.heldOn ?? null;
			return {
				...current,
				sessions: current.sessions.map((session) =>
					session.id === sessionId ? { ...session, heldOn } : session,
				),
			};
		});
		try {
			const updated = await teachingApi<TeachingSessionRecord>(
				`/api/admin/teaching/sessions/${sessionId}`,
				{
					method: 'PATCH',
					// A teacher can switch from attendance to CP immediately after choosing a date.
					// Keep this small mutation alive across that navigation so the session date is not lost.
					keepalive: true,
					body: JSON.stringify({ heldOn }),
				},
			);
			setGradebook((current) => ({
				...current,
				sessions: current.sessions.map((session) =>
					session.id === updated.id ? updated : session,
				),
			}));
			setToast('Đã lưu ngày học');
		} catch (error) {
			setGradebook((current) => ({
				...current,
				sessions: current.sessions.map((session) =>
					session.id === sessionId && session.heldOn === heldOn
						? { ...session, heldOn: previousDate }
						: session,
				),
			}));
			setToast(
				error instanceof Error ? `Lỗi lưu ngày: ${error.message}` : 'Không thể lưu ngày học',
			);
		}
	}

	async function persistNote(enrollmentId: string, note: string) {
		const student = gradebook.students.find((item) => item.enrollmentId === enrollmentId);
		if (!student) return;
		const previous = gradebook;
		setGradebook((current) => ({
			...current,
			students: current.students.map((item) =>
				item.enrollmentId === enrollmentId ? { ...item, note } : item,
			),
		}));
		try {
			await teachingApi(`/api/admin/teaching/enrollments/${enrollmentId}`, {
				method: 'PATCH',
				body: JSON.stringify({ note }),
			});
			setToast('Đã lưu ghi chú');
		} catch (error) {
			setGradebook(previous);
			setToast(error instanceof Error ? error.message : 'Không thể lưu ghi chú');
		}
	}

	async function assignTutorial(enrollmentId: string, tutorialClassId: string) {
		try {
			await teachingApi(`/api/admin/teaching/enrollments/${enrollmentId}`, {
				method: 'PATCH',
				body: JSON.stringify({ tutorialClassId }),
			});
			const next = await teachingApi<TeachingGradebook>(
				`/api/admin/teaching/classes/${gradebook.class.id}/gradebook`,
			);
			setGradebook(next);
			setToast('Đã phân tutorial');
		} catch (error) {
			setToast(error instanceof Error ? error.message : 'Không thể phân tutorial');
		}
	}

	const errorCount = Object.values(saveStates).filter((state) => state === 'error').length;
	return {
		gradebook,
		setGradebook,
		persistMark,
		persistParticipation,
		persistGift,
		persistNote,
		assignTutorial,
		setAttendanceOpen,
		setAttendanceLifecycle,
		setParticipationOpen,
		setParticipationLifecycle,
		updateSessionDate,
		togglingSessionId,
		toast,
		setToast,
		isSaving,
		hasSaveError: errorCount > 0,
		saveStates,
		retryMark,
	};
}
