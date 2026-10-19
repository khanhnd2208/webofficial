'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

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
