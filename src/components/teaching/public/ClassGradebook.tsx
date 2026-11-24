'use client';

import { useMemo } from 'react';

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

import { ClassRoster } from './ClassRoster';
import { GradebookLegend } from './GradebookLegend';
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

	const emptyMessage =
		students.length === 0
			? tutorialId === PUBLIC_TUTORIAL_UNASSIGNED
				? 'Chưa có sinh viên chưa phân tutorial.'
				: tutorialId
					? 'Tutorial này chưa có sinh viên.'
					: 'Lớp này chưa có sinh viên.'
			: 'Không tìm thấy sinh viên phù hợp. Hãy thử tên hoặc 2 số cuối MSV.';

	return (
		<div
			id="public-panel-gradebook"
			role="tabpanel"
			aria-labelledby="public-tab-gradebook"
			className="space-y-4"
		>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div role="group" aria-label="Chế độ xem bảng điểm" className="teaching-public-switch">
					{VIEW_OPTIONS.map((option) => (
						<button
							key={option.value}
							type="button"
							aria-pressed={view === option.value}
							onClick={() => onViewChange(option.value)}
						>
							{option.label}
						</button>
					))}
				</div>

				{!summaryLocked ? (
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<label className="min-w-0 sm:w-64">
							<span className="sr-only">Tìm sinh viên</span>
							<input
								type="search"
								value={query}
								onChange={(event) => onQueryChange(event.target.value)}
								placeholder={`Tìm trong ${scopedStudents.length} sinh viên`}
								className="mc-input w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm text-ink placeholder:text-ink-tertiary"
							/>
						</label>
						{showTutorialFilter ? (
							<label className="flex items-center gap-2">
								<span className="shrink-0 text-xs text-ink-secondary">Tutorial</span>
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
							</label>
						) : null}
					</div>
				) : null}
			</div>

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
				<>
					<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
						{view === 'summary' ? (
							<p className="text-xs text-ink-secondary">
								Tổng = Chuyên cần + CP · đã chốt đủ {summaryLock.totalWeeks} tuần
							</p>
						) : (
							<GradebookLegend view={view} />
						)}
						{!meId ? (
							<button
								type="button"
								onClick={onOpenMe}
								className="inline-flex min-h-11 items-center text-xs text-ink-secondary hover:text-accent"
							>
								Chọn tên bạn để ghim lên đầu →
							</button>
						) : null}
					</div>
					{filteredStudents.length === 0 ? (
						<p role="status" className="border-y border-mc-rule py-6 text-sm text-ink-secondary">
							{emptyMessage}
						</p>
					) : (
						<ClassRoster
							students={visibleStudents}
							sessions={view === 'summary' ? summarySessions : scopedSessions}
							totalWeeks={board.policy.totalWeeks}
							view={view}
							meId={meId}
							attendanceMaxPoints={board.policy.attendanceMaxPoints}
							cpMaxPoints={board.policy.cpMaxPoints}
						/>
					)}
				</>
			)}
		</div>
	);
}
