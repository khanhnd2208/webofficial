'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

interface BlogFilterBarProps {
	allTags: string[];
	allCategories: string[];
	currentTag?: string;
	currentCategory?: string;
	currentSort?: string;
	total: number;
}

const SORT_OPTIONS = [
	{ value: '', label: 'Sắp xếp ban đầu' },
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
	const [popoverOpen, setPopoverOpen] = useState(false);
	const [draftTag, setDraftTag] = useState(currentTag ?? '');
	const [draftCategory, setDraftCategory] = useState(currentCategory ?? '');
	const [draftSort, setDraftSort] = useState(currentSort ?? '');
	const [tagSearch, setTagSearch] = useState('');
	const sheetRef = useRef<HTMLDivElement>(null);
	const sheetTriggerRef = useRef<HTMLButtonElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);
	const popoverTriggerRef = useRef<HTMLButtonElement>(null);
	const sheetTitleId = useId();
	const popoverId = useId();

	const hasSecondaryFilters = !!(currentTag || currentSort);
	const hasActiveFilters = !!(currentTag || currentCategory || currentSort);

	const openSheet = () => {
		setDraftTag(currentTag ?? '');
		setDraftCategory(currentCategory ?? '');
		setDraftSort(currentSort ?? '');
		setTagSearch('');
		setSheetOpen(true);
	};

	const closeSheet = useCallback(() => {
		setSheetOpen(false);
		queueMicrotask(() => sheetTriggerRef.current?.focus());
	}, []);

	useEffect(() => {
		if (!sheetOpen) return;
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') closeSheet();
		}
		document.addEventListener('keydown', onKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		const first = sheetRef.current?.querySelector<HTMLElement>('button, input, [href]');
		first?.focus();
		return () => {
			document.removeEventListener('keydown', onKey);
			document.body.style.overflow = prev;
		};
	}, [sheetOpen, closeSheet]);

	useEffect(() => {
		if (!popoverOpen) return;
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				setPopoverOpen(false);
				popoverTriggerRef.current?.focus();
			}
		}
		function onClick(e: MouseEvent) {
			if (
				popoverRef.current &&
				!popoverRef.current.contains(e.target as Node) &&
				!popoverTriggerRef.current?.contains(e.target as Node)
			) {
				setPopoverOpen(false);
			}
		}
		document.addEventListener('keydown', onKey);
		document.addEventListener('mousedown', onClick);
		return () => {
			document.removeEventListener('keydown', onKey);
			document.removeEventListener('mousedown', onClick);
		};
	}, [popoverOpen]);

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
		closeSheet();
	};

	const clearAll = () => {
		setDraftTag('');
		setDraftCategory('');
		setDraftSort('');
		router.push('/bai-viet');
		setSheetOpen(false);
		setPopoverOpen(false);
	};

	const filteredTags = tagSearch
		? allTags.filter((t) => t.toLowerCase().includes(tagSearch.toLowerCase()))
		: allTags;

	const topics = allCategories.filter((c) => c !== 'Uncategorized');

	return (
		<>
			{/* Topic chips + desktop secondary filter popover */}
			<section className="sticky top-[var(--header-height)] z-30 border-b border-hairline bg-canvas/95 backdrop-blur-md">
				<div className="shell py-3">
					<div className="flex items-center gap-3">
						<div
							className="flex min-w-0 flex-1 gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
							role="list"
							aria-label="Chủ đề"
						>
							<Link
								href={buildQuery({ tag: currentTag, sort: currentSort })}
								role="listitem"
								className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 ${
									!currentCategory
										? 'bg-ink text-paper'
										: 'border border-hairline text-ink-secondary hover:border-ink hover:text-ink'
								}`}
							>
								Tất cả
							</Link>
							{topics.map((c) => {
								const active = currentCategory === c;
								return (
									<Link
										key={c}
										href={buildQuery({
											category: c,
											tag: currentTag,
											sort: currentSort,
										})}
										role="listitem"
										className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 ${
											active
												? 'bg-ink text-paper'
												: 'border border-hairline text-ink-secondary hover:border-ink hover:text-ink'
										}`}
									>
										{c}
									</Link>
								);
							})}
						</div>

						{/* Desktop: compact secondary filters */}
						<div className="relative hidden shrink-0 lg:block">
							<button
								ref={popoverTriggerRef}
								type="button"
								onClick={() => setPopoverOpen((v) => !v)}
								aria-expanded={popoverOpen}
								aria-controls={popoverId}
								className={`inline-flex min-h-9 items-center gap-2 rounded-[10px] px-3 text-xs font-semibold transition-colors duration-200 ${
									hasSecondaryFilters
										? 'bg-vermilion text-paper'
										: 'border border-hairline text-ink hover:bg-surface-hover'
								}`}
							>
								Lọc thêm
								{hasSecondaryFilters ? (
									<span className="font-mono text-[10px]">
										{[currentTag, currentSort].filter(Boolean).length}
									</span>
								) : null}
							</button>
							{popoverOpen ? (
								<div
									id={popoverId}
									ref={popoverRef}
									role="dialog"
									aria-label="Lọc thêm"
									className="absolute right-0 top-full z-40 mt-2 w-72 rounded-[12px] border border-hairline bg-paper p-4 shadow-lg"
								>
									<label className="block text-[10px] font-semibold uppercase tracking-widest text-ink-secondary">
										Thẻ
									</label>
									<select
										value={currentTag ?? ''}
										onChange={(e) => {
											navigate({ tag: e.target.value || undefined });
										}}
										className="mt-2 w-full rounded-[10px] border border-hairline bg-canvas px-3 py-2 text-xs text-ink"
										aria-label="Thẻ"
									>
										<option value="">Tất cả thẻ</option>
										{allTags.map((t) => (
											<option key={t} value={t}>
												#{t}
											</option>
										))}
									</select>

									<label className="mt-4 block text-[10px] font-semibold uppercase tracking-widest text-ink-secondary">
										Sắp xếp
									</label>
									<div className="mt-2 flex flex-wrap gap-1.5">
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
										<button
											type="button"
											onClick={clearAll}
											className="mt-4 text-[11px] font-medium text-ink-secondary underline underline-offset-2 hover:text-ink"
										>
											Xóa lọc
										</button>
									) : null}
								</div>
							) : null}
						</div>

						{/* Mobile: bottom sheet trigger */}
						<button
							ref={sheetTriggerRef}
							type="button"
							onClick={openSheet}
							className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-[10px] px-3 text-xs font-semibold lg:hidden ${
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

						<span className="hidden shrink-0 font-mono text-[10px] text-ink-secondary sm:inline" aria-live="polite">
							{total} kết quả
						</span>
					</div>
				</div>
			</section>

			{/* Mobile filter sheet */}
			{sheetOpen ? (
				<div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby={sheetTitleId}>
					<button type="button" className="absolute inset-0 bg-ink/40" aria-label="Đóng" onClick={closeSheet} />
					<div
						ref={sheetRef}
						className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[14px] border-t border-hairline bg-paper p-6"
						style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
					>
						<div className="mx-auto mb-4 h-1 w-10 rounded-full bg-hairline" aria-hidden />
						<p id={sheetTitleId} className="font-display text-xl font-medium text-ink">
							Bộ lọc
						</p>

						<label className="mt-6 block text-xs font-semibold uppercase tracking-widest text-ink-secondary">
							Chủ đề
						</label>
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
							{topics.map((c) => (
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
							Thẻ
						</label>
						<input
							value={tagSearch}
							onChange={(e) => setTagSearch(e.target.value)}
							placeholder="Tìm thẻ…"
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

						<div className="mt-8 flex gap-3">
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
