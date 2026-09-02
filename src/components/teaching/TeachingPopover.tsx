'use client';

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
	type CSSProperties,
	type ReactNode,
	type RefObject,
} from 'react';

type Registry = {
	activeId: string | null;
	setActive: (id: string | null) => void;
};

const TeachingPopoverRegistry = createContext<Registry | null>(null);

export function TeachingPopoverRoot({ children }: { children: ReactNode }) {
	const existing = useContext(TeachingPopoverRegistry);
	const [activeId, setActive] = useState<string | null>(null);
	if (existing) return children;
	return (
		<TeachingPopoverRegistry.Provider value={{ activeId, setActive }}>
			{children}
		</TeachingPopoverRegistry.Provider>
	);
}

export function useTeachingDismissible({
	open,
	onClose,
	rootRef,
	triggerRef,
}: {
	open: boolean;
	onClose: () => void;
	rootRef: RefObject<HTMLElement | null>;
	triggerRef?: RefObject<HTMLElement | null>;
}) {
	const closedByEscape = useRef(false);

	useEffect(() => {
		if (!open) return;
		closedByEscape.current = false;

		function onKeyDown(event: KeyboardEvent) {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			closedByEscape.current = true;
			onClose();
		}

		function onPointerDown(event: PointerEvent) {
			if (!rootRef.current?.contains(event.target as Node)) onClose();
		}

		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('pointerdown', onPointerDown);
		const triggerNode = triggerRef?.current ?? null;
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('pointerdown', onPointerDown);
			if (closedByEscape.current) triggerNode?.focus();
		};
	}, [open, onClose, rootRef, triggerRef]);
}

export function TeachingPopover({
	trigger,
	children,
	align = 'right',
	closeOnInsideClick = true,
	ariaLabel,
}: {
	trigger: (args: {
		open: boolean;
		toggle: () => void;
		triggerRef: RefObject<HTMLButtonElement | null>;
		triggerProps: {
			'aria-expanded': boolean;
			'aria-haspopup': 'menu' | 'dialog';
			type: 'button';
		};
	}) => ReactNode;
	children: ReactNode;
	align?: 'left' | 'right';
	closeOnInsideClick?: boolean;
	ariaLabel?: string;
}) {
	const id = useId();
	const registry = useContext(TeachingPopoverRegistry);
	const [localOpen, setLocalOpen] = useState(false);
	const open = registry ? registry.activeId === id : localOpen;
	const rootRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);

	const close = useCallback(() => {
		if (registry) {
			if (registry.activeId === id) registry.setActive(null);
		} else {
			setLocalOpen(false);
		}
	}, [id, registry]);

	const toggle = useCallback(() => {
		if (registry) {
			registry.setActive(registry.activeId === id ? null : id);
		} else {
			setLocalOpen((current) => !current);
		}
	}, [id, registry]);

	useTeachingDismissible({ open, onClose: close, rootRef, triggerRef });

	const panelStyle: CSSProperties =
		align === 'right' ? { right: 0 } : { left: 0 };

	return (
		<div ref={rootRef} className="relative">
			{trigger({
				open,
				toggle,
				triggerRef,
				triggerProps: {
					type: 'button',
					'aria-expanded': open,
					'aria-haspopup': closeOnInsideClick ? 'menu' : 'dialog',
				},
			})}
			{open ? (
				<div
					role={closeOnInsideClick ? 'menu' : 'dialog'}
					aria-label={ariaLabel}
					className="absolute z-40 mt-2 min-w-56 rounded-[var(--mc-r-md)] border border-mc-rule bg-paper p-2 shadow-lg"
					style={panelStyle}
					onClick={() => {
						if (closeOnInsideClick) close();
					}}
				>
					{children}
				</div>
			) : null}
		</div>
	);
}
