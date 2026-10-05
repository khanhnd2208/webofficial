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
}: {
	item: NavItem;
	index: number;
	active: boolean;
	onSelect: () => void;
	onDuplicate: () => void;
	onDelete: () => void;
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
			<button type="button" className="ln-qnav__main" onClick={onSelect}>
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
						<details
							key={group.label}
							className="ln-qnav__group"
							open={showGroups ? true : undefined}
						>
							{showGroups ? <summary>{group.label}</summary> : null}
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
										/>
									);
								})}
							</ol>
						</details>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}
