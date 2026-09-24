'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { StudioIcon } from './icons';

/** Native <dialog> so focus trapping, Escape and the backdrop come for free. */
export default function StudioDialog({
	title,
	onClose,
	children,
	footer,
	size = 'wide',
}: {
	title: string;
	onClose: () => void;
	children: ReactNode;
	footer?: ReactNode;
	size?: 'wide' | 'narrow';
}) {
	const ref = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = ref.current;
		if (dialog && !dialog.open) dialog.showModal();
		return () => dialog?.close();
	}, []);

	return (
		<dialog
			ref={ref}
			className="ln-dialog"
			data-size={size}
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}
			onClick={(event) => {
				if (event.target === ref.current) onClose();
			}}
		>
			<div className="ln-dialog__inner">
				<header className="ln-dialog__head">
					<h2>{title}</h2>
					<button type="button" className="ln-icon-btn" onClick={onClose} aria-label="Đóng">
						<StudioIcon name="close" />
					</button>
				</header>
				<div className="ln-dialog__body">{children}</div>
				{footer ? <footer className="ln-dialog__foot">{footer}</footer> : null}
			</div>
		</dialog>
	);
}
