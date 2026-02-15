'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import type { CourseUnitListItemDTO } from '@/types/courseUnit';
import type { AdminLessonListItemDTO } from '@/types/lesson';
import type { UnitDTO } from '@/types/unit';

type Props = {
	courseId: string;
	courseUnits: CourseUnitListItemDTO[];
	selectedUnitId?: string;
	lessonsByUnitId: Map<string, AdminLessonListItemDTO[]>;
};

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: string };
type ApiRes<T> = ApiOk<T> | ApiErr;

export default function UnitManager({ courseId, courseUnits, selectedUnitId, lessonsByUnitId }: Props) {
	const router = useRouter();

	const [newName, setNewName] = useState('');
	const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
	const [error, setError] = useState('');
	const [expandedUnitId, setExpandedUnitId] = useState<string | null>(selectedUnitId ?? null);

	// Auto-expand unit when selectedUnitId changes (e.g., after creating a lesson)
	useEffect(() => {
		if (selectedUnitId) {
			setExpandedUnitId(selectedUnitId);
		}
	}, [selectedUnitId]);

	type UnitWithOrder = UnitDTO & { order: number };
	const units = useMemo<UnitWithOrder[]>(
		() => (courseUnits ?? []).map((cu) => ({ ...cu.unit, order: typeof cu.order === 'number' ? cu.order : 0 })),
		[courseUnits]
	);
	const orderedUnits = useMemo<UnitWithOrder[]>(
		() => [...units].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)),
		[units]
	);

	async function onCreateAndAttach() {
		const trimmed = newName.trim();
		if (!trimmed) return;
		setStatus('saving');
		setError('');
		try {
			const attachRes = await fetch(`/api/admin/courses/${encodeURIComponent(courseId)}/units`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: trimmed }),
			});
			const attachJson = (await attachRes.json()) as ApiRes<unknown>;
			if (!attachRes.ok || !attachJson.ok) throw new Error(!attachJson.ok ? attachJson.error : `HTTP ${attachRes.status}`);
			setNewName('');
			router.refresh();
		} catch (e) {
			setStatus('error');
			setError(e instanceof Error ? e.message : 'Unknown error');
		}
	}

	async function setUnitOrder(unitId: string, order: number) {
		const res = await fetch(`/api/admin/courses/${encodeURIComponent(courseId)}/units`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ unitId, order }),
		});
		const json = (await res.json()) as ApiRes<unknown>;
		if (!res.ok || !json.ok) throw new Error(!json.ok ? json.error : `HTTP ${res.status}`);
	}

	async function onMove(fromIndex: number, delta: -1 | 1) {
		const toIndex = fromIndex + delta;
		if (toIndex < 0 || toIndex >= orderedUnits.length) return;

		const next = [...orderedUnits];
		[next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];

		const currentOrderById = new Map(orderedUnits.map((u) => [u.id, u.order] as const));
		const desiredOrderById = new Map(next.map((u, i) => [u.id, i + 1] as const));
		const changes = next.filter((u) => currentOrderById.get(u.id) !== desiredOrderById.get(u.id));
		if (changes.length === 0) return;

		setStatus('saving');
		setError('');
		try {
			await Promise.all(
				changes.map((u) => {
					const order = desiredOrderById.get(u.id);
					if (!order) return Promise.resolve();
					return setUnitOrder(u.id, order);
				})
			);
			router.refresh();
		} catch (e) {
			setStatus('error');
			setError(e instanceof Error ? e.message : 'Unknown error');
		}
	}

	async function onRename(u: UnitDTO) {
		const next = window.prompt('Đổi tên unit', u.name);
		if (next === null) return;
		const trimmed = next.trim();
		if (!trimmed) return;
		setStatus('saving');
		setError('');
		try {
			const res = await fetch(`/api/admin/units/${encodeURIComponent(u.id)}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: trimmed }),
			});
			const json = (await res.json()) as ApiRes<unknown>;
			if (!res.ok || !json.ok) throw new Error(!json.ok ? json.error : `HTTP ${res.status}`);
			router.refresh();
		} catch (e) {
			setStatus('error');
			setError(e instanceof Error ? e.message : 'Unknown error');
		}
	}

	async function onDetach(u: UnitDTO) {
		const ok = window.confirm(`Gỡ unit "${u.name}" khỏi course này?`);
		if (!ok) return;
		setStatus('saving');
		setError('');
		try {
			const res = await fetch(`/api/admin/courses/${encodeURIComponent(courseId)}/units?unitId=${encodeURIComponent(u.id)}`, { method: 'DELETE' });
			const json = (await res.json()) as ApiRes<unknown>;
			if (!res.ok || !json.ok) throw new Error(!json.ok ? json.error : `HTTP ${res.status}`);
			router.push(`/admin/learning?courseId=${encodeURIComponent(courseId)}`);
			router.refresh();
		} catch (e) {
			setStatus('error');
			setError(e instanceof Error ? e.message : 'Unknown error');
		}
	}

	async function onDelete(u: UnitDTO) {
		const ok = window.confirm(`Xoá unit "${u.name}"? (chỉ xoá được khi unit không còn gắn course nào và chưa có lesson)`);
		if (!ok) return;
		setStatus('saving');
		setError('');
		try {
			const res = await fetch(`/api/admin/units/${encodeURIComponent(u.id)}`, { method: 'DELETE' });
			const json = (await res.json()) as ApiRes<unknown>;
			if (!res.ok || !json.ok) throw new Error(!json.ok ? json.error : `HTTP ${res.status}`);
			router.refresh();
		} catch (e) {
			setStatus('error');
			setError(e instanceof Error ? e.message : 'Unknown error');
		}
	}

	return (
		<div className="space-y-3">
			{status === 'error' ? <p className="text-xs text-error">{error}</p> : null}

			<details className="rounded-lg border border-border p-3">
				<summary className="cursor-pointer select-none text-sm font-medium">+ Tạo unit mới</summary>
				<p className="mt-1 text-xs text-muted">Thêm unit vào course này để tổ chức bài giảng.</p>
				<div className="mt-3 grid gap-2">
					<input
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						placeholder="Tên unit (e.g. Unit 1, Chương 1, ...)"
						className="w-full rounded-md border border-border-hover bg-background px-3 py-2 text-sm"
						onKeyDown={(e) => {
							if (e.key === 'Enter') void onCreateAndAttach();
						}}
					/>
					<button
						type="button"
						onClick={() => void onCreateAndAttach()}
						disabled={status === 'saving' || !newName.trim()}
						className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-60"
					>
						{status === 'saving' ? 'Đang tạo…' : 'Tạo unit'}
					</button>
				</div>
			</details>
			<div className="rounded-lg border border-border">
				<div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
					<div className="text-sm font-medium">Units trong course</div>
					<p className="text-xs text-muted">Click unit → xem/thêm bài giảng</p>
				</div>
				{orderedUnits.length === 0 ? (
					<p className="px-3 py-3 text-sm text-foreground-secondary">Chưa có unit nào.</p>
				) : (
					<div className="divide-y divide-border">
						{orderedUnits.map((u, index) => {
							const isExpanded = expandedUnitId === u.id;
							const lessons = lessonsByUnitId.get(u.id) ?? [];
							const vocabTotal = lessons.reduce((sum, l) => sum + (l.vocabularyCount ?? 0), 0);
							return (
								<div key={u.id} className="px-3 py-2">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<button
											type="button"
											onClick={() => setExpandedUnitId(isExpanded ? null : u.id)}
											className="min-w-0 text-left"
										>
											<div className="flex items-center gap-2">
												<span className="text-sm">{isExpanded ? '▼' : '▶'}</span>
												<span className="truncate text-sm font-medium">{u.name}</span>
												<span className="text-xs text-muted">
													({lessons.length} lessons, {vocabTotal} vocab)
												</span>
											</div>
										</button>
										<div className="flex flex-wrap items-center gap-3 text-xs">
											<button
												type="button"
												className="rounded-md border border-border-hover px-2 py-1 disabled:opacity-60"
												onClick={() => void onMove(index, -1)}
												disabled={status === 'saving' || index === 0}
												title="Move up"
											>
												↑
											</button>
											<button
												type="button"
												className="rounded-md border border-border-hover px-2 py-1 disabled:opacity-60"
												onClick={() => void onMove(index, 1)}
												disabled={status === 'saving' || index === orderedUnits.length - 1}
												title="Move down"
											>
												↓
											</button>
											<button
												type="button"
												className="underline underline-offset-4 text-foreground-secondary"
												onClick={() => void onRename(u)}
												disabled={status === 'saving'}
											>
												Rename
											</button>
											<button
												type="button"
												className="underline underline-offset-4 text-foreground-secondary"
												onClick={() => void onDetach(u)}
												disabled={status === 'saving'}
											>
												Remove
											</button>
											<button
												type="button"
												className="underline underline-offset-4 text-error"
												onClick={() => void onDelete(u)}
												disabled={status === 'saving'}
											>
												Delete
											</button>
										</div>
									</div>

									{isExpanded ? (
										<div className="mt-3 ml-6 space-y-3 border-l-2 border-border pl-4">
											<div className="flex items-center justify-between gap-2">
												<div className="text-xs font-medium text-foreground-secondary">Bài giảng ({lessons.length})</div>
												<Link
													className="rounded-md border border-border-hover bg-background px-3 py-1.5 text-xs font-medium hover:bg-surface-hover"
													href={`/admin/lessons/create?courseId=${encodeURIComponent(courseId)}&unitId=${encodeURIComponent(u.id)}`}
												>
													+ Thêm bài giảng
												</Link>
											</div>
											{lessons.length === 0 ? (
												<p className="rounded-md border border-dashed border-border-hover p-3 text-center text-xs text-muted">
													Chưa có bài giảng. Click &quot;+ Thêm bài giảng&quot; để tạo.
												</p>
											) : (
												<div className="space-y-2">
													{lessons.map((l) => (
														<div key={l.id} className="rounded-md border border-border bg-background px-3 py-2.5 hover:bg-surface-hover">
															<div className="flex flex-wrap items-start justify-between gap-3">
																<div className="min-w-0 flex-1">
																	<div className="truncate text-sm font-medium">{l.title}</div>
																	<div className="mt-1 flex items-center gap-3 text-xs text-muted">
																		<span>Vocab: {l.vocabularyCount}</span>
																	</div>
																</div>
																<div className="flex flex-wrap items-center gap-2">
																	<Link 
																		className="rounded-md border border-border-hover px-2.5 py-1 text-xs hover:bg-surface-hover"
																		href={`/admin/lessons/${l.id}/edit`}
																		title="Sửa nội dung markdown"
																	>
																		<svg className="inline h-3 w-3 mr-0.5" viewBox="0 0 24 24" fill="none"><path d="M16.862 3.487a2.1 2.1 0 013.02 0l.631.631a2.1 2.1 0 010 3.02L9.07 18.58l-4.59 1.15 1.15-4.59L16.862 3.487z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg> Sửa
																	</Link>
																	<Link 
																		className="rounded-md border border-border-hover px-2.5 py-1 text-xs hover:bg-surface-hover"
																		href={`/admin/lessons/${l.id}/vocabulary`}
																		title="Quản lý từ vựng"
																	>
																		<svg className="inline h-3 w-3 mr-0.5" viewBox="0 0 24 24" fill="none"><path d="M4 5a2 2 0 012-2h5l2 2h5a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.5" /><path d="M9 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> Vocab
																	</Link>
																	<Link 
																		className="rounded-md border border-border-hover px-2.5 py-1 text-xs text-muted hover:bg-surface-hover"
																		href={`/courses/lessons/${l.id}`}
																		target="_blank"
																		title="Xem student view"
																	>
																		<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" /></svg>
																	</Link>
																</div>
															</div>
														</div>
													))}
												</div>
											)}
										</div>
									) : null}
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
