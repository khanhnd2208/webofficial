'use client';

import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type ReactNode,
	type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import Link from 'next/link';
import { McButton, McIcon } from '@/components/myclass/ui';
import { Dialog } from '@/components/ui/Dialog';
import { routes } from '@/config/routes';
import StatusChip from './StatusChip';
import OutlineStatusDot from './OutlineStatusDot';
import { useEditMode, useOptionalEditMode } from './EditModeContext';

const outlineMenuClosers = new Set<() => void>();

function OutlineMenuPopover({
	open,
	onClose,
	triggerRef,
	label,
	children,
}: {
	open: boolean;
	onClose: () => void;
	triggerRef: RefObject<HTMLButtonElement | null>;
	label: string;
	children: ReactNode;
}) {
	const panelRef = useRef<HTMLDivElement>(null);
	const onCloseRef = useRef(onClose);
	useEffect(() => {
		onCloseRef.current = onClose;
	}, [onClose]);
	const close = useCallback(() => onCloseRef.current(), []);
	const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

	useLayoutEffect(() => {
		if (!open) return;
		for (const other of outlineMenuClosers) {
			if (other !== close) other();
		}
		outlineMenuClosers.add(close);
		return () => {
			outlineMenuClosers.delete(close);
		};
	}, [open, close]);

	const updatePosition = useCallback(() => {
		const trigger = triggerRef.current;
		const panel = panelRef.current;
		if (!trigger || !panel) return;
		const rect = trigger.getBoundingClientRect();
		const width = panel.offsetWidth;
		const height = panel.offsetHeight;
		const gap = 4;
		const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
		const below = rect.bottom + gap;
		const top = below + height <= window.innerHeight - 8 ? below : Math.max(8, rect.top - gap - height);
		setCoords({ top, left });
	}, [triggerRef]);

	useLayoutEffect(() => {
		if (!open) return;
		updatePosition();
	}, [open, updatePosition]);

	useEffect(() => {
		if (!open) return;
		function onPointerDown(event: PointerEvent) {
			const target = event.target as Node;
			if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
			close();
		}
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') close();
		}
		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);
		window.addEventListener('resize', updatePosition);
		window.addEventListener('scroll', updatePosition, true);
		return () => {
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('resize', updatePosition);
			window.removeEventListener('scroll', updatePosition, true);
		};
	}, [open, close, triggerRef, updatePosition]);

	if (!open || typeof document === 'undefined') return null;

	return createPortal(
		<div
			ref={panelRef}
			role="menu"
			aria-label={label}
			data-testid="outline-row-menu"
			className="mc mc-outline-menu"
			style={{
				top: coords?.top ?? 0,
				left: coords?.left ?? 0,
				visibility: coords ? 'visible' : 'hidden',
			}}
		>
			{children}
		</div>,
		document.querySelector('.mc') ?? document.body,
	);
}

export function OutlineDragHandle({
	listeners,
	attributes,
	locked,
}: {
	listeners?: DraggableSyntheticListeners;
	attributes?: DraggableAttributes | Record<string, never>;
	locked?: boolean;
}) {
	return (
		<span
			{...attributes}
			{...(!locked ? listeners : undefined)}
			aria-disabled={locked || undefined}
			aria-label="Kéo để đổi thứ tự"
			className={`mc-outline-drag inline-flex h-8 w-5 shrink-0 items-center justify-center text-ink-tertiary ${
				locked ? 'cursor-not-allowed opacity-40' : 'cursor-grab active:cursor-grabbing'
			}`}
		>
			<McIcon name="drag_indicator" size={16} />
		</span>
	);
}

export function OutlineRowMenu({
	kind,
	id,
	parentId,
	title,
	updatedAt,
	status,
	hasDraft,
}: {
	kind: 'lesson' | 'section' | 'unit';
	id: string;
	parentId: string;
	title: string;
	updatedAt?: string;
	status?: string;
	hasDraft?: boolean;
}) {
	const edit = useEditMode();
	const triggerRef = useRef<HTMLButtonElement>(null);
	const [open, setOpen] = useState(false);
	const [renaming, setRenaming] = useState(false);
	const [nextTitle, setNextTitle] = useState(title);
	const [confirmArchive, setConfirmArchive] = useState(false);

	if (!edit?.enabled) return null;

	return (
		<div className="relative flex shrink-0 items-center gap-1">
			<OutlineStatusDot status={status} hasDraft={hasDraft} />
			<button
				ref={triggerRef}
				type="button"
				className="mc-outline-icon-btn mc-focus-ring"
				aria-label="Thao tác"
				aria-haspopup="menu"
				aria-expanded={open}
				onClick={(event) => {
					event.stopPropagation();
					setOpen((value) => !value);
				}}
			>
				<McIcon name="more_vert" size={16} />
			</button>
			<OutlineMenuPopover
				open={open}
				onClose={() => setOpen(false)}
				triggerRef={triggerRef}
				label={`Thao tác ${title}`}
			>
					<div className="px-3 py-2">
						<StatusChip status={status} hasDraft={hasDraft} />
					</div>
					<button
						type="button"
						role="menuitem"
						className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-surface-sunken"
						onClick={() => {
							setRenaming(true);
							setOpen(false);
						}}
					>
						Đổi tên
					</button>
					{kind === 'lesson' ? (
						<button
							type="button"
							className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-surface-sunken"
							onClick={() => {
								void edit.createSection(id);
								setOpen(false);
							}}
						>
							Thêm chủ đề
						</button>
					) : null}
					{kind === 'section' ? (
						<>
							<button
								type="button"
								className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-surface-sunken"
								onClick={() => {
									void edit.createUnit(id);
									setOpen(false);
								}}
							>
								Thêm nội dung
							</button>
							<button
								type="button"
								className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-surface-sunken"
								onClick={() => {
									edit.setPicker({ kind: 'knowledge', sectionId: id });
									setOpen(false);
								}}
							>
								Gắn nội dung có sẵn
							</button>
							<button
								type="button"
								className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-surface-sunken"
								onClick={() => {
									edit.setPicker({
										kind: 'test',
										lessonId: parentId,
										sectionId: id,
										scope: 'SECTION',
									});
									setOpen(false);
								}}
							>
								Gắn bài kiểm tra
							</button>
						</>
					) : null}
					{kind === 'lesson' ? (
						<>
							<button
								type="button"
								className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-surface-sunken"
								onClick={() => {
									edit.setPicker({ kind: 'test', lessonId: id, scope: 'LESSON' });
									setOpen(false);
								}}
							>
								Gắn bài kiểm tra
							</button>
							<button
								type="button"
								className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-surface-sunken"
								onClick={() => {
									edit.setPicker({ kind: 'vocab', lessonId: id });
									setOpen(false);
								}}
							>
								Gắn bộ từ vựng có sẵn
							</button>
							<button
								type="button"
								className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-surface-sunken"
								onClick={() => {
									edit.setVocabImport({ lessonId: id });
									setOpen(false);
								}}
							>
								Tạo bộ từ từ CSV
							</button>
						</>
					) : null}
					{kind === 'unit' ? (
						<button
							type="button"
							className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-surface-sunken"
							onClick={() => {
								void edit.detachUnit(parentId, id);
								setOpen(false);
							}}
						>
							Gỡ khỏi chủ đề
						</button>
					) : (
						<button
							type="button"
							className="block w-full rounded px-3 py-2 text-left text-sm text-error hover:bg-error-subtle"
							onClick={() => {
								setConfirmArchive(true);
								setOpen(false);
							}}
						>
							Lưu trữ
						</button>
					)}
			</OutlineMenuPopover>
			<Dialog open={renaming} onClose={() => setRenaming(false)} title="Đổi tên">
				<label className="text-sm">
					Tên mới
					<input
						value={nextTitle}
						onChange={(event) => setNextTitle(event.target.value)}
						className="mt-1.5 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-sm"
					/>
				</label>
				<div className="mt-4 flex justify-end gap-2">
					<McButton variant="quiet" onClick={() => setRenaming(false)}>
						Hủy
					</McButton>
					<McButton
						onClick={() => {
							void edit.renameNode(kind, id, nextTitle.trim() || title, updatedAt ?? '');
							setRenaming(false);
						}}
					>
						Lưu
					</McButton>
				</div>
			</Dialog>
			<Dialog open={confirmArchive} onClose={() => setConfirmArchive(false)} title="Lưu trữ mục này?">
				<p className="text-sm">Mục sẽ biến mất khỏi nội dung công khai.</p>
				<div className="mt-4 flex justify-end gap-2">
					<McButton variant="quiet" onClick={() => setConfirmArchive(false)}>
						Hủy
					</McButton>
					<McButton
						onClick={() => {
							if (kind !== 'unit') void edit.archiveNode(kind, id, updatedAt ?? '');
							setConfirmArchive(false);
						}}
					>
						Lưu trữ
					</McButton>
				</div>
			</Dialog>
		</div>
	);
}

export function OutlineVocabMenu({
	assignmentId,
	vocabSetId,
}: {
	assignmentId: string;
	vocabSetId: string;
}) {
	const edit = useOptionalEditMode();
	const triggerRef = useRef<HTMLButtonElement>(null);
	const [open, setOpen] = useState(false);
	const [confirm, setConfirm] = useState(false);

	if (!edit?.enabled) return null;

	return (
		<div className="relative flex shrink-0 items-center">
			<button
				ref={triggerRef}
				type="button"
				className="mc-outline-icon-btn mc-focus-ring"
				aria-label="Thao tác từ vựng"
				aria-haspopup="menu"
				aria-expanded={open}
				onClick={(event) => {
					event.stopPropagation();
					setOpen((value) => !value);
				}}
			>
				<McIcon name="more_vert" size={16} />
			</button>
			<OutlineMenuPopover
				open={open}
				onClose={() => setOpen(false)}
				triggerRef={triggerRef}
				label="Thao tác từ vựng"
			>
				<Link
					href={routes.admin.myClassVocabularyEdit(vocabSetId)}
					role="menuitem"
					className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-surface-sunken"
					onClick={() => setOpen(false)}
				>
					Sửa trong studio
				</Link>
				<button
					type="button"
					role="menuitem"
					className="block w-full rounded px-3 py-2 text-left text-sm text-error hover:bg-error-subtle"
					onClick={() => {
						setConfirm(true);
						setOpen(false);
					}}
				>
					Gỡ khỏi mục lục
				</button>
			</OutlineMenuPopover>
			<Dialog open={confirm} onClose={() => setConfirm(false)} title="Gỡ bộ từ vựng?">
				<p className="text-sm">Bộ từ sẽ được gỡ khỏi vị trí này. Bản ghi trong thư viện vẫn giữ nguyên nếu học viên đã lưu.</p>
				<div className="mt-4 flex justify-end gap-2">
					<McButton variant="quiet" onClick={() => setConfirm(false)}>
						Hủy
					</McButton>
					<McButton
						onClick={() => {
							void edit.detachVocab(assignmentId);
							setConfirm(false);
						}}
					>
						Gỡ
					</McButton>
				</div>
			</Dialog>
		</div>
	);
}

export function OutlineTestMenu({
	testId,
	placementId,
}: {
	testId: string;
	placementId?: string;
}) {
	const edit = useOptionalEditMode();
	const triggerRef = useRef<HTMLButtonElement>(null);
	const [open, setOpen] = useState(false);
	const [confirm, setConfirm] = useState(false);

	if (!edit?.enabled) return null;

	return (
		<div className="relative flex shrink-0 items-center">
			<button
				ref={triggerRef}
				type="button"
				className="mc-outline-icon-btn mc-focus-ring"
				aria-label="Thao tác"
				aria-haspopup="menu"
				aria-expanded={open}
				onClick={(event) => {
					event.stopPropagation();
					setOpen((value) => !value);
				}}
			>
				<McIcon name="more_vert" size={16} />
			</button>
			<OutlineMenuPopover
				open={open}
				onClose={() => setOpen(false)}
				triggerRef={triggerRef}
				label="Thao tác bài kiểm tra"
			>
					<Link
						href={routes.admin.myClassTestEdit(testId)}
						role="menuitem"
						className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-surface-sunken"
						onClick={() => setOpen(false)}
					>
						Sửa trong studio
					</Link>
					<button
						type="button"
						role="menuitem"
						className="block w-full rounded px-3 py-2 text-left text-sm text-error hover:bg-error-subtle"
						onClick={() => {
							setConfirm(true);
							setOpen(false);
						}}
					>
						Gỡ khỏi mục lục
					</button>
			</OutlineMenuPopover>
			<Dialog open={confirm} onClose={() => setConfirm(false)} title="Gỡ bài kiểm tra?">
				<p className="text-sm">Bài kiểm tra sẽ được gỡ khỏi vị trí này. Bản ghi trong thư viện vẫn giữ nguyên.</p>
				<div className="mt-4 flex justify-end gap-2">
					<McButton variant="quiet" onClick={() => setConfirm(false)}>
						Hủy
					</McButton>
					<McButton
						onClick={() => {
							void edit.detachTest(testId, placementId);
							setConfirm(false);
						}}
					>
						Gỡ
					</McButton>
				</div>
			</Dialog>
		</div>
	);
}

export function OutlineCourseMenu() {
	const edit = useEditMode();
	const triggerRef = useRef<HTMLButtonElement>(null);
	const [open, setOpen] = useState(false);

	if (!edit?.enabled) return null;

	return (
		<div className="relative flex shrink-0 items-center">
			<button
				ref={triggerRef}
				type="button"
				className="mc-outline-icon-btn mc-focus-ring"
				aria-label="Gắn vào toàn khóa"
				aria-haspopup="menu"
				aria-expanded={open}
				onClick={(event) => {
					event.stopPropagation();
					setOpen((value) => !value);
				}}
			>
				<McIcon name="more_vert" size={16} />
			</button>
			<OutlineMenuPopover
				open={open}
				onClose={() => setOpen(false)}
				triggerRef={triggerRef}
				label="Thao tác khóa học"
			>
				<button
					type="button"
					role="menuitem"
					className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-surface-sunken"
					onClick={() => {
						edit.setPicker({ kind: 'test', scope: 'COURSE' });
						setOpen(false);
					}}
				>
					Gắn bài kiểm tra (toàn khóa)
				</button>
				<button
					type="button"
					role="menuitem"
					className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-surface-sunken"
					onClick={() => {
						edit.setPicker({ kind: 'vocab' });
						setOpen(false);
					}}
				>
					Gắn bộ từ vựng (toàn khóa)
				</button>
			</OutlineMenuPopover>
		</div>
	);
}
