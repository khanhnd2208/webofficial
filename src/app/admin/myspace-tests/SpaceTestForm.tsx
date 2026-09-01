'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import { adminFetch } from '@/lib/admin/client';
import { routes } from '@/config/routes';
import type {
	SpaceTestDTO,
	SpaceTestWithQuestionCount,
	SubjectWithCounts,
} from '@/features/myspace-tests';

type Initial = SpaceTestDTO | SpaceTestWithQuestionCount;

const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type SpaceTestDraft = {
	title: string;
	slug: string;
	description: string;
	subjectId: string;
	questionCount: number;
	displayOrder: number;
	status: Initial['status'];
	savedAt: number;
};

function attachedCount(initial?: Initial): number | null {
	if (!initial || !('attachedQuestionCount' in initial)) return null;
	return initial.attachedQuestionCount;
}

export default function SpaceTestForm({ initial }: { initial?: Initial }) {
	const router = useRouter();
	const { confirm, dialog } = useAdminConfirm();
	const isEdit = Boolean(initial);
	const attached = attachedCount(initial);
	const formRef = useRef<HTMLFormElement>(null);
	const draftKey = `admin:myspace-test:draft:${initial?.id ?? 'new'}`;

	const [subjects, setSubjects] = useState<SubjectWithCounts[]>([]);
	const [title, setTitle] = useState(initial?.title ?? '');
	const [slug, setSlug] = useState(initial?.slug ?? '');
	const [description, setDescription] = useState(initial?.description ?? '');
	const [subjectId, setSubjectId] = useState(initial?.subjectId ?? '');
	const [newSubjectName, setNewSubjectName] = useState('');
	const [showNewSubject, setShowNewSubject] = useState(false);
	const [questionCount, setQuestionCount] = useState(initial?.questionCount ?? 10);
	const [displayOrder, setDisplayOrder] = useState(initial?.displayOrder ?? 0);
	const [status, setStatus] = useState(initial?.status ?? 'DRAFT');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [draftRestored, setDraftRestored] = useState(false);
	const [draftHydrated, setDraftHydrated] = useState(false);

	const initialSnapshot = useMemo(
		() =>
			JSON.stringify({
				title: initial?.title ?? '',
				slug: initial?.slug ?? '',
				description: initial?.description ?? '',
				subjectId: initial?.subjectId ?? '',
				questionCount: initial?.questionCount ?? 10,
				displayOrder: initial?.displayOrder ?? 0,
				status: initial?.status ?? 'DRAFT',
			}),
		[initial],
	);
	const currentSnapshot = useMemo(
		() =>
			JSON.stringify({ title, slug, description, subjectId, questionCount, displayOrder, status }),
		[title, slug, description, subjectId, questionCount, displayOrder, status],
	);
	const isDirty = currentSnapshot !== initialSnapshot;

	useEffect(() => {
		try {
			const raw = localStorage.getItem(draftKey);
			if (!raw) return;
			const draft = JSON.parse(raw) as Partial<SpaceTestDraft>;
			if (typeof draft.savedAt !== 'number' || Date.now() - draft.savedAt > DRAFT_MAX_AGE_MS) {
				localStorage.removeItem(draftKey);
				return;
			}
			if (typeof draft.title === 'string') setTitle(draft.title);
			if (typeof draft.slug === 'string') setSlug(draft.slug);
			if (typeof draft.description === 'string') setDescription(draft.description);
			if (typeof draft.subjectId === 'string') setSubjectId(draft.subjectId);
			if (typeof draft.questionCount === 'number') setQuestionCount(draft.questionCount);
			if (typeof draft.displayOrder === 'number') setDisplayOrder(draft.displayOrder);
			if (draft.status === 'DRAFT' || draft.status === 'PUBLISHED' || draft.status === 'ARCHIVED') {
				setStatus(draft.status);
			}
			setDraftRestored(true);
		} catch {
			localStorage.removeItem(draftKey);
		} finally {
			setDraftHydrated(true);
		}
	}, [draftKey]);

	useEffect(() => {
		if (!draftHydrated) return;
		if (!isDirty) {
			localStorage.removeItem(draftKey);
			return;
		}
		const timer = window.setTimeout(() => {
			const draft: SpaceTestDraft = {
				title,
				slug,
				description,
				subjectId,
				questionCount,
				displayOrder,
				status,
				savedAt: Date.now(),
			};
			try {
				localStorage.setItem(draftKey, JSON.stringify(draft));
			} catch {
				// Storage can be unavailable in private browsing; the form still remains usable.
			}
		}, 1000);
		return () => window.clearTimeout(timer);
	}, [
		description,
		displayOrder,
		draftHydrated,
		draftKey,
		isDirty,
		questionCount,
		slug,
		status,
		subjectId,
		title,
	]);

	useEffect(() => {
		function warnBeforeLeaving(event: BeforeUnloadEvent) {
			if (!isDirty || saving) return;
			event.preventDefault();
		}
		window.addEventListener('beforeunload', warnBeforeLeaving);
		return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
	}, [isDirty, saving]);

	useEffect(() => {
		function saveWithKeyboard(event: KeyboardEvent) {
			if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's') return;
			event.preventDefault();
			formRef.current?.requestSubmit();
		}
		window.addEventListener('keydown', saveWithKeyboard);
		return () => window.removeEventListener('keydown', saveWithKeyboard);
	}, []);

	useEffect(() => {
		void adminFetch<{ items: SubjectWithCounts[] }>('/api/admin/myspace-subjects')
			.then((data) => {
				if (data?.items) setSubjects(data.items);
			})
			.catch(() => undefined);
	}, []);

	async function createSubjectQuick() {
		if (!newSubjectName.trim()) return;
		setError(null);
		try {
			const created = await adminFetch<SubjectWithCounts>('/api/admin/myspace-subjects', {
				method: 'POST',
				body: JSON.stringify({ name: newSubjectName.trim() }),
			});
			setSubjects((prev) =>
				[...prev, { ...created, testCount: 0, questionCount: 0 }].sort((a, b) =>
					a.name.localeCompare(b.name),
				),
			);
			setSubjectId(created.id);
			setNewSubjectName('');
			setShowNewSubject(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không tạo được môn');
		}
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
				...(isEdit || displayOrder > 0 ? { displayOrder } : {}),
				status,
			};
			const saved = await adminFetch<{ id: string }>(
				isEdit ? `/api/admin/myspace-tests/${initial!.id}` : '/api/admin/myspace-tests',
				{
					method: isEdit ? 'PATCH' : 'POST',
					body: JSON.stringify(payload),
				},
			);
			localStorage.removeItem(draftKey);
			router.push(routes.admin.myspaceTestEdit(saved.id));
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Lỗi không xác định');
			setSaving(false);
		}
	}

	async function onDelete() {
		if (!initial) return;
		const ok = await confirm({
			title: 'Xóa bài test',
			description: 'Xóa bài test này?',
			confirmLabel: 'Xóa',
		});
		if (!ok) return;
		await adminFetch(`/api/admin/myspace-tests/${initial.id}`, { method: 'DELETE' });
		router.push(routes.admin.myspaceTests);
		router.refresh();
	}

	return (
		<>
			<form ref={formRef} onSubmit={onSubmit} className="mt-8 max-w-2xl space-y-5">
				<p className="text-xs text-muted" role="status" aria-live="polite">
					{saving
						? 'Đang lưu…'
						: error
							? 'Lưu thất bại. Hãy kiểm tra thông báo bên dưới.'
							: isDirty
								? 'Có thay đổi chưa lưu · Cmd/Ctrl+S để lưu'
								: 'Đã đồng bộ'}
				</p>
				{draftRestored ? (
					<p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted">
						Đã khôi phục bản nháp trên thiết bị này. Hãy kiểm tra rồi lưu lại.
					</p>
				) : null}
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
						className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
					/>
				</label>

				<label className="block">
					<span className="text-xs font-bold uppercase tracking-widest text-muted">Slug</span>
					<input
						value={slug}
						onChange={(e) => setSlug(e.target.value)}
						placeholder="tu-dong-tu-tieu-de"
						className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
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
							className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
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
						className="mt-2 inline-flex min-h-11 items-center text-xs text-muted underline underline-offset-2 hover:text-foreground"
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
								className="min-h-11 rounded-full border border-border px-3 py-2 text-xs font-bold uppercase tracking-wider"
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
						className="mt-1.5 min-h-11 w-32 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
					/>
				</label>

				<label className="block">
					<span className="text-xs font-bold uppercase tracking-widest text-muted">
						Thứ tự hiển thị trong môn
					</span>
					<input
						type="number"
						min={0}
						max={100000}
						value={displayOrder}
						onChange={(e) => setDisplayOrder(Number(e.target.value))}
						className="mt-1.5 min-h-11 w-32 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
					/>
					<span className="mt-1 block text-xs text-muted">
						Số nhỏ hơn hiện trước. Bài mới để 0 sẽ được gắn cuối môn khi tạo.
					</span>
				</label>

				<label className="block">
					<span className="text-xs font-bold uppercase tracking-widest text-muted">Trạng thái</span>
					<select
						value={status}
						onChange={(e) => setStatus(e.target.value as typeof status)}
						className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
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
						className="min-h-11 rounded-full bg-foreground px-5 py-2 text-xs font-bold uppercase tracking-wider text-background disabled:opacity-50"
					>
						{saving ? 'Đang lưu…' : isEdit ? 'Lưu' : 'Tạo bài test'}
					</button>
					<Link
						href={routes.admin.myspaceTests}
						className="inline-flex min-h-11 items-center px-2 text-xs text-muted hover:text-foreground"
					>
						Hủy
					</Link>
					{isEdit ? (
						<button
							type="button"
							onClick={() => void onDelete()}
							className="ml-auto min-h-11 px-3 text-xs text-red-600"
						>
							Xóa
						</button>
					) : null}
				</div>

				{!isEdit ? (
					<p className="text-xs text-muted">
						Khuyến nghị:{' '}
						<Link
							href={routes.admin.myspaceQuestionsImport}
							className="underline underline-offset-2"
						>
							Import thông minh
						</Link>{' '}
						để tạo bài kèm toàn bộ câu hỏi trong một bước.
					</p>
				) : null}
			</form>
			{dialog}
		</>
	);
}
