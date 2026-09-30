'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';

import TiptapEditor from '@/components/TiptapEditor';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { FormField } from '@/components/ui/FormField';
import { routes } from '@/config/routes';
import { adminFetch } from '@/lib/admin/client';
import type { LessonDTO, PublishStatus } from '@/features/courses/types';

type EditorPayload = {
	lesson: LessonDTO;
	moduleId: string;
	moduleName: string;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
	return adminFetch<T>(url, init);
}

export default function LessonEditor({
	courseId,
	initial,
}: {
	courseId: string;
	initial: EditorPayload;
}) {
	const router = useRouter();
	const [title, setTitle] = useState(initial.lesson.title);
	const [slug, setSlug] = useState(initial.lesson.slug);
	const [videoUrl, setVideoUrl] = useState(initial.lesson.videoUrl ?? '');
	const [contentHtml, setContentHtml] = useState(initial.lesson.contentHtml);
	const [status, setStatus] = useState<PublishStatus>(initial.lesson.status);
	const [tab, setTab] = useState<'edit' | 'preview'>('edit');
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [fields, setFields] = useState<Record<string, string>>({});
	const [confirmPublish, setConfirmPublish] = useState(false);

	const dirty =
		title !== initial.lesson.title ||
		slug !== initial.lesson.slug ||
		videoUrl !== (initial.lesson.videoUrl ?? '') ||
		contentHtml !== initial.lesson.contentHtml ||
		status !== initial.lesson.status;

	useEffect(() => {
		function onBeforeUnload(e: BeforeUnloadEvent) {
			if (!dirty) return;
			e.preventDefault();
			e.returnValue = '';
		}
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, [dirty]);

	const save = useCallback(
		async (nextStatus?: PublishStatus) => {
			setBusy(true);
			setError(null);
			setFields({});
			setMessage(null);
			try {
				const updated = await api<LessonDTO>(
					`/api/admin/courses/${courseId}/modules/${initial.moduleId}/lessons/${initial.lesson.id}`,
					{
						method: 'PATCH',
						body: JSON.stringify({
							title,
							slug,
							videoUrl: videoUrl.trim() || null,
							contentHtml,
							status: nextStatus ?? status,
						}),
					},
				);
				setStatus(updated.status);
				setSlug(updated.slug);
				setMessage('Đã lưu bài học');
				setConfirmPublish(false);
				router.refresh();
			} catch (err) {
				const e = err as Error & { fields?: Record<string, string> };
				setError(e.message);
				if (e.fields) setFields(e.fields);
			} finally {
				setBusy(false);
			}
		},
		[
			courseId,
			contentHtml,
			initial.lesson.id,
			initial.moduleId,
			router,
			slug,
			status,
			title,
			videoUrl,
		],
	);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
				e.preventDefault();
				void save();
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [save]);

	const previewHtml = DOMPurify.sanitize(contentHtml, { USE_PROFILES: { html: true } });

	return (
		<div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<Link
						href={routes.admin.courseEdit(courseId)}
						className="text-xs font-semibold uppercase tracking-widest text-muted hover:text-foreground"
					>
						← Quay lại khóa học
					</Link>
					<p className="mt-2 text-xs uppercase tracking-widest text-muted">{initial.moduleName}</p>
					<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">
						Biên soạn bài học
					</h1>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button type="button" variant="secondary" disabled={busy} onClick={() => void save()}>
						Lưu
					</Button>
					{status !== 'PUBLISHED' ? (
						<Button type="button" disabled={busy} onClick={() => setConfirmPublish(true)}>
							Xuất bản
						</Button>
					) : (
						<Button
							type="button"
							variant="ghost"
							disabled={busy}
							onClick={() => void save('DRAFT')}
						>
							Về nháp
						</Button>
					)}
				</div>
			</div>

			{error ? (
				<p
					className="rounded-lg border border-error/40 bg-error-subtle px-3 py-2 text-sm text-error"
					role="alert"
				>
					{error}
				</p>
			) : null}
			{message ? <p className="text-sm text-success">{message}</p> : null}
			{dirty ? <p className="text-xs text-warning">Có thay đổi chưa lưu</p> : null}

			<div className="flex gap-2 border-b border-border">
				{(['edit', 'preview'] as const).map((t) => (
					<button
						key={t}
						type="button"
						onClick={() => setTab(t)}
						aria-pressed={tab === t}
						className={`min-h-11 px-4 text-sm font-semibold ${
							tab === t ? 'border-b-2 border-foreground text-foreground' : 'text-muted'
						}`}
					>
						{t === 'edit' ? 'Soạn thảo' : 'Xem trước'}
					</button>
				))}
			</div>

			{tab === 'edit' ? (
				<div className="space-y-4">
					<FormField id="lesson-title" label="Tiêu đề" required error={fields.title}>
						<input id="lesson-title" value={title} onChange={(e) => setTitle(e.target.value)} />
					</FormField>
					<FormField id="lesson-slug" label="Slug" error={fields.slug}>
						<input id="lesson-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
					</FormField>
					<FormField
						id="lesson-video"
						label="Video URL"
						error={fields.videoUrl}
						hint="YouTube hoặc URL video hợp lệ (tuỳ chọn nếu có nội dung)."
					>
						<input
							id="lesson-video"
							type="url"
							value={videoUrl}
							onChange={(e) => setVideoUrl(e.target.value)}
							placeholder="https://"
						/>
					</FormField>
					<div>
						<p className="mb-1.5 text-sm font-semibold text-foreground">Nội dung</p>
						{fields.contentHtml ? (
							<p className="mb-2 text-xs text-error" role="alert">
								{fields.contentHtml}
							</p>
						) : null}
						<TiptapEditor
							content={contentHtml}
							onChange={setContentHtml}
							placeholder="Nội dung bài học..."
						/>
					</div>
					<label className="block max-w-xs">
						<span className="text-sm font-semibold text-foreground">Trạng thái</span>
						<select
							value={status}
							onChange={(e) => setStatus(e.target.value as PublishStatus)}
							className="mt-1.5 min-h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-sm"
						>
							<option value="DRAFT">Nháp</option>
							<option value="PUBLISHED">Đã xuất bản</option>
							<option value="ARCHIVED">Lưu trữ</option>
						</select>
					</label>
				</div>
			) : (
				<article className="prose prose-neutral dark:prose-invert max-w-none rounded-lg border border-border bg-surface p-6">
					<h2 className="!mt-0 font-display text-2xl font-medium">{title || 'Chưa có tiêu đề'}</h2>
					{videoUrl ? (
						<p className="text-sm">
							<a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-accent">
								Mở video
							</a>
						</p>
					) : null}
					{previewHtml ? (
						<div className="tiptap-content" dangerouslySetInnerHTML={{ __html: previewHtml }} />
					) : (
						<p className="text-sm text-muted">Chưa có nội dung.</p>
					)}
				</article>
			)}

			<Dialog
				open={confirmPublish}
				onClose={() => setConfirmPublish(false)}
				title="Xuất bản bài học?"
				description="Bài học cần tiêu đề và nội dung hoặc video hợp lệ."
			>
				<div className="flex flex-wrap justify-end gap-2">
					<Button type="button" variant="secondary" onClick={() => setConfirmPublish(false)}>
						Hủy
					</Button>
					<Button type="button" disabled={busy} onClick={() => void save('PUBLISHED')}>
						Xuất bản
					</Button>
				</div>
			</Dialog>
		</div>
	);
}
