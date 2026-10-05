'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

import { AdminButton } from '@/components/admin/AdminPrimitives';
import { adminDate } from '@/components/admin/inquiryNavigation';
import styles from '@/components/admin/AdminStudio.module.css';
import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import { useLeaveGuard } from '@/components/ui/useLeaveGuard';
import { routes } from '@/config/routes';
import {
	INQUIRY_STATUSES,
	INQUIRY_STATUS_LABELS,
	type InquiryStatus,
} from '@/features/inquiries/constants';
import { adminFetch } from '@/lib/admin/client';

const SUGGESTED: Partial<Record<InquiryStatus, InquiryStatus[]>> = {
	REVIEWING: ['NEED_MORE_INFO', 'QUALIFIED', 'CLOSED'],
	NEED_MORE_INFO: ['QUALIFIED', 'CLOSED'],
	QUALIFIED: ['CALL_SCHEDULED', 'CLOSED'],
	CALL_SCHEDULED: ['PROPOSAL_SENT', 'WON', 'CLOSED'],
	PROPOSAL_SENT: ['WON', 'CLOSED'],
	WON: ['CLOSED'],
	CLOSED: ['REVIEWING'],
};

type HistoryEntry = { status: InquiryStatus; at: string; note?: string };
type Message = { context: string; problem?: string; desiredOutcome?: string };
type Extra = { label: string; value?: string | null };

type Props = {
	inquiryId: string;
	currentStatus?: InquiryStatus;
	adminEmailStatus?: string;
	adminEmailError?: string;
	initialNotes?: string;
	returnHref?: string;
	nextHref?: string;
	message?: Message;
	extras?: Extra[];
	history?: HistoryEntry[];
};

export function CopyEmailButton({ email }: { email: string }) {
	const [result, setResult] = useState<'copied' | 'failed' | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	function show(next: 'copied' | 'failed') {
		setResult(next);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => setResult(null), 2500);
	}
	return (
		<span className="inline-flex items-center gap-2">
			<AdminButton
				type="button"
				tone="secondary"
				icon="copy"
				onClick={() => {
					// Clipboard access can be denied (insecure origin, browser policy).
					Promise.resolve()
						.then(() => navigator.clipboard.writeText(email))
						.then(
							() => show('copied'),
							() => show('failed'),
						);
				}}
			>
				Sao chép email
			</AdminButton>
			<span role="status" className={styles.meta}>
				{result === 'copied'
					? 'Đã sao chép'
					: result === 'failed'
						? 'Không sao chép được, hãy chọn email ở trên'
						: ''}
			</span>
		</span>
	);
}

export default function InquiryAdminActions({
	inquiryId,
	currentStatus,
	adminEmailStatus,
	adminEmailError,
	initialNotes = '',
	returnHref = routes.admin.inquiries,
	nextHref,
	message,
	extras = [],
	history = [],
}: Props) {
	const router = useRouter();
	const [status, setStatus] = useState<InquiryStatus>(currentStatus ?? 'NEW');
	const [savedStatus, setSavedStatus] = useState(status);
	const [note, setNote] = useState('');
	const [internalNotes, setInternalNotes] = useState(initialNotes);
	const [savedNotes, setSavedNotes] = useState(initialNotes);
	const [error, setError] = useState<string | null>(null);
	const [messageText, setMessageText] = useState<string | null>(null);
	const [notesFeedback, setNotesFeedback] = useState<{ error: boolean; text: string } | null>(null);
	const [pending, setPending] = useState<string | null>(null);
	const lock = useRef(false);
	const { confirm, dialog } = useAdminConfirm();
	const dirtyNotes = internalNotes !== savedNotes;
	const dirtyStatus = status !== savedStatus || Boolean(note.trim());
	const filledExtras = extras.filter((item) => item.value?.trim());
	const suggestions = SUGGESTED[savedStatus] ?? [];

	// The leave guard only protects the notes draft; a status draft is not applied on leave.
	const saveNotes = useCallback(async () => {
		if (lock.current) return false;
		if (internalNotes === savedNotes) return true;
		lock.current = true;
		setPending('notes');
		setNotesFeedback(null);
		try {
			await adminFetch(`/api/admin/inquiries/${inquiryId}`, {
				method: 'PATCH',
				body: JSON.stringify({ internalNotes }),
			});
			setSavedNotes(internalNotes);
			setNotesFeedback({ error: false, text: 'Đã lưu ghi chú.' });
			router.refresh();
			return true;
		} catch (cause) {
			setNotesFeedback({
				error: true,
				text:
					cause instanceof Error
						? cause.message
						: 'Không lưu được ghi chú. Nội dung vẫn được giữ lại.',
			});
			return false;
		} finally {
			lock.current = false;
			setPending(null);
		}
	}, [inquiryId, internalNotes, router, savedNotes]);

	const isNotesDirty = useCallback(() => internalNotes !== savedNotes, [internalNotes, savedNotes]);
	const leaveDialog = useLeaveGuard({
		dirty: isNotesDirty,
		save: saveNotes,
		buttonClassName: `${styles.button} ${styles.secondary}`,
		primaryButtonClassName: `${styles.button} ${styles.primary}`,
	});

	if (!inquiryId) return null;

	async function run(operation: string, body: Record<string, unknown>) {
		if (lock.current) return;
		lock.current = true;
		setError(null);
		setMessageText(null);
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
				router.push(nextHref ?? returnHref);
				router.refresh();
				return;
			}
			const updated = await adminFetch<{ adminEmailStatus?: string }>(
				`/api/admin/inquiries/${inquiryId}`,
				{
					method: 'PATCH',
					body: JSON.stringify(body),
				},
			);
			if (operation === 'status' || INQUIRY_STATUSES.includes(operation as InquiryStatus)) {
				const next = (body.status as InquiryStatus) ?? status;
				setStatus(next);
				setSavedStatus(next);
				setNote('');
			}
			if (operation === 'retry' && updated?.adminEmailStatus !== 'sent') {
				setError('Gửi lại vẫn chưa thành công. Lý do mới nhất hiển thị ở mục thông báo.');
			} else {
				setMessageText(
					operation === 'retry'
						? 'Đã gửi lại thông báo.'
						: operation === 'status'
							? 'Đã cập nhật trạng thái.'
							: `Đã chuyển sang ${INQUIRY_STATUS_LABELS[body.status as InquiryStatus]}.`,
				);
			}
			router.refresh();
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : 'Không thực hiện được thao tác. Hãy thử lại.',
			);
		} finally {
			lock.current = false;
			setPending(null);
		}
	}

	return (
		<div className={styles.stack}>
			{savedStatus === 'NEW' ? (
				<div className={styles.callout}>
					<p className="font-semibold">Liên hệ chưa được xem</p>
					<AdminButton
						type="button"
						pending={pending === 'REVIEWING'}
						disabled={Boolean(pending)}
						onClick={() => void run('REVIEWING', { status: 'REVIEWING' })}
					>
						{pending === 'REVIEWING' ? 'Đang đánh dấu…' : 'Đánh dấu đang xem'}
					</AdminButton>
				</div>
			) : null}
			<div className={styles.detail}>
				<div className={styles.stack}>
					{message ? (
						<section className={styles.panel}>
							<h2 className={styles.sectionTitle}>Lời nhắn</h2>
							<h3 className={styles.subheading}>Bối cảnh</h3>
							<p className="mt-2 whitespace-pre-wrap">{message.context}</p>
							{message.problem ? (
								<>
									<h3 className={styles.subheading}>Vấn đề</h3>
									<p className="mt-2 whitespace-pre-wrap">{message.problem}</p>
								</>
							) : null}
							{message.desiredOutcome ? (
								<>
									<h3 className={styles.subheading}>Kết quả mong muốn</h3>
									<p className="mt-2 whitespace-pre-wrap">{message.desiredOutcome}</p>
								</>
							) : null}
						</section>
					) : null}
					{message ? (
						<section className={styles.panel}>
							<h2 className={styles.sectionTitle}>Thông tin thêm</h2>
							{filledExtras.length ? (
								<dl className="mt-4 grid gap-4 sm:grid-cols-2">
									{filledExtras.map((item) => (
										<div key={item.label}>
											<dt className={styles.meta}>{item.label}</dt>
											<dd className="mt-1 break-words">{item.value}</dd>
										</div>
									))}
								</dl>
							) : (
								<p className={`${styles.meta} mt-3`}>Không có thông tin bổ sung.</p>
							)}
						</section>
					) : null}
					{adminEmailStatus === 'failed' ? (
						<section className={styles.alert} aria-label="Thông báo gửi lỗi">
							<div>
								<p className="font-semibold">Thông báo chưa gửi được</p>
								{adminEmailError ? (
									<p className={`${styles.meta} mt-1`}>{adminEmailError}</p>
								) : null}
							</div>
							<AdminButton
								type="button"
								tone="secondary"
								icon="retry"
								pending={pending === 'retry'}
								disabled={Boolean(pending)}
								onClick={() => void run('retry', { retryNotification: true })}
							>
								{pending === 'retry' ? 'Đang gửi lại…' : 'Gửi lại thông báo'}
							</AdminButton>
						</section>
					) : null}
					{history.length ? (
						<section className={styles.panel}>
							<h2 className={styles.sectionTitle}>Lịch sử trạng thái</h2>
							<ol className={styles.timeline}>
								{history.map((entry, index) => (
									<li key={`${entry.status}-${entry.at}-${index}`}>
										<p className="font-semibold">{INQUIRY_STATUS_LABELS[entry.status]}</p>
										<time dateTime={entry.at} title={adminDate(entry.at)} className={styles.meta}>
											{adminDate(entry.at)}
										</time>
										{entry.note ? <p className="mt-1">{entry.note}</p> : null}
									</li>
								))}
							</ol>
						</section>
					) : null}
				</div>
				<div className={styles.stack}>
					<section className={styles.panel} aria-label="Bước tiếp theo">
						<h2 className={styles.sectionTitle}>Bước tiếp theo</h2>
						{error ? (
							<p role="alert" className={`${styles.feedback} mb-4`} data-error="true">
								{error}
							</p>
						) : null}
						{messageText ? (
							<p role="status" className={`${styles.feedback} mb-4`}>
								{messageText}
							</p>
						) : null}
						{suggestions.length ? (
							<div className="mb-4 flex flex-wrap gap-2">
								{suggestions.map((target) => (
									<AdminButton
										key={target}
										type="button"
										tone={target === 'CLOSED' ? 'secondary' : 'primary'}
										pending={pending === target}
										disabled={Boolean(pending)}
										onClick={() =>
											void run(target, { status: target, statusNote: note.trim() || undefined })
										}
									>
										{pending === target ? 'Đang chuyển…' : INQUIRY_STATUS_LABELS[target]}
									</AdminButton>
								))}
							</div>
						) : null}
						<div className="mt-4 border-t border-border pt-4">
							<h3 className="font-semibold">Trạng thái khác</h3>
							<div className="mt-4 grid gap-4">
								<label className={styles.field}>
									Trạng thái
									<select
										value={status}
										onChange={(event) => setStatus(event.target.value as InquiryStatus)}
										disabled={Boolean(pending)}
										className={styles.control}
									>
										{INQUIRY_STATUSES.map((item) => (
											<option key={item} value={item}>
												{INQUIRY_STATUS_LABELS[item]}
											</option>
										))}
									</select>
								</label>
								<label className={styles.field}>
									Ghi chú lịch sử (tùy chọn)
									<input
										value={note}
										onChange={(event) => setNote(event.target.value)}
										disabled={Boolean(pending)}
										className={styles.control}
									/>
								</label>
								{dirtyStatus ? (
									<p className={styles.meta}>Có thay đổi trạng thái chưa lưu</p>
								) : null}
								<AdminButton
									type="button"
									icon="save"
									pending={pending === 'status'}
									disabled={Boolean(pending) || !dirtyStatus}
									onClick={() =>
										void run('status', { status, statusNote: note.trim() || undefined })
									}
								>
									{pending === 'status' ? 'Đang cập nhật…' : 'Cập nhật trạng thái'}
								</AdminButton>
							</div>
						</div>
					</section>
					<section className={styles.panel}>
						<label className={styles.field}>
							Ghi chú nội bộ
							<textarea
								value={internalNotes}
								onChange={(event) => setInternalNotes(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
										event.preventDefault();
										if (dirtyNotes) void saveNotes();
									}
								}}
								disabled={Boolean(pending)}
								rows={5}
								className={styles.control}
								aria-describedby={`notes-state-${inquiryId}`}
							/>
						</label>
						<p id={`notes-state-${inquiryId}`} className={`${styles.meta} my-3`}>
							{dirtyNotes ? 'Có thay đổi chưa lưu · Ctrl/⌘+Enter để lưu' : 'Ghi chú đã lưu'}
						</p>
						{notesFeedback ? (
							<p
								role={notesFeedback.error ? 'alert' : 'status'}
								className={`${styles.feedback} mb-3`}
								data-error={notesFeedback.error ? 'true' : undefined}
							>
								{notesFeedback.text}
							</p>
						) : null}
						<AdminButton
							type="button"
							tone="secondary"
							icon="save"
							pending={pending === 'notes'}
							disabled={Boolean(pending) || !dirtyNotes}
							onClick={() => void saveNotes()}
						>
							{pending === 'notes' ? 'Đang lưu…' : 'Lưu ghi chú'}
						</AdminButton>
					</section>
					<section className={styles.panel}>
						<h2 className="font-semibold">Xóa liên hệ</h2>
						<p className={`${styles.meta} mb-4 mt-2`}>
							Liên hệ và lịch sử xử lý sẽ bị xóa vĩnh viễn.
						</p>
						<AdminButton
							type="button"
							tone="danger"
							icon="delete"
							pending={pending === 'delete'}
							disabled={Boolean(pending)}
							onClick={() => void run('delete', {})}
						>
							{pending === 'delete' ? 'Đang xử lý…' : 'Xóa vĩnh viễn'}
						</AdminButton>
					</section>
				</div>
			</div>
			{dialog}
			{leaveDialog}
		</div>
	);
}
