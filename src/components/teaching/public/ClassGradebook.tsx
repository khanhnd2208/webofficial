'use client';

import { useMemo, type RefObject } from 'react';

import { AttendanceGrid } from '../admin/AttendanceGrid';
import { ParticipationGrid } from '../admin/ParticipationGrid';
import type { BoardGridStudent } from '../board/gridTypes';
import type { PublicClassBoard } from '@/features/teaching/types';
import {
	PUBLIC_TUTORIAL_ALL,
	PUBLIC_TUTORIAL_UNASSIGNED,
	hasUnassignedPublicStudents,
	sessionMatchesPublicTutorial,
	shouldShowPublicTutorialFilter,
	studentMatchesPublicTutorial,
} from '@/features/teaching/domain/publicBoardFilter';

import { pinStudent, studentIdentitySummary } from './studentIdentity';
import { getPublicSummaryLockStatus, StudentSummaryPanel } from './StudentSummaryPanel';

function toGridStudent(student: PublicClassBoard['students'][number]): BoardGridStudent {
	return {
		enrollmentId: student.enrollmentId,
		orderNo: student.orderNo,
		tutorialClassId: student.tutorialClassId,
		enrolledFromWeek: student.enrolledFromWeek,
		studentCode: student.studentCode,
		familyName: student.familyName,
		givenName: student.givenName,
		marks: student.marks,
		participation: student.participation,
		cp: student.cp,
		learningExperience: student.learningExperience,
	};
}

export function ClassGradebook({
	board,
	tab,
	tutorialId,
	onTutorialChange,
	query,
	onQueryChange,
	meId,
	onChooseMe,
	gridWrapRef,
}: {
	board: PublicClassBoard;
	tab: 'attendance' | 'cp' | 'summary';
	tutorialId: string;
	onTutorialChange: (next: string) => void;
	query: string;
	onQueryChange: (next: string) => void;
	meId: string | null;
	onChooseMe: (enrollmentId: string) => void;
	gridWrapRef: RefObject<HTMLDivElement | null>;
}) {
	const hasUnassigned = useMemo(
		() => hasUnassignedPublicStudents(board.students),
		[board.students],
	);
	const scopedStudents = useMemo(
		() => board.students.filter((student) => studentMatchesPublicTutorial(student, tutorialId)),
		[board.students, tutorialId],
	);
	const scopedSessions = useMemo(
		() => board.sessions.filter((session) => sessionMatchesPublicTutorial(session, tutorialId)),
		[board.sessions, tutorialId],
	);
	const summarySessions = scopedSessions.length > 0 ? scopedSessions : board.sessions;
	const summaryLock = useMemo(
		() => getPublicSummaryLockStatus(summarySessions, board.policy.totalWeeks),
		[summarySessions, board.policy.totalWeeks],
	);
	const students = useMemo(() => scopedStudents.map(toGridStudent), [scopedStudents]);
	const filteredStudents = useMemo(() => {
		const value = query
			.trim()
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/đ/g, 'd');
		if (!value) return students;
		return students.filter((student) =>
			`${student.studentCode} ${student.familyName} ${student.givenName}`
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/đ/g, 'd')
				.includes(value),
		);
	}, [query, students]);
	const visibleStudents = useMemo(
		() => pinStudent(filteredStudents, meId),
		[filteredStudents, meId],
	);
	const me = visibleStudents.find((student) => student.enrollmentId === meId) ?? null;

	const showTutorialFilter = shouldShowPublicTutorialFilter({
		tutorialCount: board.tutorials.length,
		hasUnassigned,
	});

	return (
		<>
			{showTutorialFilter ? (
				<div className="flex flex-wrap items-center gap-2 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 py-2">
					<label htmlFor="public-tutorial" className="text-xs font-semibold text-ink-secondary">
						Tutorial
					</label>
					<select
						id="public-tutorial"
						value={tutorialId}
						onChange={(event) => onTutorialChange(event.target.value)}
						className="min-h-10 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm text-ink"
					>
						<option value={PUBLIC_TUTORIAL_ALL}>Toàn lớp</option>
						{hasUnassigned ? (
							<option value={PUBLIC_TUTORIAL_UNASSIGNED}>Chưa phân tutorial</option>
						) : null}
						{board.tutorials.map((tutorial) => (
							<option key={tutorial.id} value={tutorial.id}>
								{tutorial.code} · {tutorial.name}
							</option>
						))}
					</select>
				</div>
			) : null}

			{tab === 'summary' && !summaryLock.unlocked ? (
				<div id="public-panel-summary" role="tabpanel" aria-labelledby="public-tab-summary">
					<StudentSummaryPanel
						students={visibleStudents}
						sessions={summarySessions}
						totalWeeks={board.policy.totalWeeks}
						attendanceMaxPoints={board.policy.attendanceMaxPoints}
						cpMaxPoints={board.policy.cpMaxPoints}
						highlightedEnrollmentId={meId}
					/>
				</div>
			) : (
				<div
					id={
						tab === 'attendance'
							? 'public-panel-attendance'
							: tab === 'cp'
								? 'public-panel-cp'
								: 'public-panel-summary'
					}
					role="tabpanel"
					aria-labelledby={
						tab === 'attendance'
							? 'public-tab-attendance'
							: tab === 'cp'
								? 'public-tab-cp'
								: 'public-tab-summary'
					}
					className="mc-surface overflow-hidden"
				>
					<div className="mc-card-head mc-public-grid-head gap-2">
						<div className="flex min-w-0 items-center gap-2">
							<h2 className="text-base font-semibold text-ink">
								{tab === 'attendance'
									? 'Bảng điểm danh'
									: tab === 'cp'
										? 'Bảng điểm CP'
										: 'Bảng điểm tổng kết'}
							</h2>
							<span className="mc-chip">{filteredStudents.length} SV</span>
						</div>
						<label>
							<span className="sr-only">Mã sinh viên</span>
							<input
								value={query}
								onChange={(event) => onQueryChange(event.target.value)}
								placeholder="Tìm tên hoặc MSV"
								className="mc-public-grid-search min-h-10 w-44 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-xs sm:min-h-8 sm:w-56"
							/>
						</label>
						<label>
							<span className="sr-only">Đây là tôi</span>
							<select
								value={meId ?? ''}
								onChange={(event) => onChooseMe(event.target.value)}
								className="min-h-10 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-xs text-ink sm:min-h-8"
							>
								<option value="">Đây là tôi</option>
								{students.map((student) => (
									<option key={student.enrollmentId} value={student.enrollmentId}>
										{student.familyName} {student.givenName}
									</option>
								))}
							</select>
						</label>
					</div>
					{me ? (
						<p className="flex flex-wrap items-center gap-2 border-b border-mc-rule px-4 py-2 text-sm text-ink">
							<span>
								{studentIdentitySummary(
									me,
									board.policy.totalWeeks,
									board.policy.attendanceMaxPoints ?? 5,
								)}
							</span>
							<button
								type="button"
								className="mc-button min-h-11 px-3 text-xs"
								onClick={() => onChooseMe('')}
							>
								Bỏ chọn
							</button>
						</p>
					) : null}
					{filteredStudents.length === 0 ? (
						<p role="status" className="p-4 text-sm text-ink-secondary">
							{students.length === 0
								? tutorialId === PUBLIC_TUTORIAL_UNASSIGNED
									? 'Chưa có sinh viên chưa phân tutorial.'
									: tutorialId
										? 'Tutorial này chưa có sinh viên.'
										: 'Lớp này chưa có sinh viên.'
								: 'Không tìm thấy sinh viên phù hợp. Hãy thử tên hoặc mã khác.'}
						</p>
					) : null}
					{tab === 'attendance' ? (
						<div ref={gridWrapRef}>
							<AttendanceGrid
								students={visibleStudents}
								highlightedEnrollmentId={meId}
								sessions={scopedSessions}
								totalWeeks={board.policy.totalWeeks}
								attendanceMaxPoints={board.policy.attendanceMaxPoints}
								showEligibilityColumn={false}
								readOnly
								publicCompact
								scrollMode="page"
							/>
						</div>
					) : tab === 'cp' ? (
						<div ref={gridWrapRef}>
							<ParticipationGrid
								students={visibleStudents}
								highlightedEnrollmentId={meId}
								sessions={scopedSessions}
								totalWeeks={board.policy.totalWeeks}
								attendanceMaxPoints={board.policy.attendanceMaxPoints}
								cpMaxPoints={board.policy.cpMaxPoints}
								readOnly
								publicCompact
								scrollMode="page"
							/>
						</div>
					) : (
						<div ref={gridWrapRef}>
							<StudentSummaryPanel
								students={visibleStudents}
								sessions={summarySessions}
								totalWeeks={board.policy.totalWeeks}
								attendanceMaxPoints={board.policy.attendanceMaxPoints}
								cpMaxPoints={board.policy.cpMaxPoints}
								highlightedEnrollmentId={meId}
							/>
						</div>
					)}
				</div>
			)}
		</>
	);
}
