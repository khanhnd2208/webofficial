'use client';

import {
	createContext,
	useContext,
	useMemo,
	useState,
	useSyncExternalStore,
	type CSSProperties,
	type ReactNode,
} from 'react';
import {
	DndContext,
	DragOverlay,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	closestCenter,
	useSensor,
	useSensors,
	type CollisionDetection,
	type DragEndEvent,
	type DragOverEvent,
	type DragStartEvent,
	type DraggableAttributes,
	type DraggableSyntheticListeners,
	type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToFirstScrollableAncestor, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { McIcon } from '@/components/myclass/ui';

export type OutlineDragType = 'lesson' | 'section' | 'unit';

export type OutlineDragData = {
	type: OutlineDragType;
	id: string;
	parentId: string;
	title: string;
};

export type OutlineDropHint = { id: UniqueIdentifier; edge: 'before' | 'after' } | null;

export type OutlineSortableBind = {
	setNodeRef: (node: HTMLElement | null) => void;
	style: CSSProperties | undefined;
	handleListeners: DraggableSyntheticListeners;
	handleAttributes: DraggableAttributes | Record<string, never>;
	isDragging: boolean;
	dropEdge: 'before' | 'after' | null;
};

const INACTIVE_BIND: OutlineSortableBind = {
	setNodeRef: () => undefined,
	style: undefined,
	handleListeners: undefined,
	handleAttributes: {},
	isDragging: false,
	dropEdge: null,
};

type OutlineDndUi = {
	dropHint: OutlineDropHint;
	active: OutlineDragData | null;
};

const OutlineDndUiContext = createContext<OutlineDndUi>({ dropHint: null, active: null });

export function sortableId(type: OutlineDragType, id: string, parentId?: string) {
	return type === 'unit' && parentId ? `unit:${parentId}:${id}` : `${type}:${id}`;
}

export function parentTypeOf(type: OutlineDragType): 'course' | 'lesson' | 'section' {
	if (type === 'lesson') return 'course';
	if (type === 'section') return 'lesson';
	return 'section';
}

function usePrefersReducedMotion() {
	return useSyncExternalStore(
		(onChange) => {
			const media = window.matchMedia('(prefers-reduced-motion: reduce)');
			media.addEventListener('change', onChange);
			return () => media.removeEventListener('change', onChange);
		},
		() => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
		() => false,
	);
}

function readData(value: unknown): OutlineDragData | undefined {
	if (!value || typeof value !== 'object') return undefined;
	const data = value as Partial<OutlineDragData>;
	if (data.type !== 'lesson' && data.type !== 'section' && data.type !== 'unit') return undefined;
	if (!data.id || !data.parentId) return undefined;
	return {
		type: data.type,
		id: data.id,
		parentId: data.parentId,
		title: data.title ?? '',
	};
}

const sameParentCollision: CollisionDetection = (args) => {
	const activeData = readData(args.active.data.current);
	const containers = args.droppableContainers.filter((container) => {
		const data = readData(container.data.current);
		return Boolean(
			activeData && data && data.type === activeData.type && data.parentId === activeData.parentId,
		);
	});
	return closestCenter({ ...args, droppableContainers: containers });
};

function dropEdgeFromEvent(event: DragOverEvent | DragEndEvent): OutlineDropHint {
	const { active, over } = event;
	if (!over || active.id === over.id) return null;
	const activeData = readData(active.data.current);
	const overData = readData(over.data.current);
	if (
		!activeData ||
		!overData ||
		activeData.type !== overData.type ||
		activeData.parentId !== overData.parentId
	) {
		return null;
	}
	const activeTop = active.rect.current.translated?.top ?? active.rect.current.initial?.top ?? 0;
	const overMid = over.rect.top + over.rect.height / 2;
	return { id: over.id, edge: activeTop < overMid ? 'before' : 'after' };
}

const announcements = {
	onDragStart({ active }: { active: { data: { current?: unknown } } }) {
		const data = readData(active.data.current);
		return data ? `Đã nhấc ${data.title}` : 'Đã nhấc mục';
	},
	onDragOver({
		over,
		active,
	}: {
		over: { data: { current?: unknown } } | null;
		active: { data: { current?: unknown } };
	}) {
		const overData = readData(over?.data.current);
		const activeData = readData(active.data.current);
		if (!overData || !activeData) return;
		return `Thả gần ${overData.title}`;
	},
	onDragEnd({ over }: { over: { data: { current?: unknown } } | null }) {
		return over ? 'Đã thả mục' : 'Đã hủy kéo';
	},
	onDragCancel() {
		return 'Đã hủy kéo';
	},
};

export function OutlineDnd({
	enabled,
	children,
	onDragStart,
	onDragFinished,
	onReorder,
}: {
	enabled: boolean;
	children: ReactNode;
	onDragStart?: (data: OutlineDragData) => void;
	onDragFinished?: () => void;
	onReorder?: (payload: {
		type: OutlineDragType;
		parentId: string;
		activeId: string;
		overId: string;
	}) => void;
}) {
	if (!enabled) return <>{children}</>;
	return (
		<OutlineDndActive onDragStart={onDragStart} onDragFinished={onDragFinished} onReorder={onReorder}>
			{children}
		</OutlineDndActive>
	);
}

function OutlineDndActive({
	children,
	onDragStart,
	onDragFinished,
	onReorder,
}: {
	children: ReactNode;
	onDragStart?: (data: OutlineDragData) => void;
	onDragFinished?: () => void;
	onReorder?: (payload: {
		type: OutlineDragType;
		parentId: string;
		activeId: string;
		overId: string;
	}) => void;
}) {
	const [active, setActive] = useState<OutlineDragData | null>(null);
	const [dropHint, setDropHint] = useState<OutlineDropHint>(null);
	const sensors = useSensors(
		useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
		useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);
	const reducedMotion = usePrefersReducedMotion();

	function handleDragStart(event: DragStartEvent) {
		const data = readData(event.active.data.current);
		if (!data) return;
		setActive(data);
		setDropHint(null);
		onDragStart?.(data);
	}

	function handleDragOver(event: DragOverEvent) {
		setDropHint(dropEdgeFromEvent(event));
	}

	function handleDragEnd(event: DragEndEvent) {
		const activeData = readData(event.active.data.current);
		const overData = readData(event.over?.data.current);
		setActive(null);
		setDropHint(null);
		onDragFinished?.();
		if (!activeData || !overData) return;
		if (activeData.type !== overData.type || activeData.parentId !== overData.parentId) return;
		if (activeData.id === overData.id) return;
		onReorder?.({
			type: activeData.type,
			parentId: activeData.parentId,
			activeId: activeData.id,
			overId: overData.id,
		});
	}

	function handleDragCancel() {
		setActive(null);
		setDropHint(null);
		onDragFinished?.();
	}

	const ui = useMemo<OutlineDndUi>(() => ({ dropHint, active }), [dropHint, active]);

	return (
		<OutlineDndUiContext.Provider value={ui}>
			<DndContext
				id="my-class-outline-dnd"
				sensors={sensors}
				collisionDetection={sameParentCollision}
				modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
				onDragStart={handleDragStart}
				onDragOver={handleDragOver}
				onDragEnd={handleDragEnd}
				onDragCancel={handleDragCancel}
				accessibility={{
					announcements,
					screenReaderInstructions: {
						draggable: 'Để đổi thứ tự, nhấn Space, dùng phím mũi tên, rồi Space để thả.',
					},
				}}
			>
				{children}
				<DragOverlay dropAnimation={reducedMotion ? null : { duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
					{active ? (
						<div className="mc mc-outline-overlay">
							<McIcon name="drag_indicator" size={16} />
							<span className="min-w-0 truncate">{active.title}</span>
						</div>
					) : null}
				</DragOverlay>
			</DndContext>
		</OutlineDndUiContext.Provider>
	);
}

export function OutlineSortableList({
	enabled,
	items,
	children,
}: {
	enabled: boolean;
	items: string[];
	children: ReactNode;
}) {
	if (!enabled) return <>{children}</>;
	return (
		<SortableContext items={items} strategy={verticalListSortingStrategy}>
			{children}
		</SortableContext>
	);
}

export function OutlineSortableItem({
	enabled,
	id,
	data,
	disabled,
	children,
}: {
	enabled: boolean;
	id: string;
	data: OutlineDragData;
	disabled?: boolean;
	children: (bind: OutlineSortableBind) => ReactNode;
}) {
	if (!enabled) return <>{children(INACTIVE_BIND)}</>;
	return (
		<OutlineSortableItemActive id={id} data={data} disabled={disabled}>
			{children}
		</OutlineSortableItemActive>
	);
}

function OutlineSortableItemActive({
	id,
	data,
	disabled,
	children,
}: {
	id: string;
	data: OutlineDragData;
	disabled?: boolean;
	children: (bind: OutlineSortableBind) => ReactNode;
}) {
	const { dropHint } = useContext(OutlineDndUiContext);
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
		data,
		disabled,
	});
	const reducedMotion = usePrefersReducedMotion();
	const style: CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition: reducedMotion ? undefined : transition,
	};

	return (
		<>
			{children({
				setNodeRef,
				style,
				handleListeners: listeners,
				handleAttributes: attributes,
				isDragging,
				dropEdge: dropHint?.id === id ? dropHint.edge : null,
			})}
		</>
	);
}
