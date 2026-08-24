'use client';

import {
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	defaultKeyboardCoordinateGetter,
	pointerWithin,
	rectIntersection,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragStartEvent,
} from '@dnd-kit/core';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { teachingApi } from '@/components/teaching/admin/api';
import { Dialog, LiveRegion, Sheet, Toast } from '@/components/ui/Dialog';
import type {
	TeachingGroupAssignmentRecord,
	TeachingGroupBoard,
	TeachingGroupRecord,
} from '@/features/teaching/types';

type Board = TeachingGroupBoard & {
	viewerEnrollmentId?: string | null;
	undoAvailableCount?: number;
	slug?: string;
};
export type GroupBoardWorkspaceProps = { classId?: string; slug?: string; initial?: Board; admin?: boolean };
type Props = GroupBoardWorkspaceProps;
type Card = Pick<
	TeachingGroupAssignmentRecord,
	'enrollmentId' | 'studentCode' | 'familyName' | 'givenName' | 'learningExperience'
>;
type GroupFilter = 'all' | 'available' | 'full' | 'leaderless';
type PendingTarget = { groupId: string; groupName: string; slotIndex: number; roleLabel: string };
type PendingAction = {
	kind: 'remove';
	card: Card;
	groupId: string;
	groupName: string;
	slotIndex: number;
	roleLabel: string;
};
type MoveOptions = { board?: Board; skipViewerSync?: boolean };

function fullName(card: Card) {
	return `${card.familyName} ${card.givenName}`.trim();
}

function groupLabel(group: Pick<TeachingGroupRecord, 'displayOrder'>) {
	return `Nhóm ${group.displayOrder + 1}`;
}

function learningChoiceLabel(choice?: Card['learningExperience']) {
	if (choice === 'CHALLENGE') return 'Challenge';
	if (choice === 'SUPPORT') return 'Royal support';
	return null;
}

function GroupStudentCard({
	card,
	draggable,
	selected,
	pending,
	onClick,
	compact = false,
	meta,
	suppressClick,
}: {
	card: Card;
	draggable: boolean;
	selected?: boolean;
	pending?: boolean;
	onClick?: () => void;
	compact?: boolean;
	meta?: string;
	suppressClick?: () => boolean;
}) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `student:${card.enrollmentId}`,
		disabled: !draggable || pending,
	});
	const learningChoice = learningChoiceLabel(card.learningExperience);
	return (
		<button
			ref={setNodeRef}
			type="button"
			onClick={() => {
				if (!suppressClick?.()) onClick?.();
			}}
			{...(draggable ? listeners : {})}
			{...(draggable ? attributes : {})}
			className={`group-student-card ${draggable ? 'group-student-card-draggable' : ''} ${compact ? 'group-student-card-compact' : ''} ${selected ? 'group-student-card-selected' : ''} ${pending ? 'group-student-card-pending' : ''} ${isDragging ? 'group-student-card-source' : ''}`}
			aria-label={`${fullName(card)} · ${card.studentCode}${learningChoice ? ` · ${learningChoice}` : ''}`}
			title={learningChoice ?? undefined}
			data-student-name={fullName(card)}
			data-lx={card.learningExperience ?? undefined}
			data-draggable={draggable ? 'true' : undefined}
		>
			{draggable ? (
				<span className="group-drag-handle" aria-hidden="true">
					⋮⋮
				</span>
			) : null}
			<span className="min-w-0 flex-1">
				<span className="group-student-name-row">
					<span className="group-student-name block text-sm font-semibold text-ink">
						{fullName(card)}
					</span>
					{learningChoice ? (
						<span
							className="group-learning-choice-dot"
							data-tone={card.learningExperience === 'CHALLENGE' ? 'challenge' : 'support'}
							aria-hidden="true"
						/>
					) : null}
				</span>
				<span className="group-student-meta mc-num block text-[11px] text-ink-secondary">
					{card.studentCode}
				</span>
				{meta ? (
					<span className="group-student-location block text-[11px] text-ink-tertiary">{meta}</span>
				) : null}
			</span>
			{selected ? (
				<span className="group-selected-mark" aria-hidden="true">
					✓
				</span>
			) : null}
		</button>
	);
}

function Slot({
	groupId,
	groupName,
	slotIndex,
	assignment,
	board,
	admin,
	viewerEnrollmentId,
	selected,
	dragging,
	draggable,
	pendingEnrollmentId,
	onSelect,
	onSelectCard,
	onRemove,
	suppressClick,
}: {
	groupId: string;
	groupName: string;
	slotIndex: number;
	assignment?: TeachingGroupAssignmentRecord;
	board: Board;
	admin: boolean;
	viewerEnrollmentId?: string | null;
	selected: boolean;
	dragging: boolean;
	draggable: boolean;
	pendingEnrollmentId?: string | null;
	onSelect: (groupId: string, slotIndex: number) => void;
	onSelectCard: (enrollmentId: string) => void;
	onRemove?: (
		assignment: TeachingGroupAssignmentRecord,
		groupName: string,
		slotIndex: number,
	) => void;
	suppressClick?: () => boolean;
}) {
	const canDrop = !assignment && (admin || board.isOpen);
	const { isOver, setNodeRef } = useDroppable({
		id: `slot:${groupId}:${slotIndex}`,
		data: { groupId, slotIndex },
		disabled: !canDrop,
	});
	const roleLabel = slotIndex === 0 ? 'Trưởng nhóm' : `TV ${slotIndex}`;
	return (
		<div
			ref={setNodeRef}
			data-group-id={groupId}
			data-slot-index={slotIndex}
			data-locked={!board.isOpen && !admin ? 'true' : undefined}
			data-slot-role={slotIndex === 0 ? 'leader' : 'member'}
			data-slot-state={assignment ? 'filled' : 'empty'}
			className={`group-slot ${slotIndex === 0 ? 'group-slot-leader' : ''} ${isOver ? 'group-slot-over' : ''} ${dragging && canDrop ? 'group-slot-drop-ready' : ''} ${selected && canDrop ? 'group-slot-targetable' : ''} ${assignment ? 'group-slot-filled' : 'group-slot-empty-state'}`}
			onClick={() => {
				if (!assignment && canDrop) onSelect(groupId, slotIndex);
			}}
			onKeyDown={(event) => {
				if (!assignment && canDrop && (event.key === 'Enter' || event.key === ' ')) {
					event.preventDefault();
					onSelect(groupId, slotIndex);
				}
			}}
			tabIndex={!assignment && canDrop ? 0 : undefined}
			role={!assignment && canDrop ? 'button' : undefined}
			aria-label={`${roleLabel}${assignment ? ` · ${fullName(assignment)}` : board.isOpen || admin ? ' · Trống' : ' · Bảng đang khóa'}`}
		>
			<span className="group-slot-role">{roleLabel}</span>
			<span className="group-slot-content">
				{assignment ? (
					<GroupStudentCard
						card={assignment}
						draggable={draggable}
						selected={assignment.enrollmentId === viewerEnrollmentId}
						pending={assignment.enrollmentId === pendingEnrollmentId}
						onClick={() => onSelectCard(assignment.enrollmentId)}
						compact
						suppressClick={suppressClick}
					/>
				) : (
					<span className="group-slot-placeholder">
						{board.isOpen || admin ? (
							<>
								<span aria-hidden="true">＋</span> Chọn vị trí
							</>
						) : (
							'Bảng đang khóa'
						)}
					</span>
				)}
			</span>
			{assignment && onRemove && (admin || board.isOpen) ? (
				<button
					type="button"
					className="group-slot-remove"
					aria-label={`Xóa ${fullName(assignment)} khỏi nhóm`}
					onClick={(event) => {
						event.stopPropagation();
						onRemove(assignment, groupName, slotIndex);
					}}
				>
					×
				</button>
			) : null}
		</div>
	);
}

function UnassignedDropZone({
	children,
	className = '',
	disabled = false,
	dragging = false,
}: {
	children: ReactNode;
	className?: string;
	disabled?: boolean;
	dragging?: boolean;
}) {
	const { isOver, setNodeRef } = useDroppable({ id: 'unassigned', disabled });
	return (
		<div
			ref={setNodeRef}
			data-group-scroll={!disabled ? 'true' : undefined}
			className={`${className} ${dragging && !disabled ? 'group-unassigned-drop-ready' : ''} ${isOver ? 'group-unassigned-over' : ''}`}
		>
			{children}
		</div>
	);
}

function groupMatches(
	group: TeachingGroupRecord,
	groupSize: number,
	filter: GroupFilter,
	query: string,
) {
	const normalized = query.trim().toLowerCase();
	const leader = group.assignments.find((assignment) => assignment.slotIndex === 0);
	if (
		normalized &&
		!`${groupLabel(group)} ${leader ? fullName(leader) : ''}`.toLowerCase().includes(normalized)
	)
		return false;
	if (filter === 'available') return group.assignments.length < groupSize;
	if (filter === 'full') return group.assignments.length >= groupSize;
	if (filter === 'leaderless')
		return !group.assignments.some((assignment) => assignment.slotIndex === 0);
	return true;
}

function groupState(group: TeachingGroupRecord, groupSize: number) {
	if (!group.assignments.some((assignment) => assignment.slotIndex === 0))
		return { label: 'Thiếu leader', tone: 'warning' } as const;
	if (group.assignments.length >= groupSize) return { label: 'Đầy', tone: 'ok' } as const;
	return { label: 'Còn chỗ', tone: 'info' } as const;
}

function cardForEnrollment(board: Board, enrollmentId: string): Card | null {
	return (
		board.groups
			.flatMap((group) => group.assignments)
			.find((assignment) => assignment.enrollmentId === enrollmentId) ??
		board.unassigned.find((student) => student.enrollmentId === enrollmentId) ??
		null
	);
}

function placeCardLocally(board: Board, card: Card, groupId: string | null, slotIndex?: number) {
	const groups = board.groups.map((group) => ({
		...group,
		assignments: group.assignments.filter(
			(assignment) => assignment.enrollmentId !== card.enrollmentId,
		),
	}));
	const unassigned = board.unassigned.filter(
		(student) => student.enrollmentId !== card.enrollmentId,
	);
	if (groupId == null) return { ...board, groups, unassigned: [...unassigned, card] };
	const group = groups.find((item) => item.id === groupId);
	if (!group || slotIndex == null) return board;
	group.assignments = [
		...group.assignments,
		{
			...card,
			groupId,
			groupOrder: group.displayOrder,
			slotIndex,
			role: slotIndex === 0 ? ('LEADER' as const) : ('MEMBER' as const),
		},
	].sort((left, right) => left.slotIndex - right.slotIndex);
	return { ...board, groups, unassigned };
}

export function GroupBoardWorkspace({ classId, slug, initial, admin = false }: Props) {
	const [board, setBoard] = useState<Board | null>(initial ?? null);
	const [loading, setLoading] = useState(!initial);
	const [error, setError] = useState('');
	const [query, setQuery] = useState('');
	const [groupQuery, setGroupQuery] = useState('');
	const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');
	const [selected, setSelected] = useState<string | null>(initial?.viewerEnrollmentId ?? null);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [pendingEnrollmentId, setPendingEnrollmentId] = useState<string | null>(null);
	const [mobileTrayOpen, setMobileTrayOpen] = useState(false);
	const [pendingTarget, setPendingTarget] = useState<PendingTarget | null>(null);
	const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
	const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
	const [config, setConfig] = useState({
		groupCount: initial?.groupCount || 0,
		groupSize: initial?.groupSize || 0,
	});
	const [clearDialogOpen, setClearDialogOpen] = useState(false);
	const [randomPreview, setRandomPreview] = useState<{
		placements: Array<{ enrollmentId: string; groupId: string; slotIndex: number }>;
		seed: number;
		version: number;
	} | null>(null);
	const [toast, setToast] = useState('');
	const [announcement, setAnnouncement] = useState('');
	const [flashGroup, setFlashGroup] = useState<string | null>(null);
	const [mobileOpenGroup, setMobileOpenGroup] = useState<string | null>(
		initial?.groups[0]?.id ?? null,
	);
	const [jumpOpen, setJumpOpen] = useState(false);
	const [jumpQuery, setJumpQuery] = useState('');
	const [undoPending, setUndoPending] = useState(false);
	const [dndReady, setDndReady] = useState(false);
	const [isMobileViewport, setIsMobileViewport] = useState<boolean | null>(null);
	const [reducedMotion, setReducedMotion] = useState(false);
	const boardRef = useRef(board);
	boardRef.current = board;
	const groupRefs = useRef<Record<string, HTMLElement | null>>({});
	const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pickerTransition = useRef(false);
	const jumpControlRef = useRef<HTMLDivElement | null>(null);
	const pendingEnrollmentRef = useRef<string | null>(null);
	const suppressClickRef = useRef(false);
	const suppressClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const base = admin
		? `/api/admin/teaching/classes/${classId}/groups`
		: `/api/teaching/classes/${slug}/groups`;
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor, { coordinateGetter: defaultKeyboardCoordinateGetter }),
	);
	const collisionDetection = useCallback((args: Parameters<typeof pointerWithin>[0]) => {
		const pointerCollisions = pointerWithin(args);
		return pointerCollisions.length ? pointerCollisions : rectIntersection(args);
	}, []);
	const applyServerBoard = useCallback((next: Board) => {
		setBoard((current) => (!current || next.version >= current.version ? next : current));
	}, []);

	const showToast = useCallback((message: string) => {
		setToast(message);
		if (toastTimer.current) clearTimeout(toastTimer.current);
		toastTimer.current = setTimeout(() => setToast(''), 3200);
	}, []);

	useEffect(
		() => () => {
			if (toastTimer.current) clearTimeout(toastTimer.current);
			if (suppressClickTimer.current) clearTimeout(suppressClickTimer.current);
		},
		[],
	);
	useEffect(() => {
		setDndReady(true);
	}, []);
	useEffect(() => {
		const media = window.matchMedia('(max-width: 767px)');
		const sync = () => setIsMobileViewport(media.matches);
		sync();
		media.addEventListener?.('change', sync);
		return () => media.removeEventListener?.('change', sync);
	}, []);
	useEffect(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => setReducedMotion(media.matches);
		sync();
		media.addEventListener?.('change', sync);
		return () => media.removeEventListener?.('change', sync);
	}, []);
	useEffect(() => {
		if (!jumpOpen) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setJumpOpen(false);
		};
		const onPointerDown = (event: PointerEvent) => {
			if (isMobileViewport === true) return;
			if (jumpControlRef.current && !jumpControlRef.current.contains(event.target as Node))
				setJumpOpen(false);
		};
		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('pointerdown', onPointerDown);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('pointerdown', onPointerDown);
		};
	}, [isMobileViewport, jumpOpen]);

	const refresh = useCallback(
		async (force = false) => {
			setLoading(true);
			try {
				const next = await teachingApi<Board>(base);
				if (force || !pendingEnrollmentRef.current) {
					applyServerBoard(next);
					setConfig({ groupCount: next.groupCount, groupSize: next.groupSize });
					setError('');
					setMobileOpenGroup((current) =>
						current && next.groups.some((group) => group.id === current)
							? current
							: (next.groups[0]?.id ?? null),
					);
				}
				return next;
			} catch (reason) {
				const message = reason instanceof Error ? reason.message : 'Không tải được bảng xếp nhóm';
				setError(message);
				setAnnouncement(message);
			} finally {
				setLoading(false);
			}
		},
		[applyServerBoard, base],
	);

	useEffect(() => {
		if (!initial) void refresh();
	}, [initial, refresh]);
	useEffect(() => {
		if (!slug || !board?.configured || typeof EventSource === 'undefined') return;
		const events = new EventSource(`/api/teaching/classes/${slug}/groups/events`);
		const reload = () => {
			if (!pendingEnrollmentId) void refresh();
		};
		events.addEventListener('board.updated', reload);
		return () => events.close();
	}, [slug, board?.configured, pendingEnrollmentId, refresh]);
	useEffect(() => {
		if (!admin && board?.isOpen && board.viewerEnrollmentId) {
			setSelected(board.viewerEnrollmentId);
			const viewerGroup = board.groups.find((group) =>
				group.assignments.some(
					(assignment) => assignment.enrollmentId === board.viewerEnrollmentId,
				),
			);
			if (viewerGroup) setMobileOpenGroup(viewerGroup.id);
		}
	}, [admin, board?.isOpen, board?.viewerEnrollmentId, board?.groups]);

	async function claimIdentity(
		card: Card,
		context?: { target?: PendingTarget | null; action?: PendingAction | null },
	) {
		if (!board?.isOpen || admin) return;
		try {
			const claimedEnrollmentId = card.enrollmentId;
			const target = context?.target === undefined ? pendingTarget : context.target;
			const action = context?.action === undefined ? pendingAction : context.action;
			const next = await teachingApi<Board>(`/api/teaching/classes/${slug}/groups/claim`, {
				method: 'POST',
				body: JSON.stringify({ enrollmentId: claimedEnrollmentId }),
			});
			setBoard(next);
			setError('');
			if (target && next?.viewerEnrollmentId === claimedEnrollmentId) {
				setPendingTarget(null);
				await move(claimedEnrollmentId, target.groupId, target.slotIndex, {
					board: next,
					skipViewerSync: true,
				});
			} else if (action && next?.viewerEnrollmentId === claimedEnrollmentId) {
				setRemoveConfirmOpen(true);
				setAnnouncement(`Đã chọn ${fullName(action.card)}. Xác nhận để xóa khỏi nhóm.`);
			} else {
				setPendingTarget(null);
				setPendingAction(null);
				setRemoveConfirmOpen(false);
				setSelected(claimedEnrollmentId);
				showToast('Đã chọn tên. Bạn có thể chọn vị trí cho mình.');
				setAnnouncement('Đã chọn tên thành công. Bạn có thể chọn vị trí cho mình.');
			}
		} catch (reason) {
			const message = reason instanceof Error ? reason.message : 'Không chọn được tên';
			setError(message);
			setAnnouncement(message);
		}
	}

	async function move(
		enrollmentId: string,
		groupId: string | null,
		slotIndex?: number,
		options: MoveOptions = {},
	) {
		const sourceBoard = options.board ?? boardRef.current;
		if (!sourceBoard) return;
		const card = cardForEnrollment(sourceBoard, enrollmentId);
		if (!card) return;
		const shouldSyncViewer =
			!admin && !options.skipViewerSync && sourceBoard.viewerEnrollmentId !== enrollmentId;
		const optimisticBoard = placeCardLocally(sourceBoard, card, groupId, slotIndex);
		pendingEnrollmentRef.current = enrollmentId;
		setPendingEnrollmentId(enrollmentId);
		setBoard(
			shouldSyncViewer ? { ...optimisticBoard, viewerEnrollmentId: enrollmentId } : optimisticBoard,
		);
		setError('');
		setSelected(null);
		setPendingTarget(null);
		setPendingAction(null);
		setRemoveConfirmOpen(false);
		setMobileTrayOpen(false);
		setAnnouncement(
			groupId
				? `Đang đặt ${fullName(card)} vào nhóm.`
				: `Đang đưa ${fullName(card)} về danh sách chưa xếp.`,
		);
		try {
			if (shouldSyncViewer) {
				await teachingApi<Board>(`/api/teaching/classes/${slug}/groups/claim`, {
					method: 'POST',
					body: JSON.stringify({ enrollmentId }),
				});
			}
			const payload = admin
				? { enrollmentId, groupId, slotIndex, expectedVersion: sourceBoard.version }
				: { groupId, slotIndex };
			const next = await teachingApi<Board>(admin ? `${base}/assignments` : `${base}/move`, {
				method: admin ? 'PUT' : 'POST',
				body: JSON.stringify(payload),
			});
			applyServerBoard(next);
			const message = groupId
				? 'Đã cập nhật vị trí sinh viên.'
				: 'Đã đưa sinh viên về danh sách chưa xếp.';
			showToast(message);
			setAnnouncement(message);
		} catch (reason) {
			const message =
				reason instanceof Error ? reason.message : 'Ô này vừa được chọn. Hãy thử lại.';
			setBoard(sourceBoard);
			setError(message);
			setAnnouncement(message);
			const refreshed = await refresh(true);
			if (refreshed) {
				setError(message);
				setAnnouncement(message);
			}
		} finally {
			pendingEnrollmentRef.current = null;
			setPendingEnrollmentId(null);
		}
	}

	function suppressNextClick() {
		if (!suppressClickRef.current) return false;
		suppressClickRef.current = false;
		return true;
	}

	function markDragComplete() {
		suppressClickRef.current = true;
		if (suppressClickTimer.current) clearTimeout(suppressClickTimer.current);
		suppressClickTimer.current = setTimeout(() => {
			suppressClickRef.current = false;
		}, 0);
	}

	function onDragStart(event: DragStartEvent) {
		setActiveId(String(event.active.id).replace('student:', ''));
		setAnnouncement('Đang kéo sinh viên. Di chuyển tới ô trống để thả.');
	}
	function onDragEnd(event: DragEndEvent) {
		setActiveId(null);
		markDragComplete();
		const enrollmentId = String(event.active.id).replace('student:', '');
		const overId = event.over ? String(event.over.id) : '';
		const slotId = /^slot:(.+):(\d+)$/.exec(overId);
		const targetFromId = slotId
			? { groupId: slotId[1], slotIndex: Number(slotId[2]) }
			: undefined;
		const targetData = event.over?.data.current as
			| { groupId?: string; slotIndex?: number }
			| undefined;
		const target = targetData?.groupId && targetData.slotIndex != null ? targetData : targetFromId;
		if (target?.groupId && target.slotIndex != null)
			void move(enrollmentId, target.groupId, target.slotIndex);
		else if (overId === 'unassigned') {
			if (board?.unassigned.some((student) => student.enrollmentId === enrollmentId)) {
				setAnnouncement('Vị trí không thay đổi.');
				return;
			}
			void move(enrollmentId, null);
		} else setAnnouncement('Đã hủy thao tác kéo.');
	}

	function selectCard(enrollmentId: string) {
		if (!admin && !board?.isOpen) return;
		if (!admin && enrollmentId !== board?.viewerEnrollmentId) {
			const card =
				assignments.find((item) => item.enrollmentId === enrollmentId) ??
				board?.unassigned.find((item) => item.enrollmentId === enrollmentId);
			if (card) void claimIdentity(card);
			return;
		}
		const next = selected === enrollmentId ? null : enrollmentId;
		setSelected(next);
		setAnnouncement(next ? 'Đã chọn sinh viên. Chọn ô trống để đặt.' : 'Đã bỏ chọn sinh viên.');
	}

	function openPlacementPicker(groupId: string, slotIndex: number, groupName: string) {
		if (!board || (!admin && !board.isOpen)) return;
		const roleLabel = slotIndex === 0 ? 'Trưởng nhóm' : `TV ${slotIndex}`;
		setPendingTarget({ groupId, groupName, slotIndex, roleLabel });
		setPendingAction(null);
		setQuery('');
		setMobileTrayOpen(true);
		setAnnouncement(`Đã chọn ô ${roleLabel} của ${groupName}. Chọn sinh viên để đặt vào ô.`);
	}

	function choosePickerCard(card: Card) {
		const target = pendingTarget;
		pickerTransition.current = true;
		setMobileTrayOpen(false);
		if (!target) {
			selectCard(card.enrollmentId);
			return;
		}
		if (admin || card.enrollmentId === board?.viewerEnrollmentId) {
			setPendingTarget(null);
			void move(card.enrollmentId, target.groupId, target.slotIndex);
			return;
		}
		void claimIdentity(card);
	}

	function requestRemove(
		assignment: TeachingGroupAssignmentRecord,
		groupName: string,
		slotIndex: number,
	) {
		if (!board || (!admin && !board.isOpen)) return;
		const action: PendingAction = {
			kind: 'remove',
			card: assignment,
			groupId: assignment.groupId,
			groupName,
			slotIndex,
			roleLabel: slotIndex === 0 ? 'Trưởng nhóm' : `TV ${slotIndex}`,
		};
		setPendingAction(action);
		setPendingTarget(null);
		if (!admin && assignment.enrollmentId !== board.viewerEnrollmentId) {
			void claimIdentity(assignment, { target: null, action });
			return;
		}
		setRemoveConfirmOpen(true);
	}

	async function confirmRemove() {
		if (!pendingAction) return;
		await move(pendingAction.card.enrollmentId, null);
	}

	async function saveConfig(event: React.FormEvent) {
		event.preventDefault();
		if (admin && (isMobileViewport === true || window.matchMedia('(max-width: 767px)').matches))
			return;
		try {
			await teachingApi(base, {
				method: 'PATCH',
				body: JSON.stringify({ ...config, expectedVersion: board?.version }),
			});
			await refresh();
			showToast('Đã lưu cấu hình nhóm.');
		} catch (reason) {
			const message = reason instanceof Error ? reason.message : 'Không lưu được cấu hình';
			setError(message);
			setAnnouncement(message);
		}
	}

	async function toggleOpen() {
		if (admin && (isMobileViewport === true || window.matchMedia('(max-width: 767px)').matches))
			return;
		try {
			const wasOpen = board?.isOpen;
			await teachingApi(base, { method: 'PATCH', body: JSON.stringify({ open: !wasOpen }) });
			await refresh();
			showToast(wasOpen ? 'Đã khóa bảng xếp nhóm.' : 'Đã mở bảng xếp nhóm.');
		} catch (reason) {
			const message = reason instanceof Error ? reason.message : 'Không đổi được trạng thái';
			setError(message);
			setAnnouncement(message);
		}
	}

	async function confirmClear() {
		if (admin && (isMobileViewport === true || window.matchMedia('(max-width: 767px)').matches))
			return;
		try {
			const next = await teachingApi<Board>(`${base}/clear`, {
				method: 'POST',
				body: JSON.stringify({ expectedVersion: board?.version }),
			});
			setBoard(next);
			setClearDialogOpen(false);
			showToast('Đã xóa toàn bộ vị trí.');
		} catch (reason) {
			const message = reason instanceof Error ? reason.message : 'Không thể xóa vị trí';
			setError(message);
			setAnnouncement(message);
			await refresh();
		}
	}

	async function requestRandomize() {
		if (admin && (isMobileViewport === true || window.matchMedia('(max-width: 767px)').matches))
			return;
		try {
			const preview = await teachingApi<{
				placements: Array<{ enrollmentId: string; groupId: string; slotIndex: number }>;
				seed: number;
				version: number;
			}>(`${base}/randomize`, {
				method: 'POST',
				body: JSON.stringify({ expectedVersion: board?.version }),
			});
			setRandomPreview(preview);
		} catch (reason) {
			const message = reason instanceof Error ? reason.message : 'Không thể xếp ngẫu nhiên';
			setError(message);
			setAnnouncement(message);
		}
	}
	async function applyRandomize() {
		if (
			!randomPreview ||
			(admin && (isMobileViewport === true || window.matchMedia('(max-width: 767px)').matches))
		)
			return;
		try {
			const next = await teachingApi<Board>(`${base}/randomize`, {
				method: 'POST',
				body: JSON.stringify({
					placements: randomPreview.placements,
					seed: randomPreview.seed,
					expectedVersion: randomPreview.version,
				}),
			});
			setBoard(next);
			setRandomPreview(null);
			showToast(`Đã xếp ngẫu nhiên ${randomPreview.placements.length} sinh viên.`);
		} catch (reason) {
			const message = reason instanceof Error ? reason.message : 'Không thể xếp ngẫu nhiên';
			setError(message);
			setAnnouncement(message);
			await refresh();
		}
	}

	async function undoLatest() {
		if (admin || !slug || !board?.viewerEnrollmentId || !board.undoAvailableCount || undoPending)
			return;
		setUndoPending(true);
		try {
			const next = await teachingApi<Board>(`/api/teaching/classes/${slug}/groups/undo`, {
				method: 'POST',
			});
			setBoard(next);
			setSelected(next.viewerEnrollmentId ?? null);
			showToast('Đã hoàn tác thao tác gần nhất.');
			setAnnouncement('Đã hoàn tác thao tác gần nhất.');
		} catch (reason) {
			const message = reason instanceof Error ? reason.message : 'Không thể hoàn tác thao tác này';
			setError(message);
			setAnnouncement(message);
			await refresh();
		} finally {
			setUndoPending(false);
		}
	}

	function jumpToGroup(groupId: string) {
		const node = groupRefs.current[groupId];
		if (!node) return;
		setMobileOpenGroup(groupId);
		setJumpOpen(false);
		setJumpQuery('');
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		node.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
		node.focus({ preventScroll: true });
		setFlashGroup(groupId);
		setTimeout(() => setFlashGroup((current) => (current === groupId ? null : current)), 1000);
	}

	const assignments = useMemo(
		() => board?.groups.flatMap((group) => group.assignments) ?? [],
		[board],
	);
	const cards = useMemo(() => {
		const normalized = query.trim().toLowerCase();
		return (board?.unassigned ?? []).filter(
			(student) =>
				!normalized ||
				`${fullName(student)} ${student.studentCode}`.toLowerCase().includes(normalized),
		);
	}, [board?.unassigned, query]);
	const pickerCards = useMemo(() => {
		if (!board) return [];
		const normalized = query.trim().toLowerCase();
		const assigned = board.groups.flatMap((group) =>
			group.assignments.map((student) => ({
				card: student,
				meta: `${groupLabel(group)} · ${student.slotIndex === 0 ? 'Trưởng nhóm' : `TV ${student.slotIndex}`}${student.enrollmentId === board.viewerEnrollmentId ? ' · Tên đang chọn' : ''}`,
			})),
		);
		const unassigned = board.unassigned.map((student) => ({ card: student, meta: 'Chưa xếp' }));
		const ordered = [...unassigned, ...assigned];
		return ordered
			.sort(
				({ card: left }, { card: right }) =>
					Number(right.enrollmentId === board.viewerEnrollmentId) -
					Number(left.enrollmentId === board.viewerEnrollmentId),
			)
			.filter(
				({ card }) =>
					!normalized || `${fullName(card)} ${card.studentCode}`.toLowerCase().includes(normalized),
			);
	}, [board, query]);
	const filteredGroups = useMemo(
		() =>
			(board?.groups ?? []).filter((group) =>
				groupMatches(group, board?.groupSize ?? 0, groupFilter, groupQuery),
			),
		[board?.groupSize, board?.groups, groupFilter, groupQuery],
	);
	const jumpGroups = useMemo(() => {
		const normalized = jumpQuery.trim().toLowerCase();
		return (board?.groups ?? []).filter((group) => {
			if (!normalized) return true;
			const leader = group.assignments.find((assignment) => assignment.slotIndex === 0);
			return `${groupLabel(group)} ${leader ? fullName(leader) : ''}`
				.toLowerCase()
				.includes(normalized);
		});
	}, [board?.groups, jumpQuery]);
	const selectedCard = useMemo(
		() =>
			assignments.find((item) => item.enrollmentId === selected) ??
			board?.unassigned.find((item) => item.enrollmentId === selected),
		[assignments, board?.unassigned, selected],
	);
	const jumpList = board ? (
		<div className="group-jump-list" role="listbox" aria-label="Danh sách nhóm">
			{jumpGroups.map((group) => {
				const leader = group.assignments.find((assignment) => assignment.slotIndex === 0);
				return (
					<button
						key={group.id}
						type="button"
						role="option"
						aria-selected="false"
						className="group-jump-option"
						onClick={() => jumpToGroup(group.id)}
					>
						<span className="group-jump-option-title">{groupLabel(group)}</span>
						<span className="group-jump-option-meta">
							<span>
								{group.assignments.length}/{board.groupSize} người
							</span>
							<span>{leader ? `Trưởng nhóm: ${fullName(leader)}` : 'Chưa có trưởng nhóm'}</span>
						</span>
					</button>
				);
			})}
			{jumpGroups.length === 0 ? (
				<p className="group-jump-empty">Không tìm thấy nhóm phù hợp.</p>
			) : null}
		</div>
	) : null;
	const desktopDragEnabled = isMobileViewport === false && (admin || Boolean(board?.isOpen));
	const groupBoardStage = board?.configured ? (
		<div className="group-board-stage grid gap-3 lg:grid-cols-[minmax(16rem,18rem)_minmax(0,1fr)]">
			<aside className="group-unassigned-panel mc-surface min-w-0 p-3 sm:p-4">
				<div className="flex items-center justify-between gap-2">
					<div>
						<h2 className="text-sm font-semibold text-ink">Chưa xếp</h2>
						<p className="mc-meta mt-0.5">Kéo tên trực tiếp vào vị trí bạn muốn</p>
					</div>
					<span className="mc-chip">{board.unassigned.length}</span>
				</div>
				<input
					className="mc-input mt-3 w-full"
					placeholder="Tìm tên hoặc MSV"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					aria-label="Tìm sinh viên chưa xếp"
				/>
				<UnassignedDropZone
					className="group-unassigned-scroll"
					disabled={!admin && !board.isOpen}
					dragging={Boolean(activeId)}
				>
					<div
						id="unassigned"
						className="mt-3 space-y-1.5"
						data-testid="unassigned-list"
						data-group-scroll="true"
					>
						{cards.map((student) => (
							<GroupStudentCard
								key={student.enrollmentId}
								card={student}
								draggable={desktopDragEnabled}
								pending={student.enrollmentId === pendingEnrollmentId}
								selected={selected === student.enrollmentId}
								onClick={() => selectCard(student.enrollmentId)}
								suppressClick={suppressNextClick}
							/>
						))}
						{cards.length === 0 ? (
							<p className="py-4 text-xs text-ink-secondary">Không có kết quả.</p>
						) : null}
					</div>
				</UnassignedDropZone>
			</aside>

			<section
				className="group-board-panel mc-surface min-w-0 p-3 sm:p-4"
				aria-label="Bảng các nhóm"
			>
				<div className="group-board-filterbar border-b border-border pb-3">
					<div className="group-filterbar-search">
						<label className="sr-only" htmlFor="group-search">
							Tìm nhóm
						</label>
						<input
							id="group-search"
							className="mc-input min-w-0 w-full"
							placeholder="Tìm số nhóm hoặc tên trưởng nhóm"
							value={groupQuery}
							onChange={(event) => setGroupQuery(event.target.value)}
						/>
					</div>
					<div className="group-filterbar-actions">
						<label className="sr-only" htmlFor="group-filter">
							Lọc nhóm
						</label>
						<select
							id="group-filter"
							className="mc-input w-full"
							value={groupFilter}
							onChange={(event) => setGroupFilter(event.target.value as GroupFilter)}
						>
							<option value="all">Tất cả nhóm</option>
							<option value="available">Còn chỗ</option>
							<option value="full">Đã đầy</option>
							<option value="leaderless">Thiếu leader</option>
						</select>
						<div className="group-jump-control" ref={jumpControlRef}>
							<button
								type="button"
								className="group-jump-trigger mc-input"
								aria-haspopup="listbox"
								aria-expanded={jumpOpen}
								onClick={() => {
									setJumpOpen((open) => !open);
									setJumpQuery('');
								}}
							>
								<span>Đi tới nhóm</span>
								<span aria-hidden="true">⌄</span>
							</button>
							{jumpOpen && isMobileViewport !== true ? (
								<div className="group-jump-popover" role="dialog" aria-label="Đi tới nhóm">
									<label className="sr-only" htmlFor="group-jump-search">
										Tìm trong danh sách nhóm
									</label>
									<input
										id="group-jump-search"
										className="mc-input w-full"
										autoFocus
										placeholder="Tìm số nhóm hoặc tên trưởng nhóm"
										value={jumpQuery}
										onChange={(event) => setJumpQuery(event.target.value)}
									/>
									{jumpList}
								</div>
							) : null}
						</div>
					</div>
				</div>
				<p className="group-board-hint mc-meta mt-2">
					{activeId
						? 'Thả vào ô trống để xếp nhóm.'
						: selectedCard
							? `Đang chọn: ${fullName(selectedCard)} · chọn ô trống để đặt`
							: 'Kéo tên vào một ô trống hoặc chọn tên rồi chọn vị trí.'}
				</p>
				<div className="group-grid-scroll mt-3" data-group-scroll="true">
					<div className="group-grid" data-testid="group-grid">
						{filteredGroups.map((group) => {
							const state = groupState(group, board.groupSize);
							const leader = group.assignments.find((item) => item.slotIndex === 0);
							const leaderName = leader ? fullName(leader) : 'Chưa có';
							const label = groupLabel(group);
							return (
								<section
									key={group.id}
									ref={(node) => {
										groupRefs.current[group.id] = node;
									}}
									tabIndex={-1}
									data-mobile-open={mobileOpenGroup === group.id}
									data-group-state={state.tone}
									className={`group-card-shell ${flashGroup === group.id ? 'group-card-shell-flash' : ''}`}
									aria-label={label}
								>
									<div
										className="group-card-header"
										onClick={(event) => {
											if (
												window.matchMedia('(max-width: 767px)').matches &&
												!(event.target as HTMLElement).closest('button')
											)
												setMobileOpenGroup((current) => (current === group.id ? null : group.id));
										}}
									>
										<div className="group-card-heading">
											<div className="group-card-identity">
												<h2 className="group-card-title text-sm font-semibold text-ink">{label}</h2>
												<p
													className="group-card-leader"
													data-missing={!leader ? 'true' : undefined}
													title={`Trưởng nhóm: ${leaderName}`}
												>
													<span>Trưởng nhóm</span>
													<strong>{leaderName}</strong>
												</p>
											</div>
											<span className="group-capacity">
												{group.assignments.length}/{board.groupSize}
											</span>
											<span className="group-status" data-tone={state.tone}>
												<span aria-hidden="true" />
												{state.label}
											</span>
										</div>
										<button
											type="button"
											className="group-mobile-expand-button"
											aria-label={`${mobileOpenGroup === group.id ? 'Thu gọn' : 'Mở'} ${label}`}
											aria-expanded={mobileOpenGroup === group.id}
											onClick={() =>
												setMobileOpenGroup((current) => (current === group.id ? null : group.id))
											}
										>
											⌄
										</button>
									</div>
									{Array.from({ length: board.groupSize }, (_, slotIndex) => (
										<Slot
											key={slotIndex}
											groupId={group.id}
											groupName={label}
											slotIndex={slotIndex}
											assignment={group.assignments.find((item) => item.slotIndex === slotIndex)}
											board={board}
											admin={admin}
											viewerEnrollmentId={board.viewerEnrollmentId}
											selected={Boolean(selected)}
											dragging={Boolean(activeId)}
											draggable={desktopDragEnabled}
											pendingEnrollmentId={pendingEnrollmentId}
											onSelect={(groupId, index) => {
												if (
													typeof window !== 'undefined' &&
													window.matchMedia('(max-width: 767px)').matches
												)
													openPlacementPicker(groupId, index, label);
												else if (selected && (admin || board.isOpen))
													void move(selected, groupId, index);
											}}
											onSelectCard={selectCard}
											onRemove={requestRemove}
											suppressClick={suppressNextClick}
										/>
									))}
								</section>
							);
						})}
						{filteredGroups.length === 0 ? (
							<p className="col-span-full py-10 text-center text-sm text-ink-secondary">
								Không có nhóm phù hợp.
							</p>
						) : null}
					</div>
				</div>
			</section>
		</div>
	) : null;

	if (loading && !board) {
		return (
			<div className="group-board-workspace space-y-3" role="status" aria-live="polite">
				<span className="sr-only">Đang tải bảng xếp nhóm…</span>
				<div className="group-board-toolbar mc-surface flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
					<div className="min-w-0 space-y-2">
						<div className="teaching-skeleton h-4 w-48" />
						<div className="teaching-skeleton h-3 w-32" />
					</div>
					<div className="teaching-skeleton h-9 w-24" />
				</div>
				<div className="group-board-stage grid gap-3 lg:grid-cols-[minmax(16rem,18rem)_minmax(0,1fr)]">
					<aside className="group-unassigned-panel mc-surface min-w-0 p-3 sm:p-4">
						<div className="teaching-skeleton h-4 w-24" />
						<div className="mt-3 space-y-2">
							<div className="teaching-skeleton h-10 w-full" />
							<div className="teaching-skeleton h-10 w-full" />
							<div className="teaching-skeleton h-10 w-full" />
						</div>
					</aside>
					<section className="group-board-panel mc-surface min-w-0 p-3 sm:p-4" aria-hidden>
						<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
							{Array.from({ length: 6 }, (_, index) => (
								<div key={index} className="teaching-skeleton h-28 w-full" />
							))}
						</div>
					</section>
				</div>
			</div>
		);
	}
	if (!board)
		return (
			<div className="mc-banner" data-tone="error">
				{error || 'Chưa có bảng xếp nhóm.'}
			</div>
		);

	return (
		<div
			className={`group-board-workspace space-y-3 ${!admin && !board.isOpen ? 'group-board-locked' : ''}`}
		>
			<LiveRegion message={announcement} />
			{error ? (
				<p className="mc-banner" data-tone="error" role="alert">
					{error}
				</p>
			) : null}
			<div className="group-board-toolbar mc-surface flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
				<div className="min-w-0">
					<p className="text-sm font-semibold text-ink">
						{board.configured
							? `${board.activeStudentCount - board.unassigned.length}/${board.activeStudentCount} sinh viên đã xếp`
							: 'Chưa thiết lập bảng nhóm'}
					</p>
					<p className="mc-meta mt-1">
						{board.isOpen ? 'Đang mở cho sinh viên' : 'Bảng đang khóa'}
						{selectedCard ? ` · Đang chọn ${fullName(selectedCard)}` : ''}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					{!admin ? (
						<button
							type="button"
							className="mc-button mc-button-ghost group-undo-button"
							onClick={() => void undoLatest()}
							disabled={
								!board.isOpen ||
								!board.viewerEnrollmentId ||
								!board.undoAvailableCount ||
								undoPending
							}
							title={
								!board.viewerEnrollmentId
									? 'Chọn tên của bạn để bật hoàn tác'
									: !board.undoAvailableCount
										? 'Chưa có thao tác để hoàn tác'
										: 'Hoàn tác thao tác gần nhất'
							}
						>
							Hoàn tác
							{board.undoAvailableCount ? (
								<span className="group-undo-count">{board.undoAvailableCount}</span>
							) : null}
						</button>
					) : null}
					{admin && isMobileViewport === false ? (
						<div
							className="group-admin-desktop-controls"
							data-testid="group-admin-desktop-controls"
						>
							<details className="group-toolbar-menu relative">
								<summary className="mc-button mc-button-ghost list-none">Thiết lập</summary>
								<form
									onSubmit={saveConfig}
									className="absolute right-0 z-20 mt-2 grid w-64 gap-3 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper p-4 shadow-lg"
								>
									<label className="text-xs font-semibold">
										Số nhóm
										<input
											className="mc-input mt-1 w-full"
											type="number"
											min={1}
											value={config.groupCount}
											onChange={(event) =>
												setConfig({ ...config, groupCount: Number(event.target.value) })
											}
										/>
									</label>
									<label className="text-xs font-semibold">
										Sức chứa mỗi nhóm
										<input
											className="mc-input mt-1 w-full"
											type="number"
											min={2}
											value={config.groupSize}
											onChange={(event) =>
												setConfig({ ...config, groupSize: Number(event.target.value) })
											}
										/>
									</label>
									<button className="mc-button mc-button-primary" type="submit">
										Lưu cấu hình
									</button>
								</form>
							</details>
							{board.configured ? (
								<>
									<button
										type="button"
										className="mc-button mc-button-ghost"
										onClick={() => void requestRandomize()}
									>
										Xếp ngẫu nhiên
									</button>
									<button
										type="button"
										className="mc-button mc-button-ghost"
										onClick={() => setClearDialogOpen(true)}
									>
										Xóa hết
									</button>
								</>
							) : null}
							<button
								type="button"
								className={`mc-button ${board.isOpen ? 'mc-button-ghost' : 'mc-button-primary'}`}
								onClick={() => void toggleOpen()}
							>
								{board.isOpen ? 'Khóa bảng' : 'Mở bảng'}
							</button>
						</div>
					) : null}
				</div>
			</div>

			{!board.configured ? (
				<>
					<div
						className={`mc-surface p-6 text-sm text-ink-secondary ${admin ? 'group-admin-desktop-unconfigured' : ''}`}
					>
						Admin cần thiết lập số nhóm và sức chứa trước khi sinh viên có thể tham gia.
					</div>
					{admin ? (
						<div className="group-admin-mobile-unconfigured mc-surface p-4 text-sm text-ink-secondary">
							Vui lòng dùng máy tính để thiết lập bảng nhóm.
						</div>
					) : null}
				</>
			) : null}

			{board.configured ? (
				dndReady ? (
					<DndContext
						sensors={sensors}
						collisionDetection={collisionDetection}
						autoScroll={{
							acceleration: 12,
							threshold: { x: 0.14, y: 0.14 },
							canScroll: (element) =>
								element instanceof HTMLElement && element.dataset.groupScroll === 'true',
						}}
						onDragStart={onDragStart}
						onDragEnd={onDragEnd}
						onDragCancel={() => {
							setActiveId(null);
							markDragComplete();
							setAnnouncement('Đã hủy thao tác kéo.');
						}}
					>
						{groupBoardStage}
						<DragOverlay
							adjustScale={false}
							dropAnimation={
								reducedMotion
									? null
									: { duration: 140, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
							}
						>
							{activeId ? (
								<div className="group-student-card group-student-card-drag">
									<span className="group-student-name">
										{fullName(
											assignments.find((item) => item.enrollmentId === activeId) ??
												board.unassigned.find((item) => item.enrollmentId === activeId)!,
										)}
									</span>
									<span className="group-student-meta mc-num">
										{
											(
												assignments.find((item) => item.enrollmentId === activeId) ??
												board.unassigned.find((item) => item.enrollmentId === activeId)
											)?.studentCode
										}
									</span>
								</div>
							) : null}
						</DragOverlay>
					</DndContext>
				) : (
					groupBoardStage
				)
			) : null}

			{isMobileViewport === true && selectedCard ? (
				<div className="group-mobile-selection-bar">
					<div className="group-mobile-selection-copy">
						<p className="text-xs font-semibold text-ink">Đang chọn sinh viên</p>
						<p className="group-mobile-selection-name text-sm text-ink-secondary">
							{fullName(selectedCard)} · {selectedCard.studentCode}
						</p>
					</div>
					{admin ? (
						<button
							type="button"
							className="mc-button mc-button-ghost"
							onClick={() => setMobileTrayOpen(true)}
						>
							Đổi thẻ
						</button>
					) : null}
					<button
						type="button"
						className="group-clear-selection"
						onClick={() => setSelected(null)}
						aria-label="Bỏ chọn sinh viên"
					>
						×
					</button>
				</div>
			) : null}
			{isMobileViewport === true && board.configured && (admin || (!admin && board.isOpen)) ? (
				<button
					type="button"
					className="group-mobile-picker mc-button mc-button-primary"
					onClick={() => setMobileTrayOpen(true)}
				>
					{board.viewerEnrollmentId ? 'Đổi sinh viên' : 'Chọn sinh viên'}
				</button>
			) : null}

			<Sheet
				open={mobileTrayOpen}
				onClose={() => {
					setMobileTrayOpen(false);
					if (pickerTransition.current) pickerTransition.current = false;
					else setPendingTarget(null);
				}}
				title={
					pendingTarget
						? `Chọn sinh viên · ${pendingTarget.groupName} · ${pendingTarget.roleLabel}`
						: 'Chọn sinh viên'
				}
			>
				<div className="space-y-3">
					<p className="mc-meta">
						{pendingTarget
							? 'Chọn tên của bạn hoặc người khác. Nếu đang ở nhóm khác, vị trí cũ sẽ tự động được thay thế.'
							: 'Chọn tên để tiếp tục thao tác.'}
					</p>
					<input
						className="mc-input w-full"
						placeholder="Tìm tên hoặc MSV"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						aria-label="Tìm sinh viên trong khay"
					/>
					<p className="mc-meta">{pickerCards.length} sinh viên phù hợp</p>
					<div className="max-h-[min(52dvh,24rem)] space-y-1.5 overflow-y-auto">
						{pickerCards.map(({ card, meta }) => (
							<GroupStudentCard
								key={card.enrollmentId}
								card={card}
								meta={meta}
								draggable={false}
								pending={card.enrollmentId === pendingEnrollmentId}
								selected={selected === card.enrollmentId}
								onClick={() => choosePickerCard(card)}
							/>
						))}
						{pickerCards.length === 0 ? (
							<p className="py-6 text-center text-sm text-ink-secondary">Không có kết quả.</p>
						) : null}
					</div>
				</div>
			</Sheet>
			<Dialog
				open={removeConfirmOpen}
				onClose={() => {
					setRemoveConfirmOpen(false);
					setPendingAction(null);
				}}
				title="Xóa sinh viên khỏi nhóm"
				description={
					pendingAction
						? `${fullName(pendingAction.card)} · ${pendingAction.groupName} · ${pendingAction.roleLabel}`
						: undefined
				}
			>
				<div className="space-y-4">
					<p className="text-sm text-ink-secondary">
						Sinh viên sẽ trở về danh sách chưa xếp. Bạn có thể chọn người này vào nhóm khác sau đó.
					</p>
					<div className="flex justify-end gap-2">
						<button
							type="button"
							className="mc-button mc-button-ghost"
							onClick={() => {
								setRemoveConfirmOpen(false);
								setPendingAction(null);
							}}
						>
							Hủy
						</button>
						<button
							type="button"
							className="mc-button mc-button-danger"
							onClick={() => void confirmRemove()}
						>
							Xóa khỏi nhóm
						</button>
					</div>
				</div>
			</Dialog>
			<Dialog
				open={clearDialogOpen}
				onClose={() => setClearDialogOpen(false)}
				title="Xóa toàn bộ vị trí"
				description="Tất cả assignment hiện tại sẽ được đưa về danh sách chưa xếp."
			>
				<div className="flex justify-end gap-2">
					<button
						type="button"
						className="mc-button mc-button-ghost"
						onClick={() => setClearDialogOpen(false)}
					>
						Hủy
					</button>
					<button
						type="button"
						className="mc-button mc-button-danger"
						onClick={() => void confirmClear()}
					>
						Xóa toàn bộ
					</button>
				</div>
			</Dialog>
			<Dialog
				open={Boolean(randomPreview)}
				onClose={() => setRandomPreview(null)}
				title="Xem trước xếp ngẫu nhiên"
				description="Các assignment hiện tại được giữ nguyên; chỉ ô trống được điền."
			>
				<div className="space-y-4">
					<p className="text-sm text-ink-secondary">
						Sẽ xếp thêm{' '}
						<strong className="text-ink">{randomPreview?.placements.length ?? 0}</strong> sinh viên
						vào các ô còn trống, gồm cả vị trí leader.
					</p>
					<div className="flex justify-end gap-2">
						<button
							type="button"
							className="mc-button mc-button-ghost"
							onClick={() => setRandomPreview(null)}
						>
							Hủy
						</button>
						<button
							type="button"
							className="mc-button mc-button-primary"
							onClick={() => void applyRandomize()}
						>
							Áp dụng
						</button>
					</div>
				</div>
			</Dialog>
			<Sheet
				open={jumpOpen && isMobileViewport === true}
				onClose={() => {
					setJumpOpen(false);
					setJumpQuery('');
				}}
				title="Đi tới nhóm"
			>
				<div className="space-y-3">
					<label className="sr-only" htmlFor="group-jump-search-mobile">
						Tìm trong danh sách nhóm
					</label>
					<input
						id="group-jump-search-mobile"
						className="mc-input w-full"
						autoFocus
						placeholder="Tìm số nhóm hoặc tên trưởng nhóm"
						value={jumpQuery}
						onChange={(event) => setJumpQuery(event.target.value)}
					/>
					{jumpList}
				</div>
			</Sheet>
			<Toast message={toast} visible={Boolean(toast)} />
		</div>
	);
}
