'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
	buildCsvFixPrompt,
	buildTestBundlePrompt,
} from '@/features/myspace-tests/prompts/testBundlePrompt';
import { routes } from '@/config/routes';
import { adminFetch } from '@/lib/admin/client';
import type { SubjectWithCounts } from '@/features/myspace-tests';

type Preview = {
	meta: {
		title: string;
		slug: string | null;
		description: string;
		subject: string;
		questionCount: number | null;
		status: 'DRAFT' | 'PUBLISHED';
	};
	questionCount: number;
	sampleStems: string[];
	errors: Array<{ row: number; missing: string[]; message?: string }>;
	metaErrors: string[];
	canImport: boolean;
};

type ImportResult = {
	test: { id: string; slug: string; title: string; status: string };
	imported: number;
	preview: Preview;
};

type Mode = 'smart' | 'file';

export default function ImportCsvClient() {
	const router = useRouter();
	const [mode, setMode] = useState<Mode>('smart');

	// Smart import state
	const [rawData, setRawData] = useState('');
	const [prompt, setPrompt] = useState('');
	const [aiCsv, setAiCsv] = useState('');
	const [preview, setPreview] = useState<Preview | null>(null);
	const [subjects, setSubjects] = useState<SubjectWithCounts[]>([]);
	const [subjectId, setSubjectId] = useState('');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [questionCount, setQuestionCount] = useState(10);
	const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
	const [newSubjectName, setNewSubjectName] = useState('');
	const [copied, setCopied] = useState(false);
	const [fixCopied, setFixCopied] = useState(false);

	// File import state
	const [file, setFile] = useState<File | null>(null);
	const [filePreview, setFilePreview] = useState<Preview | null>(null);

	const [busy, setBusy] = useState(false);
	const [importing, setImporting] = useState(false);
	const [result, setResult] = useState<ImportResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const loadSubjects = useCallback(async () => {
		const data = await adminFetch<{ items: SubjectWithCounts[] }>('/api/admin/myspace-subjects');
		if (data?.items) setSubjects(data.items);
	}, []);

	useEffect(() => {
		void loadSubjects();
	}, [loadSubjects]);

	function buildPrompt() {
		setError(null);
		setResult(null);
		setPrompt(buildTestBundlePrompt(rawData));
	}

	async function copyPrompt() {
		if (!prompt) return;
		await navigator.clipboard.writeText(prompt);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	const hasPreviewErrors = Boolean(
		preview && (preview.errors.length > 0 || preview.metaErrors.length > 0 || !preview.canImport),
	);

	async function copyFixPrompt() {
		if (!preview || !aiCsv.trim()) return;
		const fixPrompt = buildCsvFixPrompt({
			csv: aiCsv,
			errors: preview.errors,
			metaErrors: preview.metaErrors,
		});
		await navigator.clipboard.writeText(fixPrompt);
		setFixCopied(true);
		setTimeout(() => setFixCopied(false), 2000);
	}

	async function validateAiCsv() {
		if (!aiCsv.trim()) {
			setError('Dán CSV kết quả từ AI trước');
			return;
		}
		setBusy(true);
		setError(null);
		setResult(null);
		setPreview(null);
		setFixCopied(false);
		try {
			const data = await adminFetch<Preview>('/api/admin/myspace-tests/import?dryRun=1', {
				method: 'POST',
				body: JSON.stringify({ text: aiCsv, allowMissingMeta: true }),
			});
			setPreview(data);
			if (data.meta.title && !title) setTitle(data.meta.title);
			if (data.meta.description && !description) {
				setDescription(data.meta.description);
			}
			if (data.questionCount > 0) {
				setQuestionCount(data.meta.questionCount ?? Math.min(data.questionCount, 20));
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không kết nối được server');
		} finally {
			setBusy(false);
		}
	}

	async function createSubjectQuick() {
		if (!newSubjectName.trim()) return;
		try {
			const created = await adminFetch<{ id: string; name: string }>(
				'/api/admin/myspace-subjects',
				{
					method: 'POST',
					body: JSON.stringify({ name: newSubjectName.trim() }),
				},
			);
			await loadSubjects();
			setSubjectId(created.id);
			setNewSubjectName('');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không tạo được môn');
		}
	}

	async function saveSmartImport() {
		if (!preview?.canImport || !subjectId || !title.trim()) return;
		setImporting(true);
		setError(null);
		try {
			const data = await adminFetch<ImportResult>('/api/admin/myspace-tests/import', {
				method: 'POST',
				body: JSON.stringify({
					text: aiCsv,
					meta: {
						subjectId,
						title: title.trim(),
						description: description.trim() || undefined,
						questionCount,
						status,
					},
				}),
			});
			setResult(data);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không kết nối được server');
		} finally {
			setImporting(false);
		}
	}

	async function runFilePreview(selected: File) {
		setBusy(true);
		setError(null);
		setResult(null);
		setFilePreview(null);
		try {
			const form = new FormData();
			form.append('file', selected);
			const data = await adminFetch<Preview>('/api/admin/myspace-tests/import?dryRun=1', {
				method: 'POST',
				body: form,
			});
			setFilePreview(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không kết nối được server');
		} finally {
			setBusy(false);
		}
	}

	async function onFileImport() {
		if (!file || !filePreview?.canImport) return;
		setImporting(true);
		setError(null);
		try {
			const form = new FormData();
			form.append('file', file);
			const data = await adminFetch<ImportResult>('/api/admin/myspace-tests/import', {
				method: 'POST',
				body: form,
			});
			setResult(data);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không kết nối được server');
		} finally {
			setImporting(false);
		}
	}

	return (
		<div className="mx-auto max-w-3xl px-6 py-8">
			<p className="text-xs font-bold uppercase tracking-widest text-muted">My Space Tests</p>
			<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Import bài test</h1>
			<p className="mt-2 text-sm text-muted">
				Import thông minh: dán dữ liệu thô → copy prompt cho AI → dán CSV plain text từ chat (không
				dùng file đính kèm) → chọn môn và lưu.
			</p>

			<div className="mt-6 flex flex-wrap gap-2">
				<button
					type="button"
					onClick={() => setMode('smart')}
					className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${
						mode === 'smart' ? 'bg-foreground text-background' : 'border border-border text-muted'
					}`}
				>
					Import thông minh
				</button>
				<button
					type="button"
					onClick={() => setMode('file')}
					className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${
						mode === 'file' ? 'bg-foreground text-background' : 'border border-border text-muted'
					}`}
				>
					File CSV
				</button>
			</div>

			{error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

			{mode === 'smart' ? (
				<>
					<section className="mt-6 border border-border p-5">
						<p className="text-xs font-bold uppercase tracking-widest text-muted">
							Bước 1 · Dán dữ liệu thô
						</p>
						<textarea
							value={rawData}
							onChange={(e) => setRawData(e.target.value)}
							rows={8}
							placeholder="Dán bộ câu hỏi (Word / PDF / Excel / text lộn xộn)…"
							className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs"
						/>
						<button
							type="button"
							onClick={buildPrompt}
							disabled={!rawData.trim()}
							className="mt-3 inline-flex rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-background disabled:opacity-40"
						>
							Sinh prompt
						</button>
					</section>

					{prompt ? (
						<section className="mt-6 border border-border p-5">
							<p className="text-xs font-bold uppercase tracking-widest text-muted">
								Bước 2 · Copy prompt đưa vào AI
							</p>
							<pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-surface p-3 font-mono text-xs text-foreground">
								{prompt}
							</pre>
							<button
								type="button"
								onClick={() => void copyPrompt()}
								className="mt-3 inline-flex rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider"
							>
								{copied ? 'Đã copy!' : 'Copy prompt'}
							</button>
						</section>
					) : null}

					<section className="mt-6 border border-border p-5">
						<p className="text-xs font-bold uppercase tracking-widest text-muted">
							Bước 3 · Dán CSV từ AI &amp; kiểm tra
						</p>
						<textarea
							value={aiCsv}
							onChange={(e) => setAiCsv(e.target.value)}
							rows={8}
							placeholder="Dán CSV plain text từ chat AI (bắt đầu bằng dòng header)…"
							className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs"
						/>
						<button
							type="button"
							onClick={() => void validateAiCsv()}
							disabled={busy || !aiCsv.trim()}
							className="mt-3 inline-flex rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-40"
						>
							{busy ? 'Đang kiểm tra…' : 'Kiểm tra cấu trúc'}
						</button>

						{preview ? (
							<div className="mt-5 space-y-3">
								<p className="text-sm text-foreground">
									<span className="font-bold">{preview.questionCount}</span> câu hợp lệ
									{preview.errors.length > 0 ? ` · ${preview.errors.length} dòng lỗi` : ''}
								</p>
								{preview.metaErrors.length > 0 ? (
									<ul className="space-y-1 text-sm text-red-600">
										{preview.metaErrors.map((msg) => (
											<li key={msg}>{msg}</li>
										))}
									</ul>
								) : null}
								{preview.errors.length > 0 ? (
									<ul className="max-h-40 overflow-auto border border-border divide-y divide-border text-xs">
										{preview.errors.map((err) => (
											<li
												key={`${err.row}-${err.missing.join(',')}`}
												className="px-3 py-2 text-muted"
											>
												Dòng {err.row}: {err.message ?? `thiếu ${err.missing.join(', ')}`}
											</li>
										))}
									</ul>
								) : null}
								{hasPreviewErrors ? (
									<div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
										<p className="text-sm text-foreground">
											CSV chưa đạt. Copy prompt sửa lỗi gửi lại AI, rồi dán CSV mới vào ô trên và
											kiểm tra lại.
										</p>
										<button
											type="button"
											onClick={() => void copyFixPrompt()}
											className="mt-3 inline-flex rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-background"
										>
											{fixCopied ? 'Đã copy prompt sửa!' : 'Copy prompt sửa lỗi'}
										</button>
									</div>
								) : null}
								{preview.sampleStems.length > 0 ? (
									<ol className="list-decimal space-y-1 pl-5 text-sm text-foreground">
										{preview.sampleStems.map((stem, i) => (
											<li key={`${i}-${stem.slice(0, 24)}`}>{stem}</li>
										))}
									</ol>
								) : null}
							</div>
						) : null}
					</section>

					{preview?.canImport ? (
						<section className="mt-6 border border-border p-5">
							<p className="text-xs font-bold uppercase tracking-widest text-muted">
								Bước 4 · Chọn môn &amp; đặt tên · Lưu
							</p>
							<div className="mt-4 space-y-4">
								<label className="block">
									<span className="text-xs font-bold uppercase tracking-widest text-muted">
										Môn học
									</span>
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
								<div className="flex flex-wrap gap-2">
									<input
										value={newSubjectName}
										onChange={(e) => setNewSubjectName(e.target.value)}
										placeholder="Hoặc tạo môn mới…"
										className="min-w-[12rem] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
									/>
									<button
										type="button"
										onClick={() => void createSubjectQuick()}
										className="rounded-full border border-border px-3 py-2 text-xs font-bold uppercase tracking-wider"
									>
										Thêm môn
									</button>
								</div>
								<label className="block">
									<span className="text-xs font-bold uppercase tracking-widest text-muted">
										Tên bài test
									</span>
									<input
										required
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
									/>
								</label>
								<label className="block">
									<span className="text-xs font-bold uppercase tracking-widest text-muted">
										Mô tả
									</span>
									<textarea
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										rows={2}
										className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
									/>
								</label>
								<div className="flex flex-wrap gap-4">
									<label className="block">
										<span className="text-xs font-bold uppercase tracking-widest text-muted">
											Số câu / lần
										</span>
										<input
											type="number"
											min={1}
											max={preview.questionCount}
											value={questionCount}
											onChange={(e) => setQuestionCount(Number(e.target.value))}
											className="mt-1.5 w-24 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
										/>
									</label>
									<label className="block">
										<span className="text-xs font-bold uppercase tracking-widest text-muted">
											Trạng thái
										</span>
										<select
											value={status}
											onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
											className="mt-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
										>
											<option value="PUBLISHED">Xuất bản</option>
											<option value="DRAFT">Nháp</option>
										</select>
									</label>
								</div>
								<button
									type="button"
									disabled={importing || !subjectId || !title.trim() || !preview.canImport}
									onClick={() => void saveSmartImport()}
									className="inline-flex rounded-full bg-foreground px-5 py-2 text-xs font-bold uppercase tracking-wider text-background disabled:opacity-40"
								>
									{importing ? 'Đang lưu…' : 'Lưu bài test'}
								</button>
							</div>
						</section>
					) : null}
				</>
			) : (
				<>
					<section className="mt-6 border border-border p-5">
						<p className="text-xs font-bold uppercase tracking-widest text-muted">
							Nâng cao · Import file CSV bundle
						</p>
						<p className="mt-2 text-sm text-muted">
							Một file = một bài test (có meta + câu hỏi).{' '}
							<a href="/sample-myspace-test.csv" download className="underline underline-offset-2">
								Tải sample
							</a>
						</p>
						<input
							type="file"
							accept=".csv,text/csv"
							onChange={(e) => {
								const selected = e.target.files?.[0] ?? null;
								setFile(selected);
								setFilePreview(null);
								setResult(null);
								if (selected) void runFilePreview(selected);
							}}
							className="mt-4 block w-full text-sm"
						/>
						{busy ? <p className="mt-3 text-sm text-muted">Đang phân tích…</p> : null}
						{filePreview ? (
							<div className="mt-4 space-y-2 text-sm">
								<p className="font-bold text-foreground">
									{filePreview.meta.title || '(thiếu tiêu đề)'}
								</p>
								<p className="text-muted">
									{filePreview.meta.subject || '(thiếu môn)'} · {filePreview.questionCount} câu ·{' '}
									{filePreview.meta.status}
								</p>
								<button
									type="button"
									disabled={!filePreview.canImport || importing}
									onClick={() => void onFileImport()}
									className="mt-2 inline-flex rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-background disabled:opacity-40"
								>
									{importing ? 'Đang import…' : 'Import file'}
								</button>
							</div>
						) : null}
					</section>
				</>
			)}

			{result ? (
				<div className="mt-6 space-y-3 border border-border p-5">
					<p className="text-sm font-bold text-foreground">
						Đã tạo “{result.test.title}” · {result.imported} câu hỏi
						{result.test.status === 'PUBLISHED' ? ' · đã xuất bản' : ''}
					</p>
					<div className="flex flex-wrap gap-4 text-sm">
						<Link
							href={routes.mySpaceTests}
							className="underline underline-offset-2"
							target="_blank"
						>
							Xem trang Tests
						</Link>
						<Link
							href={routes.admin.myspaceTestEdit(result.test.id)}
							className="underline underline-offset-2"
						>
							Sửa bài test
						</Link>
						<Link href={routes.admin.myspaceTests} className="text-muted hover:text-foreground">
							Danh sách bài test
						</Link>
					</div>
				</div>
			) : null}

			<Link
				href={routes.admin.myspaceTests}
				className="mt-8 inline-block text-sm text-muted hover:text-foreground"
			>
				← Danh sách bài test
			</Link>
		</div>
	);
}
