'use client';

import { useState } from 'react';
import Link from 'next/link';

import { StudioButton, StudioField, StudioTextarea } from '@/components/myclass/admin/studio';
import { McIcon } from '@/components/myclass/ui';
import { absoluteUrl } from '@/config/site';
import type { TeachingAttendanceBoardConfig } from '@/features/teaching/types';

import { teachingApi } from './api';
import { useTeachingLeaveGuard } from './useTeachingLeaveGuard';

export function AttendanceBoardPanel({
	initial,
	publicPath,
	onSaved,
}: {
	initial: TeachingAttendanceBoardConfig;
	publicPath?: string | null;
	onSaved?: (updated: TeachingAttendanceBoardConfig) => void;
}) {
	const [config, setConfig] = useState(initial);
	const [rules, setRules] = useState(initial.classRules);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [copied, setCopied] = useState(false);

	const sharePath = publicPath === undefined ? config.publicPath : publicPath;
	const leaveDialog = useTeachingLeaveGuard({
		dirty: () => rules !== config.classRules || busy,
		save: () => save({ shared: config.attendanceVisible, classRules: rules }),
	});
	const shareUrl = sharePath ? absoluteUrl(sharePath) : null;
	async function save(next: { shared: boolean; classRules?: string }) {
		if (busy) return false;
		setBusy(true);
		setMessage('');
		setError('');
		try {
			const updated = await teachingApi<TeachingAttendanceBoardConfig>(
				`/api/admin/teaching/classes/${config.class.id}/share`,
				{
					method: 'PATCH',
					body: JSON.stringify(next),
				},
			);
			setConfig(updated);
			onSaved?.(updated);
			if (next.classRules !== undefined) setRules(updated.classRules);
			setMessage(
				next.classRules !== undefined
					? 'Đã lưu nội quy.'
					: next.shared
						? 'Đã chia sẻ. Ai có đường dẫn đều có thể theo dõi toàn bộ lớp.'
						: 'Đã tắt chia sẻ.',
			);
			return true;
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không thể lưu bảng điểm danh');
			return false;
		} finally {
			setBusy(false);
		}
	}

	async function copyLink() {
		if (!shareUrl) return;
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1800);
		} catch {
			setError(`Không thể sao chép tự động. Hãy sao chép thủ công: ${shareUrl}`);
		}
	}

	return (
		<div className="mt-6 space-y-5">
			{leaveDialog}
			<section className="mc-surface flex flex-wrap items-center justify-between gap-4 p-4">
				<div className="flex items-center gap-3">
					<span className="teaching-status" data-tone={config.attendanceVisible ? 'ok' : 'muted'}>
						{config.attendanceVisible ? 'Đã bật chia sẻ' : 'Chưa chia sẻ'}
					</span>
					<div>
						<p className="text-sm font-semibold text-ink">Bảng điểm danh và CP</p>
						<p className="mc-meta mt-0.5">
							Ai có đường dẫn đều có thể xem điểm danh và CP của toàn bộ lớp. Trang này không được
							lập chỉ mục trên công cụ tìm kiếm.
						</p>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{sharePath && config.attendanceVisible ? (
						<Link
							href={sharePath}
							target="_blank"
							className="inline-flex min-h-11 items-center gap-2 rounded-[var(--mc-r-sm)] border border-mc-rule px-4 text-sm font-semibold text-ink hover:bg-surface-sunken"
						>
							<McIcon name="open_in_new" size={16} />
							Mở trang sinh viên
						</Link>
					) : null}
					<StudioButton
						variant={config.attendanceVisible ? 'secondary' : 'primary'}
						disabled={busy}
						onClick={() => save({ shared: !config.attendanceVisible })}
					>
						{config.attendanceVisible ? 'Tắt chia sẻ' : 'Chia sẻ cho sinh viên'}
					</StudioButton>
				</div>
			</section>

			{!config.attendanceVisible ? (
				<div className="mc-banner" data-tone="error">
					Lưu ý: khi chia sẻ, bất kỳ ai có đường dẫn đều xem được mã sinh viên, tên, điểm danh và CP
					của toàn bộ lớp.
				</div>
			) : null}

			<section className="mc-surface space-y-4 p-5">
				<div>
					<p className="text-sm font-semibold text-ink">Đường dẫn lớp học</p>
					<p className="mc-meta mt-1">
						Gửi đường dẫn này cho sinh viên. Trang được đặt ở chế độ không lập chỉ mục.
					</p>
					<div className="mt-2 flex flex-wrap items-center gap-2">
						<code className="min-h-11 flex-1 overflow-x-auto rounded-[var(--mc-r-sm)] border border-mc-rule bg-surface-sunken px-3 py-2 text-xs text-ink">
							{shareUrl ?? 'Bấm Chia sẻ để tạo đường dẫn.'}
						</code>
						<StudioButton variant="secondary" disabled={!shareUrl} onClick={copyLink}>
							<McIcon name="content_copy" size={16} />
							{copied ? 'Đã sao chép' : 'Sao chép'}
						</StudioButton>
						{sharePath ? (
							<Link
								href={sharePath}
								target="_blank"
								className="inline-flex min-h-11 items-center gap-2 rounded-[var(--mc-r-sm)] border border-mc-rule px-4 text-sm font-semibold text-ink hover:bg-surface-sunken"
							>
								<McIcon name="open_in_new" size={16} />
								Mở trang
							</Link>
						) : null}
					</div>
				</div>
				<StudioField
					label="Nội quy lớp"
					hint="Chỉ admin được sửa. Học viên chỉ có quyền xem nội dung này trên trang lớp."
				>
					<StudioTextarea
						value={rules}
						onChange={(event) => setRules(event.target.value)}
						rows={7}
						maxLength={2000}
						placeholder="Nhập nội quy lớp, mỗi nội dung một dòng…"
					/>
				</StudioField>
				<StudioButton
					disabled={busy}
					onClick={() => save({ shared: config.attendanceVisible, classRules: rules })}
				>
					Lưu nội quy
				</StudioButton>
			</section>

			{message ? (
				<p className="mc-banner" data-tone="ok">
					{message}
				</p>
			) : null}
			{error ? (
				<p className="mc-banner" data-tone="error">
					{error}
				</p>
			) : null}
		</div>
	);
}
