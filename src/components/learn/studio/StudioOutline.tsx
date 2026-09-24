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

import type { LearnSectionKind, LearnStudioLesson, LearnStudioSection } from '@/features/learn/types';

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
	selected,
	onSelect,
}: {
	section: LearnStudioSection;
	selected: boolean;
	onSelect: () => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
	return (
		<li
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className="ln-souter__section"
			data-selected={selected ? 'true' : undefined}
			data-dragging={isDragging ? 'true' : undefined}
		>
			<button type="button" className="ln-grip" aria-label={`Kéo để sắp xếp: ${section.title}`} {...attributes} {...listeners}>
				<StudioIcon name="grip" size={14} />
			</button>
			<button type="button" className="ln-souter__section-btn" onClick={onSelect}>
				<span className="ln-outline__mark" data-kind={section.type} aria-hidden="true" />
				<span className="min-w-0 flex-1 truncate">{section.title || 'Chưa đặt tên'}</span>
				{section.type === 'QUIZ' ? <span className="ln-souter__tag">Kiểm tra</span> : null}
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
	onReorderSections,
	onAddSection,
	onDelete,
}: {
	lesson: LearnStudioLesson;
	index: number;
	selectedId: string | null;
	onSelect: (sectionId: string) => void;
	onRename: (title: string) => void;
	onReorderSections: (ids: string[]) => void;
	onAddSection: (type: LearnSectionKind) => void;
	onDelete: () => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
	const sensors = useOutlineSensors();
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
				<button type="button" className="ln-grip" aria-label={`Kéo để sắp xếp bài ${index + 1}`} {...attributes} {...listeners}>
					<StudioIcon name="grip" size={14} />
				</button>
				<span className="ln-outline__lesson-label">Bài {index + 1}</span>
				<button type="button" className="ln-icon-btn ln-icon-btn--danger ml-auto" onClick={onDelete} aria-label={`Xóa bài ${index + 1}`} title="Xóa bài">
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
			<DndContext
				id={`ln-sections-${lesson.id}`}
				sensors={sensors}
				collisionDetection={closestCenter}
				modifiers={[restrictToVerticalAxis]}
				onDragEnd={(event) => {
					const next = reorder(ids, event);
					if (next) onReorderSections(next);
				}}
			>
				<SortableContext items={ids} strategy={verticalListSortingStrategy}>
					<ol className="ln-souter__sections">
						{lesson.sections.map((section) => (
							<SectionRow
								key={section.id}
								section={section}
								selected={section.id === selectedId}
								onSelect={() => onSelect(section.id)}
							/>
						))}
					</ol>
				</SortableContext>
			</DndContext>
			<div className="ln-souter__add">
				<button type="button" className="ln-link-btn" onClick={() => onAddSection('READING')}>
					+ Mục đọc
				</button>
				<button type="button" className="ln-link-btn" onClick={() => onAddSection('QUIZ')}>
					+ Bài kiểm tra
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
					const next = reorder(ids, event);
					if (next) onReorderLessons(next);
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
							onReorderSections={(sectionIds) => onReorderSections(lesson.id, sectionIds)}
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
					<StudioIcon name="import" size={14} /> Nhập bài từ Markdown
				</button>
			</div>
		</nav>
	);
}
