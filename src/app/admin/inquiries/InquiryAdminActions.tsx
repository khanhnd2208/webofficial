'use client';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import {
	INQUIRY_STATUSES,
	INQUIRY_STATUS_LABELS,
	type InquiryStatus,
} from '@/features/inquiries/constants';
import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import { AdminButton } from '@/components/admin/AdminPrimitives';
import styles from '@/components/admin/AdminStudio.module.css';
import { routes } from '@/config/routes';
import { adminFetch } from '@/lib/admin/client';

type Props = {
	inquiryId: string;
	currentStatus?: InquiryStatus;
	adminEmailStatus?: string;
	initialNotes?: string;
	returnHref?: string;
};
type Operation = 'status' | 'notes' | 'retry' | 'delete';
export default function InquiryAdminActions({
	inquiryId,
	currentStatus,
	adminEmailStatus,
	initialNotes = '',
	returnHref = routes.admin.inquiries,
}: Props) {
	const router = useRouter();
	const [status, setStatus] = useState<InquiryStatus>(currentStatus ?? 'NEW');
	const [savedStatus, setSavedStatus] = useState(status);
	const [note, setNote] = useState('');
	const [internalNotes, setInternalNotes] = useState(initialNotes);
	const [savedNotes, setSavedNotes] = useState(initialNotes);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [pending, setPending] = useState<Operation | null>(null);
	const lock = useRef(false);
	const { confirm, dialog } = useAdminConfirm();
	const dirtyNotes = internalNotes !== savedNotes;
	const dirtyStatus = status !== savedStatus || Boolean(note.trim());
	if (!inquiryId) return null;
	async function run(operation: Operation) {
		if (lock.current) return;
		lock.current = true;
		setError(null);
		setMessage(null);
		setPending(operation);
		try {
			if (operation === 'delete') {
				const accepted = await confirm({
					title: 'Xóa yêu cầu liên hệ',
					description: 'Xóa vĩnh viễn yêu cầu liên hệ này? Không thể hoàn tác.',
					confirmLabel: 'Xóa vĩnh viễn',
				});
				if (!accepted) return;
				await adminFetch(`/api/admin/inquiries/${inquiryId}`, { method: 'DELETE' });
				router.push(returnHref);
				router.refresh();
				return;
			}
			const submittedNotes = internalNotes;
			const submittedStatus = status;
			const body =
				operation === 'status'
					? { status: submittedStatus, statusNote: note || undefined }
					: operation === 'notes'
						? { internalNotes: submittedNotes }
						: { retryNotification: true };
			await adminFetch(`/api/admin/inquiries/${inquiryId}`, {
				method: 'PATCH',
				body: JSON.stringify(body),
			});
			if (operation === 'notes') setSavedNotes(submittedNotes);
			if (operation === 'status') {
				setSavedStatus(submittedStatus);
				setNote('');
			}
			setMessage(
				operation === 'notes'
					? 'Đã lưu ghi chú.'
					: operation === 'status'
						? 'Đã cập nhật trạng thái.'
						: 'Đã xử lý yêu cầu gửi lại. Xem trạng thái thông báo bên dưới.',
			);
			router.refresh();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Không thực hiện được thao tác. Hãy thử lại.');
		} finally {
			lock.current = false;
			setPending(null);
		}
	}
	return (
		<div className={styles.stack}>
			<section className={styles.panel} aria-label="Cập nhật liên hệ">
				<h2 className={styles.sectionTitle}>Xử lý liên hệ</h2>
				{error && (
					<p role="alert" className={`${styles.feedback} mb-4`} data-error="true">
						{error}
					</p>
				)}
				{message && (
					<p role="status" className={`${styles.feedback} mb-4`}>
						{message}
					</p>
				)}
				<div className="grid gap-4">
					<label className={styles.field}>
						Trạng thái
						<select
							value={status}
							onChange={(e) => setStatus(e.target.value as InquiryStatus)}
							disabled={Boolean(pending)}
							className={styles.control}
						>
							{INQUIRY_STATUSES.map((s) => (
								<option key={s} value={s}>
									{INQUIRY_STATUS_LABELS[s]}
								</option>
							))}
						</select>
					</label>
					<label className={styles.field}>
						Ghi chú lịch sử (tùy chọn)
						<input
							value={note}
							onChange={(e) => setNote(e.target.value)}
							disabled={Boolean(pending)}
							className={styles.control}
						/>
					</label>
					{dirtyStatus && <p className={styles.meta}>Có thay đổi trạng thái chưa lưu</p>}
					<AdminButton
						type="button"
						pending={pending === 'status'}
						disabled={Boolean(pending) || !dirtyStatus}
						onClick={() => void run('status')}
						icon="save"
					>
						{pending === 'status' ? 'Đang cập nhật…' : 'Cập nhật trạng thái'}
					</AdminButton>
					<div className="border-t border-border pt-4">
						<label className={styles.field}>
							Ghi chú nội bộ
							<textarea
								value={internalNotes}
								onChange={(e) => setInternalNotes(e.target.value)}
								disabled={Boolean(pending)}
								rows={5}
								className={styles.control}
							/>
						</label>
						<p className={`${styles.meta} my-3`} role="status">
							{dirtyNotes ? 'Có thay đổi chưa lưu' : 'Ghi chú đã đồng bộ'}
						</p>
						<AdminButton
							type="button"
							tone="secondary"
							icon="save"
							pending={pending === 'notes'}
							disabled={Boolean(pending) || !dirtyNotes}
							onClick={() => void run('notes')}
						>
							{pending === 'notes' ? 'Đang lưu…' : 'Lưu ghi chú'}
						</AdminButton>
					</div>
					<div className="border-t border-border pt-4">
						<AdminButton
							type="button"
							tone="quiet"
							icon="retry"
							pending={pending === 'retry'}
							disabled={Boolean(pending) || adminEmailStatus === 'sent'}
							onClick={() => void run('retry')}
						>
							{pending === 'retry' ? 'Đang gửi lại…' : 'Gửi lại thông báo cho Admin'}
						</AdminButton>
						<p className={`${styles.meta} mt-2`}>
							{adminEmailStatus === 'sent'
								? 'Thông báo đã gửi thành công.'
								: 'Trạng thái gửi được cập nhật sau khi xử lý.'}
						</p>
					</div>
				</div>
			</section>
			<section className={styles.panel}>
				<h2 className="font-semibold">Xóa liên hệ</h2>
				<p className={`${styles.meta} mb-4 mt-2`}>Liên hệ và lịch sử xử lý sẽ bị xóa vĩnh viễn.</p>
				<AdminButton
					type="button"
					tone="danger"
					icon="delete"
					pending={pending === 'delete'}
					disabled={Boolean(pending)}
					onClick={() => void run('delete')}
				>
					{pending === 'delete' ? 'Đang xử lý…' : 'Xóa vĩnh viễn'}
				</AdminButton>
			</section>
			{dialog}
		</div>
	);
}
