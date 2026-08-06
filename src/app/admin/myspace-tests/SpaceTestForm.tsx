'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { routes } from '@/config/routes';
import type { SpaceTestDTO, SpaceTestWithQuestionCount, SubjectWithCounts } from '@/features/myspace-tests';

type Initial = SpaceTestDTO | SpaceTestWithQuestionCount;

function attachedCount(initial?: Initial): number | null {
	if (!initial || !('attachedQuestionCount' in initial)) return null;
	return initial.attachedQuestionCount;
}

export default function SpaceTestForm({ initial }: { initial?: Initial }) {
	const router = useRouter();
	const isEdit = Boolean(initial);
	const attached = attachedCount(initial);

	const [subjects, setSubjects] = useState<SubjectWithCounts[]>([]);
	const [title, setTitle] = useState(initial?.title ?? '');
	const [slug, setSlug] = useState(initial?.slug ?? '');
	const [description, setDescription] = useState(initial?.description ?? '');
	const [subjectId, setSubjectId] = useState(initial?.subjectId ?? '');
	const [newSubjectName, setNewSubjectName] = useState('');
	const [showNewSubject, setShowNewSubject] = useState(false);
	const [questionCount, setQuestionCount] = useState(initial?.questionCount ?? 10);
	const [status, setStatus] = useState(initial?.status ?? 'DRAFT');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		void fetch('/api/admin/myspace-subjects')
			.then((r) => r.json())
			.then((json: { ok: boolean; data?: { items: SubjectWithCounts[] } }) => {
				if (json.ok && json.data) setSubjects(json.data.items);
			});
	}, []);

	async function createSubjectQuick() {
		if (!newSubjectName.trim()) return;
		setError(null);
		const res = await fetch('/api/admin/myspace-subjects', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: newSubjectName.trim() }),
		});
		const json = (await res.json()) as {
			ok: boolean;
			data?: SubjectWithCounts;
			error?: string;
		};
		if (!json.ok || !json.data) {
			setError(json.error ?? 'Không tạo được môn');
			return;
		}
		setSubjects((prev) => [...prev, { ...json.data!, testCount: 0, questionCount: 0 }].sort((a, b) =>
			a.name.localeCompare(b.name),
		));
		setSubjectId(json.data.id);
		setNewSubjectName('');
		setShowNewSubject(false);
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		setError(null);
		try {
			const payload = {
				title,
				slug: slug.trim() || undefined,
				description,
				subjectId,
				questionCount,
				status,
			};
			const res = await fetch(
				isEdit ? `/api/admin/myspace-tests/${initial!.id}` : '/api/admin/myspace-tests',
				{
					method: isEdit ? 'PATCH' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				},
			);
			const json = (await res.json()) as {
				ok: boolean;
				data?: { id: string };
				error?: string;
			};
			if (!json.ok || !json.data) {
				throw new Error(json.error ?? 'Không lưu được');
			}
			router.push(routes.admin.myspaceTestEdit(json.data.id));
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Lỗi không xác định');
			setSaving(false);
		}
	}

	async function onDelete() {
		if (!initial || !confirm('Xóa bài test này?')) return;
		await fetch(`/api/admin/myspace-tests/${initial.id}`, { method: 'DELETE' });
		router.push(routes.admin.myspaceTests);
		router.refresh();
	}

	return (
		<form onSubmit={onSubmit} className="mt-8 max-w-2xl space-y-5">
			{error ? (
				<p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
					{error}
				</p>
			) : null}

			{attached !== null ? (
				<p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted">
					{attached > 0
						? `${attached} câu hỏi đang gắn trực tiếp với bài test này.`
						: 'Chưa có câu hỏi gắn trực tiếp — khi làm bài sẽ lấy từ ngân hàng theo môn (legacy).'}
				</p>
			) : null}

			<label className="block">
				<span className="text-xs font-bold uppercase tracking-widest text-muted">Tiêu đề</span>
				<input
					required
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
				/>
			</label>

			<label className="block">
				<span className="text-xs font-bold uppercase tracking-widest text-muted">Slug</span>
				<input
					value={slug}
					onChange={(e) => setSlug(e.target.value)}
					placeholder="tu-dong-tu-tieu-de"
					className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
				/>
			</label>

			<label className="block">
				<span className="text-xs font-bold uppercase tracking-widest text-muted">Mô tả</span>
				<textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					rows={3}
					className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
				/>
			</label>

			<div>
				<label className="block">
					<span className="text-xs font-bold uppercase tracking-widest text-muted">Môn học</span>
					<select
						required
						value={subjectId}
						onChange={(e) => setSubjectId(e.target.value)}
						className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
					>
						<option value="">— Chọn môn —</option>
						{subjects.map((s) => (
							<option key={s.id} value={s.id}>
								{s.name}
							</option>
						))}
					</select>
				</label>
				<button
					type="button"
					onClick={() => setShowNewSubject((v) => !v)}
					className="mt-2 text-xs text-muted underline underline-offset-2 hover:text-foreground"
				>
					{showNewSubject ? 'Ẩn tạo môn' : 'Tạo môn mới'}
				</button>
				{showNewSubject ? (
					<div className="mt-2 flex flex-wrap gap-2">
						<input
							value={newSubjectName}
							onChange={(e) => setNewSubjectName(e.target.value)}
							placeholder="Tên môn"
							className="min-w-[12rem] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
						/>
						<button
							type="button"
							onClick={() => void createSubjectQuick()}
							className="rounded-full border border-border px-3 py-2 text-xs font-bold uppercase tracking-wider"
						>
							Thêm
						</button>
					</div>
				) : null}
			</div>

			<label className="block">
				<span className="text-xs font-bold uppercase tracking-widest text-muted">
					Số câu mỗi lần làm
				</span>
				<input
					type="number"
					min={1}
					max={200}
					required
					value={questionCount}
					onChange={(e) => setQuestionCount(Number(e.target.value))}
					className="mt-1.5 w-32 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
				/>
			</label>

			<label className="block">
				<span className="text-xs font-bold uppercase tracking-widest text-muted">Trạng thái</span>
				<select
					value={status}
					onChange={(e) => setStatus(e.target.value as typeof status)}
					className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
				>
					<option value="DRAFT">Nháp</option>
					<option value="PUBLISHED">Xuất bản</option>
					<option value="ARCHIVED">Lưu trữ</option>
				</select>
			</label>

			<div className="flex flex-wrap gap-3">
				<button
					type="submit"
					disabled={saving}
					className="rounded-full bg-foreground px-5 py-2 text-xs font-bold uppercase tracking-wider text-background disabled:opacity-50"
				>
					{saving ? 'Đang lưu…' : isEdit ? 'Lưu' : 'Tạo bài test'}
				</button>
				<Link
					href={routes.admin.myspaceTests}
					className="inline-flex items-center text-xs text-muted hover:text-foreground"
				>
					Hủy
				</Link>
				{isEdit ? (
					<button
						type="button"
						onClick={() => void onDelete()}
						className="ml-auto text-xs text-red-600"
					>
						Xóa
					</button>
				) : null}
			</div>

			{!isEdit ? (
				<p className="text-xs text-muted">
					Khuyến nghị:{' '}
					<Link href={routes.admin.myspaceQuestionsImport} className="underline underline-offset-2">
						Import thông minh
					</Link>{' '}
					để tạo bài kèm toàn bộ câu hỏi trong một bước.
				</p>
			) : null}
		</form>
	);
}
