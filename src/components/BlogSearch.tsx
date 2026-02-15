'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
	id: string;
	title: string;
	slug: string;
	summary: string;
	tags: string[];
}

export default function BlogSearch() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	// Close on click outside
	useEffect(() => {
		if (!open) return;
		function handleClick(e: MouseEvent) {
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		function handleKey(e: KeyboardEvent) {
			if (e.key === 'Escape') setOpen(false);
		}
		document.addEventListener('mousedown', handleClick);
		document.addEventListener('keydown', handleKey);
		return () => {
			document.removeEventListener('mousedown', handleClick);
			document.removeEventListener('keydown', handleKey);
		};
	}, [open]);

	// Keyboard shortcut: Cmd+K / Ctrl+K
	useEffect(() => {
		function handleShortcut(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				setOpen(true);
				setTimeout(() => inputRef.current?.focus(), 50);
			}
		}
		document.addEventListener('keydown', handleShortcut);
		return () => document.removeEventListener('keydown', handleShortcut);
	}, []);

	const search = useCallback(async (q: string) => {
		if (!q.trim()) {
			setResults([]);
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(`/api/posts/search?q=${encodeURIComponent(q.trim())}`);
			const json = (await res.json()) as unknown;
			if (typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true) {
				const data = (json as { data?: SearchResult[] }).data;
				if (Array.isArray(data)) setResults(data);
			}
		} catch {
			/* ignore */
		} finally {
			setLoading(false);
		}
	}, []);

	function onInputChange(value: string) {
		setQuery(value);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => void search(value), 300);
	}

	function goToPost(slug: string) {
		setOpen(false);
		setQuery('');
		setResults([]);
		router.push(`/blog/${slug}`);
	}

	return (
		<div className="relative" ref={panelRef}>
			{/* Search trigger button */}
			<button
				onClick={() => {
					setOpen(true);
					setTimeout(() => inputRef.current?.focus(), 50);
				}}
				className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-muted transition-all hover:border-border-hover hover:text-foreground-secondary"
			>
				<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
				</svg>
				<span>Tìm kiếm…</span>
				<kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">⌘K</kbd>
			</button>

			{/* Search panel */}
			{open ? (
				<div className="absolute right-0 top-full z-50 mt-2 w-85 rounded-xl border border-border bg-surface-elevated shadow-lg sm:w-105">
					<div className="flex items-center gap-2 border-b border-border px-4 py-3">
						<svg className="h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
						</svg>
						<input
							ref={inputRef}
							value={query}
							onChange={(e) => onInputChange(e.target.value)}
							placeholder="Tìm bài viết…"
							className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
							autoFocus
						/>
						{query ? (
							<button
								onClick={() => {
									setQuery('');
									setResults([]);
									inputRef.current?.focus();
								}}
								className="text-xs text-muted hover:text-foreground"
							>
								✕
							</button>
						) : null}
					</div>

					<div className="max-h-80 overflow-y-auto p-2">
						{loading ? (
							<div className="flex items-center justify-center py-6 text-xs text-muted">
								<svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
								</svg>
								Đang tìm…
							</div>
						) : query && results.length === 0 ? (
							<p className="py-6 text-center text-xs text-muted">Không tìm thấy kết quả.</p>
						) : results.length > 0 ? (
							results.map((r) => (
								<button
									key={r.id}
									onClick={() => goToPost(r.slug)}
									className="flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
								>
									<span className="text-sm font-bold text-foreground">{r.title}</span>
									<span className="line-clamp-1 text-xs text-muted">{r.summary}</span>
									{r.tags.length > 0 ? (
										<div className="mt-0.5 flex gap-1">
											{r.tags.slice(0, 3).map((t) => (
												<span key={t} className="text-[10px] font-bold uppercase tracking-wider text-accent">
													{t}
												</span>
											))}
										</div>
									) : null}
								</button>
							))
						) : !query ? (
							<p className="py-6 text-center text-xs text-muted">Nhập từ khóa để tìm kiếm bài viết.</p>
						) : null}
					</div>
				</div>
			) : null}
		</div>
	);
}
