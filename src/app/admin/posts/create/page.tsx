'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import TagInput from '@/components/TagInput';
import ThumbnailUpload from '@/components/ThumbnailUpload';
import DualLanguageEditor from '@/components/DualLanguageEditor';
import { POST_CATEGORIES } from '@/constants/post';
import { slugify } from '@/utils/slugify';

const DRAFT_KEY = 'blog-draft-create-v2';

type SaveState =
	| { status: 'idle' }
	| { status: 'saving' }
	| { status: 'saved'; slug: string }
	| { status: 'error'; message: string };

interface DraftData {
	title: string;
	slug: string;
	summary: string;
	category: string;
	tags: string[];
	thumbnailUrl: string;
	chapterNumber: string;
	isPinned: boolean;
	isPublished: boolean;
	content: string;
	contentEn: string;
	savedAt: number;
}

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

export default function CreatePostPage() {
	const [title, setTitle] = useState('');
	const [slug, setSlug] = useState('');
	const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
	const [summary, setSummary] = useState('');
	const [category, setCategory] = useState('Uncategorized');
	const [tags, setTags] = useState<string[]>([]);
	const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
	const [thumbnailUrl, setThumbnailUrl] = useState('');
	const [chapterNumber, setChapterNumber] = useState('');
	const [isPinned, setIsPinned] = useState(false);
	const [isPublished, setIsPublished] = useState(false);
	const [content, setContent] = useState('');
	const [contentEn, setContentEn] = useState('');
	const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });
	const [draftRestored, setDraftRestored] = useState(false);

	const isSavingRef = useRef(false);

	// Word & character count from HTML content
	const plainText = useMemo(() => htmlToPlainText(content), [content]);
	const wordCount = useMemo(() => plainText.split(/\s+/).filter(Boolean).length, [plainText]);
	const charCount = useMemo(() => plainText.length, [plainText]);

	// ─── Restore draft from localStorage on mount ───
	useEffect(() => {
		try {
			const raw = localStorage.getItem(DRAFT_KEY);
			if (!raw) return;
			const draft = JSON.parse(raw) as DraftData;
			if (Date.now() - draft.savedAt > 7 * 24 * 60 * 60 * 1000) {
				localStorage.removeItem(DRAFT_KEY);
				return;
			}
			setTitle(draft.title || '');
			setSlug(draft.slug || '');
			setSummary(draft.summary || '');
			setCategory(draft.category || 'Uncategorized');
			setTags(draft.tags || []);
			setThumbnailUrl(draft.thumbnailUrl || '');
			setChapterNumber(draft.chapterNumber || '');
		setIsPinned(draft.isPinned || false);
		setIsPublished(draft.isPublished || false);
		setContent(draft.content || '');
		setContentEn(draft.contentEn || '');
		if (draft.slug) setSlugManuallyEdited(true);
			setDraftRestored(true);
		} catch {
			/* ignore */
		}
	}, []);

	// ─── Auto-save draft to localStorage every 5s ───
	useEffect(() => {
		if (saveState.status === 'saved') return;
		const timer = setTimeout(() => {
			if (!title.trim() && plainText.length < 20) return;
			const draft: DraftData = {
				title, slug, summary, category, tags, thumbnailUrl, chapterNumber, isPinned, isPublished, content, contentEn,
				savedAt: Date.now(),
			};
			try {
				localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
			} catch {
				/* storage full */
			}
		}, 5000);
		return () => clearTimeout(timer);
	}, [title, slug, summary, category, tags, thumbnailUrl, chapterNumber, isPinned, isPublished, content, contentEn, plainText, saveState.status]);

	// ─── Unsaved changes warning ───
	const hasContent = title.trim().length > 0 || plainText.length > 10;
	useEffect(() => {
		if (!hasContent || saveState.status === 'saved') return;
		function onBeforeUnload(e: BeforeUnloadEvent) {
			e.preventDefault();
		}
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, [hasContent, saveState.status]);

	// ─── Save handler ───
	const onSave = useCallback(async () => {
		if (isSavingRef.current) return;
		isSavingRef.current = true;
		setSaveState({ status: 'saving' });
		try {
			const res = await fetch('/api/posts', {
				method: 'POST',
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
			const data = (json as { data?: unknown }).data;
			const createdSlug =
				typeof data === 'object' && data !== null && typeof (data as { slug?: unknown }).slug === 'string'
					? String((data as { slug?: unknown }).slug)
					: slug;
			setSaveState({ status: 'saved', slug: createdSlug });
			try {
				localStorage.removeItem(DRAFT_KEY);
			} catch {
				/* ignore */
			}
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Unknown error';
			setSaveState({ status: 'error', message });
		} finally {
			isSavingRef.current = false;
		}
	}, [title, slug, summary, content, contentEn, category, tags, thumbnailUrl, chapterNumber, isPinned, isPublished]);

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

	function clearDraft() {
		try {
			localStorage.removeItem(DRAFT_KEY);
		} catch {
			/* ignore */
		}
		setTitle('');
		setSlug('');
		setSlugManuallyEdited(false);
		setSummary('');
		setCategory('Uncategorized');
		setTags([]);
		setThumbnailUrl('');
		setChapterNumber('');
		setIsPinned(false);
		setIsPublished(false);
		setContent('');
		setContentEn('');
		setSaveState({ status: 'idle' });
		setDraftRestored(false);
	}

	return (
		<main className="mx-auto max-w-6xl px-6 py-8">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Viết bài mới</h1>
					<p className="mt-1 text-sm text-foreground-secondary">Soạn thảo WYSIWYG — tự động lưu nháp.</p>
				</div>
				<div className="flex items-center gap-3">
					<Link className="text-sm text-muted underline underline-offset-4 hover:text-foreground" href="/admin/posts">
						← Danh sách
					</Link>
					<button
						onClick={onSave}
						disabled={saveState.status === 'saving' || saveState.status === 'saved'}
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
							'Lưu bài'
						)}
					</button>
				</div>
			</header>

			{/* Draft restored notice */}
			{draftRestored && saveState.status === 'idle' ? (
				<div className="mt-4 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning-subtle px-4 py-2.5 text-sm">
					<svg className="h-4 w-4 shrink-0 text-warning" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
					<span className="text-foreground-secondary">Đã khôi phục bản nháp tự động.</span>
					<button onClick={clearDraft} className="ml-auto text-xs font-medium text-warning underline underline-offset-2 hover:text-foreground">
						Xoá nháp, viết mới
					</button>
				</div>
			) : null}

			{saveState.status === 'error' ? (
				<div className="mt-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error-subtle px-4 py-2.5 text-sm text-error">
					<span>⚠</span> {saveState.message}
				</div>
			) : null}
			{saveState.status === 'saved' ? (
				<div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-success/30 bg-success-subtle px-4 py-2.5 text-sm text-success">
					<span>✓ Đã lưu thành công!</span>
					<Link className="font-medium underline underline-offset-2" href="/admin/posts">
						Về danh sách
					</Link>
					<Link className="font-medium underline underline-offset-2" href={`/bai-viet/${saveState.slug}`} target="_blank">
						Xem bài viết ↗
					</Link>
					<button onClick={clearDraft} className="ml-auto text-xs font-medium underline underline-offset-2">
						Viết bài mới
					</button>
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
						<span className="text-sm font-medium">Xuất bản ngay</span>
						<span className="text-xs text-muted">(Nếu không chọn, bài sẽ ở trạng thái nháp)</span>
					</label>
					<label className="flex items-center gap-2.5">
						<input
							type="checkbox"
							checked={isPinned}
							onChange={(e) => setIsPinned(e.target.checked)}
							className="h-4 w-4 rounded border-border accent-accent"
						/>
						<span className="text-sm font-medium">📌 Ghim</span>
						<span className="text-xs text-muted">(Hiển thị nổi bật trên trang chủ)</span>
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
					placeholderVi="Bắt đầu viết bài tiếng Việt..."
					placeholderEn="Start writing in English..."
				/>
				<div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
					<span>{wordCount.toLocaleString()} từ</span>
					<span>{charCount.toLocaleString()} ký tự</span>
					<span>~{Math.max(1, Math.round(wordCount / 200))} phút đọc</span>
					<span className="ml-auto text-[11px]">
						<kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">⌘S</kbd> lưu nhanh · Nháp tự động lưu mỗi 5s
					</span>
				</div>
			</section>
		</main>
	);
}
