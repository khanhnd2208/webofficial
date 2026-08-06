'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
	id: string;
	title: string;
	slug: string;
	summary: string;
	tags: string[];
	chapterNumber?: number;
}

export default function BlogSearch() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
	const titleId = useId();

	const close = useCallback(() => {
		setOpen(false);
		queueMicrotask(() => triggerRef.current?.focus());
	}, []);

	useEffect(() => {
		if (!open) return;
		function handleKey(e: KeyboardEvent) {
			if (e.key === 'Escape') close();
		}
		document.addEventListener('keydown', handleKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		setTimeout(() => inputRef.current?.focus(), 50);
		return () => {
			document.removeEventListener('keydown', handleKey);
			document.body.style.overflow = prev;
		};
	}, [open, close]);

	useEffect(() => {
		function handleShortcut(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				setOpen(true);
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
		close();
		setQuery('');
		setResults([]);
		router.push(`/bai-viet/${slug}`);
	}

	return (
		<div className="relative">
			<button
				ref={triggerRef}
				type="button"
				onClick={() => setOpen(true)}
				className="inline-flex min-h-10 items-center gap-2 rounded-[10px] border border-hairline px-3.5 py-2 text-xs text-ink-secondary transition-colors duration-200 hover:border-ink hover:text-ink"
			>
				<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
					/>
				</svg>
				<span>Tìm kiếm</span>
				<kbd className="hidden rounded border border-hairline bg-surface px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
					⌘K
				</kbd>
			</button>

			{open ? (
				<div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[max(4rem,8vh)] sm:p-6 sm:pt-[12vh]">
					<button
						type="button"
						className="absolute inset-0 bg-ink/40"
						aria-label="Đóng tìm kiếm"
						onClick={close}
					/>
					<div
						ref={panelRef}
						role="dialog"
						aria-modal="true"
						aria-labelledby={titleId}
						className="relative z-10 flex max-h-[min(70dvh,28rem)] w-full max-w-lg flex-col overflow-hidden rounded-[14px] border border-hairline bg-paper shadow-lg"
					>
						<p id={titleId} className="sr-only">
							Tìm bài viết
						</p>
						<div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
							<svg
								className="h-4 w-4 shrink-0 text-ink-secondary"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
								/>
							</svg>
							<input
								ref={inputRef}
								value={query}
								onChange={(e) => onInputChange(e.target.value)}
								placeholder="Tìm bài viết…"
								className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-secondary"
								autoFocus
							/>
							{query ? (
								<button
									type="button"
									onClick={() => {
										setQuery('');
										setResults([]);
										inputRef.current?.focus();
									}}
									className="text-xs text-ink-secondary hover:text-ink"
								>
									Xóa
								</button>
							) : (
								<button type="button" onClick={close} className="text-xs text-ink-secondary hover:text-ink">
									Esc
								</button>
							)}
						</div>

						<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
							{loading ? (
								<div className="flex items-center justify-center py-6 text-xs text-ink-secondary">Đang tìm…</div>
							) : query && results.length === 0 ? (
								<p className="py-6 text-center text-xs text-ink-secondary">Không tìm thấy kết quả.</p>
							) : results.length > 0 ? (
								results.map((r) => (
									<button
										key={r.id}
										type="button"
										onClick={() => goToPost(r.slug)}
										className="flex w-full flex-col gap-0.5 rounded-[10px] px-3 py-2.5 text-left transition-colors duration-200 hover:bg-surface-hover"
									>
										<div className="flex items-center gap-2">
											{r.chapterNumber ? (
												<span className="font-mono text-[10px] font-bold text-vermilion">
													Ch.{r.chapterNumber}
												</span>
											) : null}
											<span className="text-sm font-semibold text-ink">{r.title}</span>
										</div>
										<span className="line-clamp-1 text-xs text-ink-secondary">{r.summary}</span>
									</button>
								))
							) : (
								<p className="py-6 text-center text-xs text-ink-secondary">Nhập từ khóa để tìm kiếm bài viết.</p>
							)}
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
