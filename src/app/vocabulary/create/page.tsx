'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef } from 'react';
import TagInput from '@/components/TagInput';

type Term = { word: string; definition: string; partOfSpeech: string; example: string; ndkExplanation: string; hintsHard: string[]; hintsMedium: string[]; hintsEasy: string[] };
const EMPTY_TERM: Term = { word: '', definition: '', partOfSpeech: '', example: '', ndkExplanation: '', hintsHard: [], hintsMedium: [], hintsEasy: [] };

export default function CreateVocabSetPage() {
	const router = useRouter();
	const fileRef = useRef<HTMLInputElement>(null);

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [terms, setTerms] = useState<Term[]>([{ ...EMPTY_TERM }, { ...EMPTY_TERM }]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [csvMode, setCsvMode] = useState(false);
	const [csvFile, setCsvFile] = useState<File | null>(null);

	function updateTerm(idx: number, field: keyof Term, value: string | string[]) {
		setTerms((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));
	}

	function addTerm() {
		setTerms((prev) => [...prev, { ...EMPTY_TERM }]);
	}

	function removeTerm(idx: number) {
		if (terms.length <= 1) return;
		setTerms((prev) => prev.filter((_, i) => i !== idx));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim()) { setError('Vui lòng nhập tiêu đề'); return; }
		setError('');
		setSaving(true);

		try {
			if (csvMode && csvFile) {
				const formData = new FormData();
				formData.append('title', title.trim());
				formData.append('description', description.trim());
				formData.append('visibility', 'private');
				formData.append('file', csvFile);

				const res = await fetch('/api/vocab-sets', { method: 'POST', body: formData });
				const json = await res.json();
				if (!json.ok) throw new Error(json.error);
				router.push(`/vocabulary/${json.data.id}`);
			} else {
				const validTerms = terms.filter((t) => t.word.trim() && t.definition.trim());
				if (validTerms.length === 0) { setError('Thêm ít nhất 1 từ vựng'); setSaving(false); return; }

				const res = await fetch('/api/vocab-sets', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ title: title.trim(), description: description.trim(), visibility: 'private', words: validTerms.map(t => ({ term: t.word, definition: t.definition, partOfSpeech: t.partOfSpeech, example: t.example, ndkExplanation: t.ndkExplanation || null, hintsHard: t.hintsHard, hintsMedium: t.hintsMedium, hintsEasy: t.hintsEasy })) }),
				});
				const json = await res.json();
				if (!json.ok) throw new Error(json.error);
				router.push(`/vocabulary/${json.data.id}`);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
			setSaving(false);
		}
	}

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0] ?? null;
		if (f && !f.name.endsWith('.csv')) { setError('Chỉ chấp nhận file CSV'); return; }
		setCsvFile(f);
		setError('');
	}

	return (
		<main className="min-h-screen">
			<section className="border-b border-border">
				<div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
					<div className="flex items-center gap-3">
						<Link href="/vocabulary" className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors">
							← Từ vựng
						</Link>
					</div>
					<h1 className="mt-4 text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
						Tạo bộ từ vựng
					</h1>
				</div>
			</section>

			<section>
				<form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-6 py-10">
					{/* Title & Description */}
					<div className="space-y-4">
						<div>
							<label className="block text-xs font-bold uppercase tracking-widest text-muted">
								Tiêu đề *
							</label>
							<input
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="VD: IELTS Academic Vocabulary"
								className="mt-2 w-full border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted transition-colors focus:border-accent focus:outline-none"
							/>
						</div>
						<div>
							<label className="block text-xs font-bold uppercase tracking-widest text-muted">
								Mô tả
							</label>
							<input
								type="text"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Mô tả ngắn (tùy chọn)"
								className="mt-2 w-full border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted transition-colors focus:border-accent focus:outline-none"
							/>
						</div>
					</div>

					{/* Mode toggle */}
					<div className="mt-8 flex items-center gap-1 border border-border p-1">
						<button
							type="button"
							onClick={() => setCsvMode(false)}
							className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${!csvMode ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'}`}
						>
							Nhập thủ công
						</button>
						<button
							type="button"
							onClick={() => setCsvMode(true)}
							className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${csvMode ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'}`}
						>
							Upload CSV
						</button>
					</div>

					{csvMode ? (
						/* CSV Upload */
						<div className="mt-6">
							<div
								onClick={() => fileRef.current?.click()}
								className="cursor-pointer border-2 border-dashed border-border p-10 text-center transition-colors hover:border-accent hover:bg-accent-subtle"
							>
								<input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
								{csvFile ? (
									<>
										<p className="text-sm font-bold text-foreground">{csvFile.name}</p>
										<p className="mt-1 text-xs text-muted">{(csvFile.size / 1024).toFixed(1)} KB</p>
									</>
								) : (
									<>
										<svg className="mx-auto h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
										</svg>
										<p className="mt-3 text-sm font-medium text-foreground">Chọn file CSV</p>
										<p className="mt-1 text-xs text-muted">Cột: word, definition (bắt buộc), partOfSpeech, example (tùy chọn)</p>
									</>
								)}
							</div>
							{/* Download sample */}
							<div className="mt-3 text-center">
								<a
									href="/sample-vocab.csv"
									download
									className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
								>
									<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
									</svg>
									Tải file CSV mẫu
								</a>
							</div>
						</div>
					) : (
						/* Manual entry */
						<div className="mt-6 space-y-3">
							{terms.map((term, idx) => (
								<div key={idx} className="group relative border border-border p-4 transition-colors hover:border-border-hover">
									<div className="flex items-center justify-between">
										<span className="text-xs font-bold uppercase tracking-widest text-muted">{idx + 1}</span>
										{terms.length > 1 ? (
											<button
												type="button"
												onClick={() => removeTerm(idx)}
												className="text-xs text-muted hover:text-error transition-colors"
											>
												Xóa
											</button>
										) : null}
									</div>
									<div className="mt-3 grid gap-3 sm:grid-cols-2">
										<input
											type="text"
											value={term.word}
											onChange={(e) => updateTerm(idx, 'word', e.target.value)}
											placeholder="Từ vựng *"
											className="w-full border-b border-border bg-transparent px-0 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
										/>
										<input
											type="text"
											value={term.definition}
											onChange={(e) => updateTerm(idx, 'definition', e.target.value)}
											placeholder="Nghĩa / Định nghĩa *"
											className="w-full border-b border-border bg-transparent px-0 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
										/>
										<input
											type="text"
											value={term.partOfSpeech}
											onChange={(e) => updateTerm(idx, 'partOfSpeech', e.target.value)}
											placeholder="Loại từ (n, v, adj...)"
											className="w-full border-b border-border bg-transparent px-0 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
										/>
										<input
											type="text"
											value={term.example}
											onChange={(e) => updateTerm(idx, 'example', e.target.value)}
											placeholder="Ví dụ"
											className="w-full border-b border-border bg-transparent px-0 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
										/>
									</div>
									{/* NDK & Hints for Guess Who */}
									<div className="mt-3 space-y-3 border-t border-border pt-3">
										<p className="text-[10px] font-bold uppercase tracking-widest text-muted">Guess Who (tùy chọn)</p>
										<textarea
											value={term.ndkExplanation}
											onChange={(e) => updateTerm(idx, 'ndkExplanation', e.target.value)}
											placeholder="Giải thích NDK (không dùng từ đang học)"
											rows={2}
											className="w-full border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none resize-none"
										/>
										<div className="grid gap-2 sm:grid-cols-3">
											<div>
												<p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-error">Khó</p>
												<TagInput tags={term.hintsHard} onChange={(v) => updateTerm(idx, 'hintsHard', v)} placeholder="Gợi ý khó..." />
											</div>
											<div>
												<p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-warning">Trung bình</p>
												<TagInput tags={term.hintsMedium} onChange={(v) => updateTerm(idx, 'hintsMedium', v)} placeholder="Gợi ý trung bình..." />
											</div>
											<div>
												<p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-success">Dễ</p>
												<TagInput tags={term.hintsEasy} onChange={(v) => updateTerm(idx, 'hintsEasy', v)} placeholder="Gợi ý dễ..." />
											</div>
										</div>
									</div>
								</div>
							))}

							<button
								type="button"
								onClick={addTerm}
								className="flex w-full items-center justify-center gap-2 border-2 border-dashed border-border py-4 text-xs font-bold uppercase tracking-wider text-muted transition-colors hover:border-accent hover:text-accent"
							>
								<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
								</svg>
								Thêm từ
							</button>
						</div>
					)}

					{/* Error */}
					{error ? (
						<div className="mt-4 border border-error bg-error-subtle px-4 py-3 text-sm text-error">
							{error}
						</div>
					) : null}

					{/* Submit */}
					<div className="mt-8 flex items-center justify-end gap-3">
						<Link
							href="/vocabulary"
							className="px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-muted hover:text-foreground transition-colors"
						>
							Hủy
						</Link>
						<button
							type="submit"
							disabled={saving}
							className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground disabled:opacity-50"
						>
							{saving ? 'Đang lưu...' : 'Tạo bộ từ'}
						</button>
					</div>
				</form>
			</section>
		</main>
	);
}
