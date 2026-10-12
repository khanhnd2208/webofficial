'use client';

import { useEffect, useState } from 'react';

import { Dialog } from '@/components/ui/Dialog';

export function AdminConfirmDialog({
	open,
	title,
	description,
	confirmLabel = 'Xác nhận',
	cancelLabel = 'Huỷ',
	tone = 'danger',
	confirmDelaySeconds = 0,
	busy = false,
	onConfirm,
	onClose,
}: {
	open: boolean;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	tone?: 'danger' | 'default';
	confirmDelaySeconds?: number;
	busy?: boolean;
	onConfirm: () => void;
	onClose: () => void;
}) {
	const delaySeconds = Math.max(0, Math.ceil(confirmDelaySeconds));
	const [remainingSeconds, setRemainingSeconds] = useState(delaySeconds);

	useEffect(() => {
		if (!open || delaySeconds === 0) return;

		const unlockAt = Date.now() + delaySeconds * 1000;
		const timer = window.setInterval(() => {
			const remaining = Math.max(0, Math.ceil((unlockAt - Date.now()) / 1000));
			setRemainingSeconds(remaining);
			if (remaining === 0) window.clearInterval(timer);
		}, 100);

		return () => window.clearInterval(timer);
	}, [delaySeconds, open]);

	const confirmationLocked = remainingSeconds > 0;
	const visibleConfirmLabel = confirmationLocked
		? `${confirmLabel} (${remainingSeconds} giây)`
		: confirmLabel;

	return (
		<Dialog open={open} onClose={onClose} title={title} description={description}>
			<div className="flex flex-wrap justify-end gap-2" data-testid="admin-confirm">
				<button
					type="button"
					onClick={onClose}
					disabled={busy}
					className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold"
				>
					{cancelLabel}
				</button>
				<button
					type="button"
					onClick={onConfirm}
					disabled={busy || confirmationLocked}
					data-testid="admin-confirm-accept"
					className={`inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
						tone === 'danger' ? 'bg-error text-accent-foreground' : 'bg-foreground text-background'
					}`}
				>
					{busy ? 'Đang xử lý…' : visibleConfirmLabel}
				</button>
			</div>
		</Dialog>
	);
}
