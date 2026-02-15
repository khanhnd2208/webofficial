'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo, useCallback } from 'react';

type TermWithSet = {
	word: string;
	definition: string;
	partOfSpeech: string;
	example: string;
	setId: string;
	setTitle: string;
};

type WordStat = {
	word: string;
	correctCount: number;
	wrongCount: number;
	totalAttempts: number;
	accuracy: number;
	lastPracticed: string;
};

function speak(text: string) {
	if (typeof window === 'undefined' || !window.speechSynthesis) return;
	const u = new SpeechSynthesisUtterance(text);
	u.lang = 'en-US';
	u.rate = 0.9;
	window.speechSynthesis.cancel();
	window.speechSynthesis.speak(u);
}

const POS_OPTIONS = ['All', 'noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'other'];

export default function WordDatabasePage() {
	const [allTerms, setAllTerms] = useState<TermWithSet[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [totalSets, setTotalSets] = useState(0);
	const [statsMap, setStatsMap] = useState<Map<string, WordStat>>(new Map());

	// Filters
	const [search, setSearch] = useState('');
	const [posFilter, setPosFilter] = useState('All');
	const [setFilter, setSetFilter] = useState('All');
	const [sortBy, setSortBy] = useState<'alpha' | 'alpha-desc' | 'set' | 'hardest' | 'most-practiced'>('alpha');

	useEffect(() => {
		async function fetchAll() {
			try {
				const [termsRes, statsRes] = await Promise.all([
					fetch('/api/vocab-sets/all-terms'),
					fetch('/api/vocab-stats'),
				]);
				const termsJson = await termsRes.json();
				const statsJson = await statsRes.json();

				if (!termsJson.ok) { setError(termsJson.error); setLoading(false); return; }
				setAllTerms(termsJson.data.terms);
				setTotalSets(termsJson.data.totalSets);

				if (statsJson.ok && Array.isArray(statsJson.data)) {
					const map = new Map<string, WordStat>();
					statsJson.data.forEach((s: WordStat) => map.set(s.word, s));
					setStatsMap(map);
				}
			} catch {
				setError('Có lỗi xảy ra');
			} finally {
				setLoading(false);
			}
		}
		fetchAll();
	}, []);

	// Unique sets for filter dropdown
	const uniqueSets = useMemo(() => {
		const map = new Map<string, string>();
		allTerms.forEach((t) => map.set(t.setId, t.setTitle));
		return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
	}, [allTerms]);

	// Unique POS values that actually exist
	const existingPos = useMemo(() => {
		const s = new Set<string>();
		allTerms.forEach((t) => { if (t.partOfSpeech) s.add(t.partOfSpeech.toLowerCase()); });
		return s;
	}, [allTerms]);

	// Filtered & sorted
	const filtered = useMemo(() => {
		let result = allTerms;

		// Search
		if (search.trim()) {
			const q = search.toLowerCase();
			result = result.filter(
				(t) =>
					t.word.toLowerCase().includes(q) ||
					t.definition.toLowerCase().includes(q) ||
					t.example.toLowerCase().includes(q)
			);
		}

		// POS filter
		if (posFilter !== 'All') {
			result = result.filter((t) => t.partOfSpeech.toLowerCase() === posFilter.toLowerCase());
		}

		// Set filter
		if (setFilter !== 'All') {
			result = result.filter((t) => t.setId === setFilter);
		}

		// Sort
		if (sortBy === 'alpha') {
			result = [...result].sort((a, b) => a.word.localeCompare(b.word));
		} else if (sortBy === 'alpha-desc') {
			result = [...result].sort((a, b) => b.word.localeCompare(a.word));
		} else if (sortBy === 'set') {
			result = [...result].sort((a, b) => a.setTitle.localeCompare(b.setTitle));
		} else if (sortBy === 'hardest') {
			result = [...result].sort((a, b) => {
				const sa = statsMap.get(a.word.toLowerCase().trim());
				const sb = statsMap.get(b.word.toLowerCase().trim());
				const accA = sa ? sa.accuracy : 101; // unplayed = end
				const accB = sb ? sb.accuracy : 101;
				return accA - accB; // lowest accuracy first
			});
		} else if (sortBy === 'most-practiced') {
			result = [...result].sort((a, b) => {
				const sa = statsMap.get(a.word.toLowerCase().trim());
				const sb = statsMap.get(b.word.toLowerCase().trim());
				return (sb?.totalAttempts ?? 0) - (sa?.totalAttempts ?? 0);
			});
		}

		return result;
	}, [allTerms, search, posFilter, setFilter, sortBy, statsMap]);

	const clearFilters = useCallback(() => {
		setSearch('');
		setPosFilter('All');
		setSetFilter('All');
		setSortBy('alpha');
	}, []);

	const hasFilters = search || posFilter !== 'All' || setFilter !== 'All';

	// Color-coding for POS tags
	const posColor = (pos: string): string => {
		const p = pos.toLowerCase();
		if (p === 'noun' || p === 'n') return 'bg-indigo-subtle text-indigo';
		if (p === 'verb' || p === 'v') return 'bg-accent-subtle text-accent';
		if (p.startsWith('adj')) return 'bg-purple-subtle text-purple';
		if (p.startsWith('adv')) return 'bg-teal-subtle text-teal';
		if (p === 'preposition' || p === 'prep') return 'bg-warning-subtle text-warning';
		return 'bg-surface-hover text-muted';
	};

	if (loading) {
		return (
			<main className="min-h-screen">
				<div className="mx-auto max-w-5xl px-6 py-20 text-center">
					<div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
					<p className="mt-4 text-xs text-muted">Đang tải dữ liệu từ vựng...</p>
				</div>
			</main>
		);
	}

	if (error) {
		return (
			<main className="min-h-screen flex items-center justify-center">
				<p className="text-sm text-error">{error}</p>
			</main>
		);
	}

	return (
		<main className="min-h-screen">
			{/* Header */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
					<div className="flex items-center gap-3">
						<Link href="/vocabulary" className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors">
							Từ vựng
						</Link>
						<span className="text-xs text-muted">/</span>
						<span className="text-xs font-bold uppercase tracking-widest text-foreground">Database</span>
					</div>
					<h1 className="mt-4 text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl lg:text-4xl">
						Kho từ vựng
					</h1>
					<p className="mt-2 text-sm text-foreground-secondary">
						Tất cả từ vựng bạn đã thêm, tổng hợp từ {totalSets} bộ từ.
					</p>
				</div>
			</section>

			{/* Stats bar */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-5xl px-6">
					<div className="grid grid-cols-4">
						{[
							{ value: allTerms.length, label: 'Tổng từ vựng', color: 'text-indigo' },
							{ value: totalSets, label: 'Bộ từ', color: 'text-purple' },
							{ value: statsMap.size, label: 'Đã luyện', color: 'text-success' },
							{ value: filtered.length, label: 'Đang hiển thị', color: 'text-teal' },
						].map((stat, i) => (
							<div
								key={stat.label}
								className={`py-5 ${i > 0 ? 'border-l border-border pl-4 sm:pl-8' : ''}`}
							>
								<div className={`text-xl font-black tracking-tight sm:text-2xl ${stat.color}`}>
									{stat.value}
								</div>
								<div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">
									{stat.label}
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Filters */}
			<section className="border-b border-border bg-surface/50">
				<div className="mx-auto max-w-5xl px-6 py-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
						{/* Search */}
						<div className="relative flex-1">
							<svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
							</svg>
							<input
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Tìm từ, nghĩa, ví dụ..."
								className="w-full border border-border bg-surface py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted focus:border-indigo focus:outline-none"
							/>
						</div>

						{/* POS filter */}
						<select
							value={posFilter}
							onChange={(e) => setPosFilter(e.target.value)}
							className="border border-border bg-surface px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground focus:border-indigo focus:outline-none"
						>
							<option value="All">Tất cả loại từ</option>
							{POS_OPTIONS.slice(1).filter(p => existingPos.has(p)).map((pos) => (
								<option key={pos} value={pos}>{pos}</option>
							))}
						</select>

						{/* Set filter */}
						<select
							value={setFilter}
							onChange={(e) => setSetFilter(e.target.value)}
							className="border border-border bg-surface px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground focus:border-indigo focus:outline-none max-w-48 truncate"
						>
							<option value="All">Tất cả bộ từ</option>
							{uniqueSets.map((s) => (
								<option key={s.id} value={s.id}>{s.title}</option>
							))}
						</select>

						{/* Sort */}
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value as 'alpha' | 'alpha-desc' | 'set' | 'hardest' | 'most-practiced')}
							className="border border-border bg-surface px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground focus:border-indigo focus:outline-none"
						>
							<option value="alpha">A → Z</option>
							<option value="alpha-desc">Z → A</option>
							<option value="set">Theo bộ từ</option>
							<option value="hardest">Từ khó nhất</option>
							<option value="most-practiced">Luyện nhiều nhất</option>
						</select>

						{hasFilters && (
							<button
								onClick={clearFilters}
								className="text-xs font-bold uppercase tracking-wider text-muted hover:text-error transition-colors"
							>
								Xóa bộ lọc
							</button>
						)}
					</div>
				</div>
			</section>

			{/* Word list */}
			<section>
				<div className="mx-auto max-w-5xl px-6 py-8 sm:py-10">
					{filtered.length === 0 ? (
						<div className="border-2 border-dashed border-border p-12 text-center">
							<p className="text-sm text-muted">
								{allTerms.length === 0
									? 'Chưa có từ vựng nào. Hãy tạo bộ từ đầu tiên!'
									: 'Không tìm thấy từ vựng phù hợp với bộ lọc.'}
							</p>
							{allTerms.length === 0 && (
								<Link
									href="/vocabulary/create"
									className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground"
								>
									Tạo bộ từ
								</Link>
							)}
						</div>
					) : (
						<div className="divide-y divide-border border border-border">
							{filtered.map((term, idx) => (
								<div
									key={`${term.setId}-${term.word}-${idx}`}
									className="group flex items-start gap-3 p-4 transition-colors hover:bg-surface-hover sm:gap-4 sm:p-5"
								>
									{/* Index number */}
									<span className="shrink-0 pt-0.5 text-xs font-bold tabular-nums text-muted">
										{idx + 1}
									</span>

									{/* Content */}
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
											{/* Word */}
											<span className="text-sm font-black uppercase tracking-tight text-foreground">
												{term.word}
											</span>

											{/* Part of speech badge */}
											{term.partOfSpeech && (
												<span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${posColor(term.partOfSpeech)}`}>
													{term.partOfSpeech}
												</span>
											)}

											{/* Set badge */}
											<Link
												href={`/vocabulary/${term.setId}`}
												className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-bold text-muted transition-colors hover:text-foreground"
											>
												{term.setTitle}
											</Link>

											{/* Difficulty badge from stats */}
											{(() => {
												const stat = statsMap.get(term.word.toLowerCase().trim());
												if (!stat || stat.totalAttempts === 0) return null;
												const acc = stat.accuracy;
												const label = acc >= 80 ? 'Tốt' : acc >= 50 ? 'Khá' : 'Khó';
												const color = acc >= 80 ? 'bg-success-subtle text-success' : acc >= 50 ? 'bg-warning-subtle text-warning' : 'bg-error-subtle text-error';
												return (
													<span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${color}`} title={`${acc}% (${stat.correctCount}✓ / ${stat.wrongCount}✗)`}>
														{label} {acc}%
													</span>
												);
											})()}
										</div>

										{/* Definition */}
										<p className="mt-1 text-sm text-foreground-secondary">{term.definition}</p>

										{/* Example */}
										{term.example && (
											<p className="mt-1 text-xs italic text-muted">&ldquo;{term.example}&rdquo;</p>
										)}
									</div>

									{/* Speak button */}
									<button
										onClick={() => speak(term.word)}
										className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-muted opacity-0 transition-all hover:bg-accent hover:text-accent-foreground group-hover:opacity-100"
									>
										<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-3.14a.75.75 0 011.28.53v12.72a.75.75 0 01-1.28.53l-4.72-3.14H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
										</svg>
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			</section>
		</main>
	);
}
