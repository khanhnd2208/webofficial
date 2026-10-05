'use client';

import { useSurfaceTheme } from '@/components/ui/SurfaceTheme';

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
	type ReactNode,
	type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

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
	panelRef,
}: {
	open: boolean;
	onClose: () => void;
	rootRef: RefObject<HTMLElement | null>;
	triggerRef?: RefObject<HTMLElement | null>;
	panelRef?: RefObject<HTMLElement | null>;
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
			if (
				!rootRef.current?.contains(event.target as Node) &&
				!panelRef?.current?.contains(event.target as Node)
			)
				onClose();
		}

		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('pointerdown', onPointerDown);
		const triggerNode = triggerRef?.current ?? null;
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('pointerdown', onPointerDown);
			if (closedByEscape.current) triggerNode?.focus();
		};
	}, [open, onClose, panelRef, rootRef, triggerRef]);
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
	const surface = useSurfaceTheme();
	const id = useId();
	const registry = useContext(TeachingPopoverRegistry);
	const [localOpen, setLocalOpen] = useState(false);
	const open = registry ? registry.activeId === id : localOpen;
	const rootRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);

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

	useTeachingDismissible({ open, onClose: close, rootRef, triggerRef, panelRef });
	useEffect(() => {
		if (!open || !triggerRef.current || !panelRef.current) return;
		const update = () => {
			if (!triggerRef.current || !panelRef.current) return;
			const rect = triggerRef.current.getBoundingClientRect();
			const panelHeight = panelRef.current.getBoundingClientRect().height;
			panelRef.current.style.top = `${Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - panelHeight - 8))}px`;
			const width = panelRef.current.getBoundingClientRect().width;
			const desiredLeft = align === 'right' ? rect.right - width : rect.left;
			panelRef.current.style.left = `${Math.max(8, Math.min(desiredLeft, window.innerWidth - width - 8))}px`;
			panelRef.current.style.right = 'auto';
		};
		update();
		panelRef.current
			.querySelector<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled)')
			?.focus();
		window.addEventListener('resize', update);
		window.addEventListener('scroll', update, true);
		return () => {
			window.removeEventListener('resize', update);
			window.removeEventListener('scroll', update, true);
		};
	}, [align, open]);

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
			{open && typeof document !== 'undefined'
				? createPortal(
						<div
							ref={panelRef}
							data-surface={surface}
							role={closeOnInsideClick ? 'menu' : 'dialog'}
							aria-label={ariaLabel}
							className="fixed z-[90] max-h-[min(70dvh,32rem)] min-w-56 max-w-[calc(100vw-1rem)] overflow-auto rounded-[var(--mc-r-md)] border border-mc-rule bg-paper p-2 shadow-lg"
							style={{ top: 0, left: 0 }}
							onKeyDown={(event) => {
								if (event.key === 'Escape') {
									event.preventDefault();
									event.stopPropagation();
									close();
									triggerRef.current?.focus();
									return;
								}
								const items = Array.from(
									panelRef.current?.querySelectorAll<HTMLElement>(
										'button:not(:disabled), a[href]',
									) ?? [],
								);
								if (event.key === 'Tab') {
									close();
									triggerRef.current?.focus();
									return;
								}
								if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || !items.length)
									return;
								event.preventDefault();
								const current = items.indexOf(document.activeElement as HTMLElement);
								const next =
									event.key === 'Home'
										? 0
										: event.key === 'End'
											? items.length - 1
											: (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) %
												items.length;
								items[next]?.focus();
							}}
							onClick={() => {
								if (closeOnInsideClick) close();
							}}
						>
							{children}
						</div>,
						document.body,
					)
				: null}
		</div>
	);
}
