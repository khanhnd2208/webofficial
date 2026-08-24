'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { Sheet } from '@/components/ui/Dialog';
import { routes } from '@/config/routes';
import { foldSearchText, testMatchesSearch } from '@/features/myspace-tests/search';
import type {
	PublicSpaceTestListItem,
	PublicSubjectGroup,
} from '@/features/myspace-tests/types';

import {
	formatCompletedDate,
	formatDifficulty,
	formatScorePercent,
	truncateDescription,
} from './format';

function formatIndex(n: number): string {
	return String(n).padStart(2, '0');
}

function testCountLabel(count: number): string {
	return `${count} bài`;
}

function detailValues(values: Array<number | string>): string | null {
	const unique = [...new Set(values.map(String).filter(Boolean))];
	return unique.length > 0 ? unique.join(' · ') : null;
}

function TestDetails({ test, id }: { test: PublicSpaceTestListItem; id: string }) {
	const topics = detailValues(test.topics);
	const classifications = detailValues(test.classifications);
	const difficulties = detailValues(test.difficulties.map(formatDifficulty));

	return (
		<div
			id={id}
			className="mt-3 border-t border-hairline pt-3"
			data-testid={`myspace-test-details-${test.slug}`}
		>
			{test.description ? (
				<p className="max-w-2xl text-sm leading-[1.65] text-ink-secondary">{test.description}</p>
			) : null}
			<dl className="mt-3 grid max-w-2xl gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
				{topics ? (
					<div>
						<dt className="font-mono text-[0.65rem] tracking-[0.1em] text-ink-secondary uppercase">
							Ôn tập
						</dt>
						<dd className="mt-1 leading-relaxed text-ink">{topics}</dd>
					</div>
				) : null}
				{classifications ? (
					<div>
						<dt className="font-mono text-[0.65rem] tracking-[0.1em] text-ink-secondary uppercase">
							Loại bài
						</dt>
						<dd className="mt-1 leading-relaxed text-ink">{classifications}</dd>
					</div>
				) : null}
				{difficulties ? (
					<div>
						<dt className="font-mono text-[0.65rem] tracking-[0.1em] text-ink-secondary uppercase">
							Mức độ
						</dt>
						<dd className="mt-1 leading-relaxed text-ink">{difficulties}</dd>
					</div>
				) : null}
			</dl>
		</div>
	);
}

function HistoryPanel({ test }: { test: PublicSpaceTestListItem }) {
	const completions = test.personalProgress.recentCompletions;
	if (completions.length === 0) {
		return (
			<p className="mt-3 text-sm text-ink-secondary" role="status">
				Chưa có lần hoàn thành nào được ghi nhận.
			</p>
		);
	}

	return (
		<ol
			className="mt-3 space-y-2 border-t border-hairline pt-3"
			data-testid={`myspace-test-history-${test.slug}`}
		>
			{completions.map((item, index) => {
				const pct =
					item.total > 0 ? Math.round((item.score / item.total) * 1000) / 10 : null;
				return (
					<li
						key={`${item.submittedAt}-${index}`}
						className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm"
					>
						<span className="tabular-nums text-ink">
							{item.score}/{item.total}
							{pct != null ? (
								<span className="ml-2 text-ink-secondary">({formatScorePercent(pct)})</span>
							) : null}
						</span>
						<span className="tabular-nums text-ink-secondary">
							{formatCompletedDate(item.submittedAt)}
						</span>
					</li>
				);
			})}
		</ol>
	);
}

function TestRow({
	test,
	index,
	detailsOpen,
	historyOpen,
	onToggleDetails,
	onToggleHistory,
}: {
	test: PublicSpaceTestListItem;
	index: number;
	detailsOpen: boolean;
	historyOpen: boolean;
	onToggleDetails: () => void;
	onToggleHistory: () => void;
}) {
	const detailId = useId();
	const historyId = useId();
	const progress = test.personalProgress;
	const completed = progress.status === 'completed';
	const bestScore = formatScorePercent(progress.bestScorePercent);
	const lastDate = formatCompletedDate(progress.lastCompletedAt);
	const shortDesc = truncateDescription(test.description);
	const ctaLabel = completed ? 'Làm lại' : 'Bắt đầu';

	return (
		<li className="py-3.5" data-testid={`myspace-test-${test.slug}`}>
			<div className="flex flex-col gap-3 sm:grid sm:grid-cols-[2.25rem_minmax(0,1fr)_auto] sm:items-start sm:gap-4">
				<span className="shrink-0 pt-1 font-mono text-[0.7rem] tracking-[0.12em] text-accent">
					{formatIndex(index + 1)}
				</span>

				<div className="min-w-0">
					<h3 className="font-display text-[clamp(1.05rem,1.8vw,1.25rem)] font-medium leading-snug tracking-tight text-ink text-balance">
						{test.title}
					</h3>
					<div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-ink-secondary">
						<span className="tabular-nums">
							{test.questionCount} câu
						</span>
						<span aria-hidden className="text-ink-secondary/45">
							·
						</span>
						<span
							className={completed ? 'font-medium text-ink' : undefined}
							data-testid={`myspace-test-status-${test.slug}`}
						>
							{completed ? 'Đã làm' : 'Chưa làm'}
						</span>
						{completed && bestScore ? (
							<>
								<span aria-hidden className="text-ink-secondary/45">
									·
								</span>
								<span className="tabular-nums text-ink">
									Tốt nhất {bestScore}
								</span>
							</>
						) : null}
						{completed && progress.completedCount > 0 ? (
							<>
								<span aria-hidden className="text-ink-secondary/45">
									·
								</span>
								<span className="tabular-nums">
									{progress.completedCount} lượt
								</span>
							</>
						) : null}
						{completed && lastDate ? (
							<>
								<span aria-hidden className="text-ink-secondary/45">
									·
								</span>
								<span className="tabular-nums">{lastDate}</span>
							</>
						) : null}
					</div>
					{shortDesc ? (
						<p className="mt-1.5 line-clamp-2 max-w-2xl text-sm leading-relaxed text-ink-secondary">
							{shortDesc}
						</p>
					) : null}
					<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
						<button
							type="button"
							aria-expanded={detailsOpen}
							aria-controls={detailId}
							onClick={onToggleDetails}
							className="inline-flex min-h-11 items-center text-sm text-ink-secondary underline decoration-ink-secondary/30 underline-offset-4 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
						>
							{detailsOpen ? 'Ẩn chi tiết' : 'Chi tiết'}
						</button>
						{completed ? (
							<button
								type="button"
								aria-expanded={historyOpen}
								aria-controls={historyId}
								onClick={onToggleHistory}
								className="inline-flex min-h-11 items-center text-sm text-ink-secondary underline decoration-ink-secondary/30 underline-offset-4 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
								data-testid={`myspace-test-history-toggle-${test.slug}`}
							>
								{historyOpen ? 'Ẩn lịch sử' : 'Lịch sử'}
							</button>
						) : null}
					</div>
					{detailsOpen ? <TestDetails test={test} id={detailId} /> : null}
					{historyOpen ? (
						<div id={historyId}>
							<HistoryPanel test={test} />
						</div>
					) : null}
				</div>

				<Link
					href={routes.mySpaceTestPlay(test.slug)}
					className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-ink bg-ink px-4 font-sans text-sm font-semibold text-canvas transition-colors hover:bg-transparent hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-auto sm:self-start"
					data-testid={`myspace-test-start-${test.slug}`}
				>
					{ctaLabel} <span aria-hidden>→</span>
				</Link>
			</div>
		</li>
	);
}

function SubjectList({
	groups,
	selectedSubjectId,
	subjectQuery,
	onSubjectQueryChange,
	onSelect,
	variant,
}: {
	groups: PublicSubjectGroup[];
	selectedSubjectId: string | null;
	subjectQuery: string;
	onSubjectQueryChange: (value: string) => void;
	onSelect: (subjectId?: string) => void;
	variant: 'rail' | 'sheet';
}) {
	const filtered = useMemo(() => {
		const needle = foldSearchText(subjectQuery.trim());
		if (!needle) return groups;
		return groups.filter((group) => foldSearchText(group.subject).includes(needle));
	}, [groups, subjectQuery]);

	const totalTests = groups.reduce((sum, group) => sum + group.tests.length, 0);
	const listClass =
		variant === 'rail'
			? 'mt-3 max-h-[min(70vh,36rem)] space-y-0.5 overflow-y-auto pr-1'
			: 'mt-3 max-h-[min(55dvh,28rem)] space-y-0.5 overflow-y-auto';

	return (
		<div data-testid={variant === 'rail' ? 'myspace-subject-rail' : 'myspace-subject-sheet'}>
			<label htmlFor={`myspace-subject-search-${variant}`} className="sr-only">
				Tìm môn học
			</label>
			<input
				id={`myspace-subject-search-${variant}`}
				type="search"
				value={subjectQuery}
				onChange={(event) => onSubjectQueryChange(event.target.value)}
				placeholder="Tìm môn"
				className="min-h-11 w-full border border-hairline bg-paper/50 px-3 text-sm text-ink placeholder:text-ink-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
				data-testid={`myspace-subject-search-${variant}`}
			/>
			<nav className={listClass} aria-label="Danh sách môn học">
				<button
					type="button"
					aria-current={!selectedSubjectId ? 'true' : undefined}
					onClick={() => onSelect()}
					className={`flex min-h-11 w-full items-center justify-between gap-3 px-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
						!selectedSubjectId
							? 'bg-ink text-canvas'
							: 'text-ink-secondary hover:bg-paper/60 hover:text-ink'
					}`}
					data-testid="myspace-subject-filter-all"
				>
					<span>Tất cả</span>
					<span className="tabular-nums opacity-75">{totalTests}</span>
				</button>
				{filtered.map((group) => {
					const selected = selectedSubjectId === group.subjectId;
					return (
						<button
							key={group.subjectId}
							type="button"
							aria-current={selected ? 'true' : undefined}
							onClick={() => onSelect(group.subjectId)}
							className={`flex min-h-11 w-full items-center justify-between gap-3 px-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
								selected
									? 'bg-ink text-canvas'
									: 'text-ink-secondary hover:bg-paper/60 hover:text-ink'
							}`}
							data-testid={`myspace-subject-filter-${group.subjectId}`}
						>
							<span className="min-w-0 truncate">{group.subject}</span>
							<span className="shrink-0 tabular-nums opacity-75">{group.tests.length}</span>
						</button>
					);
				})}
				{filtered.length === 0 ? (
					<p className="px-2.5 py-3 text-sm text-ink-secondary" role="status">
						Không tìm thấy môn phù hợp.
					</p>
				) : null}
			</nav>
		</div>
	);
}

/** Dense two-column Learning Workspace catalogue. */
export default function SubjectExplorer({ groups }: { groups: PublicSubjectGroup[] }) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [query, setQuery] = useState('');
	const [subjectQuery, setSubjectQuery] = useState('');
	const [sheetOpen, setSheetOpen] = useState(false);
	const [openPanel, setOpenPanel] = useState<{ slug: string; type: 'details' | 'history' } | null>(null);
	const subjectButtonRef = useRef<HTMLButtonElement>(null);

	const selectedSubjectId = searchParams.get('subject');
	const selectedSubject = groups.find((group) => group.subjectId === selectedSubjectId) ?? null;

	useEffect(() => {
		if (selectedSubjectId && !selectedSubject) {
			const params = new URLSearchParams(searchParams.toString());
			params.delete('subject');
			const queryString = params.toString();
			router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
		}
	}, [pathname, router, searchParams, selectedSubject, selectedSubjectId]);

	useEffect(() => {
		if (!sheetOpen) return;
		const id = window.requestAnimationFrame(() => {
			document.getElementById('myspace-subject-search-sheet')?.focus();
		});
		return () => window.cancelAnimationFrame(id);
	}, [sheetOpen]);

	const visibleGroups = useMemo(() => {
		const sourceGroups = selectedSubject ? [selectedSubject] : groups;
		return sourceGroups
			.map((group) => ({
				...group,
				tests: group.tests.filter((test) =>
					testMatchesSearch(query, {
						title: test.title,
						subject: group.subject,
						topics: test.topics,
						description: test.description,
					}),
				),
			}))
			.filter((group) => group.tests.length > 0);
	}, [groups, query, selectedSubject]);

	const resultCount = visibleGroups.reduce((total, group) => total + group.tests.length, 0);
	const completedInView = visibleGroups.reduce(
		(total, group) =>
			total + group.tests.filter((test) => test.personalProgress.status === 'completed').length,
		0,
	);

	function selectSubject(subjectId?: string) {
		const params = new URLSearchParams(searchParams.toString());
		if (subjectId) params.set('subject', subjectId);
		else params.delete('subject');
		const queryString = params.toString();
		router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
		setSheetOpen(false);
		setSubjectQuery('');
	}

	function clearFilters() {
		setQuery('');
		setSubjectQuery('');
		selectSubject();
	}

	if (groups.length === 0) {
		return (
			<p
				className="mt-6 border border-hairline bg-paper/40 px-5 py-6 text-base text-ink-secondary"
				role="status"
			>
				Chưa có bài kiểm tra nào được công bố.
			</p>
		);
	}

	const selectedLabel = selectedSubject?.subject ?? 'Tất cả môn';

	return (
		<section
			className="mt-6"
			aria-label="Không gian học bài kiểm tra"
			data-testid="myspace-subject-explorer"
		>
			<div className="lg:grid lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] lg:items-start lg:gap-8">
				<aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
					<p className="font-mono text-[0.65rem] tracking-[0.12em] text-ink-secondary uppercase">
						Môn học
					</p>
					<div className="mt-2 border-t border-hairline pt-3">
						<SubjectList
							groups={groups}
							selectedSubjectId={selectedSubjectId}
							subjectQuery={subjectQuery}
							onSubjectQueryChange={setSubjectQuery}
							onSelect={selectSubject}
							variant="rail"
						/>
					</div>
				</aside>

				<div className="min-w-0">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<label htmlFor="myspace-test-search" className="sr-only">
							Tìm bài kiểm tra
						</label>
						<input
							id="myspace-test-search"
							type="search"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Tìm bài, môn hoặc chủ đề"
							className="min-h-11 w-full border border-hairline bg-paper/50 px-3.5 text-sm text-ink placeholder:text-ink-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
							data-testid="myspace-test-search"
						/>
						<button
							ref={subjectButtonRef}
							type="button"
							className="inline-flex min-h-11 w-full shrink-0 items-center justify-between gap-3 border border-hairline px-3.5 text-sm text-ink transition-colors hover:border-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
							aria-expanded={sheetOpen}
							aria-haspopup="dialog"
							onClick={() => setSheetOpen(true)}
							data-testid="myspace-subject-picker"
						>
							<span className="truncate">{selectedLabel}</span>
							<span aria-hidden className="text-ink-secondary">
								▾
							</span>
						</button>
					</div>

					<div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
						<p
							className="text-sm text-ink-secondary"
							role="status"
							aria-live="polite"
							data-testid="myspace-tests-result-summary"
						>
							{resultCount} bài
							{resultCount > 0 ? ` · ${completedInView} đã làm` : null}
							{selectedSubject ? ` · ${selectedSubject.subject}` : null}
							{query.trim() ? ` · “${query.trim()}”` : null}
						</p>
						{query || selectedSubjectId ? (
							<button
								type="button"
								onClick={clearFilters}
								className="inline-flex min-h-11 items-center text-sm text-ink-secondary underline decoration-ink-secondary/30 underline-offset-4 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
								data-testid="myspace-tests-clear-filters"
							>
								Xóa bộ lọc
							</button>
						) : null}
					</div>

					{visibleGroups.length > 0 ? (
						<div className="mt-2" data-testid="myspace-tests-results">
							{visibleGroups.map((group) => (
								<section
									key={group.subjectId}
									className="mt-5 first:mt-2"
									aria-labelledby={`subject-${group.subjectId}`}
								>
									{!selectedSubject || visibleGroups.length > 1 ? (
										<header className="flex items-baseline justify-between gap-4 border-t border-hairline pt-2.5">
											<h2
												id={`subject-${group.subjectId}`}
												className="font-mono text-[0.7rem] tracking-[0.14em] text-ink-secondary uppercase"
											>
												{group.subject}
											</h2>
											<span className="font-mono text-[0.65rem] tracking-[0.08em] text-ink-secondary">
												{testCountLabel(group.tests.length)}
											</span>
										</header>
									) : (
										<span id={`subject-${group.subjectId}`} className="sr-only">
											{group.subject}
										</span>
									)}
									<ul
										className="mt-1 divide-y divide-hairline border-b border-hairline"
										data-testid="myspace-tests-list"
									>
										{group.tests.map((test, index) => (
											<TestRow
																	key={test.slug}
																	test={test}
																	index={index}
																	detailsOpen={openPanel?.slug === test.slug && openPanel.type === 'details'}
																historyOpen={openPanel?.slug === test.slug && openPanel.type === 'history'}
																onToggleDetails={() => setOpenPanel((current) =>
																	current?.slug === test.slug && current.type === 'details'
																		? null
																		: { slug: test.slug, type: 'details' },
																)}
																onToggleHistory={() => setOpenPanel((current) =>
																	current?.slug === test.slug && current.type === 'history'
																		? null
																		: { slug: test.slug, type: 'history' },
																)}
											/>
										))}
									</ul>
								</section>
							))}
						</div>
					) : (
						<div
							className="mt-4 border-y border-hairline py-8"
							role="status"
							data-testid="myspace-tests-empty"
						>
							<p className="text-sm leading-relaxed text-ink-secondary">
								Không tìm thấy bài kiểm tra phù hợp với bộ lọc hiện tại.
							</p>
							<button
								type="button"
								onClick={clearFilters}
								className="mt-3 inline-flex min-h-11 items-center text-sm text-ink underline decoration-ink/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
							>
								Xóa bộ lọc
							</button>
						</div>
					)}
				</div>
			</div>

			<Sheet
				open={sheetOpen}
				onClose={() => {
					setSheetOpen(false);
					queueMicrotask(() => subjectButtonRef.current?.focus());
				}}
				title="Chọn môn học"
			>
				<SubjectList
					groups={groups}
					selectedSubjectId={selectedSubjectId}
					subjectQuery={subjectQuery}
					onSubjectQueryChange={setSubjectQuery}
					onSelect={selectSubject}
					variant="sheet"
				/>
			</Sheet>
		</section>
	);
}
