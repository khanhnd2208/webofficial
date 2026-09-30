'use client';

import { useSurfaceTheme } from '@/components/ui/SurfaceTheme';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Portalled so frozen columns and the table's scroll container cannot clip controls. */
export function GridPopover({
	label,
	trigger,
	children,
	menu = false,
	disabled = false,
}: {
	label: string;
	trigger: ReactNode;
	children: ReactNode | ((close: () => void) => ReactNode);
	menu?: boolean;
	disabled?: boolean;
}) {
	const surface = useSurfaceTheme();
	const id = useId();
	const [open, setOpen] = useState(false);
	const [returnFocus, setReturnFocus] = useState(false);
	const anchor = useRef<HTMLButtonElement>(null);
	const panel = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!open && returnFocus) {
			const node = anchor.current;
			queueMicrotask(() => node?.focus());
		}
	}, [open, returnFocus]);
	useEffect(() => {
		if (!open) return;
		const triggerNode = anchor.current;
		const update = () => {
			if (!triggerNode || !panel.current) return;
			const rect = triggerNode.getBoundingClientRect();
			const box = panel.current.getBoundingClientRect();
			panel.current.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - box.width - 8))}px`;
			panel.current.style.top = `${Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - box.height - 8))}px`;
		};
		update();
		(
			panel.current?.querySelector<HTMLElement>('[data-autofocus]') ??
			panel.current?.querySelector<HTMLElement>('input:not([type="date"]), button:not(:disabled)')
		)?.focus();
		const dismiss = (e: Event) => {
			if (!panel.current?.contains(e.target as Node) && !triggerNode?.contains(e.target as Node))
				setOpen(false);
		};
		const escape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				setOpen(false);
				triggerNode?.focus();
			}
			if (!menu || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
			const items = [
				...(panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []),
			];
			if (!items.length) return;
			e.preventDefault();
			const index = items.indexOf(document.activeElement as HTMLButtonElement);
			items[
				e.key === 'Home'
					? 0
					: e.key === 'End'
						? items.length - 1
						: (index + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
			]?.focus();
		};
		const observer = new ResizeObserver(update);
		if (panel.current) observer.observe(panel.current);
		window.addEventListener('resize', update);
		window.addEventListener('scroll', update, true);
		document.addEventListener('pointerdown', dismiss);
		document.addEventListener('focusin', dismiss);
		document.addEventListener('keydown', escape);
		return () => {
			observer.disconnect();
			window.removeEventListener('resize', update);
			window.removeEventListener('scroll', update, true);
			document.removeEventListener('pointerdown', dismiss);
			document.removeEventListener('focusin', dismiss);
			document.removeEventListener('keydown', escape);
		};
	}, [open, menu]);
	return (
		<>
			<button
				ref={anchor}
				type="button"
				className="mc-grid-popover-trigger"
				aria-label={label}
				aria-haspopup={menu ? 'menu' : 'dialog'}
				aria-expanded={open}
				aria-controls={open ? id : undefined}
				disabled={disabled}
				onClick={() => {
					setReturnFocus(false);
					setOpen((v) => !v);
				}}
			>
				{trigger}
			</button>
			{open &&
				createPortal(
					<div className="mc mc-studio teaching-portal" data-surface={surface}>
						<div
							ref={panel}
							id={id}
							role={menu ? 'menu' : 'dialog'}
							aria-label={label}
							className="mc-grid-popover-panel"
							onClick={(e) => {
								if (menu && (e.target as HTMLElement).closest('button:not(:disabled)')) {
									setOpen(false);
									anchor.current?.focus();
								}
							}}
						>
							{typeof children === 'function'
								? children(() => {
										setOpen(false);
										setReturnFocus(true);
									})
								: children}
						</div>
					</div>,
					document.body,
				)}
		</>
	);
}
