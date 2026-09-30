'use client';

import { useEffect, useState } from 'react';

import { myClassApi } from '@/components/myclass/admin/api';
import { McButton } from '@/components/myclass/ui';
import { Dialog } from '@/components/ui/Dialog';
import {
	buildVocabCsvFixPrompt,
	buildVocabSetPrompt,
} from '@/features/my-class/prompts/vocabSetPrompt';
import type { VocabCsvParseResult } from '@/lib/vocab/parseVocabCsv';
import { VOCAB_CSV_COLUMNS } from '@/lib/vocab/parseVocabCsv';

import { useOptionalEditMode } from './EditModeContext';

type VocabCsvPreview = VocabCsvParseResult & { canImport: boolean };

export default function VocabImportDialog({
	standalone,
}: {
	standalone?: {
		courseId: string;
		courseTitle: string;
		lessonId?: string | null;
		lessonTitle?: string | null;
		open: boolean;
		onClose: () => void;
		onImported?: () => void;
	};
} = {}) {
	const edit = useOptionalEditMode();
	const open = standalone ? standalone.open : Boolean(edit?.vocabImport);
	const lessonId = standalone
		? (standalone.lessonId ?? null)
		: (edit?.vocabImport?.lessonId ?? null);
	const lesson = standalone
		? standalone.lessonTitle
			? { id: standalone.lessonId ?? '', title: standalone.lessonTitle }
			: undefined
		: lessonId
			? edit?.course.lessons.find((item) => item.id === lessonId)
			: undefined;
	const courseId = standalone?.courseId ?? edit?.courseId;
	const courseTitle = standalone?.courseTitle ?? edit?.course.title ?? '';
	const lessonTitle = lesson?.title ?? '';
	const target = open ? { lessonId } : null;

	const [title, setTitle] = useState('');
	const [rawWords, setRawWords] = useState('');
	const [prompt, setPrompt] = useState('');
	const [csv, setCsv] = useState('');
	const [preview, setPreview] = useState<VocabCsvPreview | null>(null);
	const [copied, setCopied] = useState(false);
	const [fixCopied, setFixCopied] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) return;
		setRawWords('');
		setPrompt('');
		setCsv('');
		setPreview(null);
		setCopied(false);
		setFixCopied(false);
		setError(null);
		setTitle(lessonTitle ? `${lessonTitle} — Từ vựng` : 'Từ vựng');
	}, [open, lessonId, lessonTitle]);

	if (!target || !courseId) return null;
	if (!standalone && (!edit || !edit.enabled)) return null;
	const session = edit;
	const importTarget = target;
	const close = () => {
		if (standalone) standalone.onClose();
		else session?.setVocabImport(null);
	};

	function buildPrompt() {
		setError(null);
		setPrompt(
			buildVocabSetPrompt(rawWords, {
				courseTitle,
				lessonTitle: lesson?.title,
			}),
		);
	}

	async function copyPrompt() {
		if (!prompt) return;
		await navigator.clipboard.writeText(prompt);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 2000);
	}

	async function copyFixPrompt() {
		if (!preview || !csv.trim()) return;
		await navigator.clipboard.writeText(buildVocabCsvFixPrompt(csv, preview.errors));
		setFixCopied(true);
		window.setTimeout(() => setFixCopied(false), 2000);
	}

	async function check() {
		if (!csv.trim()) {
			setError('Dán CSV trước khi xem trước');
			return;
		}
		setBusy(true);
		setError(null);
		try {
			const next = await myClassApi<VocabCsvPreview>(
				`/api/admin/my-class/courses/${courseId}/vocab-assignments/import`,
				{
					method: 'POST',
					body: JSON.stringify({ csv, mode: 'preview', lessonId: importTarget.lessonId }),
				},
			);
			setPreview(next);
			if (!next.canImport) {
				setError(next.errors[0]?.message ?? 'CSV chưa hợp lệ');
			}
		} catch (err) {
			setPreview(null);
			setError(err instanceof Error ? err.message : 'Không kiểm tra được CSV');
		} finally {
			setBusy(false);
		}
	}

	async function commit() {
		if (!preview?.canImport) return;
		setBusy(true);
		setError(null);
		try {
			if (standalone) {
				await myClassApi(`/api/admin/my-class/courses/${courseId}/vocab-assignments/import`, {
					method: 'POST',
					body: JSON.stringify({
						csv,
						mode: 'commit',
						lessonId: importTarget.lessonId,
						title: title.trim() || `${lesson?.title ?? 'Bài'} — Từ vựng`,
					}),
				});
				standalone.onImported?.();
				standalone.onClose();
			} else if (session) {
				const ok = await session.importVocab({
					lessonId: importTarget.lessonId,
					title: title.trim() || `${lesson?.title ?? 'Bài'} — Từ vựng`,
					csv,
				});
				if (!ok) setError(session.error ?? 'Không tạo được bộ từ');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không tạo được bộ từ');
		} finally {
			setBusy(false);
		}
	}

	const sampleRows = preview?.words.slice(0, 8) ?? [];

	return (
		<Dialog
			open
			onClose={close}
			title="Thêm từ vựng"
			description={lesson ? `Gắn vào bài: ${lesson.title}` : 'Gắn vào khóa học'}
			className="!w-[min(100%-1.5rem,48rem)] max-h-[min(90dvh,52rem)]"
		>
			<div className="space-y-6">
				<label className="block text-sm">
					Tên bộ từ
					<input
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						className="mt-1.5 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-sm"
					/>
				</label>

				<section>
					<p className="text-xs font-bold uppercase tracking-wider text-ink-tertiary">
						Bước 1 · Dán danh sách từ thô
					</p>
					<textarea
						value={rawWords}
						onChange={(event) => setRawWords(event.target.value)}
						rows={5}
						placeholder="stakeholder&#10;scope creep&#10;critical path"
						className="mt-2 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3 py-2 text-sm"
					/>
					<div className="mt-2">
						<McButton
							variant="secondary"
							size="sm"
							onClick={buildPrompt}
							disabled={!rawWords.trim()}
						>
							Sinh prompt
						</McButton>
					</div>
				</section>

				<section>
					<p className="text-xs font-bold uppercase tracking-wider text-ink-tertiary">
						Bước 2 · Copy prompt đưa vào AI
					</p>
					{prompt ? (
						<pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-[var(--mc-r-sm)] border border-mc-rule bg-surface-sunken p-3 text-xs">
							{prompt}
						</pre>
					) : (
						<p className="mc-meta mt-2">Có thể bỏ qua và dán CSV thủ công ở bước 3.</p>
					)}
					<div className="mt-2 flex flex-wrap gap-2">
						<McButton
							variant="secondary"
							size="sm"
							onClick={() => void copyPrompt()}
							disabled={!prompt}
						>
							{copied ? 'Đã copy!' : 'Copy prompt'}
						</McButton>
						<a
							href={`/api/admin/my-class/courses/${courseId}/vocab-assignments/import?template=1`}
							className="inline-flex min-h-10 items-center rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-sm font-semibold hover:bg-surface-sunken"
						>
							Tải mẫu CSV
						</a>
					</div>
					<p className="mc-meta mt-2">Cột: {VOCAB_CSV_COLUMNS.join(', ')}</p>
				</section>

				<section>
					<p className="text-xs font-bold uppercase tracking-wider text-ink-tertiary">
						Bước 3 · Dán CSV kết quả
					</p>
					<textarea
						value={csv}
						onChange={(event) => {
							setCsv(event.target.value);
							setPreview(null);
						}}
						rows={8}
						placeholder={`${VOCAB_CSV_COLUMNS.join(',')}\nterm,/ipa/,noun,english meaning,nghĩa tiếng Việt,...`}
						className="mt-2 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3 py-2 font-mono text-xs"
					/>
					<div className="mt-2 flex flex-wrap gap-2">
						<McButton
							variant="secondary"
							size="sm"
							onClick={() => void check()}
							loading={busy}
							disabled={!csv.trim()}
						>
							Xem trước
						</McButton>
						{preview && !preview.canImport ? (
							<McButton variant="quiet" size="sm" onClick={() => void copyFixPrompt()}>
								{fixCopied ? 'Đã copy!' : 'Copy prompt sửa lỗi'}
							</McButton>
						) : null}
					</div>
				</section>

				{preview ? (
					<div>
						<p className="text-sm">
							<span className="mc-num">{preview.wordCount}</span> từ hợp lệ
							{preview.errors.length ? (
								<>
									{' · '}
									<span className="text-error">{preview.errors.length} dòng lỗi</span>
								</>
							) : null}
						</p>
						{preview.errors.length ? (
							<ul className="mt-2 space-y-1 text-xs text-error">
								{preview.errors.slice(0, 8).map((item) => (
									<li key={`${item.row}-${item.message}`}>
										Dòng {item.row}: {item.message ?? item.missing.join(', ')}
									</li>
								))}
							</ul>
						) : null}
						{sampleRows.length ? (
							<div className="mt-3 overflow-auto rounded-[var(--mc-r-sm)] border border-mc-rule">
								<table className="w-full text-left text-xs">
									<thead>
										<tr className="border-b border-mc-rule bg-surface-sunken">
											<th className="px-2 py-2 font-semibold">Từ</th>
											<th className="px-2 py-2 font-semibold">Phiên âm</th>
											<th className="px-2 py-2 font-semibold">Nghĩa TA</th>
											<th className="px-2 py-2 font-semibold">Nghĩa TV</th>
										</tr>
									</thead>
									<tbody>
										{sampleRows.map((word, index) => (
											<tr
												key={`${word.term}-${index}`}
												className="border-b border-mc-rule last:border-0"
											>
												<td className="px-2 py-2 font-medium">{word.term}</td>
												<td className="px-2 py-2 text-ink-secondary">{word.pronunciation}</td>
												<td className="px-2 py-2">{word.meaningEn}</td>
												<td className="px-2 py-2">{word.meaningVi || word.definition}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : null}
					</div>
				) : null}

				{error ? <p className="text-sm text-error">{error}</p> : null}

				<div className="flex justify-end gap-2">
					<McButton variant="quiet" onClick={close}>
						Hủy
					</McButton>
					<McButton
						onClick={() => void commit()}
						loading={busy || session?.busyKey === 'import-vocab'}
						disabled={!preview?.canImport}
					>
						Tạo & gắn
					</McButton>
				</div>
			</div>
		</Dialog>
	);
}
