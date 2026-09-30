'use client';

import { useRef, useState } from 'react';

import { myClassApi } from '@/components/myclass/admin/api';
import { McButton, McEmpty, McSheet } from '@/components/myclass/ui';
import { TEST_QUESTION_CSV_COLUMNS } from '@/features/my-class/imports/testQuestionCsvTemplate';
import type { TestQuestionCsvPreview } from '@/features/my-class';

export default function TestCsvImport({
	open,
	onClose,
	testId,
	existingCount,
	onImported,
}: {
	open: boolean;
	onClose: () => void;
	testId: string;
	existingCount: number;
	onImported: () => void | Promise<void>;
}) {
	const fileRef = useRef<HTMLInputElement>(null);
	const [csv, setCsv] = useState('');
	const [strategy, setStrategy] = useState<'append' | 'replace'>('append');
	const [preview, setPreview] = useState<TestQuestionCsvPreview | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function check() {
		setBusy(true);
		setError(null);
		try {
			const next = await myClassApi<TestQuestionCsvPreview>(
				`/api/admin/my-class/tests/${testId}/import`,
				{
					method: 'POST',
					body: JSON.stringify({ csv, mode: 'preview', strategy }),
				},
			);
			setPreview(next);
		} catch (err) {
			setPreview(null);
			setError(err instanceof Error ? err.message : 'Không kiểm tra được CSV');
		} finally {
			setBusy(false);
		}
	}

	async function commit() {
		if (!preview || preview.summary.invalid > 0 || preview.summary.valid === 0) return;
		setBusy(true);
		setError(null);
		try {
			await myClassApi(`/api/admin/my-class/tests/${testId}/import`, {
				method: 'POST',
				body: JSON.stringify({ csv, mode: 'commit', strategy }),
			});
			setCsv('');
			setPreview(null);
			await onImported();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không nhập được CSV');
		} finally {
			setBusy(false);
		}
	}

	function onFile(file: File | undefined) {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			setCsv(String(reader.result ?? ''));
			setPreview(null);
		};
		reader.readAsText(file);
	}

	return (
		<McSheet open={open} onClose={onClose} title="Nhập câu hỏi CSV" side="right">
			<div className="space-y-5" data-testid="my-class-test-csv-import">
				<section className="space-y-2">
					<p className="text-sm font-semibold">Định dạng file</p>
					<p className="mc-meta">
						Mỗi dòng là một câu hỏi. Header không phân biệt hoa/thường; nhận CSV dấu phẩy, chấm phẩy
						hoặc tab (Excel/Sheets). Không cần cột test_slug, question_slug hay ku_slugs.
					</p>
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm">
							<thead>
								<tr className="border-b border-mc-rule">
									<th className="py-2 pr-3 font-semibold">Cột</th>
									<th className="py-2 pr-3 font-semibold">Bắt buộc</th>
									<th className="py-2 pr-3 font-semibold">Mô tả</th>
									<th className="py-2 font-semibold">Ví dụ</th>
								</tr>
							</thead>
							<tbody>
								{TEST_QUESTION_CSV_COLUMNS.map((column) => (
									<tr key={column.key} className="border-b border-mc-rule/60 align-top">
										<td className="py-2 pr-3">
											<code className="text-xs">{column.key}</code>
											{column.aliases ? <p className="mc-meta mt-1">{column.aliases}</p> : null}
										</td>
										<td className="py-2 pr-3">{column.required ? 'Có' : 'Không'}</td>
										<td className="py-2 pr-3">{column.description}</td>
										<td className="py-2 text-ink-secondary">{column.example || '—'}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<a
						href={`/api/admin/my-class/tests/${testId}/import?template=1`}
						className="inline-flex min-h-11 items-center text-sm font-semibold text-ink underline"
					>
						Tải CSV mẫu
					</a>
				</section>
				<label className="block text-sm">
					Dán CSV
					<textarea
						value={csv}
						onChange={(event) => {
							setCsv(event.target.value);
							setPreview(null);
						}}
						rows={8}
						placeholder="stem,option_a,option_b,correct_option"
						className="mt-1.5 w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 py-2 font-mono text-xs"
					/>
				</label>
				<div className="flex flex-wrap items-center gap-2">
					<input
						ref={fileRef}
						type="file"
						accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
						className="sr-only"
						onChange={(event) => onFile(event.target.files?.[0])}
					/>
					<McButton variant="secondary" onClick={() => fileRef.current?.click()}>
						Chọn file
					</McButton>
					<label className="flex min-h-11 items-center gap-2 text-sm">
						<input
							type="radio"
							name="csv-strategy"
							checked={strategy === 'append'}
							onChange={() => setStrategy('append')}
						/>
						Thêm vào cuối
					</label>
					<label className="flex min-h-11 items-center gap-2 text-sm">
						<input
							type="radio"
							name="csv-strategy"
							checked={strategy === 'replace'}
							onChange={() => setStrategy('replace')}
						/>
						Thay thế toàn bộ
					</label>
				</div>
				{strategy === 'replace' && existingCount > 0 ? (
					<p className="text-sm text-warning">
						Sẽ gỡ {existingCount} câu hiện có khỏi bài kiểm tra (câu hỏi vẫn nằm trong ngân hàng).
					</p>
				) : null}
				{error ? <p className="text-sm text-error">{error}</p> : null}
				<McButton disabled={busy || !csv.trim()} loading={busy} onClick={() => void check()}>
					Kiểm tra
				</McButton>
				{preview ? (
					preview.summary.total === 0 ? (
						<McEmpty title="Không có dòng dữ liệu" description="Kiểm tra header và nội dung CSV." />
					) : (
						<div className="space-y-3">
							<p className="mc-meta">
								<span className="mc-num">{preview.summary.valid}</span> /{' '}
								<span className="mc-num">{preview.summary.total}</span> dòng hợp lệ
							</p>
							<ul className="space-y-2">
								{preview.rows.map((row) => (
									<li
										key={row.row}
										className="rounded-[var(--mc-r-sm)] border border-mc-rule px-3 py-2 text-sm"
									>
										<p className="font-semibold">
											Dòng {row.row}
											{row.ok ? '' : ' — lỗi'}
										</p>
										<p className="mt-1 text-ink-secondary">{row.stem.slice(0, 120) || '—'}</p>
										<p className="mc-meta mt-1">
											{row.optionCount} đáp án · {row.type} · đúng {row.correctKey || '—'} · Bloom{' '}
											{row.difficulty}
										</p>
										{row.errors.length ? (
											<ul className="mt-1 list-disc pl-4 text-error">
												{row.errors.map((item) => (
													<li key={item}>{item}</li>
												))}
											</ul>
										) : null}
									</li>
								))}
							</ul>
							<McButton
								disabled={busy || preview.summary.invalid > 0 || preview.summary.valid === 0}
								loading={busy}
								onClick={() => void commit()}
							>
								Nhập {preview.summary.valid} câu
							</McButton>
						</div>
					)
				) : null}
			</div>
		</McSheet>
	);
}
