'use client';

import { useSurfaceTheme } from './SurfaceTheme';

import { useEffect, useId, useRef, type ReactNode } from 'react';

function useBodyScrollLock(open: boolean) {
	useEffect(() => {
		if (!open) return;
		const previousOverflow = document.body.style.overflow;
		const previousTouchAction = document.body.style.touchAction;
		document.body.style.overflow = 'hidden';
		document.body.style.touchAction = 'none';

		return () => {
			document.body.style.overflow = previousOverflow;
			document.body.style.touchAction = previousTouchAction;
		};
	}, [open]);
}

type LiveRegionProps = {
	message: string;
	politeness?: 'polite' | 'assertive';
};

/** Screen-reader announcements for toasts / form errors. */
export function LiveRegion({ message, politeness = 'polite' }: LiveRegionProps) {
	return (
		<div className="sr-only" aria-live={politeness} aria-atomic="true">
			{message}
		</div>
	);
}

type ToastProps = {
	message: string;
	visible: boolean;
	onDismiss?: () => void;
	className?: string;
};

export function Toast({ message, visible, onDismiss, className }: ToastProps) {
	if (!visible || !message) return null;
	return (
		<div
			role="status"
			className={`fixed left-1/2 z-[80] max-w-[min(92vw,24rem)] -translate-x-1/2 rounded-full border border-border-strong bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lg ${
				className ?? 'bottom-[max(1rem,env(safe-area-inset-bottom))]'
			}`}
		>
			<div className="flex items-center gap-3">
				<span>{message}</span>
				{onDismiss ? (
					<button
						type="button"
						onClick={onDismiss}
						className="min-h-10 min-w-10 rounded-full text-background/80 hover:text-background"
						aria-label="Đóng thông báo"
					>
						×
					</button>
				) : null}
			</div>
		</div>
	);
}

type DialogProps = {
	open: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	description?: string;
	className?: string;
};

/**
 * Native <dialog>-based modal: focus trap via showModal, Escape, restore focus, scroll lock.
 */
export function Dialog({
	open,
	onClose,
	title,
	description,
	children,
	className = '',
}: DialogProps) {
	const surface = useSurfaceTheme();
	const dialogRef = useRef<HTMLDialogElement>(null);
	const titleId = useId();
	const descId = useId();

	useEffect(() => {
		const el = dialogRef.current;
		if (!el) return;

		const handleClose = () => onClose();

		if (open && !el.open) {
			el.showModal();
		} else if (!open && el.open) {
			el.close();
		}

		el.addEventListener('close', handleClose);
		return () => el.removeEventListener('close', handleClose);
	}, [open, onClose]);

	useBodyScrollLock(open);

	return (
		<dialog
			data-surface={surface}
			ref={dialogRef}
			aria-labelledby={titleId}
			aria-describedby={description ? descId : undefined}
			className={`fixed inset-0 z-[70] m-auto max-h-[min(90dvh,40rem)] w-[min(100%-1.5rem,32rem)] overflow-auto rounded-lg border border-border-strong bg-surface p-0 text-foreground shadow-lg backdrop:bg-ink/40 open:flex open:flex-col [&::backdrop]:bg-black/40 ${className}`}
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}
			onClick={(e) => {
				if (e.target === dialogRef.current) onClose();
			}}
		>
			<div className="sticky top-0 flex items-start justify-between gap-3 border-b border-border bg-surface px-5 py-4">
				<div>
					<h2 id={titleId} className="text-lg font-semibold">
						{title}
					</h2>
					{description ? (
						<p id={descId} className="mt-1 text-sm text-foreground-secondary">
							{description}
						</p>
					) : null}
				</div>
				<button
					type="button"
					onClick={onClose}
					className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-hover"
					aria-label="Đóng"
				>
					×
				</button>
			</div>
			<div className="px-5 py-4">{children}</div>
		</dialog>
	);
}

type SheetProps = {
	open: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	side?: 'bottom' | 'right' | 'full';
};

/** Mobile sheet using native dialog + bottom/right/full panel presentation. */
export function Sheet({ open, onClose, title, children, side = 'bottom' }: SheetProps) {
	const surface = useSurfaceTheme();
	const dialogRef = useRef<HTMLDialogElement>(null);
	const titleId = useId();

	useEffect(() => {
		const el = dialogRef.current;
		if (!el) return;
		const handleClose = () => onClose();
		if (open && !el.open) el.showModal();
		else if (!open && el.open) el.close();
		el.addEventListener('close', handleClose);
		return () => el.removeEventListener('close', handleClose);
	}, [open, onClose]);

	useBodyScrollLock(open);

	const panel =
		side === 'bottom'
			? 'mt-auto mb-0 w-full max-w-none rounded-t-2xl rounded-b-none max-h-[min(90dvh,36rem)] sheet-panel-bottom'
			: side === 'full'
				? 'm-0 h-full max-h-none w-full rounded-none border-0 sheet-panel-full'
				: 'ml-auto mr-0 h-full max-h-none w-[min(100%,28rem)] rounded-none border-l sheet-panel-right';
	const dialogAlign =
		side === 'bottom' ? 'open:justify-end' : 'open:justify-start open:items-stretch';

	return (
		<dialog
			data-surface={surface}
			ref={dialogRef}
			aria-labelledby={titleId}
			className={`fixed inset-0 z-[70] m-0 h-dvh min-h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 open:flex open:flex-col [&::backdrop]:bg-black/40 [&::backdrop]:transition-opacity [&::backdrop]:duration-300 ${dialogAlign}`}
			onClick={(e) => {
				if (e.target === dialogRef.current) onClose();
			}}
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}
		>
			<div
				className={`flex max-h-full flex-col overflow-hidden border border-border-strong bg-surface text-foreground shadow-lg ${panel}`}
				style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
			>
				<div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
					<h2 id={titleId} className="text-base font-semibold">
						{title}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-hover"
						aria-label="Đóng"
					>
						×
					</button>
				</div>
				<div
					className={`overflow-y-auto px-4 py-4 ${side === 'full' ? 'mx-auto w-full max-w-3xl' : ''}`}
				>
					{children}
				</div>
			</div>
		</dialog>
	);
}

export { Dialog as Drawer };
