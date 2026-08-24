'use client';

import { useState } from 'react';

import { myClassApi } from '@/components/myclass/admin/api';
import { QUESTION_CSV_TEMPLATE } from '@/features/my-class/imports/questionCsvTemplate';
import type { CurriculumImportPreview, QuestionCsvPreviewRow } from '@/features/my-class';
import { StudioPageHeader } from '@/components/myclass/admin/studio';

const SAMPLE = `{
  "course": { "title": "HRM Import Demo", "slug": "hrm-import-demo", "summary": "Curriculum mẫu" },
  "lessons": [{
    "slug": "gioi-thieu", "title": "Giới thiệu", "position": 0,
    "sections": [{
      "title": "Khái niệm", "position": 0,
      "knowledgeUnits": [{
        "slug": "hrm-import-dinh-nghia", "title": "Định nghĩa HRM", "position": 0,
        "foundationHtml": "<p>HRM quản trị nguồn nhân lực.</p>",
        "relatedSlugs": []
      }]
    }]
  }]
}`;

export default function MyClassImportPage() {
	const [raw, setRaw] = useState('');
	const [csv, setCsv] = useState('');
	const [curriculumPreview, setCurriculumPreview] = useState<CurriculumImportPreview | null>(null);
	const [questionPreview, setQuestionPreview] = useState<QuestionCsvPreviewRow[]>([]);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function curriculum(mode: 'preview' | 'commit') {
		setError(null);
		setMessage(null);
		if (!raw.trim()) {
			setError('Hãy dán dữ liệu JSON hoặc chọn “Dùng dữ liệu mẫu” trước khi kiểm tra.');
			return;
		}
		try {
			const parsed = JSON.parse(raw);
			const data = await myClassApi<CurriculumImportPreview | { title: string }>(
				'/api/admin/my-class/import',
				{
					method: 'POST',
					body: JSON.stringify({ ...parsed, kind: 'curriculum', mode }),
				},
			);
			if (mode === 'preview') setCurriculumPreview(data as CurriculumImportPreview);
			else setMessage(`Đã tạo khóa học ${(data as { title: string }).title}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'JSON không hợp lệ');
		}
	}

	async function questions(mode: 'preview' | 'commit') {
		setError(null);
		setMessage(null);
		if (!csv.trim()) {
			setError('Hãy dán dữ liệu CSV trước khi kiểm tra.');
			return;
		}
		try {
			const data = await myClassApi<QuestionCsvPreviewRow[] | { created: number }>(
				'/api/admin/my-class/import',
				{
					method: 'POST',
					body: JSON.stringify({ kind: 'questions', mode, csv }),
				},
			);
			if (mode === 'preview') setQuestionPreview(data as QuestionCsvPreviewRow[]);
			else setMessage(`Đã nhập ${(data as { created: number }).created} câu hỏi`);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'CSV không hợp lệ');
		}
	}

	return (
		<div className="mc-studio-container px-0 py-8">
			<StudioPageHeader
				eyebrow="Công cụ"
				title="Nhập dữ liệu"
				description="Luôn kiểm tra và xử lý lỗi trước khi ghi dữ liệu vào hệ thống."
			/>
			<ol aria-label="Các bước nhập dữ liệu" className="mt-6 grid gap-2 text-sm sm:grid-cols-4">
				{['1. Chuẩn bị dữ liệu', '2. Kiểm tra', '3. Xác nhận', '4. Kết quả'].map((step) => (
					<li
						key={step}
						className="rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 py-2 font-semibold text-ink-secondary"
					>
						{step}
					</li>
				))}
			</ol>
			{error ? (
				<p
					className="mt-4 rounded-[var(--mc-r-sm)] border border-error/30 bg-error-subtle p-3 text-sm text-error"
					role="alert"
				>
					{error}
				</p>
			) : null}
			{message ? (
				<p className="mt-4 rounded-[var(--mc-r-sm)] border border-mc-done/30 bg-mc-done-subtle p-3 text-sm text-mc-done">
					{message}
				</p>
			) : null}
			<section className="mc-surface mt-8 p-5 sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<h2 className="font-bold">Lộ trình từ JSON</h2>
						<p className="mc-meta mt-1">Dùng cho cấu trúc khóa học, bài học, phần và nội dung.</p>
					</div>
					<button
						type="button"
						className="min-h-11 rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-sm font-semibold hover:bg-surface-sunken"
						onClick={() => {
							setRaw(SAMPLE);
							setCurriculumPreview(null);
						}}
					>
						Dùng dữ liệu mẫu
					</button>
				</div>
				<label htmlFor="curriculum-json" className="mt-4 block text-sm font-semibold text-ink">
					Dữ liệu JSON
				</label>
				<textarea
					id="curriculum-json"
					value={raw}
					onChange={(e) => {
						setRaw(e.target.value);
						setCurriculumPreview(null);
					}}
					rows={16}
					className="mt-2 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3 py-2 font-mono text-xs"
					placeholder={SAMPLE}
				/>
				<div className="mt-3 flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => void curriculum('preview')}
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] border border-mc-rule px-4 text-sm font-semibold"
					>
						Kiểm tra dữ liệu
					</button>
					<button
						type="button"
						disabled={!curriculumPreview}
						onClick={() => void curriculum('commit')}
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper disabled:opacity-40"
					>
						Xác nhận nhập
					</button>
				</div>
				{curriculumPreview ? (
					<pre
						className="mt-4 max-h-80 overflow-auto rounded-[var(--mc-r-sm)] bg-surface-sunken p-4 text-xs"
						data-testid="import-preview"
					>
						{JSON.stringify(curriculumPreview, null, 2)}
					</pre>
				) : null}
			</section>
			<section className="mc-surface mt-6 p-5 sm:p-6">
				<h2 className="font-bold">Câu hỏi từ CSV</h2>
				<div className="mt-2 text-xs text-muted">
					<a
						href={`data:text/csv;charset=utf-8,${encodeURIComponent(QUESTION_CSV_TEMPLATE)}`}
						download="my-class-questions.csv"
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] font-semibold text-ink underline underline-offset-4"
					>
						Tải template CSV
					</a>
					<p className="mt-1 break-all">Các cột: {QUESTION_CSV_TEMPLATE.split('\n')[0]}</p>
				</div>
				<label htmlFor="questions-csv" className="mt-4 block text-sm font-semibold text-ink">
					Dữ liệu CSV
				</label>
				<textarea
					id="questions-csv"
					value={csv}
					onChange={(e) => {
						setCsv(e.target.value);
						setQuestionPreview([]);
					}}
					rows={8}
					className="mt-2 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3 py-2 font-mono text-xs"
					placeholder={QUESTION_CSV_TEMPLATE}
				/>
				<div className="mt-3 flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => void questions('preview')}
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] border border-mc-rule px-4 text-sm font-semibold"
					>
						Kiểm tra CSV
					</button>
					<button
						type="button"
						disabled={!questionPreview.length || questionPreview.some((row) => !row.ok)}
						onClick={() => void questions('commit')}
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper disabled:opacity-40"
					>
						Xác nhận nhập
					</button>
				</div>
				{questionPreview.length ? (
					<ul
						className="mt-4 divide-y divide-mc-rule rounded-[var(--mc-r-sm)] border border-mc-rule text-sm"
						data-testid="question-import-preview"
					>
						{questionPreview.map((row) => (
							<li key={row.row} className={`px-3 py-2 ${row.ok ? 'text-mc-done' : 'text-error'}`}>
								Dòng {row.row}: {row.ok ? 'Hợp lệ' : row.errors.join(', ')}
							</li>
						))}
					</ul>
				) : null}
			</section>
		</div>
	);
}
