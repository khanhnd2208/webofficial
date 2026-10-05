'use client';

import { useSurfaceTheme } from '@/components/ui/SurfaceTheme';

import { useEffect, useMemo, useRef, useState } from 'react';

import { createPortal } from 'react-dom';
import { GridWeekActions } from './GridWeekActions';
import { McIcon } from '@/components/myclass/ui';
import { LearningExperienceMark } from '@/components/teaching/public/LearningExperienceMark';
import {
	ATTENDANCE_MAX_POINTS,
	formatTeachingScore,
	type AttendanceStatus,
} from '@/features/teaching/domain/cp';
import type { SessionLifecycleAction } from '@/features/teaching/schemas';
import type { TeachingAttendanceMark, TeachingSessionRecord } from '@/features/teaching/types';
import type { BoardGridStudent } from '../board/gridTypes';
import type { GradebookSaveState } from './useGradebookMutations';

import {
	currentWeekNumber,
	formatDob,
	sessionDateLabel,
	STATUS_ICON,
	STATUS_OPTIONS,
	studentInitials,
	weekColumns,
} from './attendanceLabels';
import { SessionDateInput } from './SessionDateInput';
import { useGridNotePopover } from './useGridNotePopover';
import { scrollGridWeekIntoView, syncGridScrollState, type GridScrollMode } from './gridScroll';

export interface AttendanceGridProps {
	students: BoardGridStudent[];
	sessions: TeachingSessionRecord[];
	totalWeeks: number;
	attendanceMaxPoints?: number;
	selectedWeek?: number | null;
	allowUnstartedEdit?: boolean;
	showExtraColumns?: boolean;
	readOnly?: boolean;
	publicCompact?: boolean;
	scrollMode?: GridScrollMode;
	groupNumberByEnrollment?: Record<string, number>;
	showEligibilityColumn?: boolean;
	highlightedEnrollmentId?: string | null;
	onMarkChange?: (payload: {
		enrollmentId: string;
		sessionId: string;
		status: AttendanceStatus;
		note: string;
	}) => void;
	onSessionToggle?: (sessionId: string, open: boolean) => void;
	onSessionLifecycle?: (sessionId: string, action: SessionLifecycleAction) => void;
	onSessionDateChange?: (
		session: TeachingSessionRecord,
		heldOn: string | null,
	) => void | Promise<void>;
	sessionDateSaveState?: (sessionId: string) => GradebookSaveState | undefined;
	onWeekSelect?: (weekNumber: number) => void;
	togglingSessionId?: string | null;
	saveState?: (enrollmentId: string, sessionId: string) => GradebookSaveState | undefined;
	onRetry?: (enrollmentId: string, sessionId: string) => void;
}

type CellKey = { enrollmentId: string; sessionId: string };

function cellId(enrollmentId: string, sessionId: string) {
	return `att-${enrollmentId}-${sessionId}`;
}

function statusFromKey(key: string): AttendanceStatus | null {
	return STATUS_OPTIONS.find((option) => option.key === key.toUpperCase())?.status ?? null;
}

function cycleAttendanceStatus(status: AttendanceStatus | undefined): AttendanceStatus {
	if (
		!status ||
		status === 'ABSENT_UNEXCUSED' ||
		status === 'ABSENT_EXCUSED' ||
		status === 'MAKEUP'
	)
		return 'PRESENT';
	if (status === 'PRESENT') return 'LATE';
	return 'ABSENT_UNEXCUSED';
}

function attendanceTooltip(
	status: AttendanceStatus | undefined,
	note: string | undefined,
	fallback = 'Chưa điểm danh',
) {
	if (!status) return fallback;
	const label = STATUS_OPTIONS.find((option) => option.status === status)?.label ?? status;
	return note?.trim() ? `${label} - ${note.trim()}` : label;
}

function AttendanceNoteEditor({
	mark,
	onClose,
	onSave,
	onStatus,
	readOnly = false,
}: {
	mark: TeachingAttendanceMark | { status: AttendanceStatus; note?: string } | undefined;
	onClose: () => void;
	onSave: (note: string) => void;
	onStatus: (status: AttendanceStatus, note: string) => void;
	readOnly?: boolean;
}) {
	const surface = useSurfaceTheme();
	const [note, setNote] = useState(mark?.note ?? '');
	const { rootRef, textareaRef } = useGridNotePopover(onClose);
	return createPortal(
		<div className="mc mc-studio teaching-portal" data-surface={surface}>
			<div
				ref={rootRef}
				role="dialog"
				aria-label="Ghi chú điểm danh"
				className="mc-grid-note-panel w-64 rounded-[var(--mc-r-md)] border border-mc-rule bg-paper p-3 text-left shadow-[var(--mc-shadow-2)]"
			>
				<p className="text-xs font-semibold text-ink">Ghi chú / trạng thái đặc biệt</p>
				{readOnly ? (
					<p className="mt-2 whitespace-pre-wrap text-sm text-ink-secondary">
						{note || 'Không có ghi chú.'}
					</p>
				) : (
					<textarea
						ref={textareaRef}
						value={note}
						onChange={(event) => setNote(event.target.value)}
						placeholder="Nhập ghi chú…"
						maxLength={240}
						rows={3}
						className="mt-2 w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper p-2 text-sm"
					/>
				)}
				{!readOnly ? (
					<div className="mt-2 grid grid-cols-2 gap-1">
						{STATUS_OPTIONS.map((option) => (
							<button
								key={option.status}
								type="button"
								className="min-h-8 rounded-[var(--mc-r-xs)] border border-mc-rule px-2 text-xs font-semibold hover:bg-surface-sunken"
								onClick={() => onStatus(option.status, note)}
							>
								{option.label}
							</button>
						))}
					</div>
				) : null}
				<div className="mt-3 flex justify-end gap-2">
					<button
						type="button"
						className="min-h-8 px-2 text-xs font-semibold text-ink-secondary"
						onClick={onClose}
					>
						{readOnly ? 'Đóng' : 'Huỷ'}
					</button>
					{!readOnly ? (
						<button
							type="button"
							className="min-h-8 rounded-[var(--mc-r-sm)] bg-ink px-3 text-xs font-semibold text-paper"
							onClick={() => onSave(note)}
						>
							Lưu ghi chú
						</button>
					) : null}
				</div>
			</div>
		</div>,
		document.body,
	);
}

export function AttendanceGrid({
	students,
	sessions,
	totalWeeks,
	attendanceMaxPoints = ATTENDANCE_MAX_POINTS,
	selectedWeek = null,
	allowUnstartedEdit = false,
	showExtraColumns = false,
	readOnly = false,
	publicCompact = false,
	scrollMode = 'contained',
	groupNumberByEnrollment,
	showEligibilityColumn = true,
	highlightedEnrollmentId = null,
	onMarkChange,
	onSessionToggle,
	onSessionLifecycle,
	onSessionDateChange,
	sessionDateSaveState,
	onWeekSelect,
	togglingSessionId = null,
	saveState,
	onRetry,
}: AttendanceGridProps) {
	const [noteCell, setNoteCell] = useState<CellKey | null>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const cycleValues = useRef(new Map<string, AttendanceStatus>());
	const weeks = useMemo(() => weekColumns(sessions, totalWeeks), [sessions, totalWeeks]);
	const currentWeek = useMemo(() => currentWeekNumber(sessions), [sessions]);
	const hasGroupColumn = Boolean(groupNumberByEnrollment);

	useEffect(() => {
		if (!selectedWeek) return;
		scrollGridWeekIntoView(wrapperRef.current, selectedWeek);
	}, [selectedWeek]);
	useEffect(() => {
		if (!publicCompact || selectedWeek || !currentWeek) return;
		scrollGridWeekIntoView(wrapperRef.current, currentWeek);
	}, [currentWeek, publicCompact, selectedWeek]);

	useEffect(() => {
		const wrapper = wrapperRef.current;
		if (!wrapper) return;
		const update = () => syncGridScrollState(wrapper);
		let resizeFrame = 0;
		const resize = () => {
			window.cancelAnimationFrame(resizeFrame);
			resizeFrame = window.requestAnimationFrame(() => {
				update();
				const week = selectedWeek ?? (publicCompact ? currentWeek : null);
				if (week) scrollGridWeekIntoView(wrapper, week, 'instant');
			});
		};
		const observer = new ResizeObserver(resize);
		observer.observe(wrapper);
		update();
		wrapper.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', resize);
		return () => {
			observer.disconnect();
			window.cancelAnimationFrame(resizeFrame);
			wrapper.removeEventListener('scroll', update);
			window.removeEventListener('resize', resize);
		};
	}, [currentWeek, selectedWeek, publicCompact, scrollMode, weeks.length]);

	function applyStatus(
		student: BoardGridStudent,
		session: TeachingSessionRecord,
		status: AttendanceStatus,
		note?: string,
	) {
		if (
			!onMarkChange ||
			readOnly ||
			togglingSessionId === session.id ||
			session.isCancelled ||
			(!session.attendanceOpen && !allowUnstartedEdit)
		)
			return;
		const current = student.marks[session.id];
		onMarkChange({
			enrollmentId: student.enrollmentId,
			sessionId: session.id,
			status,
			note: note ?? current?.note ?? '',
		});
	}

	function cycleStatus(student: BoardGridStudent, session: TeachingSessionRecord) {
		const key = `${student.enrollmentId}:${session.id}`;
		const current = student.marks[session.id]?.status ?? 'ABSENT_UNEXCUSED';
		const savedState = saveState?.(student.enrollmentId, session.id);
		const remembered = cycleValues.current.get(key);
		const basis =
			remembered && (savedState === undefined || savedState === 'saving') ? remembered : current;
		const next = cycleAttendanceStatus(basis);
		cycleValues.current.set(key, next);
		applyStatus(student, session, next);
	}

	function saveNote(student: BoardGridStudent, session: TeachingSessionRecord, note: string) {
		const status = student.marks[session.id]?.status ?? 'ABSENT_UNEXCUSED';
		applyStatus(student, session, status, note);
		setNoteCell(null);
	}

	return (
		<>
			<div
				ref={wrapperRef}
				className={`mc-grid-wrap ${publicCompact ? 'mc-grid-wrap-public' : ''}`}
				data-scroll-mode={scrollMode}
				role="region"
				aria-label="Bảng điểm danh"
			>
				<table
					className="mc-grid"
					data-extra={showExtraColumns}
					data-group={hasGroupColumn}
					data-eligibility={showEligibilityColumn}
					data-testid="attendance-grid"
				>
					<caption className="sr-only">Bảng điểm danh</caption>
					<thead>
						<tr>
							<th
								title="Số thứ tự trong danh sách lớp"
								className={`mc-grid-freeze-left mc-grid-stt ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
							>
								STT
							</th>
							<th
								title="Mã số sinh viên"
								className={`mc-grid-freeze-left mc-grid-code ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
							>
								Mã SV
							</th>
							<th
								title="Họ và tên sinh viên"
								className={`mc-grid-freeze-left mc-grid-name ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
							>
								Họ và tên
							</th>
							{publicCompact ? (
								<th
									title="Thông tin sinh viên và điểm tổng hợp"
									className="mc-grid-public-identity mc-grid-mobile-only"
								>
									Sinh viên
								</th>
							) : null}
							{hasGroupColumn ? (
								<th
									title="Nhóm hoạt động của sinh viên"
									className={`mc-grid-freeze-left mc-grid-group ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
								>
									Nhóm
								</th>
							) : null}
							{showExtraColumns ? (
								<>
									<th
										title="Mã lớp hành chính"
										className={`mc-grid-freeze-left mc-grid-home ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
									>
										Mã lớp
									</th>
									<th
										title="Ngành học của sinh viên"
										className={`mc-grid-freeze-left mc-grid-major ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
									>
										Tên ngành
									</th>
									<th
										title="Ngày sinh của sinh viên"
										className={`mc-grid-freeze-left mc-grid-dob ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
									>
										Ngày sinh
									</th>
								</>
							) : null}
							{weeks.map(({ weekNumber, session }) => {
								const isOpen = Boolean(session?.attendanceOpen);
								const isFinalized = Boolean(session?.attendanceTakenAt) && !isOpen;
								return (
									<th
										key={weekNumber}
										aria-label={`W${weekNumber}`}
										title={`Điểm danh tuần ${weekNumber}${session?.heldOn ? ` · ${sessionDateLabel(session.heldOn, '')}` : ''}`}
										className="mc-grid-week"
										data-week={weekNumber}
										data-current={currentWeek === weekNumber}
										data-selected={selectedWeek === weekNumber}
										data-attendance-open={isOpen}
										data-attendance-finalized={isFinalized}
									>
										<span className="mc-grid-week-heading">
											{session ? (
												<GridWeekActions
													weekNumber={weekNumber}
													kind="điểm danh"
													open={isOpen}
													finalized={isFinalized}
													cancelled={session.isCancelled}
													compact={currentWeek != null && weekNumber > currentWeek}
													busy={togglingSessionId === session.id}
													onLifecycle={
														!readOnly && onSessionLifecycle
															? (action) => onSessionLifecycle(session.id, action)
															: undefined
													}
													onToggle={
														!readOnly && onSessionToggle
															? (open) => onSessionToggle(session.id, open)
															: undefined
													}
												/>
											) : null}
											{onWeekSelect && !readOnly ? (
												<button
													type="button"
													className="mc-grid-week-select"
													aria-label={`Chọn tuần ${weekNumber}`}
													onClick={() => onWeekSelect(weekNumber)}
												>
													W{weekNumber}
												</button>
											) : (
												<span>W{weekNumber}</span>
											)}
										</span>
										{session && onSessionDateChange && !readOnly && !session.isCancelled ? (
											<SessionDateInput
												weekNumber={weekNumber}
												compact={currentWeek != null && weekNumber > currentWeek && !session.heldOn}
												disabled={togglingSessionId === session.id}
												value={session.heldOn}
												saveState={sessionDateSaveState?.(session.id)}
												onCommit={(heldOn) => onSessionDateChange(session, heldOn)}
											/>
										) : (
											<span className="mc-grid-week-sub">
												{sessionDateLabel(session?.heldOn ?? null)}
											</span>
										)}
									</th>
								);
							})}
							<th
								aria-label={`Chuyên cần /${attendanceMaxPoints}`}
								title={`Điểm chuyên cần tối đa ${attendanceMaxPoints}; mức trừ được cấu hình theo lớp`}
								className={`mc-grid-freeze-right mc-grid-summary-start mc-grid-attendance-score ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
							>
								<span className="mc-grid-summary-heading">
									<span>Chuyên cần</span>
									<span>/{attendanceMaxPoints}</span>
								</span>
							</th>
							<th
								aria-label="Số buổi vắng"
								title="Tổng số buổi vắng không phép; đi muộn cũng được tính là một buổi vắng"
								className={`mc-grid-freeze-right mc-grid-abs ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
							>
								<span className="mc-grid-summary-heading">
									<span>Số buổi</span>
									<span>vắng</span>
								</span>
							</th>
							{showEligibilityColumn ? (
								<th
									aria-label="Trạng thái"
									title="Điều kiện dự thi dựa trên tỷ lệ vắng không phép"
									className={`mc-grid-freeze-right mc-grid-status ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
								>
									<span className="mc-grid-summary-heading">
										<span>Trạng thái</span>
									</span>
								</th>
							) : null}
						</tr>
					</thead>
					<tbody>
						{students.length === 0 ? (
							<tr>
								<td
									colSpan={
										(publicCompact ? 1 : 3) +
										(hasGroupColumn ? 1 : 0) +
										(showExtraColumns ? 3 : 0) +
										weeks.length +
										2 +
										(showEligibilityColumn ? 1 : 0)
									}
									className="p-8 text-center text-sm text-ink-secondary"
								>
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
									<td
										className={`mc-grid-freeze-left mc-grid-stt mc-num ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
									>
										{student.orderNo}
									</td>
									<td
										className={`mc-grid-freeze-left mc-grid-code mc-num ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
									>
										{student.studentCode}
									</td>
									<td
										className={`mc-grid-freeze-left mc-grid-name ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
									>
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
											{student.cp.banned ? (
												<McIcon name="warning" size={14} className="text-error" />
											) : null}
										</span>
									</td>
									{publicCompact ? (
										<td className="mc-grid-public-identity mc-grid-mobile-only">
											<span className="inline-flex min-w-0 items-center gap-2">
												<span className="mc-avatar" aria-hidden>
													{studentInitials(student.familyName, student.givenName)}
												</span>
												<span className="min-w-0">
													<strong className="flex min-w-0 items-center gap-1.5">
														<span className="truncate">
															{student.familyName} {student.givenName}
														</span>
														<LearningExperienceMark
															choice={student.learningExperience}
															size="sm"
															index={student.orderNo}
															appearance="quiet"
														/>
													</strong>
													<small className="mc-num mc-grid-public-meta block text-ink-secondary">
														<span className="mc-grid-public-meta-line">
															{student.studentCode} · {student.cp.unexcusedAbsences}/{totalWeeks}{' '}
															vắng
														</span>
														<span className="mc-grid-public-meta-line">
															Chuyên cần {formatTeachingScore(student.cp.attendanceScore)}/
															{attendanceMaxPoints}
															{showEligibilityColumn
																? ` · ${student.cp.riskLevel === 'BANNED' ? 'Cấm thi' : student.cp.riskLevel === 'AT_RISK' ? 'Có nguy cơ' : 'Đủ điều kiện'}`
																: ''}
														</span>
													</small>
												</span>
											</span>
										</td>
									) : null}
									{hasGroupColumn ? (
										<td
											className={`mc-grid-freeze-left mc-grid-group mc-num font-semibold text-accent ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
										>
											{groupNumberByEnrollment?.[student.enrollmentId] ?? '–'}
										</td>
									) : null}
									{showExtraColumns ? (
										<>
											<td
												className={`mc-grid-freeze-left mc-grid-home ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
											>
												{student.homeClassCode}
											</td>
											<td
												className={`mc-grid-freeze-left mc-grid-major ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
											>
												{student.majorName}
											</td>
											<td
												className={`mc-grid-freeze-left mc-grid-dob mc-num ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
											>
												{formatDob(student.dateOfBirth ?? null)}
											</td>
										</>
									) : null}
									{weeks.map(({ weekNumber, session }) => {
										if (!session || weekNumber < student.enrolledFromWeek) {
											return (
												<td
													key={weekNumber}
													className="mc-grid-week"
													data-week={weekNumber}
													data-current={currentWeek === weekNumber}
												>
													<span
														className="mc-grid-cell mc-grid-cell-empty"
														aria-label="Chưa học trong tuần này"
													>
														–
													</span>
												</td>
											);
										}
										const mark = student.marks[session.id];
										const state = saveState?.(student.enrollmentId, session.id);
										const started = readOnly
											? Boolean(session.attendanceTakenAt) && !session.attendanceOpen
											: Boolean(session.attendanceOpen) || Boolean(session.attendanceTakenAt);
										const status = mark?.status ?? (started ? 'ABSENT_UNEXCUSED' : undefined);
										const hasFlag = started && Boolean(mark?.note);
										const disabled =
											readOnly ||
											togglingSessionId === session.id ||
											session.isCancelled ||
											(!session.attendanceOpen && !allowUnstartedEdit);
										const statusDescription = attendanceTooltip(
											status,
											mark?.note,
											session.isCancelled ? 'Buổi đã hủy' : 'Chưa điểm danh',
										);
										return (
											<td
												key={session.id}
												className="mc-grid-week relative"
												data-week={weekNumber}
												data-current={currentWeek === weekNumber}
												data-selected={selectedWeek === weekNumber}
												data-save-state={state}
											>
												{readOnly ? (
													<span
														className="mc-grid-cell"
														tabIndex={0}
														title={statusDescription}
														data-status={status ?? ''}
														data-flag={hasFlag}
														aria-label={`${student.studentCode} tuần ${weekNumber}: ${statusDescription}`}
													>
														{status ? (
															<McIcon name={STATUS_ICON[status]} size={16} />
														) : (
															<span className="text-[10px]">—</span>
														)}
													</span>
												) : (
													<button
														id={cellId(student.enrollmentId, session.id)}
														type="button"
														className="mc-grid-cell"
														data-status={status ?? ''}
														data-flag={hasFlag}
														disabled={disabled}
														title={`${statusDescription}${session.isCancelled ? '' : !session.attendanceOpen && started ? '\nMở lại điểm danh để chỉnh sửa' : !started && !allowUnstartedEdit ? '\nNhấn Bắt đầu buổi trước' : '\nBấm để chuyển Có mặt → Muộn → Vắng; chuột phải để thêm ghi chú'}`}
														aria-label={`${student.studentCode} tuần ${weekNumber}${session.isCancelled ? ' buổi đã hủy' : !started && !allowUnstartedEdit ? ' chưa bắt đầu' : ''}`}
														onClick={() => cycleStatus(student, session)}
														onContextMenu={(event) => {
															event.preventDefault();
															if (!disabled)
																setNoteCell({
																	enrollmentId: student.enrollmentId,
																	sessionId: session.id,
																});
														}}
														onKeyDown={(event) => {
															const nextStatus = statusFromKey(event.key);
															if (nextStatus && !disabled) {
																event.preventDefault();
																applyStatus(student, session, nextStatus);
																return;
															}
															if (
																(event.key === 'ContextMenu' ||
																	(event.key === 'F10' && event.shiftKey)) &&
																!disabled
															) {
																event.preventDefault();
																setNoteCell({
																	enrollmentId: student.enrollmentId,
																	sessionId: session.id,
																});
															}
														}}
													>
														{status ? (
															<McIcon name={STATUS_ICON[status]} size={16} />
														) : (
															<span className="text-[10px]">—</span>
														)}
													</button>
												)}
												{(readOnly ? Boolean(mark?.note) : !disabled) ? (
													<button
														type="button"
														className="mc-grid-note-trigger"
														aria-label="Xem ghi chú điểm danh"
														onClick={(event) => {
															event.stopPropagation();
															setNoteCell({
																enrollmentId: student.enrollmentId,
																sessionId: session.id,
															});
														}}
													>
														<McIcon name="forum" size={16} />
													</button>
												) : null}
												{started && state === 'saving' ? (
													<span className="mc-grid-save-dot" aria-label="Đang lưu">
														…
													</span>
												) : null}
												{started && state === 'saved' ? (
													<span className="mc-grid-save-dot" data-tone="saved" aria-label="Đã lưu">
														✓
													</span>
												) : null}
												{started && state === 'error' ? (
													<button
														type="button"
														className="mc-grid-retry"
														aria-label={`Thử lại điểm danh ${student.studentCode} tuần ${weekNumber}`}
														onClick={() => onRetry?.(student.enrollmentId, session.id)}
													>
														↻
													</button>
												) : null}
												{noteCell?.enrollmentId === student.enrollmentId &&
												noteCell.sessionId === session.id ? (
													<AttendanceNoteEditor
														mark={mark}
														onClose={() => setNoteCell(null)}
														onSave={(note) => saveNote(student, session, note)}
														onStatus={(nextStatus, note) => {
															applyStatus(student, session, nextStatus, note);
															setNoteCell(null);
														}}
														readOnly={readOnly}
													/>
												) : null}
											</td>
										);
									})}
									<td
										className={`mc-grid-freeze-right mc-grid-summary-start mc-grid-attendance-score mc-num font-semibold ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
									>
										{formatTeachingScore(student.cp.attendanceScore)} / {attendanceMaxPoints}
									</td>
									<td
										className={`mc-grid-freeze-right mc-grid-abs mc-num ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
									>
										{student.cp.unexcusedAbsences}/{totalWeeks}
									</td>
									{showEligibilityColumn ? (
										<td
											className={`mc-grid-freeze-right mc-grid-status ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
										>
											<span
												className={`inline-flex min-h-6 items-center rounded-[var(--mc-r-sm)] border px-2 text-[11px] font-semibold ${student.cp.riskLevel === 'BANNED' ? 'border-error/30 bg-error-subtle text-error' : student.cp.riskLevel === 'AT_RISK' ? 'border-mc-rule bg-mc-vocab-subtle text-mc-vocab' : 'border-mc-done/30 bg-mc-done-subtle text-mc-done'}`}
											>
												{student.cp.riskLevel === 'BANNED'
													? 'Cấm thi'
													: student.cp.riskLevel === 'AT_RISK'
														? 'Có nguy cơ'
														: 'Đủ điều kiện'}
											</span>
										</td>
									) : null}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			<p className="mc-grid-score-context">
				Điểm chỉ tính từ các buổi đã chốt · Điểm danh:{' '}
				{sessions.filter((s) => !s.isCancelled && s.attendanceTakenAt && !s.attendanceOpen).length}{' '}
				buổi · CP:{' '}
				{
					sessions.filter((s) => !s.isCancelled && s.participationTakenAt && !s.participationOpen)
						.length
				}{' '}
				buổi
			</p>
		</>
	);
}
