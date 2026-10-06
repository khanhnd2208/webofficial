'use client';

import { useEffect, useRef, useState } from 'react';

const TOAST_MS = 8_000;

/**
 * One toast, centered at the bottom. The timer pauses while the pointer or
 * keyboard is on it, so Hoàn tác stays reachable.
 */
export default function StudioToast({
	message,
	actionLabel = 'Hoàn tác',
	onAction,
	onClose,
}: {
	message: string | null;
	actionLabel?: string;
	onAction?: () => void;
	onClose: () => void;
}) {
	if (!message) return null;
	return (
		<ToastCard
			key={message}
			message={message}
			actionLabel={actionLabel}
			onAction={onAction}
			onClose={onClose}
		/>
	);
}

function ToastCard({
	message,
	actionLabel,
	onAction,
	onClose,
}: {
	message: string;
	actionLabel: string;
	onAction?: () => void;
	onClose: () => void;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [paused, setPaused] = useState(false);
	const held = useRef(0);
	const remaining = useRef(TOAST_MS);

	useEffect(() => {
		if (paused) return;
		const started = Date.now();
		const timer = setTimeout(onClose, remaining.current);
		return () => {
			clearTimeout(timer);
			remaining.current = Math.max(0, remaining.current - (Date.now() - started));
		};
	}, [onClose, paused]);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			onClose();
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [onClose]);

	function hold(next: 1 | -1) {
		held.current = Math.max(0, held.current + next);
		setPaused(held.current > 0);
	}

	return (
		<div
			ref={ref}
			className="ln-toast"
			role="status"
			onMouseEnter={() => hold(1)}
			onMouseLeave={() => hold(-1)}
			onFocus={() => hold(1)}
			onBlur={() => hold(-1)}
		>
			<p>{message}</p>
			{onAction ? (
				<button type="button" className="ln-toast__action" onClick={onAction}>
					{actionLabel}
				</button>
			) : null}
		</div>
	);
}
