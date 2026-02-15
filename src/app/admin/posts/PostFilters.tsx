'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

interface PostFiltersProps {
	currentPublished?: string;
	currentTag?: string;
	currentCategory?: string;
	currentSearch?: string;
	currentSort?: string;
	currentDateFrom?: string;
	currentDateTo?: string;
	allTags: string[];
	allCategories: string[];
}

const STATUS_OPTIONS = [
	{ value: 'all', label: 'Tất cả' },
	{ value: 'true', label: 'Published' },
	{ value: 'false', label: 'Draft' },
] as const;

const SORT_OPTIONS = [
	{ value: 'updated', label: 'Cập nhật gần nhất' },
	{ value: 'created', label: 'Mới tạo nhất' },
	{ value: 'oldest', label: 'Cũ nhất' },
	{ value: 'views', label: 'Nhiều lượt xem' },
	{ value: 'title', label: 'Theo tiêu đề A-Z' },
] as const;

function buildUrl(params: Record<string, string | undefined>) {
	const sp = new URLSearchParams();
	for (const [key, val] of Object.entries(params)) {
		if (val && val !== 'all' && !(key === 'sort' && val === 'updated') && !(key === 'page' && val === '1')) {
			sp.set(key, val);
		}
	}
	const q = sp.toString();
	return `/admin/posts${q ? `?${q}` : ''}`;
}

export default function PostFilters({
	currentPublished = 'all',
	currentTag,
	currentCategory,
	currentSearch = '',
	currentSort = 'updated',
	currentDateFrom,
	currentDateTo,
	allTags,
	allCategories,
}: PostFiltersProps) {
	const router = useRouter();
	const [search, setSearch] = useState(currentSearch);
	const [showAdvanced, setShowAdvanced] = useState(
		!!(currentTag || (currentCategory && currentCategory !== 'all') || currentDateFrom || currentDateTo)
	);

	const navigateWithFilters = useCallback(
		(overrides: Record<string, string | undefined>) => {
			const params = {
				published: currentPublished,
				tag: currentTag,
				category: currentCategory,
				search: currentSearch,
				sort: currentSort,
				dateFrom: currentDateFrom,
				dateTo: currentDateTo,
				page: '1',
				...overrides,
			};
			router.push(buildUrl(params));
		},
		[currentPublished, currentTag, currentCategory, currentSearch, currentSort, currentDateFrom, currentDateTo, router]
	);

	function handleSearchSubmit(e: React.FormEvent) {
		e.preventDefault();
		navigateWithFilters({ search: search.trim() || undefined });
	}

	return (
		<section className="mt-6 space-y-3">
			{/* Row 1: Status tabs + search + sort */}
			<div className="flex flex-wrap items-center gap-3">
				{/* Status pills */}
				<div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
					{STATUS_OPTIONS.map((opt) => (
						<Link
							key={opt.value}
							className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
								currentPublished === opt.value
									? 'bg-foreground text-background shadow-sm'
									: 'text-muted hover:text-foreground'
							}`}
							href={buildUrl({
								published: opt.value,
								tag: currentTag,
								category: currentCategory,
								search: currentSearch || undefined,
								sort: currentSort,
								dateFrom: currentDateFrom,
								dateTo: currentDateTo,
							})}
						>
							{opt.label}
						</Link>
					))}
				</div>

				{/* Search */}
				<form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-1">
					<div className="relative flex-1 max-w-xs">
						<svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Tìm bài viết…"
							className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-xs outline-none transition-colors placeholder:text-muted focus:border-accent"
						/>
					</div>
					<button
						type="submit"
						className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium transition-colors hover:bg-surface-hover"
					>
						Tìm
					</button>
				</form>

				{/* Sort */}
				<select
					value={currentSort || 'updated'}
					onChange={(e) => navigateWithFilters({ sort: e.target.value })}
					className="rounded-lg border border-border bg-surface px-3 py-2 text-xs outline-none transition-colors focus:border-accent"
				>
					{SORT_OPTIONS.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>

				{/* Toggle advanced */}
				<button
					type="button"
					onClick={() => setShowAdvanced((v) => !v)}
					className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
						showAdvanced ? 'border-accent bg-accent-subtle text-accent' : 'border-border bg-surface text-muted hover:text-foreground'
					}`}
				>
					<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
					</svg>
					Bộ lọc
				</button>
			</div>

			{/* Row 2: Advanced filters */}
			{showAdvanced && (
				<div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
					{/* Category */}
					<label className="block min-w-35">
						<span className="text-[11px] font-medium uppercase tracking-wider text-muted">Chủ đề</span>
						<select
							value={currentCategory || 'all'}
							onChange={(e) => navigateWithFilters({ category: e.target.value === 'all' ? undefined : e.target.value })}
							className="mt-1 block w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-accent"
						>
							<option value="all">Tất cả chủ đề</option>
							{allCategories.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>
					</label>

					{/* Tag */}
					<label className="block min-w-35">
						<span className="text-[11px] font-medium uppercase tracking-wider text-muted">Tag</span>
						<select
							value={currentTag || ''}
							onChange={(e) => navigateWithFilters({ tag: e.target.value || undefined })}
							className="mt-1 block w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-accent"
						>
							<option value="">Tất cả tags</option>
							{allTags.map((t) => (
								<option key={t} value={t}>
									{t}
								</option>
							))}
						</select>
					</label>

					{/* Date from */}
					<label className="block">
						<span className="text-[11px] font-medium uppercase tracking-wider text-muted">Từ ngày</span>
						<input
							type="date"
							value={currentDateFrom || ''}
							onChange={(e) => navigateWithFilters({ dateFrom: e.target.value || undefined })}
							className="mt-1 block rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-accent"
						/>
					</label>

					{/* Date to */}
					<label className="block">
						<span className="text-[11px] font-medium uppercase tracking-wider text-muted">Đến ngày</span>
						<input
							type="date"
							value={currentDateTo || ''}
							onChange={(e) => navigateWithFilters({ dateTo: e.target.value || undefined })}
							className="mt-1 block rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-accent"
						/>
					</label>

					{/* Clear */}
					<Link
						href="/admin/posts"
						className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
					>
						Xoá bộ lọc
					</Link>
				</div>
			)}
		</section>
	);
}
