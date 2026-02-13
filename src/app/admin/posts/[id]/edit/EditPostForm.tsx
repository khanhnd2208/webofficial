'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { slugify } from '@/utils/slugify';

import 'react-markdown-editor-lite/lib/index.css';

const MdEditor = dynamic(() => import('react-markdown-editor-lite'), { ssr: false });

type AdminPost = {
	id: string;
	title: string;
	slug: string;
	summary: string;
	content: string;
	tags: string[];
	thumbnailUrl?: string;
	isPublished: boolean;
};

type SaveState =
	| { status: 'idle' }
	| { status: 'saving' }
	| { status: 'saved' }
	| { status: 'error'; message: string };

export default function EditPostForm({ initial }: { initial: AdminPost }) {
	const [title, setTitle] = useState(initial.title);
	const [slug, setSlug] = useState(initial.slug);
	const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
	const [summary, setSummary] = useState(initial.summary);
	const [tagsText, setTagsText] = useState(initial.tags.join(', '));
	const [thumbnailUrl, setThumbnailUrl] = useState(initial.thumbnailUrl ?? '');
	const [isPublished, setIsPublished] = useState(Boolean(initial.isPublished));
	const [content, setContent] = useState(initial.content);
	const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });

	useEffect(() => {
		if (slugManuallyEdited) return;
		setSlug(slugify(title));
	}, [title, slugManuallyEdited]);

	const tags = useMemo(() => {
		return Array.from(
			new Set(
				tagsText
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean)
			)
		);
	}, [tagsText]);

	async function onSave() {
		setSaveState({ status: 'saving' });
		try {
			const res = await fetch(`/api/admin/posts/${initial.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title,
					slug,
					summary,
					content,
					tags,
					thumbnailUrl: thumbnailUrl || undefined,
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
		} catch (e) {
			setSaveState({ status: 'error', message: e instanceof Error ? e.message : 'Unknown error' });
		}
	}

	return (
		<main className="mx-auto max-w-6xl bg-white px-6 py-10">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Sửa bài viết</h1>
					<p className="mt-2 text-sm text-foreground/70">ID: {initial.id}</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<Link className="text-sm underline underline-offset-4" href="/admin/posts">
						← Danh sách
					</Link>
					<Link className="text-sm underline underline-offset-4" href="/admin/posts/create">
						+ Tạo bài
					</Link>
					<Link className="text-sm underline underline-offset-4" href="/blog">
						Blog
					</Link>
					{isPublished ? (
						<Link className="text-sm underline underline-offset-4" href={`/blog/${slug}`}>
							Xem public
						</Link>
					) : null}
					<button
						onClick={onSave}
						disabled={saveState.status === 'saving'}
						className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
					>
						{saveState.status === 'saving' ? 'Đang lưu…' : 'Lưu thay đổi'}
					</button>
				</div>
			</header>

			{saveState.status === 'error' ? (
				<p className="mt-4 text-sm text-red-600">Lỗi: {saveState.message}</p>
			) : null}
			{saveState.status === 'saved' ? (
				<p className="mt-4 text-sm text-foreground/70">Đã lưu.</p>
			) : null}

			<section className="mt-8 grid gap-4 md:grid-cols-2">
				<label className="block">
					<div className="text-sm font-medium">Title</div>
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="mt-2 w-full rounded-md border border-foreground/15 px-3 py-2 text-sm"
						placeholder="Tiêu đề bài viết"
					/>
				</label>

				<label className="block">
					<div className="text-sm font-medium">Slug</div>
					<input
						value={slug}
						onChange={(e) => {
							setSlugManuallyEdited(true);
							setSlug(slugify(e.target.value));
						}}
						className="mt-2 w-full rounded-md border border-foreground/15 px-3 py-2 text-sm"
						placeholder="hoc-lap-trinh-nextjs"
					/>
					<p className="mt-1 text-xs text-foreground/60">Tự động sinh từ Title (có thể chỉnh).</p>
				</label>

				<label className="block md:col-span-2">
					<div className="text-sm font-medium">Summary</div>
					<textarea
						value={summary}
						onChange={(e) => setSummary(e.target.value)}
						className="mt-2 w-full rounded-md border border-foreground/15 px-3 py-2 text-sm"
						rows={2}
						placeholder="Tóm tắt ngắn (SEO + trang danh sách)"
					/>
				</label>

				<label className="block">
					<div className="text-sm font-medium">Tags (comma separated)</div>
					<input
						value={tagsText}
						onChange={(e) => setTagsText(e.target.value)}
						className="mt-2 w-full rounded-md border border-foreground/15 px-3 py-2 text-sm"
						placeholder="NextJS, React, Career"
					/>
					{tags.length > 0 ? (
						<p className="mt-1 text-xs text-foreground/60">Tags: {tags.join(', ')}</p>
					) : null}
				</label>

				<label className="block">
					<div className="text-sm font-medium">Thumbnail URL</div>
					<input
						value={thumbnailUrl}
						onChange={(e) => setThumbnailUrl(e.target.value)}
						className="mt-2 w-full rounded-md border border-foreground/15 px-3 py-2 text-sm"
						placeholder="https://..."
					/>
				</label>

				<label className="flex items-center gap-2 md:col-span-2">
					<input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
					<span className="text-sm">Publish (isPublished)</span>
				</label>
			</section>

			<section className="mt-8">
				<div className="rounded-lg border border-foreground/10">
					<MdEditor
						value={content}
						onChange={({ text }: { text: string }) => setContent(text)}
						onImageUpload={async (file: File) => {
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
						}}
						renderHTML={(text: string) => (
							<div className="prose prose-sm max-w-none">
								<ReactMarkdown
									remarkPlugins={[remarkGfm]}
									components={{
										img: (props) => {
											const src = typeof props.src === 'string' ? props.src.trim() : '';
											if (!src) return null;
											return <img {...props} src={src} alt={props.alt ?? ''} loading="lazy" />;
										},
									}}
								>
									{text}
								</ReactMarkdown>
							</div>
						)}
						style={{ height: '560px' }}
						view={{ menu: true, md: true, html: true }}
						canView={{ menu: true, md: true, html: true, both: true, fullScreen: true, hideMenu: true }}
					/>
				</div>
			</section>
		</main>
	);
}
