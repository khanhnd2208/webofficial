'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { McqQuestionDTO } from '@/features/myspace-tests';

export default function QuestionsClient({
	initialItems,
	subjects,
	topicsBySubjectId,
	initialSubjectId,
	initialTopic,
	initialQ,
}: {
	initialItems: McqQuestionDTO[];
	subjects: Array<{ id: string; name: string }>;
	topicsBySubjectId: Record<string, string[]>;
	initialSubjectId: string;
	initialTopic: string;
	initialQ: string;
}) {
	const router = useRouter();
	const [subjectId, setSubjectId] = useState(initialSubjectId);
	const [topic, setTopic] = useState(initialTopic);
	const [q, setQ] = useState(initialQ);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [editing, setEditing] = useState<McqQuestionDTO | null>(null);
	const [editStem, setEditStem] = useState('');
	const [editTopic, setEditTopic] = useState('');
	const [error, setError] = useState<string | null>(null);

	const topics = subjectId ? (topicsBySubjectId[subjectId] ?? []) : [];

	function applyFilters(e: React.FormEvent) {
		e.preventDefault();
		const params = new URLSearchParams();
		if (subjectId) params.set('subjectId', subjectId);
		if (topic) params.set('topic', topic);
		if (q.trim()) params.set('q', q.trim());
		router.push(`/admin/myspace-tests/questions?${params.toString()}`);
	}

	async function toggleActive(item: McqQuestionDTO) {
		setBusyId(item.id);
		setError(null);
		try {
			await fetch(`/api/admin/myspace-questions/${item.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isActive: !item.isActive }),
			});
			router.refresh();
		} finally {
			setBusyId(null);
		}
	}

	function openEdit(item: McqQuestionDTO) {
		setEditing(item);
		setEditStem(item.stem);
		setEditTopic(item.topic);
		setError(null);
	}

	async function saveEdit() {
		if (!editing) return;
		setBusyId(editing.id);
		setError(null);
		try {
			const res = await fetch(`/api/admin/myspace-questions/${editing.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ stem: editStem, topic: editTopic }),
			});
			const json = (await res.json()) as { ok: boolean; error?: string };
			if (!json.ok) {
				setError(json.error ?? 'Không lưu được');
				return;
			}
			setEditing(null);
			router.refresh();
		} finally {
			setBusyId(null);
		}
	}

	async function onDelete(item: McqQuestionDTO) {
		if (!confirm('Xóa câu hỏi này?')) return;
		setBusyId(item.id);
		setError(null);
		try {
			const res = await fetch(`/api/admin/myspace-questions/${item.id}`, {
				method: 'DELETE',
			});
			const json = (await res.json()) as { ok: boolean; error?: string };
			if (!json.ok) {
				setError(json.error ?? 'Không xóa được');
				return;
			}
			router.refresh();
		} finally {
			setBusyId(null);
		}
	}

	return (
		<div className="mt-8">
			{error ? (
				<p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
					{error}
				</p>
			) : null}

			<form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3">
				<label className="block text-xs">
					<span className="font-bold uppercase tracking-widest text-muted">Môn</span>
					<select
						value={subjectId}
						onChange={(e) => {
							setSubjectId(e.target.value);
							setTopic('');
						}}
						className="mt-1 block min-w-[12rem] rounded-lg border border-border bg-surface px-2 py-2"
					>
						<option value="">Tất cả</option>
						{subjects.map((s) => (
							<option key={s.id} value={s.id}>
								{s.name}
							</option>
						))}
					</select>
				</label>
				<label className="block text-xs">
					<span className="font-bold uppercase tracking-widest text-muted">Topic</span>
					<select
						value={topic}
						onChange={(e) => setTopic(e.target.value)}
						disabled={!subjectId}
						className="mt-1 block min-w-[14rem] rounded-lg border border-border bg-surface px-2 py-2 disabled:opacity-50"
					>
						<option value="">Tất cả</option>
						{topics.map((t) => (
							<option key={t} value={t}>
								{t}
							</option>
						))}
					</select>
				</label>
				<label className="block min-w-[12rem] flex-1 text-xs">
					<span className="font-bold uppercase tracking-widest text-muted">Tìm</span>
					<input
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="stem / topic…"
						className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
					/>
				</label>
				<button
					type="submit"
					className="rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-background"
				>
					Lọc
				</button>
			</form>

			{editing ? (
				<div className="mt-6 border border-border p-4">
					<p className="text-xs font-bold uppercase tracking-widest text-muted">Sửa câu hỏi</p>
					<label className="mt-3 block text-xs">
						<span className="text-muted">Topic</span>
						<input
							value={editTopic}
							onChange={(e) => setEditTopic(e.target.value)}
							className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
						/>
					</label>
					<label className="mt-3 block text-xs">
						<span className="text-muted">Stem</span>
						<textarea
							value={editStem}
							onChange={(e) => setEditStem(e.target.value)}
							rows={3}
							className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
						/>
					</label>
					<div className="mt-3 flex gap-2">
						<button
							type="button"
							disabled={busyId === editing.id}
							onClick={() => void saveEdit()}
							className="rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-background disabled:opacity-50"
						>
							Lưu
						</button>
						<button
							type="button"
							onClick={() => setEditing(null)}
							className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted"
						>
							Hủy
						</button>
					</div>
				</div>
			) : null}

			<div className="mt-6 divide-y divide-border border border-border">
				{initialItems.length === 0 ? (
					<p className="p-6 text-sm text-muted">Không có câu hỏi khớp bộ lọc.</p>
				) : (
					initialItems.map((item) => (
						<div key={item.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium text-foreground">{item.stem}</p>
								<p className="mt-1 text-xs text-muted">
									{item.subjectName ?? '—'} · {item.topic} · Diff {item.difficulty} · Đáp
									án {item.correctOption}
									{item.classification ? ` · ${item.classification}` : ''}
									{!item.isActive ? ' · ẩn' : ''}
								</p>
							</div>
							<div className="flex shrink-0 flex-wrap gap-2">
								<button
									type="button"
									disabled={busyId === item.id}
									onClick={() => openEdit(item)}
									className="rounded-full border border-border px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted disabled:opacity-50"
								>
									Sửa
								</button>
								<button
									type="button"
									disabled={busyId === item.id}
									onClick={() => toggleActive(item)}
									className="rounded-full border border-border px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted disabled:opacity-50"
								>
									{item.isActive ? 'Ẩn' : 'Hiện'}
								</button>
								<button
									type="button"
									disabled={busyId === item.id}
									onClick={() => void onDelete(item)}
									className="rounded-full border border-red-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600 disabled:opacity-50"
								>
									Xóa
								</button>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
