'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import TagInput from '@/components/TagInput';

type StoreSet = {
	id: string;
	title: string;
	description: string;
	ownerName: string;
	wordCount: number;
	updatedAt: string;
	isArchived: boolean;
};

type Term = {
	word: string;
	definition: string;
	partOfSpeech: string;
	example: string;
	ndkExplanation: string;
	hintsHard: string[];
	hintsMedium: string[];
	hintsEasy: string[];
};

const EMPTY_TERM: Term = {
	word: '', definition: '', partOfSpeech: '', example: '',
	ndkExplanation: '', hintsHard: [], hintsMedium: [], hintsEasy: [],
};

/* ── Toast ─────────────────────────────────────────────────────── */
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
	useEffect(() => {
		const t = setTimeout(onClose, 3500);
		return () => clearTimeout(t);
	}, [onClose]);
	return (
		<div
			className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 border px-5 py-3 shadow-lg text-sm font-medium ${
				type === 'success'
					? 'border-success bg-success-subtle text-success'
					: 'border-error bg-error-subtle text-error'
			}`}
		>
			{message}
			<button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100">
				<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	);
}

/* ── Confirm Modal ──────────────────────────────────────────────── */
function ConfirmModal({ open, title, message, onConfirm, onCancel }: {
	open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
			<div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
			<div className="relative w-full max-w-md border border-border bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
				<h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</h3>
				<p className="mt-2 text-sm text-foreground-secondary">{message}</p>
				<div className="mt-6 flex justify-end gap-3">
					<button onClick={onCancel} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted hover:text-foreground transition-colors">
						Hủy
					</button>
					<button onClick={onConfirm} className="border-2 border-error bg-error px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-transparent hover:text-error">
						Xác nhận xóa
					</button>
				</div>
			</div>
		</div>
	);
}

export default function AdminVocabularyPage() {
	const [sets, setSets] = useState<StoreSet[]>([]);
	const [loading, setLoading] = useState(true);
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
	const [deleting, setDeleting] = useState<string | null>(null);
	const [confirmDelete, setConfirmDelete] = useState<StoreSet | null>(null);
	const [togglingId, setTogglingId] = useState<string | null>(null);

	// Upload form state
	const [showUpload, setShowUpload] = useState(false);
	const [uploadTitle, setUploadTitle] = useState('');
	const [uploadDesc, setUploadDesc] = useState('');
	const [uploadMethod, setUploadMethod] = useState<'csv' | 'manual'>('csv');
	const [csvFile, setCsvFile] = useState<File | null>(null);
	const [manualTerms, setManualTerms] = useState<Term[]>([
		{ ...EMPTY_TERM },
		{ ...EMPTY_TERM },
	]);
	const [uploading, setUploading] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);

	const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

	const fetchSets = useCallback(async () => {
		try {
			const res = await fetch('/api/admin/vocab-sets');
			const json = await res.json();
			if (json.ok) setSets(json.data.items);
		} catch { /* ignore */ } finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { void fetchSets(); }, [fetchSets]);

	/* ── Toggle public/private ── */
	async function handleTogglePublic(set: StoreSet) {
		setTogglingId(set.id);
		try {
			const res = await fetch(`/api/vocab-sets/${set.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isArchived: !set.isArchived }),
			});
			const json = await res.json();
			if (json.ok) {
				setSets((prev) => prev.map((s) => s.id === set.id ? { ...s, isArchived: !s.isArchived } : s));
				showToast(!set.isArchived ? 'Đã ẩn bộ từ khỏi cửa hàng' : 'Đã công khai bộ từ', 'success');
			} else {
				showToast(json.error ?? 'Có lỗi xảy ra', 'error');
			}
		} catch { showToast('Có lỗi xảy ra', 'error'); }
		finally { setTogglingId(null); }
	}

	/* ── Delete ── */
	async function handleDelete(id: string) {
		setDeleting(id);
		try {
			const res = await fetch(`/api/vocab-sets/${id}`, { method: 'DELETE' });
			const json = await res.json();
			if (json.ok) {
				setSets((prev) => prev.filter((s) => s.id !== id));
				showToast('Đã xóa bộ từ', 'success');
			} else {
				showToast(json.error ?? 'Có lỗi xảy ra', 'error');
			}
		} catch { showToast('Có lỗi xảy ra', 'error'); }
		finally { setDeleting(null); setConfirmDelete(null); }
	}

	/* ── Upload new set ── */
	async function handleUpload(e: React.FormEvent) {
		e.preventDefault();
		if (!uploadTitle.trim()) { showToast('Vui lòng nhập tiêu đề', 'error'); return; }
		setUploading(true);

		try {
			if (uploadMethod === 'csv' && csvFile) {
				const formData = new FormData();
				formData.append('title', uploadTitle.trim());
				formData.append('description', uploadDesc.trim());
				formData.append('visibility', 'public');
				formData.append('file', csvFile);
				const res = await fetch('/api/vocab-sets', { method: 'POST', body: formData });
				const json = await res.json();
				if (!json.ok) throw new Error(json.error);
				showToast(`Đã tạo "${uploadTitle}" và đưa vào cửa hàng!`, 'success');
			} else {
				const validTerms = manualTerms.filter((t) => t.word.trim() && t.definition.trim());
				if (validTerms.length === 0) { showToast('Thêm ít nhất 1 từ hợp lệ', 'error'); setUploading(false); return; }
				const res = await fetch('/api/vocab-sets', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
						title: uploadTitle.trim(),
						description: uploadDesc.trim(),
						visibility: 'public',
						words: validTerms.map(t => ({
							term: t.word,
							definition: t.definition,
							partOfSpeech: t.partOfSpeech,
							example: t.example,
							ndkExplanation: t.ndkExplanation || null,
							hintsHard: t.hintsHard,
							hintsMedium: t.hintsMedium,
							hintsEasy: t.hintsEasy,
						})),
					}),
				});
				const json = await res.json();
				if (!json.ok) throw new Error(json.error);
				showToast(`Đã tạo "${uploadTitle}" và đưa vào cửa hàng!`, 'success');
			}
			// Reset form
			setShowUpload(false);
			setUploadTitle(''); setUploadDesc(''); setCsvFile(null);
			setManualTerms([{ ...EMPTY_TERM }, { ...EMPTY_TERM }]);
			if (fileRef.current) fileRef.current.value = '';
			await fetchSets();
		} catch (err) {
			showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra', 'error');
		} finally {
			setUploading(false);
		}
	}

	function updateTerm(idx: number, field: keyof Term, val: string | string[]) {
		setManualTerms((prev) => prev.map((t, i) => i === idx ? { ...t, [field]: val } : t));
	}

	const publicSets = sets.filter((s) => !s.isArchived);
	const privateSets = sets.filter((s) => s.isArchived);

	return (
		<div className="mx-auto max-w-5xl px-6 py-8">
			{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
			<ConfirmModal
				open={!!confirmDelete}
				title="Xóa bộ từ vựng"
				message={`Bạn có chắc muốn xóa "${confirmDelete?.title}"? Hành động này không thể hoàn tác.`}
				onConfirm={() => confirmDelete && void handleDelete(confirmDelete.id)}
				onCancel={() => setConfirmDelete(null)}
			/>

			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-bold uppercase tracking-widest text-muted">Admin</p>
					<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Cửa hàng từ vựng</h1>
					<p className="mt-1 text-sm text-foreground-secondary">
						Quản lý bộ từ vựng Admin tạo và công khai cho học viên tải về.
					</p>
				</div>
				<button
					onClick={() => setShowUpload((v) => !v)}
					className={`inline-flex shrink-0 items-center gap-2 border-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
						showUpload
							? 'border-border text-muted hover:border-foreground hover:text-foreground'
							: 'border-foreground bg-foreground text-background hover:bg-transparent hover:text-foreground'
					}`}
				>
					{showUpload ? (
						<>
							<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
							Hủy
						</>
					) : (
						<>
							<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
							</svg>
							Thêm bộ từ mới
						</>
					)}
				</button>
			</div>

			{/* Upload Form */}
			{showUpload && (
				<form
					onSubmit={handleUpload}
					className="mt-6 border border-border bg-surface p-6 space-y-5"
				>
					<h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Tạo bộ từ mới cho cửa hàng</h2>

					{/* Title & Desc */}
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
								Tiêu đề <span className="text-error">*</span>
							</label>
							<input
								type="text"
								value={uploadTitle}
								onChange={(e) => setUploadTitle(e.target.value)}
								placeholder="Ví dụ: IELTS Academic Word List 1"
								className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground"
								required
							/>
						</div>
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
								Mô tả
							</label>
							<input
								type="text"
								value={uploadDesc}
								onChange={(e) => setUploadDesc(e.target.value)}
								placeholder="Mô tả ngắn về bộ từ..."
								className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground"
							/>
						</div>
					</div>

					{/* Method selector */}
					<div>
						<label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Phương thức</label>
						<div className="flex gap-2">
							{(['csv', 'manual'] as const).map((m) => (
								<button
									key={m}
									type="button"
									onClick={() => setUploadMethod(m)}
									className={`border-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
										uploadMethod === m
											? 'border-foreground bg-foreground text-background'
											: 'border-border text-muted hover:border-foreground hover:text-foreground'
									}`}
								>
									{m === 'csv' ? 'Upload CSV' : 'Nhập tay'}
								</button>
							))}
						</div>
					</div>

					{/* CSV Upload */}
					{uploadMethod === 'csv' && (
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
								File CSV <span className="text-error">*</span>
							</label>
							<div className="flex items-center gap-3">
								<input
									ref={fileRef}
									type="file"
									accept=".csv"
									onChange={(e) => {
										const f = e.target.files?.[0] ?? null;
										if (f && !f.name.endsWith('.csv')) { showToast('Chỉ chấp nhận .csv', 'error'); return; }
										setCsvFile(f);
									}}
									className="flex-1 border border-border bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:border-0 file:bg-surface-hover file:px-3 file:py-1 file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-foreground"
								/>
								<a
									href={`data:text/csv;charset=utf-8,${encodeURIComponent('\uFEFFword,definition,partOfSpeech,example\nhello,xin chào,interjection,Hello everyone!\n')}`}
									download="sample-vocab.csv"
									className="shrink-0 border border-border px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted transition-colors hover:border-foreground hover:text-foreground"
								>
									Tải CSV mẫu
								</a>
							</div>
							<p className="mt-1.5 text-[11px] text-muted">
								Cột bắt buộc: <code className="font-mono">word</code>, <code className="font-mono">definition</code>. Tùy chọn: <code className="font-mono">partOfSpeech</code>, <code className="font-mono">example</code>.
							</p>
						</div>
					)}

					{/* Manual Terms */}
					{uploadMethod === 'manual' && (
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Từ vựng</label>
							<div className="space-y-2">
								{manualTerms.map((t, i) => (
									<div key={i} className="border border-border bg-background p-3 space-y-2">
										<div className="grid grid-cols-[1fr_1fr_auto] gap-2">
											<input
												value={t.word}
												onChange={(e) => updateTerm(i, 'word', e.target.value)}
												placeholder={`Từ ${i + 1}`}
												className="border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground"
											/>
											<input
												value={t.definition}
												onChange={(e) => updateTerm(i, 'definition', e.target.value)}
												placeholder="Nghĩa / định nghĩa"
												className="border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground"
											/>
											<button
												type="button"
												onClick={() => setManualTerms((prev) => prev.filter((_, j) => j !== i))}
												className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-error"
												disabled={manualTerms.length <= 1}
											>
												<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
													<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
										</div>
										{/* NDK & Hints (Guess Who) */}
										<div className="border-t border-border pt-2 space-y-2">
											<p className="text-[10px] font-bold uppercase tracking-widest text-muted">Guess Who (tùy chọn)</p>
											<textarea
												value={t.ndkExplanation}
												onChange={(e) => updateTerm(i, 'ndkExplanation', e.target.value)}
												placeholder="Giải thích NDK (không dùng từ đang học)"
												rows={2}
												className="w-full border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground resize-none"
											/>
											<div className="grid gap-2 sm:grid-cols-3">
												<div>
													<p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-error">Khó</p>
													<TagInput tags={t.hintsHard} onChange={(v) => updateTerm(i, 'hintsHard', v)} placeholder="Gợi ý khó..." />
												</div>
												<div>
													<p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-warning">Trung bình</p>
													<TagInput tags={t.hintsMedium} onChange={(v) => updateTerm(i, 'hintsMedium', v)} placeholder="Gợi ý trung bình..." />
												</div>
												<div>
													<p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-success">Dễ</p>
													<TagInput tags={t.hintsEasy} onChange={(v) => updateTerm(i, 'hintsEasy', v)} placeholder="Gợi ý dễ..." />
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
							<button
								type="button"
								onClick={() => setManualTerms((prev) => [...prev, { ...EMPTY_TERM }])}
								className="mt-2 text-xs font-bold uppercase tracking-wider text-accent hover:underline"
							>
								+ Thêm từ
							</button>
						</div>
					)}

					<div className="flex items-center gap-3 pt-2 border-t border-border">
						<button
							type="submit"
							disabled={uploading}
							className="inline-flex items-center gap-2 border-2 border-foreground bg-foreground px-5 py-2 text-xs font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground disabled:opacity-50"
						>
							{uploading ? 'Đang tạo...' : 'Tạo & Đưa vào cửa hàng'}
						</button>
						<p className="text-[11px] text-muted">Bộ từ sẽ được công khai ngay lập tức.</p>
					</div>
				</form>
			)}

			{loading ? (
				<div className="mt-12 flex justify-center">
					<div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-accent" />
				</div>
			) : (
				<>
					{/* Stats bar */}
					<div className="mt-8 flex items-center gap-6 border-b border-border pb-4">
						<div>
							<span className="text-2xl font-black tabular-nums text-foreground">{publicSets.length}</span>
							<span className="ml-2 text-xs font-bold uppercase tracking-widest text-accent">Đang công khai</span>
						</div>
						<div className="h-4 w-px bg-border" />
						<div>
							<span className="text-2xl font-black tabular-nums text-foreground">{privateSets.length}</span>
							<span className="ml-2 text-xs font-bold uppercase tracking-widest text-muted">Đang ẩn</span>
						</div>
						<div className="ml-auto text-[11px] text-muted">
							Tổng {sets.length} bộ từ
						</div>
					</div>

					{sets.length === 0 ? (
						<div className="mt-16 text-center">
							<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-hover">
								<svg className="h-7 w-7 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
								</svg>
							</div>
							<p className="mt-5 text-sm font-medium text-foreground">Chưa có bộ từ nào</p>
							<p className="mt-1 text-xs text-muted">Nhấn &ldquo;Thêm bộ từ mới&rdquo; để bắt đầu.</p>
						</div>
					) : (
						<>
							{/* Public sets */}
							{publicSets.length > 0 && (
								<section className="mt-6">
									<h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-accent">
										Đang công khai ({publicSets.length})
									</h2>
									<div className="divide-y divide-border border border-border">
										{publicSets.map((set) => (
											<SetRow
												key={set.id}
												set={set}
												deleting={deleting === set.id}
												toggling={togglingId === set.id}
												onToggle={() => void handleTogglePublic(set)}
												onDelete={() => setConfirmDelete(set)}
											/>
										))}
									</div>
								</section>
							)}

							{/* Private (draft) sets */}
							{privateSets.length > 0 && (
								<section className="mt-8">
									<h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted">
										Đang ẩn — chưa công khai ({privateSets.length})
									</h2>
									<div className="divide-y divide-border border border-border">
										{privateSets.map((set) => (
											<SetRow
												key={set.id}
												set={set}
												deleting={deleting === set.id}
												toggling={togglingId === set.id}
												onToggle={() => void handleTogglePublic(set)}
												onDelete={() => setConfirmDelete(set)}
											/>
										))}
									</div>
								</section>
							)}
						</>
					)}
				</>
			)}
		</div>
	);
}

/* ── SetRow sub-component ────────────────────────────────────── */
function SetRow({
	set,
	deleting,
	toggling,
	onToggle,
	onDelete,
}: {
	set: StoreSet;
	deleting: boolean;
	toggling: boolean;
	onToggle: () => void;
	onDelete: () => void;
}) {
	return (
		<div className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-hover">
			{/* Status dot */}
			<div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!set.isArchived ? 'bg-success' : 'bg-muted'}`} />

			{/* Info */}
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="text-sm font-bold text-foreground truncate">{set.title}</span>
					<span className="shrink-0 rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-bold tabular-nums text-muted">
						{set.wordCount} từ
					</span>
					{!set.isArchived && (
						<span className="shrink-0 rounded-full bg-success-subtle px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
							Public
						</span>
					)}
				</div>
				{set.description && (
					<p className="mt-0.5 text-[11px] text-muted truncate">{set.description}</p>
				)}
				<p className="mt-0.5 text-[10px] text-muted">
					{new Date(set.updatedAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' })}
				</p>
			</div>

			{/* Actions */}
			<div className="flex shrink-0 items-center gap-2">
				{/* Toggle public */}
				<button
					onClick={onToggle}
					disabled={toggling}
					title={set.isArchived ? 'Công khai lên cửa hàng' : 'Ẩn khỏi cửa hàng'}
					className={`flex items-center gap-1.5 border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${
						set.isArchived
							? 'border-success text-success hover:bg-success hover:text-white'
							: 'border-border text-muted hover:border-foreground hover:text-foreground'
					}`}
				>
					{toggling ? (
						<span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
					) : set.isArchived ? (
						<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
						</svg>
					) : (
						<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
							<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					)}
					{set.isArchived ? 'Công khai' : 'Ẩn'}
				</button>

				{/* Delete */}
				<button
					onClick={onDelete}
					disabled={deleting}
					title="Xóa bộ từ"
					className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-error disabled:opacity-50"
				>
					{deleting ? (
						<span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
					) : (
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
						</svg>
					)}
				</button>
			</div>
		</div>
	);
}
