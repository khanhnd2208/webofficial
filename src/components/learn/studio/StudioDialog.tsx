'use client';

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

import { StudioIcon } from './icons';

/** Native <dialog> so focus trapping, Escape and the backdrop come for free. */
export default function StudioDialog({
	title,
	onClose,
	children,
	footer,
	size = 'wide',
	busy = false,
}: {
	title: string;
	onClose: () => void;
	children: ReactNode;
	footer?: ReactNode;
	size?: 'wide' | 'narrow';
	/** While a write is in progress, Escape, the backdrop and the close button do nothing. */
	busy?: boolean;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	const titleId = useId();

	useEffect(() => {
		const dialog = ref.current;
		if (dialog && !dialog.open) dialog.showModal();
		return () => dialog?.close();
	}, []);

	return (
		<dialog
			ref={ref}
			className="ln-dialog"
			aria-labelledby={titleId}
			data-size={size}
			onCancel={(event) => {
				event.preventDefault();
				if (!busy) onClose();
			}}
			onClick={(event) => {
				if (busy) return;
				if (event.target === ref.current) onClose();
			}}
		>
			<div className="ln-dialog__inner">
				<header className="ln-dialog__head">
					<h2 id={titleId}>{title}</h2>
					<button
						type="button"
						className="ln-icon-btn"
						onClick={onClose}
						aria-label="Đóng"
						disabled={busy}
					>
						<StudioIcon name="close" />
					</button>
				</header>
				<div className="ln-dialog__body">{children}</div>
				{footer ? <footer className="ln-dialog__foot">{footer}</footer> : null}
			</div>
		</dialog>
	);
}

function cycleDrawerFocus(event: KeyboardEvent<HTMLDialogElement>) {
	if (event.key !== 'Tab') return;
	const focusable = Array.from(
		event.currentTarget.querySelectorAll<HTMLElement>(
			'button, a[href], input, select, textarea, [tabindex]',
		),
	).filter(
		(node) => node.tabIndex >= 0 && !node.matches(':disabled') && node.getClientRects().length > 0,
	);
	const first = focusable[0];
	const last = focusable.at(-1);
	if (event.shiftKey && document.activeElement === first) {
		event.preventDefault();
		last?.focus();
	} else if (!event.shiftKey && document.activeElement === last) {
		event.preventDefault();
		first?.focus();
	}
}

/** Native modal drawer keeps focus inside the open panel and restores its trigger on close. */
export function StudioDrawer({
	title,
	side,
	onClose,
	children,
}: {
	title: string;
	side: 'left' | 'right';
	onClose: () => void;
	children: ReactNode;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	useEffect(() => {
		const dialog = ref.current;
		const trigger = document.activeElement;
		dialog?.showModal();
		return () => {
			dialog?.close();
			if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
		};
	}, []);
	return (
		<dialog
			ref={ref}
			className="ln-drawer"
			onKeyDown={cycleDrawerFocus}
			data-side={side}
			aria-label={title}
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}
			onClick={(event) => {
				if (event.target === ref.current) onClose();
			}}
		>
			{children}
		</dialog>
	);
}
