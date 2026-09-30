'use client';

import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

import {
	LEARN_SECTION_KIND_SHORT,
	type LearnSectionKind,
	type LearnStudioLesson,
	type LearnStudioSection,
} from '@/features/learn/types';

import { StudioIcon } from './icons';

function useOutlineSensors() {
	return useSensors(
		useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
		useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);
}

function reorder(ids: string[], event: DragEndEvent): string[] | null {
	const { active, over } = event;
	if (!over || active.id === over.id) return null;
	const from = ids.indexOf(String(active.id));
	const to = ids.indexOf(String(over.id));
	return from < 0 || to < 0 ? null : arrayMove(ids, from, to);
}

function SectionRow({
	section,
	lessonId,
	selected,
	onSelect,
}: {
	section: LearnStudioSection;
	lessonId: string;
	selected: boolean;
	onSelect: () => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: section.id,
		data: { type: 'section', lessonId },
	});
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
				{...attributes}
				{...listeners}
			>
				<StudioIcon name="grip" size={14} />
			</button>
			<button type="button" className="ln-souter__section-btn" onClick={onSelect}>
				<span className="ln-outline__mark" data-kind={section.type} aria-hidden="true" />
				<span className="min-w-0 flex-1 truncate">{section.title || 'Chưa đặt tên'}</span>
				{section.type !== 'READING' ? (
					<span className="ln-souter__tag">{LEARN_SECTION_KIND_SHORT[section.type]}</span>
				) : null}
			</button>
		</li>
	);
}

function LessonBlock({
	lesson,
	index,
	selectedId,
	onSelect,
	onRename,
	onAddSection,
	onDelete,
}: {
	lesson: LearnStudioLesson;
	index: number;
	selectedId: string | null;
	onSelect: (sectionId: string) => void;
	onRename: (title: string) => void;
	onAddSection: (type: LearnSectionKind) => void;
	onDelete: () => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: lesson.id,
		data: { type: 'lesson', lessonId: lesson.id },
	});
	const ids = lesson.sections.map((section) => section.id);
	const [title, setTitle] = useState(lesson.title);

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className="ln-souter__lesson"
			data-dragging={isDragging ? 'true' : undefined}
		>
			<div className="ln-souter__lesson-head">
				<button
					type="button"
					className="ln-grip"
					aria-label={`Kéo để sắp xếp bài ${index + 1}`}
					{...attributes}
					{...listeners}
				>
					<StudioIcon name="grip" size={14} />
				</button>
				<span className="ln-outline__lesson-label">Bài {index + 1}</span>
				<button
					type="button"
					className="ln-icon-btn ln-icon-btn--danger ml-auto"
					onClick={onDelete}
					aria-label={`Xóa bài ${index + 1}`}
					title="Xóa bài"
				>
					<StudioIcon name="trash" size={13} />
				</button>
			</div>
			<input
				className="ln-souter__lesson-title"
				value={title}
				aria-label={`Tên bài ${index + 1}`}
				onChange={(event) => setTitle(event.target.value)}
				onBlur={() => {
					const next = title.trim();
					if (next && next !== lesson.title) onRename(next);
					else setTitle(lesson.title);
				}}
				onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
			/>
			<SortableContext id={lesson.id} items={ids} strategy={verticalListSortingStrategy}>
				<ol className="ln-souter__sections">
					{lesson.sections.map((section) => (
						<SectionRow
							key={section.id}
							section={section}
							lessonId={lesson.id}
							selected={section.id === selectedId}
							onSelect={() => onSelect(section.id)}
						/>
					))}
				</ol>
			</SortableContext>
			<div className="ln-souter__add">
				<button type="button" className="ln-link-btn" onClick={() => onAddSection('READING')}>
					+ Mục đọc
				</button>
				<button type="button" className="ln-link-btn" onClick={() => onAddSection('QUIZ')}>
					+ Bài kiểm tra
				</button>
				<button type="button" className="ln-link-btn" onClick={() => onAddSection('PRACTICE')}>
					+ Luyện tập
				</button>
				<button type="button" className="ln-link-btn" onClick={() => onAddSection('DISCUSSION')}>
					+ Phản biện
				</button>
			</div>
		</div>
	);
}

export default function StudioOutline({
	lessons,
	selectedId,
	onSelect,
	onRenameLesson,
	onReorderLessons,
	onReorderSections,
	onPlaceSection,
	onAddSection,
	onDeleteLesson,
	onAddLesson,
	onImport,
}: {
	lessons: LearnStudioLesson[];
	selectedId: string | null;
	onSelect: (sectionId: string) => void;
	onRenameLesson: (lessonId: string, title: string) => void;
	onReorderLessons: (ids: string[]) => void;
	onReorderSections: (lessonId: string, ids: string[]) => void;
	onPlaceSection: (sectionId: string, lessonId: string, beforeId: string | null) => void;
	onAddSection: (lessonId: string, type: LearnSectionKind) => void;
	onDeleteLesson: (lessonId: string) => void;
	onAddLesson: () => void;
	onImport: () => void;
}) {
	const sensors = useOutlineSensors();
	const ids = lessons.map((lesson) => lesson.id);

	return (
		<nav className="ln-souter" aria-label="Mục lục khóa học">
			<DndContext
				id="ln-lessons"
				sensors={sensors}
				collisionDetection={closestCenter}
				modifiers={[restrictToVerticalAxis]}
				onDragEnd={(event) => {
					const activeType = event.active.data.current?.type;
					if (activeType === 'lesson') {
						const next = reorder(ids, event);
						if (next) onReorderLessons(next);
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
						if (next) onReorderSections(fromLesson, next);
						return;
					}
					onPlaceSection(
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
							selectedId={selectedId}
							onSelect={onSelect}
							onRename={(title) => onRenameLesson(lesson.id, title)}
							onAddSection={(type) => onAddSection(lesson.id, type)}
							onDelete={() => onDeleteLesson(lesson.id)}
						/>
					))}
				</SortableContext>
			</DndContext>
			<div className="ln-souter__footer">
				<button type="button" className="ln-btn ln-btn--block" onClick={onAddLesson}>
					<StudioIcon name="plus" size={14} /> Thêm bài
				</button>
				<button type="button" className="ln-btn ln-btn--block" onClick={onImport}>
					<StudioIcon name="import" size={14} /> Nhập bằng AI
				</button>
			</div>
		</nav>
	);
}
