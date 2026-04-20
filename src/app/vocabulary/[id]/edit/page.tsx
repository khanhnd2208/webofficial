'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TagInput from '@/components/TagInput';

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

/* ── Modal Component ── */
function ConfirmModal({
	open,
	title,
	message,
	confirmLabel,
	onConfirm,
	onCancel,
}: {
	open: boolean;
	title: string;
	message: string;
	confirmLabel: string;
	onConfirm: () => void;
	onCancel: () => void;
}) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onCancel}>
			<div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
			<div
				className="relative w-full max-w-md border border-border bg-surface-elevated p-6 shadow-lg"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-start gap-4">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center bg-error-subtle text-error">
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
						</svg>
					</div>
					<div>
						<h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</h3>
						<p className="mt-2 text-sm leading-relaxed text-foreground-secondary">{message}</p>
					</div>
				</div>
				<div className="mt-6 flex items-center justify-end gap-3">
					<button
						onClick={onCancel}
						className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted hover:text-foreground transition-colors"
					>
						Hủy
					</button>
					<button
						onClick={onConfirm}
						className="rounded-full border-2 border-error bg-error px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-transparent hover:text-error"
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}

/* ── Toast Component ── */
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
	useEffect(() => {
		const t = setTimeout(onClose, 3000);
		return () => clearTimeout(t);
	}, [onClose]);
	const colors = {
		success: 'border-success bg-success-subtle text-success',
		error: 'border-error bg-error-subtle text-error',
		info: 'border-indigo bg-indigo-subtle text-indigo',
	};
	return (
		<div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 border px-5 py-3 shadow-lg ${colors[type]}`}>
			<span className="text-sm font-medium">{message}</span>
			<button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
				<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	);
}

/* ══════════════════════════════════════════════════════════════
   Main Edit Page
   ══════════════════════════════════════════════════════════════ */
export default function EditVocabSetPage({ params }: { params: Promise<{ id: string }> }) {
	const router = useRouter();
	const fileRef = useRef<HTMLInputElement>(null);

	// ── Core State ──
	const [id, setId] = useState('');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [terms, setTerms] = useState<Term[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [isPublic, setIsPublic] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);

	// ── Management State ──
	const [selected, setSelected] = useState<Set<number>>(new Set());
	const [searchQuery, setSearchQuery] = useState('');
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

	// ── Modal State ──
	const [deleteCollectionModal, setDeleteCollectionModal] = useState(false);
	const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
	const [deletingCollection, setDeletingCollection] = useState(false);

	// ── Load Data ──
	useEffect(() => {
		params.then(async ({ id: paramId }) => {
			setId(paramId);
			const res = await fetch(`/api/vocab-sets/${paramId}`);
			const json = await res.json();
			if (!json.ok) { setError('Không tìm thấy bộ từ'); setLoading(false); return; }
			const d = json.data;
			setTitle(d.title);
			setDescription(d.description);
			setIsPublic(!d.isArchived);
				setTerms(d.words && d.words.length > 0
					? d.words.map((w: { term: string; definition: string; partOfSpeech: string; example: string; ndkExplanation?: string | null; hintsHard?: string[]; hintsMedium?: string[]; hintsEasy?: string[] }) => ({
						word: w.term,
						definition: w.definition,
						partOfSpeech: w.partOfSpeech,
						example: w.example,
						ndkExplanation: w.ndkExplanation ?? '',
						hintsHard: w.hintsHard ?? [],
						hintsMedium: w.hintsMedium ?? [],
						hintsEasy: w.hintsEasy ?? [],
					}))
					: [{ ...EMPTY_TERM }]);
			setLoading(false);
		});
		fetch('/api/auth/session').then(r => r.json()).then(s => {
			if (s?.user?.role === 'admin') setIsAdmin(true);
		}).catch(() => {});
	}, [params]);

	// ── Filtered terms ──
	const filteredIndices = useMemo(() => {
		if (!searchQuery.trim()) return terms.map((_, i) => i);
		const q = searchQuery.toLowerCase().trim();
		return terms
			.map((t, i) => ({ t, i }))
			.filter(({ t }) =>
				t.word.toLowerCase().includes(q) ||
				t.definition.toLowerCase().includes(q) ||
				t.partOfSpeech.toLowerCase().includes(q) ||
				t.example.toLowerCase().includes(q)
			)
			.map(({ i }) => i);
	}, [terms, searchQuery]);

	// ── Term Operations ──
	function updateTerm(idx: number, field: keyof Term, value: string | string[]) {
		setTerms(prev => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));
	}

	function addTerm() {
		setTerms(prev => [...prev, { ...EMPTY_TERM }]);
		setSearchQuery('');
		setToast({ message: 'Đã thêm từ mới', type: 'info' });
	}

	function removeTerm(idx: number) {
		if (terms.length <= 1) return;
		setTerms(prev => prev.filter((_, i) => i !== idx));
		setSelected(prev => {
			const next = new Set<number>();
			prev.forEach(i => {
				if (i < idx) next.add(i);
				else if (i > idx) next.add(i - 1);
			});
			return next;
		});
	}

	// ── Selection ──
	const toggleSelect = useCallback((idx: number) => {
		setSelected(prev => {
			const next = new Set(prev);
			if (next.has(idx)) next.delete(idx);
			else next.add(idx);
			return next;
		});
	}, []);

	const selectAllVisible = useCallback(() => {
		setSelected(prev => {
			const next = new Set(prev);
			filteredIndices.forEach(i => next.add(i));
			return next;
		});
	}, [filteredIndices]);

	const deselectAll = useCallback(() => {
		setSelected(new Set());
	}, []);

	const isAllVisibleSelected = filteredIndices.length > 0 && filteredIndices.every(i => selected.has(i));

	// ── Bulk Delete ──
	function handleBulkDelete() {
		if (selected.size === 0) return;
		if (selected.size >= terms.length) {
			setToast({ message: 'Không thể xóa hết. Hãy giữ lại ít nhất 1 từ.', type: 'error' });
			setBulkDeleteModal(false);
			return;
		}
		const count = selected.size;
		setTerms(prev => prev.filter((_, i) => !selected.has(i)));
		setToast({ message: `Đã xóa ${count} từ vựng`, type: 'success' });
		setSelected(new Set());
		setBulkDeleteModal(false);
	}

	// ── CSV Import ──
	// Parse một dòng CSV có hỗ trợ quoted fields (xử lý dấu phẩy trong nội dung)
	function parseCsvLine(line: string): string[] {
		const result: string[] = [];
		let current = '';
		let inQuotes = false;
		for (let i = 0; i < line.length; i++) {
			const ch = line[i];
			if (ch === '"') {
				if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
				else { inQuotes = !inQuotes; }
			} else if (ch === ',' && !inQuotes) {
				result.push(current.trim());
				current = '';
			} else {
				current += ch;
			}
		}
		result.push(current.trim());
		return result;
	}

	async function handleCsvAppend(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		const buffer = await file.arrayBuffer();
		// Giải mã UTF-8 và tự động bỏ BOM nếu có
		const decoder = new TextDecoder('utf-8');
		let text = decoder.decode(buffer);
		// Bỏ UTF-8 BOM (\uFEFF) nếu có
		if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

		const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
		if (lines.length < 2) return;

		const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase());
		const wordIdx = headers.findIndex(h => ['word', 'term'].includes(h));
		const defIdx = headers.findIndex(h => ['definition', 'meaning', 'meaningvi'].includes(h));
		const posIdx = headers.findIndex(h => ['partofspeech', 'pos', 'part_of_speech'].includes(h));
		const exIdx = headers.findIndex(h => ['example', 'sentence'].includes(h));

		const ndkIdx = headers.findIndex(h => ['ndk_explanation', 'ndkexplanation'].includes(h));
		const hHardIdx = headers.findIndex(h => ['hints_hard', 'hintshard'].includes(h));
		const hMedIdx = headers.findIndex(h => ['hints_medium', 'hintsmedium'].includes(h));
		const hEasyIdx = headers.findIndex(h => ['hints_easy', 'hintseasy'].includes(h));

		if (wordIdx === -1 || defIdx === -1) {
			setToast({ message: 'CSV cần có cột word và definition', type: 'error' });
			return;
		}

		const parseHints = (val: string | undefined): string[] =>
			val ? val.split('||').map((s) => s.trim()).filter(Boolean) : [];

		const newTerms: Term[] = [];
		for (let i = 1; i < lines.length; i++) {
			const cols = parseCsvLine(lines[i]);
			const word = cols[wordIdx] ?? '';
			const definition = cols[defIdx] ?? '';
			if (!word || !definition) continue;
			newTerms.push({
				word,
				definition,
				partOfSpeech: posIdx >= 0 ? (cols[posIdx] ?? '') : '',
				example: exIdx >= 0 ? (cols[exIdx] ?? '') : '',
				ndkExplanation: ndkIdx >= 0 ? (cols[ndkIdx] ?? '') : '',
				hintsHard: parseHints(hHardIdx >= 0 ? cols[hHardIdx] : undefined),
				hintsMedium: parseHints(hMedIdx >= 0 ? cols[hMedIdx] : undefined),
				hintsEasy: parseHints(hEasyIdx >= 0 ? cols[hEasyIdx] : undefined),
			});
		}

		if (newTerms.length > 0) {
			setTerms(prev => {
				const nonEmpty = prev.filter(t => t.word.trim() || t.definition.trim());
				return [...nonEmpty, ...newTerms];
			});
			setToast({ message: `Đã nhập ${newTerms.length} từ từ CSV`, type: 'success' });
		}
		if (fileRef.current) fileRef.current.value = '';
	}

	// ── Save ──
	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim()) { setToast({ message: 'Vui lòng nhập tiêu đề', type: 'error' }); return; }
		const validTerms = terms.filter(t => t.word.trim() && t.definition.trim());
		if (validTerms.length === 0) { setToast({ message: 'Thêm ít nhất 1 từ vựng', type: 'error' }); return; }

		setError('');
		setSaving(true);
		try {
			const res = await fetch(`/api/vocab-sets/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: title.trim(), description: description.trim(), words: validTerms.map(t => ({
				term: t.word,
				definition: t.definition,
				partOfSpeech: t.partOfSpeech,
				example: t.example,
				ndkExplanation: t.ndkExplanation || null,
				hintsHard: t.hintsHard,
				hintsMedium: t.hintsMedium,
				hintsEasy: t.hintsEasy,
			})) }),
			});
			const json = await res.json();
			if (!json.ok) throw new Error(json.error);
			router.push(`/vocabulary/${id}`);
		} catch (err) {
			setToast({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', type: 'error' });
			setSaving(false);
		}
	}

	// ── Delete Collection ──
	async function handleDeleteCollection() {
		setDeletingCollection(true);
		try {
			const res = await fetch(`/api/vocab-sets/${id}`, { method: 'DELETE' });
			const json = await res.json();
			if (!json.ok) throw new Error(json.error);
			router.push('/vocabulary');
		} catch (err) {
			setToast({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', type: 'error' });
			setDeletingCollection(false);
			setDeleteCollectionModal(false);
		}
	}

	// ── Stats ──
	const totalTerms = terms.length;
	const filledTerms = terms.filter(t => t.word.trim() && t.definition.trim()).length;
	const emptyTerms = totalTerms - filledTerms;

	if (loading) {
		return (
			<main className="min-h-screen">
				<div className="mx-auto max-w-3xl px-6 py-20 text-center">
					<div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-screen">
			{/* ── Header ── */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
					<div className="flex items-center gap-3">
						<Link href="/vocabulary" className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors">
							Từ vựng
						</Link>
						<span className="text-xs text-muted">/</span>
						<Link href={`/vocabulary/${id}`} className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors line-clamp-1">
							{title || 'Bộ từ'}
						</Link>
						<span className="text-xs text-muted">/</span>
						<span className="text-xs font-bold uppercase tracking-widest text-foreground">Chỉnh sửa</span>
					</div>
					<h1 className="mt-4 text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
						Quản lý bộ từ
					</h1>
					<p className="mt-2 text-sm text-foreground-secondary">
						Thêm, sửa, xóa từ vựng và quản lý bộ sưu tập.
					</p>
				</div>
			</section>

			{/* ── Form ── */}
			<section>
				<form onSubmit={handleSave} className="mx-auto max-w-3xl px-6 py-10">
					{/* Meta */}
					<div className="space-y-4">
						<div>
							<label className="block text-xs font-bold uppercase tracking-widest text-muted">Tiêu đề *</label>
							<input
								type="text"
								value={title}
								onChange={e => setTitle(e.target.value)}
								placeholder="Nhập tiêu đề bộ từ"
								className="mt-2 w-full border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none transition-colors"
							/>
						</div>
						<div>
							<label className="block text-xs font-bold uppercase tracking-widest text-muted">Mô tả</label>
							<input
								type="text"
								value={description}
								onChange={e => setDescription(e.target.value)}
								placeholder="Mô tả ngắn về bộ từ"
								className="mt-2 w-full border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none transition-colors"
							/>
						</div>

						{isAdmin && (
							<div className="flex items-center gap-3 border border-border p-4">
								<button
									type="button"
									onClick={() => setIsPublic(v => !v)}
									className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${isPublic ? 'bg-success' : 'bg-surface-hover'}`}
								>
									<span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
								</button>
								<div>
									<div className="text-xs font-bold uppercase tracking-wider text-foreground">Đăng lên Cửa hàng</div>
									<div className="text-[10px] text-muted">
										{isPublic ? 'Bộ từ này đang hiển thị trong cửa hàng.' : 'Bộ từ chỉ riêng bạn nhìn thấy.'}
									</div>
								</div>
								{isPublic && (
									<span className="ml-auto rounded-full bg-rose-subtle px-2.5 py-0.5 text-[10px] font-bold text-rose">
										Công khai
									</span>
								)}
							</div>
						)}
					</div>

					{/* ═══ TERM MANAGEMENT TOOLBAR ═══ */}
					<div className="mt-10 space-y-4">
						{/* Stats */}
						<div className="flex flex-wrap items-center gap-3 text-xs">
							<span className="font-bold uppercase tracking-widest text-foreground">Từ vựng</span>
							<span className="rounded-full bg-surface-hover px-2.5 py-0.5 font-bold text-muted">{totalTerms} từ</span>
							{emptyTerms > 0 && (
								<span className="rounded-full bg-warning-subtle px-2.5 py-0.5 font-bold text-warning">{emptyTerms} chưa điền</span>
							)}
							{selected.size > 0 && (
								<span className="rounded-full bg-indigo-subtle px-2.5 py-0.5 font-bold text-indigo">{selected.size} đã chọn</span>
							)}
						</div>

						{/* Toolbar row */}
						<div className="flex flex-wrap items-center gap-2">
							{/* Search */}
							<div className="relative flex-1 min-w-[200px]">
								<svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
								</svg>
								<input
									type="text"
									value={searchQuery}
									onChange={e => setSearchQuery(e.target.value)}
									placeholder="Tìm kiếm từ vựng…"
									className="w-full border border-border bg-surface py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none transition-colors"
								/>
								{searchQuery && (
									<button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
										<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								)}
							</div>

							{/* CSV */}
							<label className="cursor-pointer inline-flex items-center gap-1.5 border border-border px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition-all hover:border-accent hover:text-accent">
								<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
								</svg>
								<span className="hidden sm:inline">CSV</span>
								<input ref={fileRef} type="file" accept=".csv" onChange={handleCsvAppend} className="hidden" />
							</label>

							{/* Add */}
							<button type="button" onClick={addTerm} className="inline-flex items-center gap-1.5 border border-border px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition-all hover:border-success hover:text-success">
								<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
								</svg>
								Thêm
							</button>
						</div>

						{/* Bulk selection bar */}
						{selected.size > 0 && (
							<div className="flex flex-wrap items-center gap-2 border border-indigo bg-indigo-subtle p-3">
								<span className="text-xs font-bold text-indigo">{selected.size} từ đã chọn</span>
								<div className="flex-1" />
								<button type="button" onClick={deselectAll} className="text-xs font-bold uppercase tracking-wider text-indigo hover:underline transition-colors">
									Bỏ chọn
								</button>
								<button
									type="button"
									onClick={() => setBulkDeleteModal(true)}
									className="inline-flex items-center gap-1.5 rounded-full border border-error bg-error px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-transparent hover:text-error"
								>
									<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
									</svg>
									Xóa {selected.size} từ
								</button>
							</div>
						)}

						{/* Select all */}
						{filteredIndices.length > 0 && (
							<div className="flex items-center gap-3 text-xs text-muted">
								<button
									type="button"
									onClick={isAllVisibleSelected ? deselectAll : selectAllVisible}
									className="flex items-center gap-1.5 font-bold uppercase tracking-wider hover:text-foreground transition-colors"
								>
									<span className={`flex h-4 w-4 items-center justify-center border transition-colors ${isAllVisibleSelected ? 'border-indigo bg-indigo text-white' : 'border-border hover:border-foreground'}`}>
										{isAllVisibleSelected && (
											<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
												<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
											</svg>
										)}
									</span>
									{isAllVisibleSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
								</button>
								{searchQuery && (
									<span>Hiển thị {filteredIndices.length}/{totalTerms} từ</span>
								)}
							</div>
						)}
					</div>

					{/* ═══ TERM LIST ═══ */}
					<div className="mt-4 space-y-2">
						{filteredIndices.length === 0 && searchQuery ? (
							<div className="border-2 border-dashed border-border p-10 text-center">
								<p className="text-sm text-muted">Không tìm thấy từ nào cho &ldquo;{searchQuery}&rdquo;</p>
								<button type="button" onClick={() => setSearchQuery('')} className="mt-3 text-xs font-bold uppercase tracking-wider text-accent hover:underline">
									Xóa bộ lọc
								</button>
							</div>
						) : (
							filteredIndices.map(idx => {
								const term = terms[idx];
								const isSelected = selected.has(idx);
								return (
									<div
										key={idx}
										className={`group relative border p-4 transition-all ${isSelected ? 'border-indigo bg-indigo-subtle' : 'border-border hover:border-border-hover'}`}
									>
										{/* Top row */}
										<div className="flex items-center gap-3">
											<button
												type="button"
												onClick={() => toggleSelect(idx)}
												className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${isSelected ? 'border-indigo bg-indigo text-white' : 'border-border-hover hover:border-foreground'}`}
											>
												{isSelected && (
													<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
														<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
													</svg>
												)}
											</button>
											<span className="text-xs font-bold uppercase tracking-widest text-muted">{idx + 1}</span>
											<div className="ml-auto flex items-center gap-2">
												{term.word.trim() && term.definition.trim() ? (
													<span className="h-1.5 w-1.5 rounded-full bg-success" title="Hoàn chỉnh" />
												) : (
													<span className="h-1.5 w-1.5 rounded-full bg-warning" title="Chưa đầy đủ" />
												)}
												{terms.length > 1 && (
													<button
														type="button"
														onClick={() => removeTerm(idx)}
														className="rounded p-1 text-muted opacity-0 group-hover:opacity-100 hover:bg-error-subtle hover:text-error transition-all"
														title="Xóa từ này"
													>
														<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
															<path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
														</svg>
													</button>
												)}
											</div>
										</div>

										{/* Inputs */}
										<div className="mt-3 grid gap-3 sm:grid-cols-2">
											<input type="text" value={term.word} onChange={e => updateTerm(idx, 'word', e.target.value)} placeholder="Từ vựng *" className="w-full border-b border-border bg-transparent px-0 py-2 text-sm font-medium text-foreground placeholder:text-muted focus:border-accent focus:outline-none transition-colors" />
											<input type="text" value={term.definition} onChange={e => updateTerm(idx, 'definition', e.target.value)} placeholder="Nghĩa *" className="w-full border-b border-border bg-transparent px-0 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none transition-colors" />
											<input type="text" value={term.partOfSpeech} onChange={e => updateTerm(idx, 'partOfSpeech', e.target.value)} placeholder="Loại từ (n, v, adj…)" className="w-full border-b border-border bg-transparent px-0 py-2 text-xs text-foreground-secondary placeholder:text-muted focus:border-accent focus:outline-none transition-colors" />
											<input type="text" value={term.example} onChange={e => updateTerm(idx, 'example', e.target.value)} placeholder="Ví dụ" className="w-full border-b border-border bg-transparent px-0 py-2 text-xs italic text-foreground-secondary placeholder:text-muted focus:border-accent focus:outline-none transition-colors" />
										</div>

										{/* NDK's Explanation */}
										<div className="mt-3">
											<label className="block text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">
												📝 NDK&apos;s Explanation
											</label>
											<textarea
												value={term.ndkExplanation}
												onChange={e => updateTerm(idx, 'ndkExplanation', e.target.value)}
												placeholder="Lời thầy giải thích (tuỳ chọn)…"
												rows={2}
												className="w-full resize-none border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-amber-500 focus:outline-none transition-colors rounded"
											/>
										</div>

										{/* Guess Who Hints */}
										<details className="mt-3 group">
											<summary className="cursor-pointer select-none text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 list-none flex items-center gap-1">
												<svg className="h-3 w-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
												🎮 Guess Who — Gợi ý
												{(term.hintsHard.length + term.hintsMedium.length + term.hintsEasy.length) > 0 && (
													<span className="ml-1 rounded-full bg-purple-100 dark:bg-purple-900/50 px-1.5 py-0.5 text-[9px] font-bold text-purple-600 dark:text-purple-300">
														{term.hintsHard.length + term.hintsMedium.length + term.hintsEasy.length} gợi ý
													</span>
												)}
											</summary>
											<div className="mt-2 space-y-3 pl-4 border-l-2 border-purple-200 dark:border-purple-800">
												<div>
													<label className="block text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">🔴 Khó (Hard)</label>
													<TagInput tags={term.hintsHard} onChange={val => updateTerm(idx, 'hintsHard', val)} placeholder="Gợi ý khó — Enter để thêm" />
												</div>
												<div>
													<label className="block text-[10px] font-bold uppercase tracking-widest text-yellow-500 mb-1">🟡 Trung bình (Medium)</label>
													<TagInput tags={term.hintsMedium} onChange={val => updateTerm(idx, 'hintsMedium', val)} placeholder="Gợi ý vừa — Enter để thêm" />
												</div>
												<div>
													<label className="block text-[10px] font-bold uppercase tracking-widest text-green-500 mb-1">🟢 Dễ (Easy)</label>
													<TagInput tags={term.hintsEasy} onChange={val => updateTerm(idx, 'hintsEasy', val)} placeholder="Gợi ý dễ — Enter để thêm" />
												</div>
											</div>
										</details>
									</div>
								);
							})
						)}

						{!searchQuery && (
							<button type="button" onClick={addTerm} className="flex w-full items-center justify-center gap-2 border-2 border-dashed border-border py-4 text-xs font-bold uppercase tracking-wider text-muted transition-colors hover:border-success hover:text-success">
								<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
								</svg>
								Thêm từ mới
							</button>
						)}
					</div>

					{error && <div className="mt-4 border border-error bg-error-subtle px-4 py-3 text-sm text-error">{error}</div>}

					{/* ═══ BOTTOM ACTION BAR ═══ */}
					<div className="mt-10 space-y-6">
						<div className="flex items-center justify-end gap-3">
							<Link href={`/vocabulary/${id}`} className="px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-muted hover:text-foreground transition-colors">
								Hủy
							</Link>
							<button
								type="submit"
								disabled={saving}
								className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground disabled:opacity-50"
							>
								{saving ? (
									<>
										<svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
										</svg>
										Đang lưu…
									</>
								) : (
									'Lưu thay đổi'
								)}
							</button>
						</div>

						{/* Danger Zone */}
						<div className="border border-error/30 p-5">
							<div className="flex items-start gap-4">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center bg-error-subtle text-error">
									<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
									</svg>
								</div>
								<div className="flex-1">
									<h3 className="text-xs font-bold uppercase tracking-wider text-error">Vùng nguy hiểm</h3>
									<p className="mt-1 text-xs text-foreground-secondary">
										Xóa toàn bộ bộ từ vựng này. Hành động không thể hoàn tác và sẽ xóa tất cả {totalTerms} từ vựng cùng lịch sử luyện tập.
									</p>
								</div>
								<button
									type="button"
									onClick={() => setDeleteCollectionModal(true)}
									disabled={deletingCollection}
									className="shrink-0 rounded-full border-2 border-error px-4 py-2 text-xs font-bold uppercase tracking-wider text-error transition-all hover:bg-error hover:text-white disabled:opacity-50"
								>
									{deletingCollection ? 'Đang xóa…' : 'Xóa bộ từ'}
								</button>
							</div>
						</div>
					</div>
				</form>
			</section>

			{/* Modals */}
			<ConfirmModal
				open={bulkDeleteModal}
				title="Xóa từ vựng đã chọn"
				message={`Bạn sắp xóa ${selected.size} từ vựng. Hành động này không thể hoàn tác. Các từ đã xóa sẽ mất khi bạn lưu thay đổi.`}
				confirmLabel={`Xóa ${selected.size} từ`}
				onConfirm={handleBulkDelete}
				onCancel={() => setBulkDeleteModal(false)}
			/>

			<ConfirmModal
				open={deleteCollectionModal}
				title="Xóa toàn bộ bộ từ"
				message={`Bạn sắp xóa bộ từ "${title}" với ${totalTerms} từ vựng. Toàn bộ dữ liệu và lịch sử luyện tập sẽ bị xóa vĩnh viễn. Hành động này KHÔNG THỂ hoàn tác.`}
				confirmLabel="Xóa vĩnh viễn"
				onConfirm={handleDeleteCollection}
				onCancel={() => setDeleteCollectionModal(false)}
			/>

			{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
		</main>
	);
}
