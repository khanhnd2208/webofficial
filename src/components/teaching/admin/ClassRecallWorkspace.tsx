'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useTeachingLeaveGuard } from './useTeachingLeaveGuard';

import { teachingApi } from '@/components/teaching/admin/api';
import { routes } from '@/config/routes';
import type { TeachingClassRecallAssignment } from '@/features/teaching/types';

export function ClassRecallWorkspace({
	classId,
	courseId,
	initial,
}: {
	classId: string;
	courseId: string;
	initial: TeachingClassRecallAssignment[];
}) {
	const [assignments, setAssignments] = useState(initial);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [notice, setNotice] = useState('');
	const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initial));

	const enabledCount = useMemo(
		() => (JSON.parse(savedSnapshot) as TeachingClassRecallAssignment[]).filter((item) => item.enabled && item.status === 'PUBLISHED').length,
		[savedSnapshot],
	);
	const isDirty = JSON.stringify(assignments) !== savedSnapshot;
	const leaveDialog = useTeachingLeaveGuard({ dirty: () => isDirty || busy, save });

	function toggle(deckId: string) {
		setAssignments((items) =>
			items.map((item) => (item.deckId === deckId ? { ...item, enabled: !item.enabled } : item)),
		);
	}

	function move(deckId: string, offset: -1 | 1) {
		setAssignments((items) => {
			const index = items.findIndex((item) => item.deckId === deckId);
			const destination = index + offset;
			if (index < 0 || destination < 0 || destination >= items.length) return items;
			const next = [...items];
			const [item] = next.splice(index, 1);
			next.splice(destination, 0, item!);
			return next;
		});
	}

	async function save() {
		if (busy) return false;
		setBusy(true);
		setError('');
		setNotice('');
		try {
			const saved = await teachingApi<TeachingClassRecallAssignment[]>(
				`/api/admin/teaching/classes/${classId}/recall`,
				{
					method: 'PUT',
					body: JSON.stringify({
						assignments: assignments.map((item, displayOrder) => ({
							deckId: item.deckId,
							enabled: item.enabled,
							displayOrder,
						})),
					}),
				},
			);
			setAssignments(saved);
			setSavedSnapshot(JSON.stringify(saved));
			setNotice('Đã lưu bộ Active Recall cho lớp này.');
			return true;
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không lưu được thay đổi');
			return false;
		} finally {
			setBusy(false);
		}
	}

	return (
		<section className="mc-surface space-y-4 p-5">
			{leaveDialog}
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="text-base font-semibold text-ink">Active Recall của lớp</h2>
					<p className="mt-1 text-sm text-ink-secondary">
						{enabledCount} bộ đã xuất bản được bật trong cấu hình đã lưu. Sinh viên xem được khi lớp mở chia sẻ.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Link
						href={routes.mySpaceTeachingCourseTab(courseId, 'recall')}
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] border border-border px-3 text-xs font-semibold"
					>
						Thư viện môn
					</Link>
					<button
						type="button"
						onClick={() => void save()}
						disabled={busy || !isDirty}
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-3 text-xs font-semibold text-paper disabled:opacity-50"
					>
						{busy ? 'Đang lưu…' : 'Lưu thay đổi'}
					</button>
				</div>
			</div>
			{error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
			{notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
			{isDirty ? <p role="status" className="text-sm text-ink-secondary">Có thay đổi chưa lưu</p> : null}
			{assignments.length === 0 ? (
				<p className="text-sm text-ink-secondary">
					Môn này chưa có bộ thẻ. Hãy tạo bộ Active Recall trong thư viện môn trước.
				</p>
			) : (
				<ul className="divide-y divide-border">
					{assignments.map((item, index) => (
						<li key={item.deckId} className="flex flex-wrap items-center gap-3 py-3">
							<label className="flex min-w-0 flex-1 items-start gap-3">
								<input
									type="checkbox"
									disabled={busy}
									checked={item.enabled}
									onChange={() => toggle(item.deckId)}
									className="mt-1"
								/>
								<span>
									<span className="block font-semibold text-ink">{item.title}</span>
									<span className="mt-0.5 block text-xs text-ink-secondary">
										{[item.lessonLabel, `${item.cardCount} thẻ`, item.status === 'PUBLISHED' ? 'Công khai' : item.status === 'ARCHIVED' ? 'Lưu trữ' : 'Bản nháp']
											.filter(Boolean)
											.join(' · ')}
									</span>
								</span>
							</label>
							<div className="flex items-center gap-1" aria-label={`Sắp thứ tự ${item.title}`}>
								<button
									type="button"
									onClick={() => move(item.deckId, -1)}
									disabled={index === 0}
									aria-label={`Đưa ${item.title} lên`}
									className="inline-flex size-9 items-center justify-center rounded border border-border text-sm font-semibold disabled:opacity-35"
								>
									↑
								</button>
								<button
									type="button"
									onClick={() => move(item.deckId, 1)}
									disabled={index === assignments.length - 1}
									aria-label={`Đưa ${item.title} xuống`}
									className="inline-flex size-9 items-center justify-center rounded border border-border text-sm font-semibold disabled:opacity-35"
								>
									↓
								</button>
							</div>
							<Link
								href={routes.mySpaceTeachingRecallEdit(courseId, item.deckId)}
								className="text-xs font-semibold text-accent hover:underline"
							>
								Sửa bộ thẻ
							</Link>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
