'use client';

import { closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
	arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useStudioSensors } from './dndSensors';
import { StudioIcon } from './icons';
import StudioMenu from './StudioMenu';

export interface NavItem {
	id: string;
	title: string;
	issues: string[];
	group: string | null;
}

function Row({
	item,
	index,
	active,
	onSelect,
	onDuplicate,
	onDelete,
	onMove,
}: {
	item: NavItem;
	index: number;
	active: boolean;
	onSelect: () => void;
	onDuplicate: () => void;
	onDelete: () => void;
	onMove: (delta: number) => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: item.id,
	});
	return (
		<li
			ref={setNodeRef}
			className="ln-qnav__row"
			data-active={active ? 'true' : undefined}
			data-dragging={isDragging ? 'true' : undefined}
			style={{ transform: CSS.Transform.toString(transform), transition }}
		>
			<button
				type="button"
				className="ln-grip"
				aria-label={`Kéo câu ${index + 1}`}
				title="Kéo để sắp xếp"
				{...attributes}
				{...listeners}
			>
				<StudioIcon name="grip" size={14} />
			</button>
			<button
				type="button"
				className="ln-qnav__main"
				title={item.title}
				onClick={onSelect}
				onKeyDown={(event) => {
					if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
					event.preventDefault();
					onMove(event.key === 'ArrowUp' ? -1 : 1);
				}}
			>
				<span className="tabular-nums">Câu {index + 1}</span>
				<span className="ln-qnav__title">{item.title}</span>
				{item.issues.length ? (
					<span className="ln-qnav__badge" title={item.issues.join('. ')}>
						{item.issues[0]}
					</span>
				) : null}
			</button>
			<StudioMenu
				label={`Thao tác câu ${index + 1}`}
				align="end"
				items={[
					{ label: 'Đưa lên', onSelect: () => onMove(-1) },
					{ label: 'Đưa xuống', onSelect: () => onMove(1) },
					{ label: 'Nhân bản', icon: 'duplicate', onSelect: onDuplicate },
					{ label: 'Xóa', icon: 'trash', danger: true, onSelect: onDelete },
				]}
			/>
		</li>
	);
}

export default function QuestionNavigator({
	items,
	activeId,
	onSelect,
	onReorder,
	onDuplicate,
	onDelete,
}: {
	items: NavItem[];
	activeId: string | null;
	onSelect: (id: string) => void;
	onReorder: (ids: string[]) => void;
	onDuplicate: (id: string) => void;
	onDelete: (id: string) => void;
}) {
	const sensors = useStudioSensors();
	const groups: Array<{ label: string; items: NavItem[] }> = [];
	for (const item of items) {
		const label = item.group ?? 'Chưa có phần';
		const last = groups.at(-1);
		if (last?.label === label) last.items.push(item);
		else groups.push({ label, items: [item] });
	}
	const showGroups = items.some((item) => item.group);

	function move(id: string, delta: number) {
		const ids = items.map((item) => item.id);
		const from = ids.indexOf(id);
		const to = from + delta;
		if (from < 0 || to < 0 || to >= ids.length) return;
		onReorder(arrayMove(ids, from, to));
	}

	function onDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const ids = items.map((item) => item.id);
		const from = ids.indexOf(String(active.id));
		const to = ids.indexOf(String(over.id));
		if (from < 0 || to < 0) return;
		onReorder(arrayMove(ids, from, to));
	}

	let cursor = 0;
	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			modifiers={[restrictToVerticalAxis]}
			onDragEnd={onDragEnd}
		>
			<SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
				<div className="ln-qnav">
					{groups.map((group) => (
						<div key={group.label} className="ln-qnav__group">
							{showGroups ? <p className="ln-qnav__group-label">{group.label}</p> : null}
							<ol className="ln-qnav__list">
								{group.items.map((item) => {
									const index = cursor;
									cursor += 1;
									return (
										<Row
											key={item.id}
											item={item}
											index={index}
											active={item.id === activeId}
											onSelect={() => onSelect(item.id)}
											onDuplicate={() => onDuplicate(item.id)}
											onDelete={() => onDelete(item.id)}
											onMove={(delta) => move(item.id, delta)}
										/>
									);
								})}
							</ol>
						</div>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}
