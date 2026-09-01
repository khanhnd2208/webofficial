'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import { adminFetch } from '@/lib/admin/client';
import type { SubjectWithCounts } from '@/features/myspace-tests';

export default function SubjectsClient({ initial }: { initial: SubjectWithCounts[] }) {
	const router = useRouter();
	const { confirm, dialog } = useAdminConfirm();
	const [name, setName] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState('');

	async function onCreate(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim()) return;
		setBusy(true);
		setError(null);
		try {
			await adminFetch('/api/admin/myspace-subjects', {
				method: 'POST',
				body: JSON.stringify({ name: name.trim() }),
			});
			setName('');
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không kết nối được server');
		} finally {
			setBusy(false);
		}
	}

	async function onSaveEdit(id: string) {
		if (!editName.trim()) return;
		setBusy(true);
		setError(null);
		try {
			await adminFetch(`/api/admin/myspace-subjects/${id}`, {
				method: 'PATCH',
				body: JSON.stringify({ name: editName.trim() }),
			});
			setEditingId(null);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không kết nối được server');
		} finally {
			setBusy(false);
		}
	}

	async function onDelete(subject: SubjectWithCounts) {
		const ok = await confirm({
			title: 'Xóa môn học',
			description: `Xóa môn “${subject.name}”?`,
			confirmLabel: 'Xóa',
		});
		if (!ok) return;
		setBusy(true);
		setError(null);
		try {
			await adminFetch(`/api/admin/myspace-subjects/${subject.id}`, {
				method: 'DELETE',
			});
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không kết nối được server');
		} finally {
			setBusy(false);
		}
	}

	return (
		<>
		<div className="mt-8 space-y-6">
			{error ? (
				<p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
					{error}
				</p>
			) : null}

			<form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
				<label className="block min-w-[16rem] flex-1 text-xs">
					<span className="font-bold uppercase tracking-widest text-muted">Tên môn mới</span>
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Principles of Management"
						className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
					/>
				</label>
				<button
					type="submit"
					disabled={busy || !name.trim()}
					className="rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-background disabled:opacity-50"
				>
					Tạo môn
				</button>
			</form>

			<div className="divide-y divide-border border border-border">
				{initial.length === 0 ? (
					<p className="p-6 text-sm text-muted">Chưa có môn học nào.</p>
				) : (
					initial.map((s) => (
						<div
							key={s.id}
							className="flex flex-wrap items-center justify-between gap-3 p-4"
						>
							<div className="min-w-0 flex-1">
								{editingId === s.id ? (
									<input
										value={editName}
										onChange={(e) => setEditName(e.target.value)}
										className="w-full max-w-md rounded-lg border border-border bg-surface px-3 py-1.5 text-sm"
									/>
								) : (
									<>
										<p className="text-sm font-bold text-foreground">{s.name}</p>
										<p className="mt-0.5 text-xs text-muted">
											/{s.slug} · {s.testCount} bài test · {s.questionCount} câu hỏi
										</p>
									</>
								)}
							</div>
							<div className="flex flex-wrap gap-2">
								{editingId === s.id ? (
									<>
										<button
											type="button"
											disabled={busy}
											onClick={() => void onSaveEdit(s.id)}
											className="rounded-full bg-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-background disabled:opacity-50"
										>
											Lưu
										</button>
										<button
											type="button"
											onClick={() => setEditingId(null)}
											className="rounded-full border border-border px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted"
										>
											Hủy
										</button>
									</>
								) : (
									<>
										<button
											type="button"
											onClick={() => {
												setEditingId(s.id);
												setEditName(s.name);
											}}
											className="rounded-full border border-border px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted"
										>
											Sửa
										</button>
										<button
											type="button"
											disabled={busy}
											onClick={() => void onDelete(s)}
											className="rounded-full border border-red-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600 disabled:opacity-50"
										>
											Xóa
										</button>
									</>
								)}
							</div>
						</div>
					))
				)}
			</div>
		</div>
		{dialog}
		</>
	);
}
