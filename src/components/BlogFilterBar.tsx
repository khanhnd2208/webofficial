'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface BlogFilterBarProps {
	allTags: string[];
	allCategories: string[];
	currentTag?: string;
	currentCategory?: string;
	currentSort?: string;
	total: number;
}

const SORT_OPTIONS = [
	{ value: '', label: 'Mặc định' },
	{ value: 'chapter-asc', label: 'Chương ↑' },
	{ value: 'chapter-desc', label: 'Chương ↓' },
	{ value: 'newest', label: 'Mới nhất' },
	{ value: 'oldest', label: 'Cũ nhất' },
	{ value: 'views', label: 'Xem nhiều' },
] as const;

function buildQuery(params: Record<string, string | undefined>) {
	const sp = new URLSearchParams();
	for (const [key, val] of Object.entries(params)) {
		if (val && val !== '') sp.set(key, val);
	}
	const q = sp.toString();
	return `/bai-viet${q ? `?${q}` : ''}`;
}

export default function BlogFilterBar({
	allTags,
	allCategories,
	currentTag,
	currentCategory,
	currentSort,
	total,
}: BlogFilterBarProps) {
	const router = useRouter();
	const [sheetOpen, setSheetOpen] = useState(false);
	const [draftTag, setDraftTag] = useState(currentTag ?? '');
	const [draftCategory, setDraftCategory] = useState(currentCategory ?? '');
	const [draftSort, setDraftSort] = useState(currentSort ?? '');
	const [tagSearch, setTagSearch] = useState('');
	const [catSearch, setCatSearch] = useState('');
	const sheetRef = useRef<HTMLDivElement>(null);

	const hasActiveFilters = !!(currentTag || currentCategory || currentSort);

	const openSheet = () => {
		setDraftTag(currentTag ?? '');
		setDraftCategory(currentCategory ?? '');
		setDraftSort(currentSort ?? '');
		setTagSearch('');
		setCatSearch('');
		setSheetOpen(true);
	};

	useEffect(() => {
		if (!sheetOpen) return;
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') setSheetOpen(false);
		}
		document.addEventListener('keydown', onKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.removeEventListener('keydown', onKey);
			document.body.style.overflow = prev;
		};
	}, [sheetOpen]);

	const navigate = useCallback(
		(overrides: Record<string, string | undefined>) => {
			router.push(
				buildQuery({
					tag: currentTag,
					category: currentCategory,
					sort: currentSort,
					page: undefined,
					...overrides,
				}),
			);
		},
		[currentTag, currentCategory, currentSort, router],
	);

	const applyDraft = () => {
		router.push(
			buildQuery({
				tag: draftTag || undefined,
				category: draftCategory || undefined,
				sort: draftSort || undefined,
			}),
		);
		setSheetOpen(false);
	};

	const clearAll = () => {
		setDraftTag('');
		setDraftCategory('');
		setDraftSort('');
		router.push('/bai-viet');
		setSheetOpen(false);
	};

	const filteredTags = tagSearch
		? allTags.filter((t) => t.toLowerCase().includes(tagSearch.toLowerCase()))
		: allTags;
	const filteredCats = catSearch
		? allCategories.filter((c) => c.toLowerCase().includes(catSearch.toLowerCase()))
		: allCategories;

	return (
		<>
			{/* Desktop sticky filter */}
			<section className="sticky top-[57px] z-30 hidden border-b border-hairline bg-canvas/95 backdrop-blur-md lg:block">
				<div className="shell py-3">
					<div className="flex flex-wrap items-center gap-2">
						<select
							value={currentCategory ?? ''}
							onChange={(e) => navigate({ category: e.target.value || undefined })}
							className="rounded-[10px] border border-hairline bg-paper px-3 py-2 text-xs text-ink"
							aria-label="Chủ đề"
						>
							<option value="">Tất cả chủ đề</option>
							{allCategories.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>

						<select
							value={currentTag ?? ''}
							onChange={(e) => navigate({ tag: e.target.value || undefined })}
							className="rounded-[10px] border border-hairline bg-paper px-3 py-2 text-xs text-ink"
							aria-label="Tag"
						>
							<option value="">Tất cả tag</option>
							{allTags.map((t) => (
								<option key={t} value={t}>
									#{t}
								</option>
							))}
						</select>

						<div className="flex items-center gap-1">
							{SORT_OPTIONS.map((opt) => {
								const isActive = (currentSort ?? '') === opt.value;
								return (
									<button
										key={opt.value}
										type="button"
										onClick={() => navigate({ sort: opt.value || undefined })}
										className={`rounded-[10px] px-2.5 py-1.5 text-[11px] font-medium transition-colors duration-200 ${
											isActive
												? 'bg-ink text-paper'
												: 'text-ink-secondary hover:bg-surface-hover hover:text-ink'
										}`}
									>
										{opt.label}
									</button>
								);
							})}
						</div>

						{hasActiveFilters ? (
							<Link
								href="/bai-viet"
								className="text-[11px] font-medium text-ink-secondary underline underline-offset-2 hover:text-ink"
							>
								Xóa lọc
							</Link>
						) : null}

						<span className="ml-auto font-mono text-[10px] text-ink-secondary" aria-live="polite">
							{total} kết quả
						</span>
					</div>
				</div>
			</section>

			{/* Mobile filter trigger */}
			<section className="border-b border-hairline lg:hidden">
				<div className="shell flex items-center justify-between gap-3 py-3">
					<button
						type="button"
						onClick={openSheet}
						className={`inline-flex min-h-11 items-center gap-2 rounded-[10px] px-4 text-xs font-semibold ${
							hasActiveFilters ? 'bg-vermilion text-paper' : 'border border-hairline text-ink'
						}`}
					>
						Bộ lọc
						{hasActiveFilters ? (
							<span className="font-mono text-[10px]">
								{[currentTag, currentCategory, currentSort].filter(Boolean).length}
							</span>
						) : null}
					</button>
					<span className="font-mono text-[10px] text-ink-secondary" aria-live="polite">
						{total} kết quả
					</span>
				</div>
			</section>

			{/* Mobile filter sheet */}
			{sheetOpen ? (
				<div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Bộ lọc">
					<button
						type="button"
						className="absolute inset-0 bg-ink/40"
						aria-label="Đóng"
						onClick={() => setSheetOpen(false)}
					/>
					<div
						ref={sheetRef}
						className="absolute inset-x-0 bottom-0 max-h-[85svh] overflow-y-auto rounded-t-[18px] border-t border-hairline bg-paper p-6"
					>
						<div className="mx-auto mb-4 h-1 w-10 rounded-full bg-hairline" aria-hidden />
						<p className="font-display text-xl font-medium text-ink">Bộ lọc</p>

						<label className="mt-6 block text-xs font-semibold uppercase tracking-widest text-ink-secondary">
							Chủ đề
						</label>
						<input
							value={catSearch}
							onChange={(e) => setCatSearch(e.target.value)}
							placeholder="Tìm chủ đề…"
							className="mt-2 w-full rounded-[10px] border border-hairline bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
						/>
						<div className="mt-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
							<button
								type="button"
								onClick={() => setDraftCategory('')}
								className={`rounded-[10px] px-3 py-1.5 text-xs ${
									!draftCategory ? 'bg-ink text-paper' : 'border border-hairline text-ink-secondary'
								}`}
							>
								Tất cả
							</button>
							{filteredCats.map((c) => (
								<button
									key={c}
									type="button"
									onClick={() => setDraftCategory(c)}
									className={`rounded-[10px] px-3 py-1.5 text-xs ${
										draftCategory === c ? 'bg-ink text-paper' : 'border border-hairline text-ink-secondary'
									}`}
								>
									{c}
								</button>
							))}
						</div>

						<label className="mt-6 block text-xs font-semibold uppercase tracking-widest text-ink-secondary">
							Tag
						</label>
						<input
							value={tagSearch}
							onChange={(e) => setTagSearch(e.target.value)}
							placeholder="Tìm tag…"
							className="mt-2 w-full rounded-[10px] border border-hairline bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
						/>
						<div className="mt-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
							<button
								type="button"
								onClick={() => setDraftTag('')}
								className={`rounded-[10px] px-3 py-1.5 text-xs ${
									!draftTag ? 'bg-ink text-paper' : 'border border-hairline text-ink-secondary'
								}`}
							>
								Tất cả
							</button>
							{filteredTags.map((t) => (
								<button
									key={t}
									type="button"
									onClick={() => setDraftTag(t)}
									className={`rounded-[10px] px-3 py-1.5 text-xs ${
										draftTag === t ? 'bg-ink text-paper' : 'border border-hairline text-ink-secondary'
									}`}
								>
									#{t}
								</button>
							))}
						</div>

						<label className="mt-6 block text-xs font-semibold uppercase tracking-widest text-ink-secondary">
							Sắp xếp
						</label>
						<div className="mt-2 flex flex-wrap gap-2">
							{SORT_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() => setDraftSort(opt.value)}
									className={`rounded-[10px] px-3 py-1.5 text-xs ${
										draftSort === opt.value ? 'bg-ink text-paper' : 'border border-hairline text-ink-secondary'
									}`}
								>
									{opt.label}
								</button>
							))}
						</div>

						<div className="mt-8 flex gap-3 pb-[env(safe-area-inset-bottom)]">
							<button
								type="button"
								onClick={clearAll}
								className="min-h-11 flex-1 rounded-[10px] border border-hairline text-xs font-semibold uppercase tracking-wider text-ink"
							>
								Xóa lọc
							</button>
							<button
								type="button"
								onClick={applyDraft}
								className="min-h-11 flex-1 rounded-[10px] bg-ink text-xs font-semibold uppercase tracking-wider text-paper"
							>
								Áp dụng
							</button>
						</div>
					</div>
				</div>
			) : null}
		</>
	);
}
