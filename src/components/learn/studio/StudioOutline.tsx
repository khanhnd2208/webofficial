'use client';

import { closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState } from 'react';

import { sectionHint } from '@/features/learn/questionHealth';
import { unresolvedSectionImages } from '@/features/learn/sectionImages';
import {
	LEARN_SECTION_KIND_SHORT,
	type LearnSectionKind,
	type LearnStudioLesson,
	type LearnStudioSection,
} from '@/features/learn/types';

import { useStudioSensors } from './dndSensors';
import { StudioIcon, type StudioIconName } from './icons';
import StudioMenu, { type StudioMenuEntry } from './StudioMenu';
import { useOutlineOpen } from './useOutlineOpen';

export const SECTION_KINDS: {
	type: LearnSectionKind;
	label: string;
	hint: string;
	icon: StudioIconName;
}[] = [
	{
		type: 'READING',
		label: 'Bài giảng',
		hint: 'Một phần bài giảng: callout, bảng, hình',
		icon: 'reading',
	},
	{
		type: 'DISCUSSION',
		label: 'Phản biện',
		hint: 'Tình huống mở kèm đáp án mẫu',
		icon: 'discussion',
	},
];

export interface OutlineActions {
	onSelect: (sectionId: string) => void;
	onRenameLesson: (lessonId: string, title: string) => void;
	onReorderLessons: (ids: string[]) => void;
	onReorderSections: (lessonId: string, ids: string[]) => void;
	onPlaceSection: (sectionId: string, lessonId: string, beforeId: string | null) => void;
	onAddSection: (lessonId: string, type: LearnSectionKind) => void;
	onDeleteLesson: (lessonId: string) => void;
	onDuplicateLesson: (lessonId: string) => void;
	onExportLesson: (lessonId: string) => void;
	onDuplicateSection: (sectionId: string) => void;
	onPreviewSection: (sectionId: string) => void;
	onDeleteSection: (sectionId: string) => void;
	onAddLesson: () => void;
	onImport: () => void;
}

function reorder(ids: string[], event: DragEndEvent): string[] | null {
	const { active, over } = event;
	if (!over || active.id === over.id) return null;
	const from = ids.indexOf(String(active.id));
	const to = ids.indexOf(String(over.id));
	return from < 0 || to < 0 ? null : arrayMove(ids, from, to);
}

function step(ids: string[], id: string, by: -1 | 1): string[] | null {
	const from = ids.indexOf(id);
	const to = from + by;
	return from < 0 || to < 0 || to >= ids.length ? null : arrayMove(ids, from, to);
}

function needsAttention(section: LearnStudioSection): boolean {
	return Boolean(sectionHint(section)?.warn) || unresolvedSectionImages(section).length > 0;
}

function SectionRow({
	section,
	lessonId,
	selected,
	lessons,
	actions,
}: {
	section: LearnStudioSection;
	lessonId: string;
	selected: boolean;
	lessons: LearnStudioLesson[];
	actions: OutlineActions;
}) {
	const missingCount = useMemo(() => unresolvedSectionImages(section).length, [section]);
	const hint = sectionHint(section);
	const hintId = hint ? `ln-hint-${section.id}` : undefined;
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: section.id,
		data: { type: 'section', lessonId },
	});
	const lesson = lessons.find((item) => item.id === lessonId);
	const siblings = lesson?.sections.map((item) => item.id) ?? [];
	const at = siblings.indexOf(section.id);
	const menu: StudioMenuEntry[] = [
		{
			label: 'Xem như học viên',
			icon: 'eye',
			onSelect: () => actions.onPreviewSection(section.id),
		},
		{
			label: 'Nhân bản mục',
			icon: 'duplicate',
			onSelect: () => actions.onDuplicateSection(section.id),
		},
		{
			label: 'Lên trên',
			icon: 'up',
			disabled: at <= 0,
			onSelect: () => {
				const next = step(siblings, section.id, -1);
				if (next) actions.onReorderSections(lessonId, next);
			},
		},
		{
			label: 'Xuống dưới',
			icon: 'down',
			disabled: at < 0 || at >= siblings.length - 1,
			onSelect: () => {
				const next = step(siblings, section.id, 1);
				if (next) actions.onReorderSections(lessonId, next);
			},
		},
		...lessons
			.map((target, index) => ({ target, index }))
			.filter(({ target }) => target.id !== lessonId)
			.map(
				({ target, index }): StudioMenuEntry => ({
					label: `Chuyển sang Bài ${index + 1}`,
					hint: target.title,
					icon: 'move',
					onSelect: () => actions.onPlaceSection(section.id, target.id, null),
				}),
			),
		'divider',
		{
			label: 'Xóa mục',
			icon: 'trash',
			danger: true,
			onSelect: () => actions.onDeleteSection(section.id),
		},
	];
	return (
		<li
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className="ln-souter__section"
			data-selected={selected ? 'true' : undefined}
			data-dragging={isDragging ? 'true' : undefined}
		>
			<button
				type="button"
				className="ln-grip"
				aria-label={`Kéo để sắp xếp: ${section.title}`}
				title="Kéo để sắp xếp"
				{...attributes}
				{...listeners}
			>
				<StudioIcon name="grip" size={14} />
			</button>
			<button
				type="button"
				className="ln-souter__section-btn"
				aria-current={selected ? 'true' : undefined}
				aria-describedby={hintId}
				onClick={() => actions.onSelect(section.id)}
			>
				<span className="ln-outline__mark" data-kind={section.type} aria-hidden="true" />
				<span className="min-w-0 flex-1 truncate">{section.title || 'Chưa đặt tên'}</span>
				{hint ? (
					<span
						id={hintId}
						className="ln-souter__hint tabular-nums"
						data-warn={hint.warn || undefined}
					>
						{hint.text}
					</span>
				) : null}
				{missingCount ? (
					<span
						className="ln-souter__warn"
						role="img"
						title={`${missingCount} ảnh chưa tải lên`}
						aria-label={`${missingCount} ảnh chưa tải lên`}
					/>
				) : null}
				{section.type !== 'READING' ? (
					<span className="ln-souter__tag">{LEARN_SECTION_KIND_SHORT[section.type]}</span>
				) : null}
			</button>
			<div className="ln-souter__row-menu">
				<StudioMenu
					label={`Thao tác mục: ${section.title || 'Chưa đặt tên'}`}
					items={menu}
					align="end"
				/>
			</div>
		</li>
	);
}

function LessonBlock({
	lesson,
	index,
	count,
	open,
	selectedId,
	lessons,
	actions,
	onToggle,
}: {
	lesson: LearnStudioLesson;
	index: number;
	count: number;
	open: boolean;
	selectedId: string | null;
	lessons: LearnStudioLesson[];
	actions: OutlineActions;
	onToggle: () => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: lesson.id,
		data: { type: 'lesson', lessonId: lesson.id },
	});
	const ids = lesson.sections.map((section) => section.id);
	const [draft, setDraft] = useState<string | null>(null);
	const attention = lesson.sections.filter(needsAttention).length;
	const bodyId = `ln-lesson-${lesson.id}`;
	const lessonIds = lessons.map((item) => item.id);

	function commitRename() {
		const next = draft?.trim();
		setDraft(null);
		if (next && next !== lesson.title) actions.onRenameLesson(lesson.id, next);
	}

	const menu: StudioMenuEntry[] = [
		{ label: 'Đổi tên', icon: 'pencil', onSelect: () => setDraft(lesson.title) },
		...SECTION_KINDS.map(
			(kind): StudioMenuEntry => ({
				label: `Thêm ${kind.label.toLowerCase()}`,
				icon: kind.icon,
				onSelect: () => actions.onAddSection(lesson.id, kind.type),
			}),
		),
		'divider',
		{
			label: 'Nhân bản bài',
			icon: 'duplicate',
			onSelect: () => actions.onDuplicateLesson(lesson.id),
		},
		{
			label: 'Lên trên',
			icon: 'up',
			disabled: index === 0,
			onSelect: () => {
				const next = step(lessonIds, lesson.id, -1);
				if (next) actions.onReorderLessons(next);
			},
		},
		{
			label: 'Xuống dưới',
			icon: 'down',
			disabled: index === count - 1,
			onSelect: () => {
				const next = step(lessonIds, lesson.id, 1);
				if (next) actions.onReorderLessons(next);
			},
		},
		{
			label: 'Xuất Markdown bài này',
			icon: 'download',
			onSelect: () => actions.onExportLesson(lesson.id),
		},
		'divider',
		{
			label: 'Xóa bài…',
			icon: 'trash',
			danger: true,
			onSelect: () => actions.onDeleteLesson(lesson.id),
		},
	];

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className="ln-souter__lesson"
			data-open={open ? 'true' : undefined}
			data-dragging={isDragging ? 'true' : undefined}
		>
			<div className="ln-souter__lesson-head">
				<button
					type="button"
					className="ln-grip"
					aria-label={`Kéo để sắp xếp bài ${index + 1}`}
					title="Kéo để sắp xếp"
					{...attributes}
					{...listeners}
				>
					<StudioIcon name="grip" size={14} />
				</button>
				{draft === null ? (
					<button
						type="button"
						className="ln-souter__lesson-toggle"
						aria-expanded={open}
						aria-controls={bodyId}
						aria-label={`Bài ${index + 1}: ${lesson.title}, ${lesson.sections.length} mục${
							attention ? `, ${attention} cần xem` : ''
						}`}
						onClick={onToggle}
						onDoubleClick={() => setDraft(lesson.title)}
						title={open ? 'Thu gọn bài' : 'Mở bài'}
					>
						<span className="ln-souter__chevron" aria-hidden="true">
							<StudioIcon name="chevron" size={13} />
						</span>
						<span className="ln-souter__lesson-text">
							<span className="ln-outline__lesson-label">Bài {index + 1}</span>
							<span className="ln-souter__lesson-name">{lesson.title}</span>
							<span className="ln-souter__lesson-meta tabular-nums">
								{lesson.sections.length} mục
								{attention ? (
									<span className="ln-souter__lesson-warn"> · {attention} cần xem</span>
								) : null}
							</span>
						</span>
					</button>
				) : (
					<input
						className="ln-souter__lesson-title"
						value={draft}
						autoFocus
						maxLength={200}
						aria-label={`Tên bài ${index + 1}`}
						onChange={(event) => setDraft(event.target.value)}
						onBlur={commitRename}
						onKeyDown={(event) => {
							if (event.key === 'Enter') event.currentTarget.blur();
							if (event.key === 'Escape') {
								event.preventDefault();
								setDraft(null);
							}
						}}
					/>
				)}
				<StudioMenu label={`Thao tác bài ${index + 1}`} items={menu} align="end" />
			</div>
			{open ? (
				<div id={bodyId}>
					<SortableContext id={lesson.id} items={ids} strategy={verticalListSortingStrategy}>
						<ol className="ln-souter__sections">
							{lesson.sections.map((section) => (
								<SectionRow
									key={section.id}
									section={section}
									lessonId={lesson.id}
									selected={section.id === selectedId}
									lessons={lessons}
									actions={actions}
								/>
							))}
						</ol>
					</SortableContext>
					<div className="ln-souter__add">
						<StudioMenu
							label={`Thêm mục vào bài ${index + 1}`}
							triggerClassName="ln-link-btn"
							trigger={
								<>
									<StudioIcon name="plus" size={13} /> Thêm mục
								</>
							}
							items={SECTION_KINDS.map((kind) => ({
								label: kind.label,
								hint: kind.hint,
								icon: kind.icon,
								onSelect: () => actions.onAddSection(lesson.id, kind.type),
							}))}
						/>
					</div>
				</div>
			) : null}
		</div>
	);
}

export default function StudioOutline({
	courseId,
	lessons,
	selectedId,
	actions,
}: {
	courseId: string;
	lessons: LearnStudioLesson[];
	selectedId: string | null;
	actions: OutlineActions;
}) {
	const sensors = useStudioSensors();
	const ids = lessons.map((lesson) => lesson.id);
	const activeLessonId =
		lessons.find((lesson) => lesson.sections.some((section) => section.id === selectedId))?.id ??
		null;
	const { open, toggle, setAll } = useOutlineOpen(courseId, activeLessonId);
	const allOpen = lessons.length > 0 && lessons.every((lesson) => open.has(lesson.id));

	return (
		<div className="ln-souter__body">
			<div className="ln-souter__top">
				<span className="ln-souter__heading">
					Mục lục <span className="tabular-nums">· {lessons.length} bài</span>
				</span>
				{lessons.length > 1 ? (
					<button
						type="button"
						className="ln-link-btn"
						onClick={() => setAll(allOpen ? (activeLessonId ? [activeLessonId] : []) : ids)}
					>
						<StudioIcon name={allOpen ? 'collapse' : 'expand'} size={13} />
						{allOpen ? 'Thu gọn' : 'Mở tất cả'}
					</button>
				) : null}
			</div>
			<DndContext
				id="ln-lessons"
				sensors={sensors}
				collisionDetection={closestCenter}
				modifiers={[restrictToVerticalAxis]}
				onDragEnd={(event) => {
					const activeType = event.active.data.current?.type;
					if (activeType === 'lesson') {
						const next = reorder(ids, event);
						if (next) actions.onReorderLessons(next);
						return;
					}
					if (activeType !== 'section' || !event.over) return;
					const fromLesson = String(event.active.data.current?.lessonId ?? '');
					const overType = event.over.data.current?.type;
					const toLesson =
						overType === 'section'
							? String(event.over.data.current?.lessonId ?? '')
							: overType === 'lesson'
								? String(event.over.id)
								: '';
					if (!toLesson) return;
					if (toLesson === fromLesson && overType === 'section') {
						const lesson = lessons.find((item) => item.id === fromLesson);
						const next = lesson
							? reorder(
									lesson.sections.map((section) => section.id),
									event,
								)
							: null;
						if (next) actions.onReorderSections(fromLesson, next);
						return;
					}
					actions.onPlaceSection(
						String(event.active.id),
						toLesson,
						overType === 'section' ? String(event.over.id) : null,
					);
				}}
			>
				<SortableContext items={ids} strategy={verticalListSortingStrategy}>
					{lessons.map((lesson, index) => (
						<LessonBlock
							key={lesson.id}
							lesson={lesson}
							index={index}
							count={lessons.length}
							open={open.has(lesson.id)}
							selectedId={selectedId}
							lessons={lessons}
							actions={actions}
							onToggle={() => toggle(lesson.id)}
						/>
					))}
				</SortableContext>
			</DndContext>
			<div className="ln-souter__footer">
				<button type="button" className="ln-btn ln-btn--block" onClick={actions.onAddLesson}>
					<StudioIcon name="plus" size={14} /> Thêm bài
				</button>
				<button type="button" className="ln-btn ln-btn--block" onClick={actions.onImport}>
					<StudioIcon name="import" size={14} /> Nhập nội dung
				</button>
			</div>
		</div>
	);
}
