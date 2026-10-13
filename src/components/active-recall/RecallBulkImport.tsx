'use client';

import { useMemo, useState } from 'react';
import type { RecallImportPreview } from '@/features/active-recall';
import { toRecallCsv, toRecallPaste } from '@/features/active-recall/parser';
import { recallVisibleText } from '@/features/active-recall/richText';
import { ACTIVE_RECALL_AI_FORMATTING_GUIDE, copyText } from './aiFormattingGuide';
import { previewDraftImport, type ImportDraftCard } from './importDraft';

const secondary =
	'rounded-lg border border-border px-3 py-2 text-sm font-semibold disabled:opacity-40';
const primary =
	'rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background disabled:opacity-40';

export default function RecallBulkImport({
	cards,
	text,
	onTextChange,
	open,
	onOpenChange,
	busy,
	filename,
	onApply,
	onNotice,
	onLoadingChange,
}: {
	cards: ImportDraftCard[];
	text: string;
	onTextChange: (text: string) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	busy: boolean;
	filename: string;
	onApply: (preview: RecallImportPreview, mode: 'append' | 'replace') => Promise<boolean>;
	onNotice: (notice: string) => void;
	onLoadingChange: (loading: boolean) => void;
}) {
	const [mode, setMode] = useState<'append' | 'replace'>('append');
	const [checkedText, setCheckedText] = useState<string | null>(null);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [previewPage, setPreviewPage] = useState(0);
	const preview = useMemo(() => {
		if (checkedText !== text || !text.trim()) return null;
		return previewDraftImport(text, cards, mode);
	}, [checkedText, text, cards, mode]);
	const additions = preview?.rows.filter((row) => row.action === 'create').length ?? 0;
	const updates = preview?.rows.filter((row) => row.action === 'update').length ?? 0;
	const canApply =
		preview &&
		preview.summary.valid > preview.summary.duplicates &&
		!preview.summary.invalid &&
		!preview.summary.orphanAnswers;
	const pages = Math.max(1, Math.ceil((preview?.rows.length ?? 0) / 10));
	const page = Math.min(previewPage, pages - 1);

	function check() {
		setError('');
		setCheckedText(null);
		if (text.length > 2_000_000) {
			setError('Dữ liệu quá lớn. Hãy chia file dưới 2 MB.');
			return;
		}
		setPreviewPage(0);
		setCheckedText(text);
	}
	async function copy(value: string, notice: string) {
		try {
			await copyText(value);
			onNotice(notice);
		} catch {
			setError('Không thể sao chép. Hãy thử lại.');
		}
	}
	async function readFile(file: File | undefined) {
		if (!file) return;
		if (file.size > 2_000_000) {
			setError('File quá lớn. Hãy chọn file dưới 2 MB.');
			return;
		}
		setLoading(true);
		onLoadingChange(true);
		setError('');
		try {
			onTextChange(await file.text());
			setCheckedText(null);
			onNotice(`Đã đọc ${file.name}. Kiểm tra dữ liệu trước khi thêm vào bộ.`);
		} catch {
			setError('Không đọc được file. Hãy dán nội dung hoặc chọn file văn bản UTF-8.');
		} finally {
			setLoading(false);
			onLoadingChange(false);
		}
	}
	function download() {
		const value = toRecallCsv(
			cards.map((card, index) => ({ ...card, id: card.id ?? '', position: index })),
		);
		const url = URL.createObjectURL(new Blob([value], { type: 'text/csv;charset=utf-8' }));
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `${filename}.csv`;
		anchor.click();
		URL.revokeObjectURL(url);
	}
	return (
		<details
			className="mt-4 border border-border bg-surface p-4 sm:p-5"
			open={open}
			onToggle={(event) => onOpenChange(event.currentTarget.open)}
		>
			<summary className="cursor-pointer text-sm font-semibold text-ink">Nhập nhiều</summary>
			<fieldset disabled={busy || loading} className="mt-4 min-w-0">
				<p className="text-sm text-muted">
					1. Dán hoặc chọn file → 2. Kiểm tra → 3. Đưa vào bộ → 4. Lưu.
				</p>
				<p className="mt-2 text-sm text-muted">
					Q:/A:, QVI:/AVI: cho bản dịch; CSV có cột question, answer; hoặc hai cột sao chép từ
					Excel. Tối đa 1.000 thẻ. Nhập dữ liệu chưa làm thay đổi bộ đã lưu.
				</p>
				<div className="mt-3 flex flex-wrap items-center gap-2">
					<label className={secondary}>
						Chọn file CSV / TXT
						<input
							aria-label="Chọn file nhập thẻ"
							type="file"
							accept=".csv,.txt,.tsv,text/plain,text/csv"
							className="sr-only"
							onChange={(event) => {
								void readFile(event.target.files?.[0]);
								event.target.value = '';
							}}
						/>
					</label>
					<button
						type="button"
						className={secondary}
						onClick={() =>
							void copy(
								ACTIVE_RECALL_AI_FORMATTING_GUIDE,
								'Đã sao chép hướng dẫn định dạng cho AI.',
							)
						}
					>
						Sao chép hướng dẫn cho AI
					</button>
					<button type="button" className={secondary} onClick={download}>
						Xuất CSV
					</button>
					<button
						type="button"
						className={secondary}
						onClick={() => void copy(toRecallPaste(cards), 'Đã sao chép dạng Q/A.')}
					>
						Sao chép Q/A
					</button>
				</div>
				<label className="mt-4 block text-sm font-semibold">
					Dữ liệu nhập
					<textarea
						value={text}
						onChange={(event) => {
							onTextChange(event.target.value);
							setCheckedText(null);
							setError('');
						}}
						rows={8}
						className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm font-normal"
						placeholder={
							'Q: What is **HRM**?\nA: Human resource management\nQVI: HRM là gì?\nAVI: Quản trị nguồn nhân lực\n---\nQ: ...\nA: ...'
						}
					/>
				</label>
				<div className="mt-3 flex flex-wrap items-center gap-2">
					<label className="text-sm">
						Cách nhập{' '}
						<select
							value={mode}
							onChange={(event) => {
								setMode(event.target.value as 'append' | 'replace');
								setPreviewPage(0);
							}}
							className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
						>
							<option value="append">Thêm vào bộ hiện có</option>
							<option value="replace">Thay thế toàn bộ thẻ</option>
						</select>
					</label>
					<button
						type="button"
						className={canApply ? secondary : primary}
						disabled={!text.trim()}
						onClick={check}
					>
						{loading ? 'Đang đọc file…' : 'Kiểm tra dữ liệu'}
					</button>
					{canApply ? (
						<button
							type="button"
							className={primary}
							onClick={() => {
								void onApply(preview, mode).then((applied) => {
									if (applied) setCheckedText(null);
								});
							}}
						>
							{mode === 'replace'
								? `Thay bằng ${additions} thẻ`
								: `Đưa vào bộ: ${additions} mới${updates ? `, ${updates} cập nhật` : ''}`}
						</button>
					) : null}
				</div>
				{error ? (
					<p role="alert" className="mt-3 text-sm text-red-700">
						{error}
					</p>
				) : null}
				{preview ? (
					<div className="mt-4 text-sm">
						<p role="status">
							<strong>{preview.summary.valid}</strong> hợp lệ ·{' '}
							<strong>{preview.summary.invalid}</strong> lỗi ·{' '}
							<strong>{preview.summary.duplicates}</strong> trùng sẽ bỏ qua · {updates} cập nhật
							theo ID
						</p>
						{preview.summary.orphanAnswers ? (
							<p role="alert" className="mt-2 text-red-700">
								Có {preview.summary.orphanAnswers} đáp án không có câu hỏi. Mỗi đáp án cần đứng sau
								Q: tương ứng.
							</p>
						) : null}
						{!preview.summary.total ? (
							<p role="alert" className="mt-2 text-red-700">
								Chưa tìm thấy thẻ. Dùng Q: và A: hoặc CSV có cột question, answer.
							</p>
						) : null}
						<p className="mt-2 text-muted">
							{mode === 'replace'
								? `Thay toàn bộ nội dung hiện tại; có thể hoàn tác trước khi sửa tiếp hoặc lưu.`
								: 'Giữ thẻ hiện có; chỉ cập nhật thẻ có ID thuộc bộ này. Thẻ trùng cả nội dung và bản dịch được bỏ qua.'}
						</p>
						<ol className="mt-3 divide-y divide-border border-y border-border">
							{preview.rows.slice(page * 10, (page + 1) * 10).map((row) => (
								<li key={row.row} className="py-3">
									<div className="flex flex-wrap items-baseline gap-2">
										<strong>Dòng {row.row}</strong>
										<span className={row.errors.length ? 'text-red-700' : 'text-muted'}>
											{row.errors.length
												? row.errors.join(' · ')
												: row.action === 'skip'
													? 'Bỏ qua trùng'
													: row.action === 'update'
														? 'Cập nhật'
														: 'Thẻ mới'}
										</span>
									</div>
									<p className="mt-1 line-clamp-2">Q: {recallVisibleText(row.question)}</p>
									<p className="mt-1 line-clamp-2 text-muted">A: {recallVisibleText(row.answer)}</p>
									{row.questionVi || row.answerVi ? (
										<p className="mt-1 line-clamp-2 text-muted">
											VI: {recallVisibleText(row.questionVi ?? '')} ·{' '}
											{recallVisibleText(row.answerVi ?? '')}
										</p>
									) : null}
								</li>
							))}
						</ol>
						{pages > 1 ? (
							<nav aria-label="Trang xem trước nhập" className="mt-3 flex items-center gap-3">
								<button
									type="button"
									className={secondary}
									disabled={page === 0}
									onClick={() => setPreviewPage(page - 1)}
								>
									Trước
								</button>
								<label>
									Trang{' '}
									<select
										aria-label="Chọn trang xem trước"
										value={page}
										onChange={(event) => setPreviewPage(Number(event.target.value))}
										className="rounded border border-border bg-background p-2"
									>
										{Array.from({ length: pages }, (_, index) => (
											<option key={index} value={index}>
												{index + 1}
											</option>
										))}
									</select>{' '}
									/ {pages}
								</label>
								<button
									type="button"
									className={secondary}
									disabled={page === pages - 1}
									onClick={() => setPreviewPage(page + 1)}
								>
									Sau
								</button>
							</nav>
						) : null}
					</div>
				) : null}
			</fieldset>
		</details>
	);
}
