'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const TiptapEditor = dynamic(() => import('@/components/TiptapEditor'), { ssr: false });

type SaveState =
	| { status: 'idle' }
	| { status: 'loading' }
	| { status: 'saving' }
	| { status: 'saved' }
	| { status: 'error'; message: string };

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

export default function AdminFeedbackPage() {
	const [title, setTitle] = useState('Phản hồi');
	const [content, setContent] = useState('');
	const [isPublished, setIsPublished] = useState(true);
	const [saveState, setSaveState] = useState<SaveState>({ status: 'loading' });
	const isSavingRef = useRef(false);

	// Load feedback page data on mount
	useEffect(() => {
		void (async () => {
			try {
				const res = await fetch('/api/admin/feedback');
				const json = (await res.json()) as unknown;
				if (typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true) {
					const data = (json as { data?: { title?: string; content?: string; isPublished?: boolean } }).data;
					if (data) {
						setTitle(data.title ?? 'Phản hồi');
						setContent(data.content ?? '');
						setIsPublished(data.isPublished ?? true);
					}
				}
			} catch {
				/* ignore */
			} finally {
				setSaveState({ status: 'idle' });
			}
		})();
	}, []);

	const onSave = useCallback(async () => {
		if (isSavingRef.current) return;
		isSavingRef.current = true;
		setSaveState({ status: 'saving' });
		try {
			const res = await fetch('/api/admin/feedback', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, content, isPublished }),
			});
			const json = (await res.json()) as unknown;
			if (typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok !== true) {
				const errMsg =
					typeof json === 'object' && json !== null && typeof (json as { error?: unknown }).error === 'string'
						? String((json as { error?: unknown }).error)
						: 'Lưu thất bại';
				setSaveState({ status: 'error', message: errMsg });
			} else {
				setSaveState({ status: 'saved' });
			}
		} catch (e) {
			setSaveState({ status: 'error', message: e instanceof Error ? e.message : 'Lưu thất bại' });
		} finally {
			isSavingRef.current = false;
		}
	}, [title, content, isPublished]);

	// Cmd+S / Ctrl+S
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

	const plainText = useMemo(
		() => content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
		[content],
	);
	const wordCount = useMemo(() => plainText.split(/\s+/).filter(Boolean).length, [plainText]);

	if (saveState.status === 'loading') {
		return (
			<main className="mx-auto max-w-6xl px-6 py-8">
				<div className="flex items-center gap-2 text-sm text-muted">
					<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
					</svg>
					Đang tải…
				</div>
			</main>
		);
	}

	return (
		<main className="mx-auto max-w-6xl px-6 py-8">
			{/* Header */}
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<Link href="/admin" className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground">
						← Admin
					</Link>
					<h1 className="mt-2 text-2xl font-bold tracking-tight">Trang Phản hồi</h1>
					<p className="mt-1 text-sm text-foreground-secondary">
						Soạn nội dung trang phản hồi — thêm text, link, ảnh, bảng, v.v.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Link
						href="/feedback"
						target="_blank"
						className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
					>
						Xem trang ↗
					</Link>
					<button
						onClick={onSave}
						disabled={saveState.status === 'saving'}
						className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
					>
						{saveState.status === 'saving' ? (
							<>
								<span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
								Đang lưu…
							</>
						) : (
							<>
								<span>Lưu</span>
								<kbd className="ml-1 hidden rounded border border-accent-foreground/20 px-1 py-0.5 font-mono text-[10px] sm:inline-block">⌘S</kbd>
							</>
						)}
					</button>
				</div>
			</header>

			{/* Status messages */}
			{saveState.status === 'error' ? (
				<div className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
					{saveState.message}
				</div>
			) : null}
			{saveState.status === 'saved' ? (
				<div className="mt-4 rounded-lg bg-success-subtle px-4 py-3 text-sm text-success">
					Đã lưu thành công!
				</div>
			) : null}

			{/* Settings bar */}
			<div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4">
				<label className="flex-1">
					<span className="text-xs font-semibold uppercase tracking-wider text-muted">Tiêu đề trang</span>
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="mt-1.5 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-accent"
						placeholder="Phản hồi"
					/>
				</label>
				<label className="flex items-center gap-2">
					<input
						type="checkbox"
						checked={isPublished}
						onChange={(e) => setIsPublished(e.target.checked)}
						className="h-4 w-4 rounded border-border text-accent accent-accent"
					/>
					<span className="text-sm text-foreground-secondary">Công khai</span>
				</label>
				<div className="text-xs text-muted">
					{wordCount} từ
				</div>
			</div>

			{/* Editor */}
			<div className="mt-4 min-h-[500px] rounded-xl border border-border bg-surface">
				<TiptapEditor
					content={content}
					onChange={setContent}
					onImageUpload={uploadImage}
				/>
			</div>
		</main>
	);
}
