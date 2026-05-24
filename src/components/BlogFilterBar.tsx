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
	{ value: 'chapter-asc', label: 'Chapter ↑' },
	{ value: 'chapter-desc', label: 'Chapter ↓' },
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
	return `/blog${q ? `?${q}` : ''}`;
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
	const [showFilters, setShowFilters] = useState(
		!!(currentTag || currentCategory || currentSort),
	);
	const [tagSearch, setTagSearch] = useState('');
	const [showTagDropdown, setShowTagDropdown] = useState(false);
	const [catSearch, setCatSearch] = useState('');
	const [showCatDropdown, setShowCatDropdown] = useState(false);
	const tagRef = useRef<HTMLDivElement>(null);
	const catRef = useRef<HTMLDivElement>(null);

	const hasActiveFilters = !!(currentTag || currentCategory || currentSort);

	// Close dropdowns on outside click
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (tagRef.current && !tagRef.current.contains(e.target as Node)) setShowTagDropdown(false);
			if (catRef.current && !catRef.current.contains(e.target as Node)) setShowCatDropdown(false);
		}
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, []);

	const filteredTags = tagSearch
		? allTags.filter((t) => t.toLowerCase().includes(tagSearch.toLowerCase()))
		: allTags;

	const filteredCats = catSearch
		? allCategories.filter((c) => c.toLowerCase().includes(catSearch.toLowerCase()))
		: allCategories;

	const navigate = useCallback(
		(overrides: Record<string, string | undefined>) => {
			const params: Record<string, string | undefined> = {
				tag: currentTag,
				category: currentCategory,
				sort: currentSort,
				page: undefined, // Reset page on filter change
				...overrides,
			};
			router.push(buildQuery(params));
		},
		[currentTag, currentCategory, currentSort, router],
	);

	return (
		<section className="border-b border-border">
			<div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
				{/* Main filter row */}
				<div className="flex flex-wrap items-center gap-2">
					{/* Filter toggle button */}
					<button
						onClick={() => setShowFilters((v) => !v)}
						className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
							showFilters || hasActiveFilters
								? 'bg-accent text-accent-foreground'
								: 'border border-border text-muted hover:border-foreground hover:text-foreground'
						}`}
					>
						<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
						</svg>
						Bộ lọc
						{hasActiveFilters ? (
							<span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent-foreground/20 text-[10px]">
								{[currentTag, currentCategory, currentSort].filter(Boolean).length}
							</span>
						) : null}
					</button>

					{/* Sort chips (always visible) */}
					<div className="flex items-center gap-1">
						{SORT_OPTIONS.map((opt) => {
							const isActive = (currentSort ?? '') === opt.value;
							return (
								<button
									key={opt.value}
									onClick={() => navigate({ sort: opt.value || undefined })}
									className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
										isActive
											? 'bg-foreground text-background'
											: 'text-muted hover:bg-surface-hover hover:text-foreground'
									}`}
								>
									{opt.label}
								</button>
							);
						})}
					</div>

					{/* Active filter pills */}
					{currentTag ? (
						<span className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-2.5 py-1 text-[11px] font-bold text-accent">
							Tag: {currentTag}
							<button
								onClick={() => navigate({ tag: undefined })}
								className="ml-0.5 text-accent/60 hover:text-accent"
							>
								✕
							</button>
						</span>
					) : null}
					{currentCategory ? (
						<span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-1 text-[11px] font-bold text-foreground-secondary">
							{currentCategory}
							<button
								onClick={() => navigate({ category: undefined })}
								className="ml-0.5 text-muted hover:text-foreground"
							>
								✕
							</button>
						</span>
					) : null}

					{hasActiveFilters ? (
						<Link
							href="/blog"
							className="text-[11px] font-medium text-muted underline underline-offset-2 hover:text-foreground"
						>
							Xoá tất cả
						</Link>
					) : null}

					{/* Result count */}
					<span className="ml-auto font-mono text-[10px] text-muted">{total} kết quả</span>
				</div>

				{/* Expanded filter panel */}
				{showFilters ? (
					<div className="mt-3 flex flex-wrap items-start gap-4 border-t border-border pt-3">
						{/* Tag filter with search */}
						<div className="relative" ref={tagRef}>
							<button
								onClick={() => {
									setShowTagDropdown((v) => !v);
									setShowCatDropdown(false);
								}}
								className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground-secondary transition-colors hover:border-foreground"
							>
								<svg className="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
								</svg>
								{currentTag ? `#${currentTag}` : 'Chọn tag'}
								<svg className="h-3 w-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
								</svg>
							</button>
							{showTagDropdown && allTags.length > 0 ? (
								<div className="absolute left-0 top-full z-40 mt-1 w-56 rounded-xl border border-border bg-surface-elevated shadow-lg">
									<div className="border-b border-border p-2">
										<input
											value={tagSearch}
											onChange={(e) => setTagSearch(e.target.value)}
											placeholder="Tìm tag…"
											className="w-full rounded-md bg-surface-hover px-2.5 py-1.5 text-xs outline-none placeholder:text-muted"
											autoFocus
										/>
									</div>
									<div className="max-h-48 overflow-y-auto p-1">
										{currentTag ? (
											<button
												onClick={() => {
													navigate({ tag: undefined });
													setShowTagDropdown(false);
												}}
												className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-muted hover:bg-surface-hover"
											>
												Bỏ chọn tag
											</button>
										) : null}
										{filteredTags.map((t) => (
											<button
												key={t}
												onClick={() => {
													navigate({ tag: t });
													setShowTagDropdown(false);
													setTagSearch('');
												}}
												className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-surface-hover ${
													currentTag === t ? 'font-bold text-accent' : 'text-foreground-secondary'
												}`}
											>
												<span className="text-muted">#</span>
												{t}
											</button>
										))}
										{filteredTags.length === 0 ? (
											<p className="px-3 py-2 text-xs text-muted">Không tìm thấy.</p>
										) : null}
									</div>
								</div>
							) : null}
						</div>

						{/* Category filter with search */}
						{allCategories.length > 0 ? (
							<div className="relative" ref={catRef}>
								<button
									onClick={() => {
										setShowCatDropdown((v) => !v);
										setShowTagDropdown(false);
									}}
									className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground-secondary transition-colors hover:border-foreground"
								>
									<svg className="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
									</svg>
									{currentCategory ?? 'Chủ đề'}
									<svg className="h-3 w-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
									</svg>
								</button>
								{showCatDropdown ? (
									<div className="absolute left-0 top-full z-40 mt-1 w-56 rounded-xl border border-border bg-surface-elevated shadow-lg">
										<div className="border-b border-border p-2">
											<input
												value={catSearch}
												onChange={(e) => setCatSearch(e.target.value)}
												placeholder="Tìm chủ đề…"
												className="w-full rounded-md bg-surface-hover px-2.5 py-1.5 text-xs outline-none placeholder:text-muted"
												autoFocus
											/>
										</div>
										<div className="max-h-48 overflow-y-auto p-1">
											{currentCategory ? (
												<button
													onClick={() => {
														navigate({ category: undefined });
														setShowCatDropdown(false);
													}}
													className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-muted hover:bg-surface-hover"
												>
													Bỏ chọn chủ đề
												</button>
											) : null}
											{filteredCats.map((c) => (
												<button
													key={c}
													onClick={() => {
														navigate({ category: c });
														setShowCatDropdown(false);
														setCatSearch('');
													}}
													className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-surface-hover ${
														currentCategory === c ? 'font-bold text-accent' : 'text-foreground-secondary'
													}`}
												>
													{c}
												</button>
											))}
											{filteredCats.length === 0 ? (
												<p className="px-3 py-2 text-xs text-muted">Không tìm thấy.</p>
											) : null}
										</div>
									</div>
								) : null}
							</div>
						) : null}
					</div>
				) : null}
			</div>
		</section>
	);
}
