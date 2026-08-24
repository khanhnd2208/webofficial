'use client';

import { useEffect, useMemo, useState } from 'react';

import { Toast } from '@/components/ui/Dialog';
import type { TeachingGradebook } from '@/features/teaching/types';

import { AttendanceGrid } from './AttendanceGrid';
import { ParticipationGrid } from './ParticipationGrid';
import { TutorialSwitcher } from './TutorialSwitcher';
import { mutationKey, useGradebookMutations } from './useGradebookMutations';

type GradebookView = 'attendance' | 'participation';
export function GradebookWorkspace({
	initial,
	initialView = 'attendance',
	groupNumberByEnrollment,
}: {
	initial: TeachingGradebook;
	initialView?: GradebookView;
	groupNumberByEnrollment?: Record<string, number>;
}) {
	const {
		gradebook,
		persistMark,
		persistParticipation,
		persistGift,
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
		hasSaveError,
		saveStates,
		retryMark,
	} = useGradebookMutations(initial);
	const [tutorialId, setTutorialId] = useState(
		initial.tutorials.length === 1 ? (initial.tutorials[0]?.id ?? '') : '',
	);
	const [query, setQuery] = useState('');
	const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
	const view = initialView;

	const tutorialSessions = useMemo(
		() =>
			gradebook.sessions.filter((session) => !tutorialId || session.tutorialClassId === tutorialId),
		[gradebook.sessions, tutorialId],
	);
	const tutorialStudents = useMemo(
		() =>
			gradebook.students.filter((student) => !tutorialId || student.tutorialClassId === tutorialId),
		[gradebook.students, tutorialId],
	);
	const students = useMemo(() => {
		const q = query.trim().toLowerCase();
		return tutorialStudents.filter(
			(student) =>
				!q ||
				`${student.studentCode} ${student.familyName} ${student.givenName}`
					.toLowerCase()
					.includes(q),
		);
	}, [query, tutorialStudents]);
	const unassignedCount = useMemo(
		() =>
			gradebook.students.filter(
				(student) => student.status === 'ACTIVE' && !student.tutorialClassId,
			).length,
		[gradebook.students],
	);

	useEffect(() => {
		if (!isSaving) return;
		const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener('beforeunload', warnBeforeLeaving);
		return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
	}, [isSaving]);

	useEffect(() => {
		if (!toast) return;
		const timer = window.setTimeout(() => setToast(''), 3200);
		return () => window.clearTimeout(timer);
	}, [setToast, toast]);

	return (
		<div className="mc-gradebook-workspace flex min-h-0 flex-1 flex-col space-y-3">
			<div className="mc-gradebook-toolbar">
				{gradebook.tutorials.length > 1 ? (
					<TutorialSwitcher
						tutorials={gradebook.tutorials}
						value={tutorialId}
						onChange={(id) => {
							setTutorialId(id);
							setSelectedWeek(null);
						}}
					/>
				) : null}
				<label className="relative">
					<span className="sr-only">Tìm theo tên hoặc mã sinh viên</span>
					<input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Tìm tên hoặc MSV"
						className="mc-student-code-search"
					/>
				</label>
				{isSaving || hasSaveError ? (
					<span
						className="mc-save-status"
						data-tone={hasSaveError ? 'error' : 'saving'}
						aria-live="polite"
					>
						{hasSaveError ? 'Có lỗi cần thử lại' : 'Đang lưu…'}
					</span>
				) : null}
				{unassignedCount > 0 ? (
					<a className="mc-unassigned-hint" href="#teaching-students">
						{unassignedCount} học viên chưa phân tutorial
					</a>
				) : null}
			</div>

			{unassignedCount > 0 ? (
				<div id="teaching-students" className="mc-inline-warning" role="status">
					<span>{unassignedCount} học viên chưa có tutorial.</span>
					{gradebook.tutorials.length > 0
						? gradebook.students
								.filter((student) => student.status === 'ACTIVE' && !student.tutorialClassId)
								.slice(0, 3)
								.map((student) => (
									<label key={student.enrollmentId} className="inline-flex items-center gap-1.5">
										<span className="mc-num text-xs">{student.studentCode}</span>
										<select
											aria-label={`Phân tutorial cho ${student.studentCode}`}
											className="h-7 rounded border border-mc-rule bg-paper px-1 text-xs"
											defaultValue=""
											onChange={(event) => {
												if (event.target.value)
													void assignTutorial(student.enrollmentId, event.target.value);
											}}
										>
											<option value="" disabled>
												Chọn nhóm
											</option>
											{gradebook.tutorials.map((tutorial) => (
												<option key={tutorial.id} value={tutorial.id}>
													{tutorial.code}
												</option>
											))}
										</select>
									</label>
								))
						: null}
				</div>
			) : null}

			<div className="mc-gradebook-surface mc-surface flex min-h-0 flex-1 flex-col overflow-hidden">
				{view === 'attendance' ? (
					<AttendanceGrid
						students={students}
						sessions={tutorialSessions}
						totalWeeks={gradebook.class.totalWeeks}
						selectedWeek={selectedWeek}
						groupNumberByEnrollment={groupNumberByEnrollment}
						publicCompact
						scrollMode="contained"
						showEligibilityColumn={false}
						onWeekSelect={setSelectedWeek}
						onMarkChange={persistMark}
						onSessionToggle={(sessionId, open) => {
							void setAttendanceOpen(sessionId, open);
						}}
						onSessionLifecycle={(sessionId, action) => {
							void setAttendanceLifecycle(sessionId, action);
						}}
						onSessionDateChange={(session, heldOn) => updateSessionDate(session.id, heldOn)}
						togglingSessionId={togglingSessionId}
						saveState={(enrollmentId, sessionId) =>
							saveStates[mutationKey('attendance', enrollmentId, sessionId)]
						}
						onRetry={(enrollmentId, sessionId) => retryMark(enrollmentId, sessionId, 'attendance')}
					/>
				) : (
					<ParticipationGrid
						students={students}
						sessions={tutorialSessions}
						totalWeeks={gradebook.class.totalWeeks}
						selectedWeek={selectedWeek}
						publicCompact
						scrollMode="contained"
						onWeekSelect={setSelectedWeek}
						onParticipationChange={persistParticipation}
						onGiftChange={(enrollmentId, delta) => persistGift({ enrollmentId, delta })}
						onSessionToggle={(sessionId, open) => {
							void setParticipationOpen(sessionId, open);
						}}
						onSessionLifecycle={(sessionId, action) => {
							void setParticipationLifecycle(sessionId, action);
						}}
						togglingSessionId={togglingSessionId}
						saveState={(enrollmentId, sessionId) =>
							saveStates[mutationKey('participation', enrollmentId, sessionId)]
						}
						onRetry={(enrollmentId, sessionId) =>
							retryMark(enrollmentId, sessionId, 'participation')
						}
					/>
				)}
			</div>

			<Toast
				message={toast}
				visible={Boolean(toast)}
				onDismiss={() => setToast('')}
				className="mc-toast"
			/>
		</div>
	);
}
