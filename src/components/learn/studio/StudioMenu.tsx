'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { StudioIcon, type StudioIconName } from './icons';

export interface StudioMenuItem {
	label: string;
	onSelect: () => void;
	icon?: StudioIconName;
	/** One short line under the label. */
	hint?: string;
	danger?: boolean;
	disabled?: boolean;
}

export type StudioMenuEntry = StudioMenuItem | 'divider';

/**
 * Button plus popover menu. Esc and clicks outside close it and return focus to the button;
 * arrow keys, Home and End move between items.
 */
export default function StudioMenu({
	label,
	items,
	trigger,
	align = 'start',
	triggerClassName = 'ln-icon-btn',
	title,
}: {
	/** Accessible name of the trigger button. */
	label: string;
	items: StudioMenuEntry[];
	/** Visible content of the trigger; defaults to ⋯. */
	trigger?: ReactNode;
	align?: 'start' | 'end';
	triggerClassName?: string;
	title?: string;
}) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const menuId = useId();

	useEffect(() => {
		if (!open) return;
		const menuItems = () =>
			[...(rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])].filter(
				(item) => !item.disabled,
			);
		menuItems()[0]?.focus();
		const onPointer = (event: PointerEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.stopPropagation();
				setOpen(false);
				buttonRef.current?.focus();
				return;
			}
			const list = menuItems();
			const at = list.indexOf(document.activeElement as HTMLButtonElement);
			const move = (index: number) => {
				event.preventDefault();
				list[(index + list.length) % list.length]?.focus();
			};
			if (event.key === 'ArrowDown') move(at + 1);
			else if (event.key === 'ArrowUp') move(at - 1);
			else if (event.key === 'Home') move(0);
			else if (event.key === 'End') move(list.length - 1);
			else if (event.key === 'Tab') setOpen(false);
		};
		document.addEventListener('pointerdown', onPointer);
		document.addEventListener('keydown', onKey, true);
		return () => {
			document.removeEventListener('pointerdown', onPointer);
			document.removeEventListener('keydown', onKey, true);
		};
	}, [open]);

	return (
		<div className="ln-menu" ref={rootRef}>
			<button
				ref={buttonRef}
				type="button"
				className={triggerClassName}
				aria-label={label}
				title={title ?? label}
				aria-haspopup="menu"
				aria-expanded={open}
				aria-controls={open ? menuId : undefined}
				onClick={(event) => {
					event.stopPropagation();
					setOpen((value) => !value);
				}}
			>
				{trigger ?? <StudioIcon name="more" size={16} />}
			</button>
			{open ? (
				<div id={menuId} className="ln-popover" data-align={align} role="menu" aria-label={label}>
					{items.map((item, index) =>
						item === 'divider' ? (
							<hr key={`divider-${index}`} className="ln-popover__divider" />
						) : (
							<button
								key={item.label}
								type="button"
								role="menuitem"
								className="ln-popover__item"
								data-danger={item.danger || undefined}
								disabled={item.disabled}
								onClick={() => {
									setOpen(false);
									buttonRef.current?.focus();
									item.onSelect();
								}}
							>
								{item.icon ? <StudioIcon name={item.icon} size={15} /> : null}
								<span className="ln-popover__text">
									<span>{item.label}</span>
									{item.hint ? <span className="ln-popover__hint">{item.hint}</span> : null}
								</span>
							</button>
						),
					)}
				</div>
			) : null}
		</div>
	);
}
