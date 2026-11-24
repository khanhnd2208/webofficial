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

import type { GradebookView } from './publicBoardNav';
import { matchesStudentQuery, pinStudent } from './studentIdentity';
import { getPublicSummaryLockStatus, StudentSummaryPanel } from './StudentSummaryPanel';

const VIEW_OPTIONS: Array<{ value: GradebookView; label: string }> = [
	{ value: 'attendance', label: 'Điểm danh' },
	{ value: 'cp', label: 'CP' },
	{ value: 'summary', label: 'Tổng kết' },
];

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
	view,
	onViewChange,
	tutorialId,
	onTutorialChange,
	query,
	onQueryChange,
	meId,
	onOpenMe,
	gridWrapRef,
}: {
	board: PublicClassBoard;
	view: GradebookView;
	onViewChange: (next: GradebookView) => void;
	tutorialId: string;
	onTutorialChange: (next: string) => void;
	query: string;
	onQueryChange: (next: string) => void;
	meId: string | null;
	onOpenMe: () => void;
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
	const filteredStudents = useMemo(
		() => students.filter((student) => matchesStudentQuery(student, query)),
		[query, students],
	);
	const visibleStudents = useMemo(
		() => pinStudent(filteredStudents, meId),
		[filteredStudents, meId],
	);

	const showTutorialFilter = shouldShowPublicTutorialFilter({
		tutorialCount: board.tutorials.length,
		hasUnassigned,
	});
	const summaryLocked = view === 'summary' && !summaryLock.unlocked;

	return (
		<div
			id="public-panel-gradebook"
			role="tabpanel"
			aria-labelledby="public-tab-gradebook"
			className="space-y-3"
		>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div
					role="group"
					aria-label="Chế độ xem bảng điểm"
					className="inline-grid w-full grid-cols-3 rounded-[var(--mc-r-sm)] border border-mc-rule bg-surface-sunken p-1 sm:w-auto"
				>
					{VIEW_OPTIONS.map((option) => {
						const active = view === option.value;
						return (
							<button
								key={option.value}
								type="button"
								aria-pressed={active}
								onClick={() => onViewChange(option.value)}
								className={`min-h-11 rounded-[6px] px-3 text-sm font-semibold transition-colors ${
									active
										? 'bg-paper text-accent shadow-xs'
										: 'text-ink-secondary hover:text-ink'
								}`}
							>
								{option.label}
							</button>
						);
					})}
				</div>

				{!meId ? (
					<button
						type="button"
						onClick={onOpenMe}
						className="inline-flex min-h-11 items-center text-xs font-medium text-ink-secondary hover:text-accent"
					>
						Chọn bạn là ai để ghim hàng của bạn →
					</button>
				) : null}
			</div>

			{!summaryLocked || showTutorialFilter ? (
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					{!summaryLocked ? (
						<label className="min-w-0 flex-1 sm:max-w-xs">
							<span className="sr-only">Tìm sinh viên</span>
							<input
								type="search"
								value={query}
								onChange={(event) => onQueryChange(event.target.value)}
								placeholder={`Tìm trong ${scopedStudents.length} sinh viên`}
								className="mc-input w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm text-ink placeholder:text-ink-tertiary"
							/>
						</label>
					) : null}
					{showTutorialFilter ? (
						<div className="flex items-center gap-2 sm:ml-auto">
							<label
								htmlFor="public-tutorial"
								className="shrink-0 text-xs font-semibold text-ink-secondary"
							>
								Tutorial
							</label>
							<select
								id="public-tutorial"
								value={tutorialId}
								onChange={(event) => onTutorialChange(event.target.value)}
								className="min-h-11 flex-1 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm text-ink sm:flex-none"
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
				</div>
			) : null}

			{summaryLocked ? (
				<StudentSummaryPanel
					students={visibleStudents}
					sessions={summarySessions}
					totalWeeks={board.policy.totalWeeks}
					attendanceMaxPoints={board.policy.attendanceMaxPoints}
					cpMaxPoints={board.policy.cpMaxPoints}
					highlightedEnrollmentId={meId}
				/>
			) : (
				<div className="mc-surface overflow-hidden">
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
					{view === 'attendance' ? (
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
					) : view === 'cp' ? (
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
		</div>
	);
}
