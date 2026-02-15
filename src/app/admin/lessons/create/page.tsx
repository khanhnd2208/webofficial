'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { UnitDTO } from '@/types/unit';

import 'react-markdown-editor-lite/lib/index.css';

const MdEditor = dynamic(() => import('react-markdown-editor-lite'), { ssr: false });

type SaveState =
	| { status: 'idle' }
	| { status: 'saving' }
	| { status: 'saved'; lessonId: string }
	| { status: 'error'; message: string };

export default function AdminCreateLessonPage() {
	const router = useRouter();
	const sp = useSearchParams();
	const courseId = sp.get('courseId') ?? '';
	const initialUnitId = sp.get('unitId') ?? '';
	const cleanedCourseId = String(courseId ?? '').trim();

	const [unitId, setUnitId] = useState(initialUnitId);
	const [unitsState, setUnitsState] = useState<
		| { status: 'loading' }
		| { status: 'loaded'; items: UnitDTO[] }
		| { status: 'error'; message: string }
	>({ status: 'loading' });
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('# Unit 1\n\nNội dung bài học...\n');
	const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });

	useEffect(() => {
		let cancelled = false;
		if (!cleanedCourseId) {
			setUnitsState({ status: 'loaded', items: [] });
			setUnitId('');
			return () => {
				cancelled = true;
			};
		}
		const url = `/api/admin/courses/${encodeURIComponent(cleanedCourseId)}/units`;

		fetch(url)
			.then(async (res) => {
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
				const items = Array.isArray(data)
					? (data
							.map((cu) => (typeof cu === 'object' && cu !== null ? (cu as { unit?: unknown }).unit : null))
							.filter((u): u is UnitDTO => Boolean(u && typeof u === 'object')) as UnitDTO[])
					: [];
				if (!cancelled) {
					setUnitsState({ status: 'loaded', items });
					// Don't override unitId if initialUnitId was provided from URL
					if (!initialUnitId && items.length > 0) {
						setUnitId(items[0].id);
					}
				}
			})
			.catch((e) => {
				if (!cancelled) setUnitsState({ status: 'error', message: e instanceof Error ? e.message : 'Unknown error' });
			});
		return () => {
			cancelled = true;
		};
	}, [cleanedCourseId, initialUnitId]);

	const units = useMemo(() => (unitsState.status === 'loaded' ? unitsState.items : []), [unitsState]);

	async function onSave() {
		if (!cleanedCourseId) {
			setSaveState({ status: 'error', message: 'Missing courseId. Create lesson from Learning page.' });
			return;
		}
		if (!unitId.trim()) {
			setSaveState({ status: 'error', message: 'Missing unitId' });
			return;
		}
		if (!title.trim()) {
			setSaveState({ status: 'error', message: 'Missing title' });
			return;
		}
		setSaveState({ status: 'saving' });
		try {
			const payload = {
				unitId: unitId.trim(),
				title,
				content,
			};

			const res = await fetch('/api/admin/lessons', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
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
			const lessonId =
				typeof data === 'object' && data !== null && typeof (data as { id?: unknown }).id === 'string'
					? String((data as { id?: unknown }).id)
					: '';
			if (!lessonId) throw new Error('Missing lesson id');
			// Refresh router cache before redirect to ensure new lesson is loaded
			router.refresh();
			// Small delay to ensure DB commit and cache clear
			await new Promise(resolve => setTimeout(resolve, 100));
			// Redirect back to learning page to show newly created lesson
			const returnUrl = `/admin/learning?courseId=${encodeURIComponent(cleanedCourseId)}&unitId=${encodeURIComponent(unitId.trim())}`;
			router.push(returnUrl);
		} catch (e) {
			setSaveState({ status: 'error', message: e instanceof Error ? e.message : 'Unknown error' });
		}
	}

	return (
		<main className="mx-auto max-w-6xl px-6 py-10">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Create lesson</h1>
					<p className="mt-2 text-sm text-foreground-secondary">Chọn unit → soạn nội dung → lưu. Từ vựng quản lý riêng (CSV hoặc nhập thủ công).</p>
					{cleanedCourseId ? (
						<p className="mt-1 text-xs text-muted">
							Course context: <span className="font-mono">{cleanedCourseId}</span> (chỉ hiển thị unit thuộc course này).
						</p>
					) : (
						<p className="mt-1 text-xs text-muted">
							Mở trang này từ Learning để chọn course → unit.
						</p>
					)}
				</div>
				<nav className="flex flex-wrap items-center gap-3">
					<Link className="text-sm underline underline-offset-4" href="/dashboard">
						Dashboard
					</Link>
					<Link className="text-sm underline underline-offset-4" href="/admin/learning">
						Learning
					</Link>
					<button
						type="button"
						onClick={() => void onSave()}
						disabled={saveState.status === 'saving'}
						className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
					>
						{saveState.status === 'saving' ? 'Đang lưu…' : 'Save'}
					</button>
				</nav>
			</header>

			{saveState.status === 'error' ? (
				<p className="mt-4 text-sm text-error">Lỗi: {saveState.message}</p>
			) : null}

			{saveState.status === 'saved' ? (
				<div className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm">
					<div className="font-medium">Đã lưu bài học.</div>
					<div className="mt-2 flex flex-wrap gap-4">
						<Link className="underline underline-offset-4" href={`/courses/lessons/${saveState.lessonId}`}>
							Mở bài học (Student View)
						</Link>
						<Link className="underline underline-offset-4" href={`/admin/lessons/${saveState.lessonId}/vocabulary`}>
							Quản lý từ vựng
						</Link>
						{String(courseId ?? '').trim() ? (
							<Link
								className="underline underline-offset-4"
								href={`/admin/learning?courseId=${encodeURIComponent(String(courseId).trim())}&unitId=${encodeURIComponent(unitId.trim())}`}
							>
								← Quay lại Learning
							</Link>
						) : null}
					</div>
					<div className="mt-2 text-xs text-muted">
						Lesson ID: <span className="font-mono">{saveState.lessonId}</span>
					</div>
				</div>
			) : null}

			{!cleanedCourseId ? (
				<section className="mt-8 rounded-lg border border-border bg-surface p-4">
					<div className="text-sm font-medium">Thiếu course context</div>
					<p className="mt-2 text-sm text-foreground-secondary">Để tạo lesson đúng cấu trúc Course → Unit → Lesson, hãy tạo lesson từ trang Learning.</p>
					<div className="mt-3">
						<Link className="text-sm underline underline-offset-4" href="/admin/learning">
							→ Đi tới Learning
						</Link>
					</div>
				</section>
			) : (
				<section className="mt-8 grid gap-4">
				<label className="block">
					<div className="text-sm font-medium">Unit</div>
					{unitsState.status === 'loading' ? <p className="mt-2 text-sm text-foreground-secondary">Đang tải units…</p> : null}
					{unitsState.status === 'error' ? <p className="mt-2 text-sm text-error">Lỗi: {unitsState.message}</p> : null}
					{unitsState.status === 'loaded' ? (
						units.length === 0 ? (
							<p className="mt-2 text-sm text-foreground-secondary">
								Chưa có unit trong course này. Hãy tạo unit trong trang{' '}
								<Link className="underline underline-offset-4" href={String(courseId ?? '').trim() ? `/admin/learning?courseId=${encodeURIComponent(String(courseId).trim())}` : '/admin/learning'}>
									Learning
								</Link>
								.
							</p>
						) : (
						<select
							value={unitId}
							onChange={(e) => setUnitId(e.target.value)}
							className="mt-2 w-full rounded-md border border-border-hover bg-background px-3 py-2 text-sm"
						>
							{units.map((u) => (
								<option key={u.id} value={u.id}>
									{u.name}
								</option>
							))}
						</select>
						)
					) : null}
				</label>

				<label className="block">
					<div className="text-sm font-medium">Title</div>
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="mt-2 w-full rounded-md border border-border-hover bg-background px-3 py-2 text-sm"
						placeholder='Unit 1: Tại sân bay'
						required
					/>
				</label>
				</section>
			)}

			<section className="mt-6">
				<div className="rounded-lg border border-border">
					<MdEditor
						value={content}
						onChange={({ text }: { text: string }) => setContent(text)}
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
						style={{ height: '520px' }}
						view={{ menu: true, md: true, html: true }}
						canView={{ menu: true, md: true, html: true, both: true, fullScreen: true, hideMenu: true }}
					/>
				</div>
				<p className="mt-2 text-xs text-muted">Preview nội dung Markdown phía trên.</p>
			</section>

			<footer className="mt-10 rounded-lg border border-border bg-surface p-4 text-sm text-foreground-secondary">
				<div className="font-medium text-foreground">Preview</div>
				<div className="mt-1">Title: {title || '—'}</div>
			</footer>
		</main>
	);
}
