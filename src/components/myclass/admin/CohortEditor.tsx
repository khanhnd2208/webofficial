'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import { myClassApi } from './api';

export default function CohortEditor({
	cohort,
}: {
	cohort: {
		id: string;
		name: string;
		term: string;
		startsAt: string | null;
		endsAt: string | null;
		status: string;
	};
}) {
	const router = useRouter();
	const { confirm, dialog } = useAdminConfirm();
	const [name, setName] = useState(cohort.name);
	const [term, setTerm] = useState(cohort.term);
	const [status, setStatus] = useState(cohort.status);
	const [startsAt, setStartsAt] = useState(cohort.startsAt?.slice(0, 10) ?? '');
	const [endsAt, setEndsAt] = useState(cohort.endsAt?.slice(0, 10) ?? '');
	const [error, setError] = useState<string | null>(null);

	return (
		<>
			<form
				className="mt-6 grid gap-3 sm:grid-cols-3"
				onSubmit={async (event) => {
					event.preventDefault();
					setError(null);
					if (startsAt && endsAt && endsAt < startsAt) {
						setError('Ngày kết thúc phải sau ngày bắt đầu');
						return;
					}
					try {
						await myClassApi(`/api/admin/my-class/cohorts/${cohort.id}`, {
							method: 'PATCH',
							body: JSON.stringify({
								name,
								term,
								status,
								startsAt: startsAt || null,
								endsAt: endsAt || null,
							}),
						});
						router.refresh();
					} catch (err) {
						setError(err instanceof Error ? err.message : 'Không lưu được');
					}
				}}
			>
				<label className="text-sm">
					Tên lớp
					<input
						value={name}
						onChange={(event) => setName(event.target.value)}
						className="mt-1 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3"
					/>
				</label>
				<label className="text-sm">
					Học kỳ
					<input
						value={term}
						onChange={(event) => setTerm(event.target.value)}
						className="mt-1 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3"
					/>
				</label>
				<label className="text-sm">
					Trạng thái
					<select
						value={status}
						onChange={(event) => setStatus(event.target.value)}
						className="mt-1 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3"
					>
						<option value="DRAFT">Bản nháp</option>
						<option value="PUBLISHED">Đã xuất bản</option>
						<option value="ARCHIVED">Đã lưu trữ</option>
					</select>
				</label>
				<label className="text-sm">
					Bắt đầu
					<input
						type="date"
						value={startsAt}
						onChange={(event) => setStartsAt(event.target.value)}
						className="mt-1 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3"
					/>
				</label>
				<label className="text-sm">
					Kết thúc
					<input
						type="date"
						value={endsAt}
						onChange={(event) => setEndsAt(event.target.value)}
						className="mt-1 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3"
					/>
				</label>
				<div className="flex gap-2 sm:col-span-3">
					<button className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper">
						Lưu nhóm
					</button>
					{status !== 'ARCHIVED' ? (
						<button
							type="button"
							onClick={async () => {
								const ok = await confirm({
									title: 'Lưu trữ nhóm học',
									description: 'Lưu trữ nhóm học và gỡ học viên đang tham gia?',
									confirmLabel: 'Lưu trữ',
								});
								if (!ok) return;
								await myClassApi(`/api/admin/my-class/cohorts/${cohort.id}`, { method: 'DELETE' });
								router.refresh();
							}}
							className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] border border-mc-rule px-4 text-sm font-semibold"
						>
							Lưu trữ
						</button>
					) : null}
				</div>
				{error ? <p className="text-sm text-error sm:col-span-3">{error}</p> : null}
			</form>
			{dialog}
		</>
	);
}
