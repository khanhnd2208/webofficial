'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import TagInput from '@/components/TagInput';
import { routes } from '@/config/routes';
import { clientLoginHref } from '@/lib/admin/client';

/* ══════════════════════════════════════════════════════════════════
   Types
══════════════════════════════════════════════════════════════════ */
type StoreSet = {
	id: string;
	title: string;
	description: string;
	ownerName: string;
	wordCount: number;
	updatedAt: string;
	isArchived?: boolean;
	alreadyOwned?: boolean;
};

type Term = { word: string; definition: string; partOfSpeech: string; example: string; pronunciation: string; meaningEn: string; meaningVi: string; ndkExplanation: string; hintsHard: string[]; hintsMedium: string[]; hintsEasy: string[] };
const EMPTY_TERM: Term = { word: '', definition: '', partOfSpeech: '', example: '', pronunciation: '', meaningEn: '', meaningVi: '', ndkExplanation: '', hintsHard: [], hintsMedium: [], hintsEasy: [] };

type EditableWord = {
	id?: string;
	term: string;
	definition: string;
	partOfSpeech: string;
	example: string;
	pronunciation: string;
	meaningEn: string;
	meaningVi: string;
	ndkExplanation: string;
	hintsHard: string[];
	hintsMedium: string[];
	hintsEasy: string[];
	_isNew?: boolean;
	_deleted?: boolean;
	_expanded?: boolean;
};
const EMPTY_EDIT_WORD: EditableWord = { term: '', definition: '', partOfSpeech: '', example: '', pronunciation: '', meaningEn: '', meaningVi: '', ndkExplanation: '', hintsHard: [], hintsMedium: [], hintsEasy: [], _isNew: true, _deleted: false, _expanded: true };

/* ══════════════════════════════════════════════════════════════════
   Shared UI helpers
══════════════════════════════════════════════════════════════════ */
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
	useEffect(() => {
		const t = setTimeout(onClose, 3500);
		return () => clearTimeout(t);
	}, [onClose]);
	return (
		<div
			className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 border px-5 py-3 shadow-lg text-sm font-medium ${
				type === 'success'
					? 'border-success bg-success-subtle text-success'
					: type === 'error'
						? 'border-error bg-error-subtle text-error'
						: 'border-border bg-surface text-foreground'
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

/* ══════════════════════════════════════════════════════════════════
   User Store View — browse & download
══════════════════════════════════════════════════════════════════ */
function UserStoreView() {
	const [items, setItems] = useState<StoreSet[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [search, setSearch] = useState('');
	const [adding, setAdding] = useState<string | null>(null);
	const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

	const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
		setToast({ message, type });
	}, []);

	useEffect(() => {
		async function fetchStore() {
			try {
				const res = await fetch('/api/vocab-sets/store');
				const json = await res.json();
				if (!json.ok) { setError(json.error); return; }
				const storeItems = json.data.items as StoreSet[];
				setItems(storeItems);
				// Pre-mark already owned
				const owned = new Set(storeItems.filter((s) => s.alreadyOwned).map((s) => s.id));
				setAddedIds(owned);
			} catch {
				setError('Có lỗi xảy ra');
			} finally {
				setLoading(false);
			}
		}
		fetchStore();
	}, []);

	const handleAdd = useCallback(async (set: StoreSet) => {
		if (adding || addedIds.has(set.id)) return;
		setAdding(set.id);
		// Optimistic
		setAddedIds((prev) => new Set(prev).add(set.id));
		try {
			const res = await fetch('/api/vocab-sets/store', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ vocabSetId: set.id }),
			});
			if (res.status === 409) { showToast('Bạn đã sở hữu bộ từ này', 'info'); return; }
			if (res.status === 401) {
				window.location.assign(clientLoginHref(routes.vocabStore));
				return;
			}
			if (!res.ok) throw new Error('Server error');
			showToast(`Đã thêm "${set.title}" vào thư viện!`, 'success');
		} catch {
			setAddedIds((prev) => { const n = new Set(prev); n.delete(set.id); return n; });
			showToast('Không thể thêm bộ từ. Vui lòng thử lại.', 'error');
		} finally {
			setAdding(null);
		}
	}, [adding, addedIds, showToast]);

	const filtered = search.trim()
		? items.filter((s) =>
			s.title.toLowerCase().includes(search.toLowerCase()) ||
			s.description.toLowerCase().includes(search.toLowerCase())
		)
		: items;

	if (loading) return (
		<div className="flex h-64 items-center justify-center">
			<div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-rose" />
		</div>
	);
	if (error) return (
		<div className="flex h-64 items-center justify-center">
			<p className="text-sm text-error">{error}</p>
		</div>
	);

	return (
		<div className="space-y-6">
			{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

			{/* Stats + search */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-6">
					<div>
						<div className="text-xl font-black text-rose">{items.length}</div>
						<div className="text-[10px] font-bold uppercase tracking-widest text-muted">Bộ từ</div>
					</div>
					<div className="h-6 w-px bg-border" />
					<div>
						<div className="text-xl font-black text-teal">{items.reduce((s, i) => s + i.wordCount, 0)}</div>
						<div className="text-[10px] font-bold uppercase tracking-widest text-muted">Tổng từ</div>
					</div>
				</div>
				<div className="relative sm:w-72">
					<svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
					</svg>
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Tìm bộ từ vựng..."
						className="w-full border border-border bg-surface py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted focus:border-rose focus:outline-none"
					/>
				</div>
			</div>

			{/* Grid */}
			{filtered.length === 0 ? (
				<div className="border-2 border-dashed border-border py-16 text-center">
					<p className="text-sm text-muted">
						{items.length === 0 ? 'Cửa hàng đang trống.' : 'Không tìm thấy bộ từ phù hợp.'}
					</p>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{filtered.map((set) => {
						const owned = addedIds.has(set.id);
						const isAdding = adding === set.id;
						return (
							<div key={set.id} className="group border border-border p-5 transition-all hover:bg-surface-hover">
								<div className="mb-3 flex items-center gap-2">
									<span className="rounded-full bg-rose-subtle px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rose">Cửa hàng</span>
									<span className="text-[10px] font-bold text-muted">{set.wordCount} từ</span>
								</div>
								<h3 className="text-sm font-bold uppercase tracking-tight text-foreground">{set.title}</h3>
								{set.description && <p className="mt-2 line-clamp-2 text-xs text-foreground-secondary">{set.description}</p>}
								<div className="mt-3 flex items-center gap-2 text-[10px] text-muted">
									<span>Bởi {set.ownerName}</span>
									<span>·</span>
									<time>{new Date(set.updatedAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' })}</time>
								</div>
								<div className="mt-4">
									{owned ? (
										<span className="inline-flex items-center gap-1.5 text-xs font-bold text-success">
											<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
												<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
											</svg>
											Đã có trong thư viện
										</span>
									) : (
										<button
											onClick={() => handleAdd(set)}
											disabled={isAdding}
											className="inline-flex items-center gap-2 border-2 border-foreground bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground disabled:opacity-50 active:scale-95"
										>
											{isAdding ? (
												<><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-t-transparent" />Đang thêm...</>
											) : (
												<><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>Thêm vào thư viện</>
											)}
										</button>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

/* ══════════════════════════════════════════════════════════════════
   Admin Store Management View
══════════════════════════════════════════════════════════════════ */
export function AdminStoreView() {
	const [sets, setSets] = useState<StoreSet[]>([]);
	const [loading, setLoading] = useState(true);
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
	const [confirmDelete, setConfirmDelete] = useState<StoreSet | null>(null);
	const [togglingId, setTogglingId] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [editingSetId, setEditingSetId] = useState<string | null>(null);

	// Create form state
	const [showCreate, setShowCreate] = useState(false);
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

	/* ── Toggle public/private (isArchived) ── */
	async function handleToggleVisibility(set: StoreSet) {
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
				showToast(!set.isArchived ? 'Đã ẩn bộ từ khỏi cửa hàng' : 'Đã hiện bộ từ trong cửa hàng', 'success');
			} else {
				showToast(json.error ?? 'Có lỗi xảy ra', 'error');
			}
		} catch { showToast('Có lỗi xảy ra', 'error'); }
		finally { setTogglingId(null); }
	}

	/* ── Delete (archive) ── */
	async function handleDelete(id: string) {
		setDeletingId(id);
		try {
			const res = await fetch(`/api/vocab-sets/${id}?action=archive`, { method: 'DELETE' });
			const json = await res.json();
			if (json.ok) {
				setSets((prev) => prev.filter((s) => s.id !== id));
				showToast('Đã xóa bộ từ', 'success');
			} else {
				showToast(json.error ?? 'Có lỗi xảy ra', 'error');
			}
		} catch { showToast('Có lỗi xảy ra', 'error'); }
		finally { setDeletingId(null); setConfirmDelete(null); }
	}

	/* ── Create new set ── */
	async function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		if (!uploadTitle.trim()) { showToast('Vui lòng nhập tiêu đề', 'error'); return; }
		setUploading(true);
		try {
			if (uploadMethod === 'csv' && csvFile) {
				const formData = new FormData();
				formData.append('title', uploadTitle.trim());
				formData.append('description', uploadDesc.trim());
				formData.append('file', csvFile);
				const res = await fetch('/api/vocab-sets', { method: 'POST', body: formData });
				const json = await res.json();
				if (!json.ok) throw new Error(json.error);
			} else {
				const validTerms = manualTerms.filter((t) => t.word.trim() && t.definition.trim());
				if (validTerms.length === 0) { showToast('Thêm ít nhất 1 từ hợp lệ', 'error'); setUploading(false); return; }
				const res = await fetch('/api/vocab-sets', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						title: uploadTitle.trim(),
						description: uploadDesc.trim(),
						words: validTerms.map((t) => ({
							term: t.word,
							definition: t.meaningVi || t.definition,
							partOfSpeech: t.partOfSpeech,
							example: t.example,
							pronunciation: t.pronunciation,
							meaningEn: t.meaningEn,
							meaningVi: t.meaningVi || t.definition,
							ndkExplanation: t.ndkExplanation || null,
							hintsHard: t.hintsHard,
							hintsMedium: t.hintsMedium,
							hintsEasy: t.hintsEasy,
						})),
					}),
				});
				const json = await res.json();
				if (!json.ok) throw new Error(json.error);
			}
			showToast(`Đã tạo "${uploadTitle}" thành công!`, 'success');
			setShowCreate(false);
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

	if (loading) return (
		<div className="flex h-64 items-center justify-center">
			<div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
		</div>
	);

	return (
		<div>
			{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
			<ConfirmModal
				open={!!confirmDelete}
				title="Xóa bộ từ vựng"
				message={`Bạn có chắc muốn xóa "${confirmDelete?.title}"? Hành động này không thể hoàn tác.`}
				onConfirm={() => confirmDelete && void handleDelete(confirmDelete.id)}
				onCancel={() => setConfirmDelete(null)}
			/>

			{/* Admin header */}
			<div className="mb-6 flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-bold uppercase tracking-widest text-muted">Admin · Quản lí cửa hàng</p>
					<h2 className="mt-1 text-xl font-black tracking-tight text-foreground">Bộ từ của cửa hàng</h2>
					<p className="mt-1 text-sm text-foreground-secondary">
						Không gian này tách biệt với kho từ cá nhân. Hiện/ẩn bộ từ để kiểm soát nội dung cửa hàng.
					</p>
				</div>
				<button
					onClick={() => setShowCreate((v) => !v)}
					className={`shrink-0 inline-flex items-center gap-2 border-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
						showCreate
							? 'border-border text-muted hover:border-foreground hover:text-foreground'
							: 'border-foreground bg-foreground text-background hover:bg-transparent hover:text-foreground'
					}`}
				>
					{showCreate ? (
						<><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>Hủy</>
					) : (
						<><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>Thêm bộ từ mới</>
					)}
				</button>
			</div>

			{/* Create form */}
			{showCreate && (
				<form onSubmit={handleCreate} className="mb-8 border border-border bg-surface p-6 space-y-5">
					<h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Tạo bộ từ mới</h3>
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Tiêu đề <span className="text-error">*</span></label>
							<input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)}
								placeholder="Ví dụ: IELTS Academic Word List 1"
								className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground" required />
						</div>
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Mô tả</label>
							<input type="text" value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)}
								placeholder="Mô tả ngắn..."
								className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground" />
						</div>
					</div>
					<div>
						<label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Phương thức</label>
						<div className="flex gap-2">
							{(['csv', 'manual'] as const).map((m) => (
								<button key={m} type="button" onClick={() => setUploadMethod(m)}
									className={`border-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
										uploadMethod === m ? 'border-foreground bg-foreground text-background' : 'border-border text-muted hover:border-foreground hover:text-foreground'
									}`}>
									{m === 'csv' ? 'Upload CSV / Excel' : 'Nhập tay'}
								</button>
							))}
						</div>
					</div>
					{uploadMethod === 'csv' ? (
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">File CSV / Excel <span className="text-error">*</span></label>
							<div className="flex items-center gap-3">
								<input ref={fileRef} type="file" accept=".csv,.xlsx"
									onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
									className="block text-sm text-foreground file:mr-3 file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-foreground hover:file:bg-surface-hover" />
								{csvFile && <span className="text-xs text-muted">{csvFile.name}</span>}
							</div>
							<div className="mt-1.5 flex flex-wrap items-start gap-x-4 gap-y-1">
								<p className="text-[11px] text-muted">
									Bắt buộc: <code className="text-foreground">word/term, definition, ndk_explanation</code>
									{' · '}
									Tuỳ chọn: <code>partOfSpeech, example, hints_hard, hints_medium, hints_easy</code>
								</p>
								<a
									href="/api/vocab-sets/sample"
									download="sample-vocab.xlsx"
									className="shrink-0 text-[11px] font-bold underline underline-offset-2 text-foreground-secondary hover:text-foreground transition-colors"
								>
									↓ Tải file mẫu (.xlsx)
								</a>
							</div>
						</div>
					) : (
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Danh sách từ</label>
							<div className="space-y-2">
								{manualTerms.map((t, i) => (
									<div key={i} className="border border-border bg-background p-3 space-y-2">
										<div className="grid gap-2 sm:grid-cols-4">
											<input type="text" placeholder={`Từ ${i + 1}`} value={t.word}
												onChange={(e) => updateTerm(i, 'word', e.target.value)}
												className="border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-foreground" />
											<input type="text" placeholder="Phiên âm" value={t.pronunciation}
												onChange={(e) => updateTerm(i, 'pronunciation', e.target.value)}
												className="border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-foreground" />
											<input type="text" placeholder="Nghĩa tiếng Anh" value={t.meaningEn}
												onChange={(e) => updateTerm(i, 'meaningEn', e.target.value)}
												className="border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-foreground" />
											<input type="text" placeholder="Nghĩa tiếng Việt" value={t.meaningVi || t.definition}
												onChange={(e) => {
													updateTerm(i, 'meaningVi', e.target.value);
													updateTerm(i, 'definition', e.target.value);
												}}
												className="border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-foreground" />
										</div>
										<div className="grid gap-2 sm:grid-cols-4">
											<input type="text" placeholder="Từ loại (tuỳ chọn)" value={t.partOfSpeech}
												onChange={(e) => updateTerm(i, 'partOfSpeech', e.target.value)}
												className="border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-foreground" />
											<div className="flex gap-2 sm:col-span-3">
												<input type="text" placeholder="Ví dụ (tuỳ chọn)" value={t.example}
													onChange={(e) => updateTerm(i, 'example', e.target.value)}
													className="flex-1 border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-foreground" />
												{manualTerms.length > 2 && (
													<button type="button" onClick={() => setManualTerms((prev) => prev.filter((_, j) => j !== i))}
														className="flex h-10 w-10 shrink-0 items-center justify-center border border-border text-muted hover:border-error hover:text-error transition-colors">
														<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
													</button>
												)}
											</div>
										</div>
										{/* NDK & Hints (Guess Who) */}
										<div className="border-t border-border pt-2 space-y-2">
											<p className="text-[10px] font-bold uppercase tracking-widest text-muted">Guess Who (tùy chọn)</p>
											<textarea value={t.ndkExplanation} onChange={(e) => updateTerm(i, 'ndkExplanation', e.target.value)}
												placeholder="Giải thích NDK (không dùng từ đang học)" rows={2}
												className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground resize-none" />
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
							<button type="button" onClick={() => setManualTerms((prev) => [...prev, { ...EMPTY_TERM }])}
								className="mt-3 border border-dashed border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted hover:border-foreground hover:text-foreground transition-colors">
								+ Thêm từ
							</button>
						</div>
					)}
					<div className="flex justify-end gap-3">
						<button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted hover:text-foreground transition-colors">Hủy</button>
						<button type="submit" disabled={uploading}
							className="border-2 border-foreground bg-foreground px-6 py-2 text-xs font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground disabled:opacity-50">
							{uploading ? 'Đang tạo...' : 'Tạo bộ từ'}
						</button>
					</div>
				</form>
			)}

			{/* Stats */}
			<div className="mb-6 flex items-center gap-6">
				<div>
					<span className="text-xl font-black text-success">{publicSets.length}</span>
					<span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-muted">Đang hiện</span>
				</div>
				<div className="h-5 w-px bg-border" />
				<div>
					<span className="text-xl font-black text-muted">{privateSets.length}</span>
					<span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-muted">Đang ẩn</span>
				</div>
			</div>

			{/* Sets table */}
			{sets.length === 0 ? (
				<div className="border-2 border-dashed border-border py-16 text-center">
					<p className="text-sm text-muted">Chưa có bộ từ nào. Bắt đầu bằng cách tạo bộ từ mới.</p>
				</div>
			) : (
				<div className="space-y-3">
					{/* Public sets */}
					{publicSets.length > 0 && (
						<div>
							<p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-success">Đang hiện trong cửa hàng ({publicSets.length})</p>
							{publicSets.map((set) => (
								<AdminSetRow
									key={set.id}
									set={set}
									onToggle={handleToggleVisibility}
									onDelete={(s) => setConfirmDelete(s)}
									onEdit={(s) => setEditingSetId(s.id)}
									isToggling={togglingId === set.id}
									isDeleting={deletingId === set.id}
								/>
							))}
						</div>
					)}
					{/* Private sets */}
					{privateSets.length > 0 && (
						<div className="mt-6">
							<p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">Đang ẩn ({privateSets.length})</p>
							{privateSets.map((set) => (
								<AdminSetRow
									key={set.id}
									set={set}
									onToggle={handleToggleVisibility}
									onDelete={(s) => setConfirmDelete(s)}
									onEdit={(s) => setEditingSetId(s.id)}
									isToggling={togglingId === set.id}
									isDeleting={deletingId === set.id}
								/>
							))}
						</div>
					)}
				</div>
			)}

			{/* Full-screen set editor */}
			{editingSetId && (
				<AdminSetEditor
					setId={editingSetId}
					onClose={() => setEditingSetId(null)}
					onSaved={() => { setEditingSetId(null); void fetchSets(); showToast('Đã cập nhật bộ từ', 'success'); }}
				/>
			)}
		</div>
	);
}

/* ── Admin Set Row ── */
function AdminSetRow({ set, onToggle, onDelete, onEdit, isToggling, isDeleting }: {
	set: StoreSet;
	onToggle: (s: StoreSet) => void;
	onDelete: (s: StoreSet) => void;
	onEdit: (s: StoreSet) => void;
	isToggling: boolean;
	isDeleting: boolean;
}) {
	return (
		<div className={`flex items-center gap-4 border border-border p-4 transition-all ${set.isArchived ? 'opacity-60' : ''}`}>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<h3 className="truncate text-sm font-bold text-foreground">{set.title}</h3>
					<span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
						set.isArchived ? 'bg-surface-hover text-muted' : 'bg-success-subtle text-success'
					}`}>
						{set.isArchived ? 'Ẩn' : 'Hiện'}
					</span>
				</div>
				{set.description && <p className="mt-0.5 truncate text-xs text-muted">{set.description}</p>}
				<p className="mt-1 text-[11px] text-muted">{set.wordCount} từ · Cập nhật {new Date(set.updatedAt).toLocaleDateString('vi-VN')}</p>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<button onClick={() => onEdit(set)}
					className="flex h-8 w-8 items-center justify-center border border-border text-muted hover:border-foreground hover:text-foreground transition-colors"
					title="Chỉnh sửa">
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
					</svg>
				</button>
				<button
					onClick={() => onToggle(set)}
					disabled={isToggling}
					className={`flex h-8 items-center gap-1.5 border px-3 text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${
						set.isArchived
							? 'border-success bg-success text-white hover:bg-transparent hover:text-success'
							: 'border-border text-muted hover:border-foreground hover:text-foreground'
					}`}
					title={set.isArchived ? 'Hiện ra cửa hàng' : 'Ẩn khỏi cửa hàng'}
				>
					{isToggling ? (
						<div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
					) : set.isArchived ? (
						<><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Hiện</>
					) : (
						<><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>Ẩn</>
					)}
				</button>
				<button
					onClick={() => onDelete(set)}
					disabled={isDeleting}
					className="flex h-8 w-8 items-center justify-center border border-border text-muted hover:border-error hover:text-error transition-colors disabled:opacity-50"
					title="Xóa bộ từ"
				>
					{isDeleting ? (
						<div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
					) : (
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
						</svg>
					)}
				</button>
			</div>
		</div>
	);
}

/* ══════════════════════════════════════════════════════════════════
   Admin Set Editor — full-screen word-level CRUD
══════════════════════════════════════════════════════════════════ */
function AdminSetEditor({ setId, onClose, onSaved }: { setId: string; onClose: () => void; onSaved: () => void }) {
	const [title, setTitle] = useState('');
	const [desc, setDesc] = useState('');
	const [words, setWords] = useState<EditableWord[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		async function load() {
			try {
				const res = await fetch(`/api/vocab-sets/${setId}`);
				const json = await res.json();
				if (!json.ok) throw new Error(json.error);
				const s = json.data.set;
				setTitle(s.title);
				setDesc(s.description ?? '');
				setWords((s.words ?? []).map((w: { id: string; term: string; definition: string; partOfSpeech?: string; example?: string; pronunciation?: string; meaningEn?: string; meaningVi?: string; ndkExplanation?: string | null; hintsHard?: string[]; hintsMedium?: string[]; hintsEasy?: string[] }) => ({
					id: w.id,
					term: w.term,
					definition: w.definition,
					partOfSpeech: w.partOfSpeech ?? '',
					example: w.example ?? '',
					pronunciation: w.pronunciation ?? '',
					meaningEn: w.meaningEn ?? '',
					meaningVi: w.meaningVi || w.definition,
					ndkExplanation: w.ndkExplanation ?? '',
					hintsHard: w.hintsHard ?? [],
					hintsMedium: w.hintsMedium ?? [],
					hintsEasy: w.hintsEasy ?? [],
					_isNew: false,
					_deleted: false,
					_expanded: false,
				})));
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Không tải được bộ từ');
			} finally {
				setLoading(false);
			}
		}
		void load();
	}, [setId]);

	function updateWord(idx: number, field: keyof EditableWord, val: unknown) {
		setWords((prev) => prev.map((w, i) => i === idx ? { ...w, [field]: val } : w));
	}

	function addWord() {
		setWords((prev) => [...prev, { ...EMPTY_EDIT_WORD }]);
	}

	function toggleExpand(idx: number) {
		setWords((prev) => prev.map((w, i) => i === idx ? { ...w, _expanded: !w._expanded } : w));
	}

	function toggleDelete(idx: number) {
		setWords((prev) => prev.map((w, i) => i === idx ? { ...w, _deleted: !w._deleted, _expanded: false } : w));
	}

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim()) { setError('Tiêu đề không được để trống'); return; }
		const validNew = words.filter((w) => !w._deleted && w._isNew && (!w.term.trim() || !(w.meaningVi || w.definition || w.meaningEn).trim()));
		if (validNew.length > 0) { setError('Mỗi từ mới phải có từ và nghĩa'); return; }
		setSaving(true);
		setError('');
		try {
			const deleteWordIds = words.filter((w) => w._deleted && w.id).map((w) => w.id!);
			const upsertWords = words
				.filter((w) => !w._deleted)
				.map((w) => ({
					...(w.id ? { id: w.id } : {}),
					term: w.term.trim(),
					definition: (w.meaningVi || w.definition).trim(),
					partOfSpeech: w.partOfSpeech.trim(),
					example: w.example.trim(),
					pronunciation: w.pronunciation.trim(),
					meaningEn: w.meaningEn.trim(),
					meaningVi: (w.meaningVi || w.definition).trim(),
					ndkExplanation: w.ndkExplanation.trim() || null,
					hintsHard: w.hintsHard,
					hintsMedium: w.hintsMedium,
					hintsEasy: w.hintsEasy,
				}));
			const res = await fetch(`/api/vocab-sets/${setId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: title.trim(), description: desc.trim(), words: upsertWords, deleteWordIds }),
			});
			const json = await res.json();
			if (!json.ok) throw new Error(json.error ?? 'Lỗi lưu');
			onSaved();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
		} finally {
			setSaving(false);
		}
	}

	const activeWords = words.filter((w) => !w._deleted);
	const willDeleteCount = words.filter((w) => w._deleted && w.id).length;

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ overflowY: 'hidden' }}>
			{/* Top toolbar */}
			<div className="flex shrink-0 items-center gap-4 border-b border-border bg-surface px-6 py-4">
				<button
					type="button"
					onClick={onClose}
					className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted hover:text-foreground transition-colors"
				>
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
					</svg>
					Quay lại
				</button>
				<div className="flex-1">
					<p className="text-xs font-bold uppercase tracking-widest text-muted">Admin · Chỉnh sửa bộ từ</p>
					{!loading && <p className="text-sm font-bold text-foreground">{title}</p>}
				</div>
				{!loading && (
					<div className="flex items-center gap-3">
						<span className="text-xs text-muted">{activeWords.length} từ{willDeleteCount > 0 && <span className="ml-1 text-error">· xóa {willDeleteCount}</span>}</span>
						<button
							type="button"
							onClick={(e) => handleSave(e as unknown as React.FormEvent)}
							disabled={saving}
							className="inline-flex items-center gap-2 border-2 border-foreground bg-foreground px-5 py-2 text-xs font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground disabled:opacity-50"
						>
							{saving ? (
								<><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-t-transparent" />Đang lưu...</>
							) : (
								<><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Lưu tất cả</>
							)}
						</button>
					</div>
				)}
			</div>

			{/* Scrollable content */}
			<div className="flex-1 overflow-y-auto px-6 py-8">
				<div className="mx-auto max-w-4xl">
					{loading ? (
						<div className="flex h-64 items-center justify-center">
							<div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
						</div>
					) : (
						<form onSubmit={handleSave} className="space-y-8">
							{/* Metadata */}
							<div className="grid gap-4 sm:grid-cols-2 border border-border bg-surface p-5">
								<div>
									<label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Tiêu đề <span className="text-error">*</span></label>
									<input
										type="text" value={title} onChange={(e) => setTitle(e.target.value)}
										className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground"
										required
									/>
								</div>
								<div>
									<label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Mô tả</label>
									<input
										type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
										className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground"
									/>
								</div>
							</div>

							{/* Word list */}
							<div>
								<div className="mb-3 flex items-center justify-between">
									<p className="text-[10px] font-bold uppercase tracking-widest text-muted">
										{activeWords.length} từ vựng
										{willDeleteCount > 0 && <span className="ml-2 text-error">· {willDeleteCount} sẽ bị xóa</span>}
									</p>
									<button
										type="button"
										onClick={() => setWords((prev) => prev.map((w) => ({ ...w, _expanded: true })))}
										className="text-[10px] font-bold uppercase tracking-wider text-muted hover:text-foreground transition-colors"
									>
										Mở rộng tất cả
									</button>
								</div>
								<div className="space-y-2">
									{words.map((w, i) => (
										<WordEditorCard
											key={i}
											word={w}
											index={i}
											onUpdate={(field, val) => updateWord(i, field, val)}
											onToggleExpand={() => toggleExpand(i)}
											onToggleDelete={() => toggleDelete(i)}
										/>
									))}
								</div>
								<button
									type="button"
									onClick={addWord}
									className="mt-4 flex w-full items-center justify-center gap-2 border-2 border-dashed border-border py-4 text-xs font-bold uppercase tracking-wider text-muted transition-colors hover:border-foreground hover:text-foreground"
								>
									<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
									</svg>
									Thêm từ mới
								</button>
							</div>

							{error && (
								<div className="border border-error bg-error-subtle px-4 py-3 text-sm text-error">{error}</div>
							)}
						</form>
					)}
				</div>
			</div>
		</div>
	);
}

/* ── Word Editor Card ── */
function WordEditorCard({ word, index, onUpdate, onToggleExpand, onToggleDelete }: {
	word: EditableWord;
	index: number;
	onUpdate: (field: keyof EditableWord, val: unknown) => void;
	onToggleExpand: () => void;
	onToggleDelete: () => void;
}) {
	const hasGuessWho = word.hintsHard.length + word.hintsMedium.length + word.hintsEasy.length > 0 || !!word.ndkExplanation;

	if (word._deleted) {
		return (
			<div className="flex items-center gap-3 border border-error/30 bg-error-subtle px-4 py-3">
				<p className="flex-1 text-sm text-error line-through">{word.term || '(từ mới)'} — {word.definition}</p>
				<button
					type="button"
					onClick={onToggleDelete}
					className="shrink-0 text-xs font-bold uppercase tracking-wider text-muted hover:text-foreground transition-colors"
				>
					Hoàn tác
				</button>
			</div>
		);
	}

	return (
		<div className={`border ${word._isNew ? 'border-accent' : 'border-border'} bg-background`}>
			{/* Collapsed row */}
			<div className="flex items-center gap-3 px-4 py-3">
				<span className="w-6 shrink-0 text-[10px] font-bold tabular-nums text-muted">{index + 1}</span>
				<div className="min-w-0 flex-1">
					<div className="flex items-baseline gap-3">
						<span className="truncate text-sm font-bold text-foreground">{word.term || <span className="italic text-muted">chưa nhập</span>}</span>
						<span className="shrink-0 text-xs text-muted">—</span>
						<span className="truncate text-sm text-foreground-secondary">{word.meaningVi || word.definition || <span className="italic text-muted">chưa nhập</span>}</span>
					</div>
					{(word.partOfSpeech || word.example) && (
						<p className="mt-0.5 truncate text-[11px] text-muted">
							{word.partOfSpeech && <span className="mr-2 font-bold">{word.partOfSpeech}</span>}
							{word.example}
						</p>
					)}
				</div>
				<div className="flex shrink-0 items-center gap-1">
					{word._isNew && (
						<span className="rounded-full bg-accent-subtle px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">Mới</span>
					)}
					{hasGuessWho && (
						<span className="rounded-full bg-surface-hover px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted">GW</span>
					)}
					<button
						type="button"
						onClick={onToggleExpand}
						className="flex h-7 w-7 items-center justify-center text-muted hover:text-foreground transition-colors"
						title={word._expanded ? 'Thu gọn' : 'Chỉnh sửa'}
					>
						<svg
							className={`h-4 w-4 transition-transform ${word._expanded ? 'rotate-180' : ''}`}
							fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
						</svg>
					</button>
					<button
						type="button"
						onClick={onToggleDelete}
						className="flex h-7 w-7 items-center justify-center text-muted hover:text-error transition-colors"
						title="Xóa từ này"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
						</svg>
					</button>
				</div>
			</div>
			{/* Expanded edit form */}
			{word._expanded && (
				<div className="border-t border-border bg-surface p-4 space-y-4">
					{/* Core fields */}
					<div className="grid gap-3 sm:grid-cols-2">
						<div>
							<label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Từ <span className="text-error">*</span></label>
							<input
								type="text" value={word.term}
								onChange={(e) => onUpdate('term', e.target.value)}
								placeholder="Từ vựng"
								className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground"
							/>
						</div>
						<div>
							<label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Phiên âm</label>
							<input
								type="text" value={word.pronunciation}
								onChange={(e) => onUpdate('pronunciation', e.target.value)}
								placeholder="/rɪˈzɪliənt/"
								className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground"
							/>
						</div>
						<div>
							<label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Nghĩa tiếng Anh</label>
							<input
								type="text" value={word.meaningEn}
								onChange={(e) => onUpdate('meaningEn', e.target.value)}
								placeholder="English meaning"
								className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground"
							/>
						</div>
						<div>
							<label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Nghĩa tiếng Việt <span className="text-error">*</span></label>
							<input
								type="text" value={word.meaningVi || word.definition}
								onChange={(e) => {
									onUpdate('meaningVi', e.target.value);
									onUpdate('definition', e.target.value);
								}}
								placeholder="Nghĩa tiếng Việt"
								className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground"
							/>
						</div>
						<div>
							<label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Từ loại</label>
							<input
								type="text" value={word.partOfSpeech}
								onChange={(e) => onUpdate('partOfSpeech', e.target.value)}
								placeholder="n, v, adj..."
								className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground"
							/>
						</div>
						<div>
							<label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Ví dụ</label>
							<input
								type="text" value={word.example}
								onChange={(e) => onUpdate('example', e.target.value)}
								placeholder="Câu ví dụ"
								className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground"
							/>
						</div>
					</div>
					{/* Guess Who section */}
					<div className="border-t border-border pt-3 space-y-3">
						<p className="text-[10px] font-bold uppercase tracking-widest text-muted">Guess Who (tùy chọn)</p>
						<textarea
							value={word.ndkExplanation}
							onChange={(e) => onUpdate('ndkExplanation', e.target.value)}
							placeholder="Giải thích NDK — mô tả từ mà không dùng chính từ đó"
							rows={2}
							className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground resize-none"
						/>
						<div className="grid gap-3 sm:grid-cols-3">
							<div>
								<p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-error">Gợi ý Khó</p>
								<TagInput tags={word.hintsHard} onChange={(v) => onUpdate('hintsHard', v)} placeholder="Nhập gợi ý, Enter để thêm" />
							</div>
							<div>
								<p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-warning">Gợi ý Trung bình</p>
								<TagInput tags={word.hintsMedium} onChange={(v) => onUpdate('hintsMedium', v)} placeholder="Nhập gợi ý, Enter để thêm" />
							</div>
							<div>
								<p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-success">Gợi ý Dễ</p>
								<TagInput tags={word.hintsEasy} onChange={(v) => onUpdate('hintsEasy', v)} placeholder="Nhập gợi ý, Enter để thêm" />
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

/* ══════════════════════════════════════════════════════════════════
   Main Export
══════════════════════════════════════════════════════════════════ */
export default function StoreClient() {
	return (
		<main className="min-h-screen">
			<section className="border-b border-border">
				<div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
					<div className="flex items-center gap-3">
						<Link href="/vocabulary" className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors">
							Từ vựng
						</Link>
						<span className="text-xs text-muted">/</span>
						<span className="text-xs font-bold uppercase tracking-widest text-foreground">Cửa hàng</span>
					</div>
					<div className="mt-4 flex items-end justify-between gap-4">
						<div>
							<h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl lg:text-4xl">
								Cửa hàng từ vựng
							</h1>
							<p className="mt-2 text-sm text-foreground-secondary">
								Khám phá bộ sưu tập từ vựng do giảng viên tuyển chọn.
							</p>
						</div>
						<Link href="/vocabulary"
							className="hidden shrink-0 items-center gap-2 border-2 border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition-all hover:border-foreground sm:inline-flex">
							Bộ từ của tôi
						</Link>
					</div>
				</div>
			</section>

			<section>
				<div className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
					<UserStoreView />
				</div>
			</section>
		</main>
	);
}
