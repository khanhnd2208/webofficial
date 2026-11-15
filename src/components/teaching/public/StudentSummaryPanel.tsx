import {
	ATTENDANCE_MAX_POINTS,
	CP_MAX_POINTS,
	DEFAULT_CP_POLICY,
	TOTAL_MAX_POINTS,
	formatTeachingScore,
	isAttendanceCounted,
	isParticipationCounted,
} from '@/features/teaching/domain/cp';
import type { TeachingSessionRecord } from '@/features/teaching/types';
import { studentInitials } from '../admin/attendanceLabels';
import type { BoardGridStudent } from '../board/gridTypes';
import { LearningExperienceMark } from './LearningExperienceMark';

export interface PublicSummaryLockStatus {
	totalWeeks: number;
	lockedAttendanceWeeks: number;
	lockedCpWeeks: number;
	unlocked: boolean;
}

/**
 * Counts locked attendance and CP weeks across 1..totalWeeks to gate the public summary table.
 * Cancelled sessions are skipped; a week with no sessions yet stays unlocked.
 */
export function getPublicSummaryLockStatus(
	sessions: TeachingSessionRecord[],
	totalWeeks = DEFAULT_CP_POLICY.totalWeeks,
): PublicSummaryLockStatus {
	const targetWeeks = Number.isFinite(totalWeeks)
		? Math.max(0, Math.floor(totalWeeks))
		: DEFAULT_CP_POLICY.totalWeeks;
	let lockedAttendanceWeeks = 0;
	let lockedCpWeeks = 0;

	for (let week = 1; week <= targetWeeks; week += 1) {
		const weekSessions = sessions.filter((session) => session.weekNumber === week);
		if (weekSessions.length === 0) continue;
		// A cancelled session has nothing to grade, so it never holds the week open. A week whose
		// sessions were all cancelled counts as settled.
		const heldSessions = weekSessions.filter((session) => !session.isCancelled);
		if (heldSessions.every(isAttendanceCounted)) lockedAttendanceWeeks += 1;
		if (heldSessions.every(isParticipationCounted)) lockedCpWeeks += 1;
	}

	return {
		totalWeeks: targetWeeks,
		lockedAttendanceWeeks,
		lockedCpWeeks,
		unlocked:
			targetWeeks > 0 &&
			lockedAttendanceWeeks === targetWeeks &&
			lockedCpWeeks === targetWeeks,
	};
}

function giftLabel(deduction: number): string {
	return String(deduction).replace('.', ',');
}

export interface StudentSummaryPanelProps {
	students: BoardGridStudent[];
	sessions: TeachingSessionRecord[];
	totalWeeks?: number;
	attendanceMaxPoints?: number;
	cpMaxPoints?: number;
	highlightedEnrollmentId?: string | null;
}

/** Public class summary tab showing lock progress until all weeks are finalized, then final scores. */
export function StudentSummaryPanel({
	students,
	sessions,
	totalWeeks = DEFAULT_CP_POLICY.totalWeeks,
	attendanceMaxPoints = ATTENDANCE_MAX_POINTS,
	cpMaxPoints = CP_MAX_POINTS,
	highlightedEnrollmentId = null,
}: StudentSummaryPanelProps) {
	const lockStatus = getPublicSummaryLockStatus(sessions, totalWeeks);

	if (!lockStatus.unlocked) {
		return (
			<section
				className="mc-surface space-y-2 p-5 sm:p-6"
				data-testid="summary-locked"
				role="status"
			>
				<h2 className="text-base font-semibold text-ink">Chưa mở bảng điểm tổng kết</h2>
				<p className="text-sm text-ink-secondary">
					Điểm tổng kết sẽ hiển thị khi tất cả {lockStatus.totalWeeks} tuần điểm danh và điểm CP đã
					được khóa.
				</p>
				<p className="mc-num text-sm font-medium text-ink">
					Tiến độ khóa điểm: Điểm danh {lockStatus.lockedAttendanceWeeks}/{lockStatus.totalWeeks}{' '}
					tuần · Điểm CP {lockStatus.lockedCpWeeks}/{lockStatus.totalWeeks} tuần
				</p>
			</section>
		);
	}

	return (
		<>
			<div
				className="mc-grid-wrap mc-grid-wrap-public"
				data-scroll-mode="page"
				role="region"
				aria-label="Bảng điểm tổng kết"
			>
				<table className="mc-grid text-center" data-testid="summary-grid">
					<caption className="sr-only">Bảng điểm tổng kết lớp học</caption>
					<thead>
						<tr>
							<th scope="col" className="whitespace-nowrap">
								STT
							</th>
							<th scope="col" className="whitespace-nowrap">
								Mã SV
							</th>
							<th scope="col" className="whitespace-nowrap text-left">
								Họ và tên
							</th>
							<th scope="col" className="whitespace-nowrap">
								Số buổi vắng
							</th>
							<th scope="col" className="whitespace-nowrap">
								Gift
							</th>
							<th
								scope="col"
								aria-label={`Chuyên cần /${attendanceMaxPoints}`}
								className="whitespace-nowrap"
							>
								<span className="mc-grid-summary-heading">
									<span>Chuyên cần</span>
									<span>/{attendanceMaxPoints}</span>
								</span>
							</th>
							<th
								scope="col"
								aria-label={`CP /${cpMaxPoints}`}
								className="whitespace-nowrap"
							>
								<span className="mc-grid-summary-heading">
									<span>CP</span>
									<span>/{cpMaxPoints}</span>
								</span>
							</th>
							<th
								scope="col"
								aria-label={`Tổng /${TOTAL_MAX_POINTS}`}
								className="whitespace-nowrap"
							>
								<span className="mc-grid-summary-heading">
									<span>Tổng</span>
									<span>/{TOTAL_MAX_POINTS}</span>
								</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{students.length === 0 ? (
							<tr>
								<td colSpan={8} className="p-8 text-center text-sm text-ink-secondary">
									Không tìm thấy mã sinh viên phù hợp.
								</td>
							</tr>
						) : (
							students.map((student) => (
								<tr
									key={student.enrollmentId}
									data-risk={student.cp.riskLevel}
									data-me={student.enrollmentId === highlightedEnrollmentId ? 'true' : undefined}
								>
									<td className="mc-num whitespace-nowrap">{student.orderNo}</td>
									<td className="mc-num whitespace-nowrap">{student.studentCode}</td>
									<td className="whitespace-nowrap text-left">
										<span className="inline-flex items-center gap-2">
											<span className="mc-avatar" aria-hidden>
												{studentInitials(student.familyName, student.givenName)}
											</span>
											<span className="font-semibold">
												{student.familyName} {student.givenName}
											</span>
											<LearningExperienceMark
												choice={student.learningExperience}
												index={student.orderNo}
												appearance="quiet"
											/>
										</span>
									</td>
									<td className="mc-num whitespace-nowrap">{student.cp.unexcusedAbsences}</td>
									<td className="mc-num whitespace-nowrap">
										−{giftLabel(student.cp.giftDeduction)}
									</td>
									<td className="mc-num whitespace-nowrap font-semibold">
										{formatTeachingScore(student.cp.attendanceScore)} / {attendanceMaxPoints}
									</td>
									<td className="mc-num whitespace-nowrap font-semibold">
										{formatTeachingScore(student.cp.cp)} / {cpMaxPoints}
									</td>
									<td className="mc-num whitespace-nowrap font-bold">
										{formatTeachingScore(student.cp.totalScore)} / {TOTAL_MAX_POINTS}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			<p className="mc-grid-score-context">
				Đã khóa đủ {lockStatus.totalWeeks}/{lockStatus.totalWeeks} tuần điểm danh và điểm CP · Tổng
				điểm = Chuyên cần + CP
			</p>
		</>
	);
}
