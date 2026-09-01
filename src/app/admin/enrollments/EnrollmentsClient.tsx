'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Dialog } from '@/components/ui/Dialog';
import { AdminErrorState } from '@/components/admin/AdminPageHeader';
import type { CourseListItem, EnrollmentAdminDTO } from '@/features/courses/types';
import { adminFetch } from '@/lib/admin/client';

type UserHit = { id: string; name: string; email: string; image: string | null; role: string };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
	return adminFetch<T>(url, init);
}

type RowAction = { id: string; action: 'revoke' | 'restore' };

export default function EnrollmentsClient({
	courses,
	initialCourseId,
}: {
	courses: CourseListItem[];
	initialCourseId: string;
}) {
	const [courseId, setCourseId] = useState(initialCourseId);
	const [items, setItems] = useState<EnrollmentAdminDTO[]>([]);
	const [query, setQuery] = useState('');
	const [hits, setHits] = useState<UserHit[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [enrollBusy, setEnrollBusy] = useState(false);

	// Per-row loading & error
	const [rowBusy, setRowBusy] = useState<Record<string, boolean>>({});
	const [rowError, setRowError] = useState<Record<string, string>>({});

	// Confirm dialog state
	const [pendingAction, setPendingAction] = useState<RowAction | null>(null);
	const confirmOpenRef = useRef(false);
	confirmOpenRef.current = pendingAction !== null;

	const load = useCallback(async (id: string) => {
		const data = await api<{ items: EnrollmentAdminDTO[] }>(
			`/api/admin/enrollments?courseId=${encodeURIComponent(id)}`,
		);
		setItems(data.items);
	}, []);

	useEffect(() => {
		void load(courseId).catch((err) => setError(err instanceof Error ? err.message : 'Lỗi'));
	}, [courseId, load]);

	useEffect(() => {
		if (query.trim().length < 2) {
			setHits([]);
			return;
		}
		const t = setTimeout(() => {
			void api<{ users: UserHit[] }>(
				`/api/admin/enrollments/search-users?q=${encodeURIComponent(query.trim())}`,
			)
				.then((data) => setHits(data.users))
				.catch((err) => setError(err instanceof Error ? err.message : 'Lỗi'));
		}, 250);
		return () => clearTimeout(t);
	}, [query]);

	async function enroll(userId: string) {
		setEnrollBusy(true);
		setError(null);
		try {
			await api('/api/admin/enrollments', {
				method: 'POST',
				body: JSON.stringify({ courseId, userId }),
			});
			setQuery('');
			setHits([]);
			await load(courseId);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Lỗi');
		} finally {
			setEnrollBusy(false);
		}
	}

	async function executeAction(id: string, action: 'revoke' | 'restore') {
		setRowBusy((prev) => ({ ...prev, [id]: true }));
		setRowError((prev) => ({ ...prev, [id]: '' }));
		try {
			await api(`/api/admin/enrollments/${id}`, {
				method: 'PATCH',
				body: JSON.stringify({ action }),
			});
			await load(courseId);
		} catch (err) {
			setRowError((prev) => ({
				...prev,
				[id]: err instanceof Error ? err.message : 'Lỗi',
			}));
		} finally {
			setRowBusy((prev) => ({ ...prev, [id]: false }));
		}
	}

	function requestAction(id: string, action: 'revoke' | 'restore') {
		setPendingAction({ id, action });
	}

	async function confirmAction() {
		if (!pendingAction) return;
		const { id, action } = pendingAction;
		setPendingAction(null);
		await executeAction(id, action);
	}

	const pendingItem = pendingAction ? items.find((i) => i.id === pendingAction.id) : null;
	const pendingLabel = pendingItem?.user
		? (pendingItem.user.name || pendingItem.user.email)
		: pendingItem?.userId ?? '';
	const actionLabel = pendingAction?.action === 'revoke' ? 'hủy ghi danh' : 'khôi phục ghi danh';

	return (
		<div className="mt-8 space-y-6">
			{error ? (
				<AdminErrorState title="Không tải được danh sách ghi danh" description={error} />
			) : null}

			<label className="block max-w-md">
				<span className="text-xs font-bold uppercase tracking-widest text-muted">Khóa học</span>
				<select
					value={courseId}
					onChange={(e) => setCourseId(e.target.value)}
					className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
				>
					{courses.map((c) => (
						<option key={c.id} value={c.id}>
							{c.title} ({c.status})
						</option>
					))}
				</select>
			</label>

			<section className="border border-border p-5">
				<h2 className="text-xs font-bold uppercase tracking-widest text-muted">Thêm học viên</h2>
				<input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Tìm theo email hoặc tên…"
					className="mt-3 w-full max-w-md rounded-lg border border-border bg-surface px-3 py-2 text-sm"
				/>
				{hits.length > 0 ? (
					<ul className="mt-3 max-w-md divide-y divide-border border border-border">
						{hits.map((u) => (
							<li key={u.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
								<div className="min-w-0">
									<p className="truncate font-bold text-foreground">{u.name || u.email}</p>
									<p className="truncate text-xs text-muted">{u.email}</p>
								</div>
								<button
									type="button"
									disabled={enrollBusy}
									onClick={() => void enroll(u.id)}
									className="shrink-0 text-xs font-bold uppercase tracking-wider text-accent hover:underline disabled:opacity-50"
								>
									Ghi danh
								</button>
							</li>
						))}
					</ul>
				) : null}
			</section>

			<section>
				<h2 className="text-xs font-bold uppercase tracking-widest text-muted">
					Danh sách ghi danh
				</h2>
				{items.length === 0 ? (
					<p className="mt-4 text-sm text-muted">Chưa có học viên nào.</p>
				) : (
					<div className="mt-4 divide-y divide-border border border-border">
						{items.map((item) => {
							const busy = rowBusy[item.id] ?? false;
							const rowErr = rowError[item.id] ?? '';
							const displayName = item.user
								? item.user.name || item.user.email
								: item.userId;
							const displayEmail = item.user?.email;

							return (
								<div
									key={item.id}
									className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"
								>
									<div className="min-w-0">
										<p className="truncate font-semibold text-foreground">{displayName}</p>
										{displayEmail && displayEmail !== displayName ? (
											<p className="truncate text-xs text-muted">{displayEmail}</p>
										) : null}
										<p className="mt-0.5 text-xs text-muted">
											{item.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã hủy'} ·{' '}
											{new Date(item.enrolledAt).toLocaleDateString('vi-VN')}
										</p>
										{rowErr ? (
											<p className="mt-1 text-xs text-error">{rowErr}</p>
										) : null}
									</div>
									<div className="shrink-0">
										{item.status === 'ACTIVE' ? (
											<button
												type="button"
												disabled={busy}
												onClick={() => requestAction(item.id, 'revoke')}
												className="text-xs font-bold uppercase tracking-wider text-error hover:underline disabled:opacity-50"
											>
												{busy ? 'Đang xử lý…' : 'Hủy ghi danh'}
											</button>
										) : (
											<button
												type="button"
												disabled={busy}
												onClick={() => requestAction(item.id, 'restore')}
												className="text-xs font-bold uppercase tracking-wider text-accent hover:underline disabled:opacity-50"
											>
												{busy ? 'Đang xử lý…' : 'Khôi phục'}
											</button>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</section>

			{/* Confirm dialog */}
			<Dialog
				open={pendingAction !== null}
				onClose={() => setPendingAction(null)}
				title="Xác nhận thao tác"
				description={`Bạn có chắc muốn ${actionLabel} cho "${pendingLabel}"?`}
			>
				<div className="flex justify-end gap-3 pt-2">
					<button
						type="button"
						onClick={() => setPendingAction(null)}
						className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-surface-hover"
					>
						Hủy
					</button>
					<button
						type="button"
						onClick={() => void confirmAction()}
						className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-foreground/90"
					>
						Xác nhận
					</button>
				</div>
			</Dialog>
		</div>
	);
}
