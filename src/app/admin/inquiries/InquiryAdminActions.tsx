'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
	INQUIRY_STATUSES,
	INQUIRY_STATUS_LABELS,
	type InquiryStatus,
} from '@/features/inquiries/constants';
import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import { routes } from '@/config/routes';
import { adminFetch } from '@/lib/admin/client';

type Props = {
	inquiryId: string;
	currentStatus?: InquiryStatus;
	adminEmailStatus?: string;
};

export default function InquiryAdminActions({ inquiryId, currentStatus, adminEmailStatus }: Props) {
	const router = useRouter();
	const [status, setStatus] = useState<InquiryStatus>(currentStatus ?? 'NEW');
	const [note, setNote] = useState('');
	const [internalNotes, setInternalNotes] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();
	const { confirm, dialog } = useAdminConfirm();

	if (!inquiryId) return null;

	async function patch(body: Record<string, unknown>) {
		setError(null);
		await adminFetch(`/api/admin/inquiries/${inquiryId}`, {
			method: 'PATCH',
			body: JSON.stringify(body),
		});
		router.refresh();
	}

	function onSaveStatus() {
		startTransition(async () => {
			try {
				await patch({ status, statusNote: note || undefined });
				setNote('');
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Lỗi');
			}
		});
	}

	function onSaveNotes() {
		startTransition(async () => {
			try {
				await patch({ internalNotes });
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Lỗi');
			}
		});
	}

	function onRetryEmail() {
		startTransition(async () => {
			try {
				await patch({ retryNotification: true });
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Lỗi');
			}
		});
	}

	function onDelete() {
		startTransition(async () => {
			const ok = await confirm({
				title: 'Xoá yêu cầu liên hệ',
				description: 'Xóa vĩnh viễn yêu cầu liên hệ này? Không hoàn tác được.',
				confirmLabel: 'Xoá',
			});
			if (!ok) return;
			try {
				await adminFetch(`/api/admin/inquiries/${inquiryId}`, { method: 'DELETE' });
				router.push(routes.admin.inquiries);
				router.refresh();
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Lỗi');
			}
		});
	}

	return (
		<div className="space-y-6 rounded-xl border border-border bg-surface p-4">
			{error ? (
				<p role="alert" className="text-sm text-error">
					{error}
				</p>
			) : null}

			<div>
				<label className="text-xs font-semibold uppercase tracking-wider text-muted">Trạng thái</label>
				<div className="mt-2 flex flex-wrap gap-2">
					<select
						value={status}
						onChange={(e) => setStatus(e.target.value as InquiryStatus)}
						className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
					>
						{INQUIRY_STATUSES.map((s) => (
							<option key={s} value={s}>
								{INQUIRY_STATUS_LABELS[s]}
							</option>
						))}
					</select>
					<input
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="Ghi chú lịch sử (tuỳ chọn)"
						className="min-w-[180px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
					/>
					<button
						type="button"
						disabled={pending}
						onClick={onSaveStatus}
						className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60"
					>
						Cập nhật trạng thái
					</button>
				</div>
			</div>

			<div>
				<label className="text-xs font-semibold uppercase tracking-wider text-muted">Ghi chú nội bộ</label>
				<textarea
					value={internalNotes}
					onChange={(e) => setInternalNotes(e.target.value)}
					rows={4}
					className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
					placeholder="Ghi chú nội bộ…"
				/>
				<button
					type="button"
					disabled={pending}
					onClick={onSaveNotes}
					className="mt-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold disabled:opacity-60"
				>
					Lưu ghi chú
				</button>
			</div>

			<div className="flex flex-wrap gap-3 border-t border-border pt-4">
				<button
					type="button"
					disabled={pending || adminEmailStatus === 'sent'}
					onClick={onRetryEmail}
					className="rounded-lg border border-border px-3 py-2 text-sm font-semibold disabled:opacity-60"
				>
					Gửi lại thông báo cho admin
				</button>
				<button
					type="button"
					disabled={pending}
					onClick={onDelete}
					className="rounded-lg border border-error/40 px-3 py-2 text-sm font-semibold text-error disabled:opacity-60"
				>
					Xóa vĩnh viễn
				</button>
			</div>
			{dialog}
		</div>
	);
}
