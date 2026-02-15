'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { LessonVocabularyItemDTO } from '@/types/lessonVocabulary';

type LoadState =
	| { status: 'loading' }
	| { status: 'loaded'; items: LessonVocabularyItemDTO[] }
	| { status: 'error'; message: string };

type UploadState =
	| { status: 'idle' }
	| { status: 'uploading' }
	| {
			status: 'uploaded';
			records: number;
			total: number;
			upserted: number;
			invalidRows: number;
			invalidSamples: string[];
	  }
	| { status: 'cleared'; deleted: number }
	| { status: 'error'; message: string; details: string[] };

type ApiResponseOk<T> = { ok: true; data: T };
type ApiResponseErr = { ok: false; error: string; details?: string[] };
type ApiResponse<T> = ApiResponseOk<T> | ApiResponseErr;

export default function AdminLessonVocabularyPage() {
	const routeParams = useParams();
	const lessonIdRaw = routeParams?.id;
	const lessonId = typeof lessonIdRaw === 'string' ? lessonIdRaw : Array.isArray(lessonIdRaw) ? lessonIdRaw[0] ?? '' : '';

	const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
	const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });
	const [file, setFile] = useState<File | null>(null);
	const [replaceExisting, setReplaceExisting] = useState(false);
	const [manual, setManual] = useState<{ word: string; partOfSpeech: string; meaningVi: string; meaningEn: string }>(
		{ word: '', partOfSpeech: '', meaningVi: '', meaningEn: '' },
	);
	const [manualState, setManualState] = useState<
		| { status: 'idle' }
		| { status: 'saving' }
		| { status: 'saved'; total: number }
		| { status: 'error'; message: string }
	>({ status: 'idle' });

	const loadItems = useCallback(
		async (signal?: AbortSignal) => {
			if (!lessonId) return;
			setLoadState({ status: 'loading' });
			try {
				const res = await fetch(`/api/admin/lessons/${encodeURIComponent(lessonId)}/vocabulary`, { signal });
				const json = (await res.json()) as ApiResponse<unknown>;
				if (!res.ok || !json.ok) {
					const message = !json.ok && typeof json.error === 'string' ? json.error : `HTTP ${res.status}`;
					throw new Error(message);
				}
				const items = Array.isArray(json.data) ? (json.data as LessonVocabularyItemDTO[]) : [];
				setLoadState({ status: 'loaded', items });
			} catch (e) {
				if (signal?.aborted) return;
				setLoadState({ status: 'error', message: e instanceof Error ? e.message : 'Unknown error' });
			}
		},
		[lessonId],
	);

	useEffect(() => {
		if (!lessonId) return;
		const controller = new AbortController();
		void loadItems(controller.signal);
		return () => controller.abort();
	}, [lessonId, loadItems]);

	const items = loadState.status === 'loaded' ? loadState.items : [];
	const sampleCsv = useMemo(() => {
		return 'word,partOfSpeech,meaningVi,meaningEn\nhello,interjection,xin chào,hello\n';
	}, []);
	const sampleCsvHref = useMemo(() => {
		return `data:text/csv;charset=utf-8,${encodeURIComponent(sampleCsv)}`;
	}, [sampleCsv]);

	async function onManualSave() {
		if (!lessonId) return;
		setManualState({ status: 'saving' });
		try {
			const word = manual.word.trim();
			const meaningVi = manual.meaningVi.trim();
			const meaningEn = manual.meaningEn.trim();
			if (!word || !meaningVi || !meaningEn) {
				setManualState({ status: 'error', message: 'Thiếu trường bắt buộc: word, meaningVi, meaningEn' });
				return;
			}
			const res = await fetch(`/api/admin/lessons/${encodeURIComponent(lessonId)}/vocabulary`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					word,
					partOfSpeech: manual.partOfSpeech,
					meaningVi,
					meaningEn,
				}),
			});
			const json = (await res.json()) as ApiResponse<unknown>;
			if (!res.ok || !json.ok) {
				const message = !json.ok && typeof json.error === 'string' ? json.error : `HTTP ${res.status}`;
				setManualState({ status: 'error', message });
				return;
			}
			const data = json.data as { total?: unknown };
			const total = typeof data?.total === 'number' ? data.total : 0;
			setManualState({ status: 'saved', total });
			setManual({ word: '', partOfSpeech: '', meaningVi: '', meaningEn: '' });
			await loadItems();
		} catch (e) {
			setManualState({ status: 'error', message: e instanceof Error ? e.message : 'Unknown error' });
		}
	}

	async function onDeleteWord(word: string) {
		if (!lessonId) return;
		const cleaned = String(word ?? '').trim();
		if (!cleaned) return;
		const confirmed = window.confirm(`Xóa từ "${cleaned}"?`);
		if (!confirmed) return;
		try {
			const res = await fetch(
				`/api/admin/lessons/${encodeURIComponent(lessonId)}/vocabulary?word=${encodeURIComponent(cleaned)}`,
				{ method: 'DELETE' },
			);
			const json = (await res.json()) as ApiResponse<unknown>;
			if (!res.ok || !json.ok) {
				const message = !json.ok && typeof json.error === 'string' ? json.error : `HTTP ${res.status}`;
				window.alert(message);
				return;
			}
			await loadItems();
		} catch (e) {
			window.alert(e instanceof Error ? e.message : 'Unknown error');
		}
	}

	async function onUpload() {
		if (!lessonId) return;
		if (!file) {
			setUploadState({ status: 'error', message: 'Chọn file CSV trước', details: [] });
			return;
		}
		setUploadState({ status: 'uploading' });
		try {
			const fd = new FormData();
			fd.append('file', file);
			if (replaceExisting) fd.append('mode', 'replace');
			const res = await fetch(`/api/admin/lessons/${encodeURIComponent(lessonId)}/vocabulary`, {
				method: 'POST',
				body: fd,
			});
			const json = (await res.json()) as ApiResponse<unknown>;
			if (!res.ok || !json.ok) {
				const message = !json.ok && typeof json.error === 'string' ? json.error : `HTTP ${res.status}`;
				const details = !json.ok && Array.isArray(json.details) ? json.details.map((d) => String(d)) : [];
				setUploadState({ status: 'error', message, details });
				return;
			}
			const data = json.data as {
				records?: unknown;
				total?: unknown;
				upserted?: unknown;
				invalidRows?: unknown;
				invalidSamples?: unknown;
			};
			const records = typeof data?.records === 'number' ? data.records : 0;
			const total = typeof data?.total === 'number' ? data.total : 0;
			const upserted = typeof data?.upserted === 'number' ? data.upserted : 0;
			const invalidRows = typeof data?.invalidRows === 'number' ? data.invalidRows : 0;
			const invalidSamples = Array.isArray(data?.invalidSamples) ? data.invalidSamples.map((d) => String(d)) : [];
			setUploadState({ status: 'uploaded', records, total, upserted, invalidRows, invalidSamples });

			setFile(null);
			await loadItems();
		} catch (e) {
			setUploadState({ status: 'error', message: e instanceof Error ? e.message : 'Unknown error', details: [] });
		}
	}

	async function onClear() {
		if (!lessonId) return;
		const confirmed = window.confirm('Xóa toàn bộ từ vựng của lesson này?');
		if (!confirmed) return;
		setUploadState({ status: 'uploading' });
		try {
			const res = await fetch(`/api/admin/lessons/${encodeURIComponent(lessonId)}/vocabulary`, { method: 'DELETE' });
			const json = (await res.json()) as ApiResponse<unknown>;
			if (!res.ok || !json.ok) {
				const message = !json.ok && typeof json.error === 'string' ? json.error : `HTTP ${res.status}`;
				const details = !json.ok && Array.isArray(json.details) ? json.details.map((d) => String(d)) : [];
				setUploadState({ status: 'error', message, details });
				return;
			}
			const data = json.data as { deleted?: unknown };
			const deleted = typeof data?.deleted === 'number' ? data.deleted : 0;
			setUploadState({ status: 'cleared', deleted });
			await loadItems();
		} catch (e) {
			setUploadState({ status: 'error', message: e instanceof Error ? e.message : 'Unknown error', details: [] });
		}
	}

	return (
		<main className="mx-auto max-w-4xl px-6 py-10">
			<header className="flex flex-wrap items-baseline justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Lesson Vocabulary</h1>
					<p className="mt-2 text-sm text-foreground-secondary">Thêm từ vựng bằng CSV hoặc nhập thủ công.</p>
				</div>
				<nav className="flex flex-wrap items-center gap-3">
					<Link className="text-sm underline underline-offset-4" href="/admin/lessons">
						← Lessons
					</Link>
					{lessonId ? (
						<Link className="text-sm underline underline-offset-4" href={`/courses/lessons/${lessonId}`}>
							Student View
						</Link>
					) : null}
				</nav>
			</header>

			{!lessonId ? <p className="mt-6 text-sm text-error">Missing lessonId</p> : null}

			<details className="mt-8 rounded-lg border border-border p-4" open>
				<summary className="cursor-pointer select-none text-sm font-medium">CSV import</summary>
				<p className="mt-2 text-xs text-muted">
					Cột bắt buộc: <span className="font-mono">word, meaningVi, meaningEn</span> (POS tuỳ chọn)
				</p>
				<div className="mt-3 flex flex-wrap items-center justify-between gap-3">
					<div className="text-xs text-muted">Sample</div>
					<a
						href={sampleCsvHref}
						download="vocab-sample.csv"
						className="text-xs underline underline-offset-4"
					>
						Download sample CSV
					</a>
				</div>
				<pre className="mt-3 overflow-x-auto rounded-md border border-border bg-surface-hover p-3 text-xs">{sampleCsv}</pre>

				<div className="mt-4 flex flex-wrap items-center gap-3">
					<input
						type="file"
						accept=".csv,text/csv"
						onChange={(e) => setFile(e.target.files?.[0] ?? null)}
						className="text-sm"
					/>
					{file ? <span className="text-xs text-muted">{file.name}</span> : null}
					<label className="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={replaceExisting}
							onChange={(e) => setReplaceExisting(e.target.checked)}
						/>
						Replace (xóa danh sách cũ trước)
					</label>
					<button
						type="button"
						onClick={() => void onUpload()}
						disabled={!lessonId || uploadState.status === 'uploading'}
						className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
					>
						{uploadState.status === 'uploading' ? 'Đang upload…' : 'Upload CSV'}
					</button>
					<button
						type="button"
						onClick={() => void onClear()}
						disabled={!lessonId || uploadState.status === 'uploading'}
						className="rounded-md border border-border-hover px-4 py-2 text-sm disabled:opacity-60"
					>
						Clear
					</button>
				</div>

				{uploadState.status === 'error' ? (
					<div className="mt-3">
						<p className="text-sm text-error">Lỗi: {uploadState.message}</p>
						{uploadState.details.length > 0 ? (
							<ul className="mt-2 list-disc pl-5 text-xs text-error">
								{uploadState.details.slice(0, 8).map((d) => (
									<li key={d}>{d}</li>
								))}
							</ul>
						) : null}
					</div>
				) : null}
				{uploadState.status === 'uploaded' ? (
					<div className="mt-3 text-sm text-foreground-secondary">
						<div>
							Đã upsert {uploadState.upserted}/{uploadState.total} từ hợp lệ (từ {uploadState.records} dòng; bỏ qua {uploadState.invalidRows}{' '}
							dòng lỗi).
						</div>
						{uploadState.invalidSamples.length > 0 ? (
							<ul className="mt-2 list-disc pl-5 text-xs text-muted">
								{uploadState.invalidSamples.slice(0, 8).map((d) => (
									<li key={d}>{d}</li>
								))}
							</ul>
						) : null}
					</div>
				) : null}
				{uploadState.status === 'cleared' ? (
					<p className="mt-3 text-sm text-foreground-secondary">Đã xóa {uploadState.deleted} từ.</p>
				) : null}
			</details>

			<details className="mt-6 rounded-lg border border-border p-4" open>
				<summary className="cursor-pointer select-none text-sm font-medium">Manual entry</summary>
				<p className="mt-2 text-xs text-muted">
					Nhập <span className="font-mono">word</span> + nghĩa VI/EN. Nếu word đã tồn tại thì sẽ được update.
				</p>

				<div className="mt-4 grid gap-3 md:grid-cols-2">
					<label className="block">
						<div className="text-xs font-medium">Word *</div>
						<input
							value={manual.word}
							onChange={(e) => {
								setManual((p) => ({ ...p, word: e.target.value }));
								if (manualState.status !== 'idle') setManualState({ status: 'idle' });
							}}
							className="mt-1 w-full rounded-md border border-border-hover bg-background px-3 py-2 text-sm"
							placeholder="hello"
							required
						/>
					</label>

					<label className="block">
						<div className="text-xs font-medium">POS</div>
						<input
							value={manual.partOfSpeech}
							onChange={(e) => {
								setManual((p) => ({ ...p, partOfSpeech: e.target.value }));
								if (manualState.status !== 'idle') setManualState({ status: 'idle' });
							}}
							className="mt-1 w-full rounded-md border border-border-hover bg-background px-3 py-2 text-sm"
							placeholder="interjection"
						/>
					</label>

					<label className="block">
						<div className="text-xs font-medium">Nghĩa (VI) *</div>
						<input
							value={manual.meaningVi}
							onChange={(e) => {
								setManual((p) => ({ ...p, meaningVi: e.target.value }));
								if (manualState.status !== 'idle') setManualState({ status: 'idle' });
							}}
							className="mt-1 w-full rounded-md border border-border-hover bg-background px-3 py-2 text-sm"
							placeholder="xin chào"
							required
						/>
					</label>

					<label className="block">
						<div className="text-xs font-medium">Meaning (EN) *</div>
						<input
							value={manual.meaningEn}
							onChange={(e) => {
								setManual((p) => ({ ...p, meaningEn: e.target.value }));
								if (manualState.status !== 'idle') setManualState({ status: 'idle' });
							}}
							className="mt-1 w-full rounded-md border border-border-hover bg-background px-3 py-2 text-sm"
							placeholder="hello"
							required
						/>
					</label>
				</div>

				<div className="mt-4 flex flex-wrap items-center gap-3">
					<button
						type="button"
						onClick={() => void onManualSave()}
						disabled={!lessonId || manualState.status === 'saving'}
						className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
					>
						{manualState.status === 'saving' ? 'Đang lưu…' : 'Save word'}
					</button>
					{manualState.status === 'saved' ? (
						<p className="text-sm text-foreground-secondary">OK. Total: {manualState.total}</p>
					) : null}
					{manualState.status === 'error' ? <p className="text-sm text-error">Lỗi: {manualState.message}</p> : null}
				</div>
			</details>

			<section className="mt-8">
				<div className="flex flex-wrap items-baseline justify-between gap-3">
					<h2 className="text-lg font-semibold">Hiện có: {items.length} từ</h2>
					<button
						type="button"
						onClick={() => void loadItems()}
						disabled={!lessonId || loadState.status === 'loading'}
						className="text-xs underline underline-offset-4 text-foreground-secondary disabled:opacity-60"
					>
						Refresh
					</button>
				</div>
				{loadState.status === 'loading' ? <p className="mt-3 text-sm text-foreground-secondary">Đang tải…</p> : null}
				{loadState.status === 'error' ? <p className="mt-3 text-sm text-error">Lỗi: {loadState.message}</p> : null}

				{loadState.status === 'loaded' ? (
					items.length === 0 ? (
						<p className="mt-3 text-sm text-foreground-secondary">Chưa có từ vựng.</p>
					) : (
						<div className="mt-4 overflow-x-auto rounded-lg border border-border">
							<table className="min-w-full text-left text-sm">
								<thead className="bg-surface-hover">
									<tr>
										<th className="px-3 py-2 font-medium">Word</th>
										<th className="px-3 py-2 font-medium">POS</th>
										<th className="px-3 py-2 font-medium">Nghĩa VI</th>
										<th className="px-3 py-2 font-medium">Nghĩa EN</th>
										<th className="px-3 py-2 font-medium"></th>
									</tr>
								</thead>
								<tbody>
									{items.map((v) => (
										<tr key={v.id} className="border-t border-border">
											<td className="px-3 py-2 font-medium">{v.word}</td>
											<td className="px-3 py-2 text-xs text-foreground-secondary">{v.partOfSpeech || '—'}</td>
											<td className="px-3 py-2">{v.meaningVi}</td>
											<td className="px-3 py-2 text-foreground-secondary">{v.meaningEn}</td>
											<td className="px-3 py-2 text-right">
												<button
													type="button"
													onClick={() => void onDeleteWord(v.word)}
													className="text-xs underline underline-offset-4 text-foreground-secondary"
												>
													Delete
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)
				) : null}
			</section>
		</main>
	);
}
