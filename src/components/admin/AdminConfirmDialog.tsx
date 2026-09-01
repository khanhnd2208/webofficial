'use client';

import { Dialog } from '@/components/ui/Dialog';

export function AdminConfirmDialog({
	open,
	title,
	description,
	confirmLabel = 'Xác nhận',
	cancelLabel = 'Huỷ',
	tone = 'danger',
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
	busy?: boolean;
	onConfirm: () => void;
	onClose: () => void;
}) {
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
					disabled={busy}
					data-testid="admin-confirm-accept"
					className={`inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold ${
						tone === 'danger' ? 'bg-error text-accent-foreground' : 'bg-foreground text-background'
					}`}
				>
					{busy ? 'Đang xử lý…' : confirmLabel}
				</button>
			</div>
		</Dialog>
	);
}
