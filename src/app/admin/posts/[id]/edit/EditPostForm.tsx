'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import TagInput from '@/components/TagInput';
import ThumbnailUpload from '@/components/ThumbnailUpload';
import DualLanguageEditor from '@/components/DualLanguageEditor';
import { POST_CATEGORIES } from '@/constants/post';
import { slugify } from '@/utils/slugify';

type AdminPost = {
	id: string;
	title: string;
	slug: string;
	summary: string;
	content: string;
	contentEn?: string;
	contentFormat?: 'markdown' | 'html';
	category: string;
	tags: string[];
	thumbnailUrl?: string;
	chapterNumber?: number;
	isPinned?: boolean;
	isPublished: boolean;
};

type SaveState =
	| { status: 'idle' }
	| { status: 'saving' }
	| { status: 'saved' }
	| { status: 'error'; message: string };

/** Strip HTML tags to get plain text for word count */
function htmlToPlainText(html: string): string {
	return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function uploadImage(file: File): Promise<string> {
	const fd = new FormData();
	fd.append('file', file);
	const res = await fetch('/api/uploads', { method: 'POST', body: fd });
	const json = (await res.json()) as unknown;
	const ok = typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true;
	if (!res.ok || !ok) {
		const message =
			typeof json === 'object' && json !== null && typeof (json as { error?: unknown }).error === 'string'
				? String((json as { error?: unknown }).error)
				: `HTTP ${res.status}`;
		throw new Error(message);
	}
	const data = (json as { data?: unknown }).data;
	const url =
		typeof data === 'object' && data !== null && typeof (data as { url?: unknown }).url === 'string'
			? String((data as { url?: unknown }).url)
			: '';
	if (!url) throw new Error('Upload failed');
	return url;
}

export default function EditPostForm({ initial }: { initial: AdminPost }) {
	const [title, setTitle] = useState(initial.title);
	const [slug, setSlug] = useState(initial.slug);
	const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
	const [summary, setSummary] = useState(initial.summary);
	const [category, setCategory] = useState(initial.category || 'Uncategorized');
	const [tags, setTags] = useState<string[]>(initial.tags);
	const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
	const [thumbnailUrl, setThumbnailUrl] = useState(initial.thumbnailUrl ?? '');
	const [chapterNumber, setChapterNumber] = useState(initial.chapterNumber != null ? String(initial.chapterNumber) : '');
	const [isPinned, setIsPinned] = useState(Boolean(initial.isPinned));
	const [isPublished, setIsPublished] = useState(Boolean(initial.isPublished));
	const [content, setContent] = useState(initial.content);
	const [contentEn, setContentEn] = useState(initial.contentEn ?? '');
	const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });

	// For legacy markdown posts, the content is stored as markdown.
	// The editor always outputs HTML from now on.
	// When editing a markdown post, the editor receives the raw markdown as initial content
	// and Tiptap will render it as best-effort text; saving will convert it to HTML format.
	const isLegacyMarkdown = (initial.contentFormat ?? 'markdown') === 'markdown';

	const isSavingRef = useRef(false);

	// Word & character count from HTML content
	const plainText = useMemo(() => htmlToPlainText(content), [content]);
	const wordCount = useMemo(() => plainText.split(/\s+/).filter(Boolean).length, [plainText]);
	const charCount = useMemo(() => plainText.length, [plainText]);

	// Track dirty state for unsaved changes warning
	const isDirty = useMemo(() => {
		if (saveState.status === 'saved') return false;
		return (
			title !== initial.title ||
			content !== initial.content ||
			contentEn !== (initial.contentEn ?? '') ||
			summary !== initial.summary ||
			category !== (initial.category || 'Uncategorized') ||
			JSON.stringify(tags) !== JSON.stringify(initial.tags) ||
			thumbnailUrl !== (initial.thumbnailUrl ?? '') ||
			chapterNumber !== (initial.chapterNumber != null ? String(initial.chapterNumber) : '') ||
			isPinned !== Boolean(initial.isPinned) ||
			isPublished !== Boolean(initial.isPublished)
		);
	}, [title, content, contentEn, summary, category, tags, thumbnailUrl, chapterNumber, isPinned, isPublished, saveState.status, initial]);

	useEffect(() => {
		if (!isDirty) return;
		function onBeforeUnload(e: BeforeUnloadEvent) {
			e.preventDefault();
		}
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, [isDirty]);

	// ─── Save handler ───
	const onSave = useCallback(async () => {
		if (isSavingRef.current) return;
		isSavingRef.current = true;
		setSaveState({ status: 'saving' });
		try {
			const res = await fetch(`/api/admin/posts/${initial.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title, slug, summary, content, contentEn, category, tags,
					contentFormat: 'html',
					thumbnailUrl: thumbnailUrl || undefined,
					chapterNumber: chapterNumber ? Number(chapterNumber) : undefined,
					isPinned,
					isPublished,
				}),
			});
			const json = (await res.json()) as unknown;
			const ok = typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true;
			if (!res.ok || !ok) {
				const message =
					typeof json === 'object' && json !== null && typeof (json as { error?: unknown }).error === 'string'
						? String((json as { error?: unknown }).error)
						: `HTTP ${res.status}`;
				throw new Error(message);
			}
			setSaveState({ status: 'saved' });
			// Auto-clear saved status after 3s so user can edit & save again
			setTimeout(() => setSaveState((prev) => (prev.status === 'saved' ? { status: 'idle' } : prev)), 3000);
		} catch (e) {
			setSaveState({ status: 'error', message: e instanceof Error ? e.message : 'Unknown error' });
		} finally {
			isSavingRef.current = false;
		}
	}, [title, slug, summary, content, contentEn, category, tags, thumbnailUrl, chapterNumber, isPinned, isPublished, initial.id]);

	// ─── Cmd+S / Ctrl+S keyboard shortcut ───
	useEffect(() => {
		function handleSave(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === 's') {
				e.preventDefault();
				void onSave();
			}
		}
		window.addEventListener('keydown', handleSave);
		return () => window.removeEventListener('keydown', handleSave);
	}, [onSave]);

	useEffect(() => {
		if (slugManuallyEdited) return;
		setSlug(slugify(title));
	}, [title, slugManuallyEdited]);

	// Fetch existing tags for suggestions
	useEffect(() => {
		void (async () => {
			try {
				const res = await fetch('/api/posts/tags');
				const json = (await res.json()) as unknown;
				if (typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true) {
					const data = (json as { data?: string[] }).data;
					if (Array.isArray(data)) setTagSuggestions(data);
				}
			} catch {
				/* ignore */
			}
		})();
	}, []);

	return (
		<main className="mx-auto max-w-6xl px-6 py-8">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa bài viết</h1>
					<p className="mt-1 text-sm text-muted font-mono">ID: {initial.id}</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<Link className="text-sm text-muted underline underline-offset-4 hover:text-foreground" href="/admin/posts">
						← Danh sách
					</Link>
					<Link className="text-sm text-muted underline underline-offset-4 hover:text-foreground" href="/admin/posts/create">
						+ Viết mới
					</Link>
					{isPublished ? (
						<Link className="text-sm text-muted underline underline-offset-4 hover:text-foreground" href={`/bai-viet/${slug}`} target="_blank">
							Xem public ↗
						</Link>
					) : null}
					<button
						onClick={onSave}
						disabled={saveState.status === 'saving'}
						className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
						title="⌘S"
					>
						{saveState.status === 'saving' ? (
							<>
								<span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
								Đang lưu…
							</>
						) : saveState.status === 'saved' ? (
							'✓ Đã lưu'
						) : (
							'Lưu thay đổi'
						)}
					</button>
				</div>
			</header>

			{/* Status messages */}
			{saveState.status === 'error' ? (
				<div className="mt-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error-subtle px-4 py-2.5 text-sm text-error">
					<span>⚠</span> {saveState.message}
				</div>
			) : null}
			{saveState.status === 'saved' ? (
				<div className="mt-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success-subtle px-4 py-2.5 text-sm text-success">
					<span>✓</span> Đã lưu thành công.
				</div>
			) : null}
			{isDirty && saveState.status !== 'saving' ? (
				<div className="mt-2 flex items-center gap-1.5 text-xs text-warning">
					<span className="inline-block h-1.5 w-1.5 rounded-full bg-warning" />
					Có thay đổi chưa lưu
				</div>
			) : null}
			{isLegacyMarkdown ? (
				<div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-300/30 bg-blue-50 px-4 py-2.5 text-sm text-blue-700 dark:border-blue-500/20 dark:bg-blue-950/30 dark:text-blue-300">
					<svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" /></svg>
					Bài viết này đang ở định dạng Markdown cũ. Khi lưu, nội dung sẽ được chuyển sang HTML.
				</div>
			) : null}

			<section className="mt-6 grid gap-4 md:grid-cols-2">
				<label className="block">
					<div className="text-xs font-semibold uppercase tracking-wider text-muted">Tiêu đề</div>
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
						placeholder="Tiêu đề bài viết"
					/>
				</label>

				<label className="block">
					<div className="text-xs font-semibold uppercase tracking-wider text-muted">Slug</div>
					<input
						value={slug}
						onChange={(e) => {
							setSlugManuallyEdited(true);
							setSlug(slugify(e.target.value));
						}}
						className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-accent"
						placeholder="tieu-de-bai-viet"
					/>
					<p className="mt-1 text-[11px] text-muted">Tự động từ tiêu đề. Chỉnh để tuỳ chỉnh URL.</p>
				</label>

				<label className="block md:col-span-2">
					<div className="text-xs font-semibold uppercase tracking-wider text-muted">Tóm tắt <span className="text-muted/60 normal-case tracking-normal">(tuỳ chọn)</span></div>
					<textarea
						value={summary}
						onChange={(e) => setSummary(e.target.value)}
						className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
						rows={2}
						placeholder="Mô tả ngắn cho SEO (không bắt buộc)"
					/>
				</label>

				<label className="block">
					<div className="text-xs font-semibold uppercase tracking-wider text-muted">Chủ đề</div>
					<select
						value={category}
						onChange={(e) => setCategory(e.target.value)}
						className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
					>
						{POST_CATEGORIES.map((c) => (
							<option key={c} value={c}>{c}</option>
						))}
					</select>
				</label>

				<label className="block">
					<div className="text-xs font-semibold uppercase tracking-wider text-muted">Chapter Number</div>
					<input
						type="number"
						min="1"
						value={chapterNumber}
						onChange={(e) => setChapterNumber(e.target.value)}
						className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
						placeholder="VD: 1, 2, 3..."
					/>
					<p className="mt-1 text-[11px] text-muted">Số thứ tự chapter. Hiển thị dạng &quot;Chapter 1&quot;, &quot;Chapter 2&quot;…</p>
				</label>

				<div className="block">
					<div className="text-xs font-semibold uppercase tracking-wider text-muted">Tags</div>
					<div className="mt-1.5">
						<TagInput tags={tags} onChange={setTags} suggestions={tagSuggestions} />
					</div>
				</div>

				<ThumbnailUpload value={thumbnailUrl} onChange={setThumbnailUrl} />

				<div className="flex flex-wrap items-center gap-x-6 gap-y-3 md:col-span-2">
					<label className="flex items-center gap-2.5">
						<input
							type="checkbox"
							checked={isPublished}
							onChange={(e) => setIsPublished(e.target.checked)}
							className="h-4 w-4 rounded border-border accent-accent"
						/>
						<span className="text-sm font-medium">Xuất bản</span>
						{isPublished ? (
							<span className="rounded-full bg-success-subtle px-2 py-0.5 text-[10px] font-bold text-success">LIVE</span>
						) : (
							<span className="rounded-full bg-warning-subtle px-2 py-0.5 text-[10px] font-bold text-warning">DRAFT</span>
						)}
					</label>
					<label className="flex items-center gap-2.5">
						<input
							type="checkbox"
							checked={isPinned}
							onChange={(e) => setIsPinned(e.target.checked)}
							className="h-4 w-4 rounded border-border accent-accent"
						/>
						<span className="text-sm font-medium">📌 Ghim</span>
						{isPinned ? (
							<span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">PINNED</span>
						) : null}
					</label>
				</div>
			</section>

			<section className="mt-6">
				<DualLanguageEditor
					contentVi={content}
					contentEn={contentEn}
					onChangeVi={setContent}
					onChangeEn={setContentEn}
					onImageUpload={uploadImage}
					placeholderVi="Nội dung tiếng Việt..."
					placeholderEn="English content..."
				/>
				<div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
					<span>{wordCount.toLocaleString()} từ</span>
					<span>{charCount.toLocaleString()} ký tự</span>
					<span>~{Math.max(1, Math.round(wordCount / 200))} phút đọc</span>
					{isDirty ? (
						<span className="flex items-center gap-1 text-warning">
							<span className="inline-block h-1.5 w-1.5 rounded-full bg-warning" />
							Chưa lưu
						</span>
					) : saveState.status === 'saved' ? (
						<span className="text-success">✓ Đã lưu</span>
					) : null}
					<span className="ml-auto text-[11px]">
						<kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">⌘S</kbd> lưu nhanh
					</span>
				</div>
			</section>
		</main>
	);
}
