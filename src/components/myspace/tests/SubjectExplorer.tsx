'use client';

import Link from 'next/link';
import { useCallback, useId, useRef, useState, type KeyboardEvent } from 'react';

import { routes } from '@/config/routes';
import type { PublicSubjectGroup } from '@/features/myspace-tests';

function formatIndex(n: number): string {
	return String(n).padStart(2, '0');
}

function TestList({
	tests,
	listTestId,
}: {
	tests: PublicSubjectGroup['tests'];
	listTestId?: string;
}) {
	return (
		<ul className="divide-y divide-hairline border-t border-hairline" data-testid={listTestId}>
			{tests.map((test) => (
				<li key={test.slug} data-testid={`myspace-test-${test.slug}`}>
					<div className="relative flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
						<div className="pointer-events-none min-w-0 flex-1">
							<h3 className="font-display text-[clamp(1.15rem,2.2vw,1.35rem)] font-medium leading-snug tracking-tight text-ink text-balance">
								{test.title}
							</h3>
							<p className="mt-1.5 font-sans text-sm text-ink-secondary">
								{test.questionCount} câu
								{test.description ? (
									<span className="mt-1 block line-clamp-2 leading-[1.55]">
										{test.description}
									</span>
								) : null}
							</p>
						</div>
						<Link
							href={routes.mySpaceTestPlay(test.slug)}
							className="z-10 inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-[var(--radius-sm)] border border-ink bg-ink px-4 font-sans text-sm font-semibold text-canvas transition-colors after:absolute after:inset-0 after:z-[1] after:content-[''] hover:bg-transparent hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
							data-testid={`myspace-test-start-${test.slug}`}
						>
							Bắt đầu
							<span aria-hidden>→</span>
						</Link>
					</div>
				</li>
			))}
		</ul>
	);
}

export default function SubjectExplorer({ groups }: { groups: PublicSubjectGroup[] }) {
	const baseId = useId();
	const [activeIndex, setActiveIndex] = useState(0);
	const [mobileOpen, setMobileOpen] = useState(0);
	const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

	const active = groups[activeIndex] ?? groups[0];
	const tablistId = `${baseId}-tablist`;
	const panelId = `${baseId}-panel`;

	const selectSubject = useCallback((index: number) => {
		setActiveIndex(index);
	}, []);

	const focusTab = useCallback((index: number) => {
		const clamped = Math.max(0, Math.min(index, groups.length - 1));
		setActiveIndex(clamped);
		tabRefs.current[clamped]?.focus();
	}, [groups.length]);

	function onTabKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
		if (groups.length === 0) return;
		if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
			e.preventDefault();
			focusTab((index + 1) % groups.length);
		} else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
			e.preventDefault();
			focusTab((index - 1 + groups.length) % groups.length);
		} else if (e.key === 'Home') {
			e.preventDefault();
			focusTab(0);
		} else if (e.key === 'End') {
			e.preventDefault();
			focusTab(groups.length - 1);
		}
	}

	if (groups.length === 0) {
		return (
			<p
				className="mt-12 rounded-[var(--radius-sm)] border border-hairline bg-paper/40 px-5 py-8 font-sans text-base text-ink-secondary"
				role="status"
			>
				Chưa có bài test nào được xuất bản.
			</p>
		);
	}

	return (
		<div className="mt-10 sm:mt-12" data-testid="myspace-subject-explorer">
			{/* Mobile accordion */}
			<div className="lg:hidden" data-testid="myspace-subjects-mobile">
				<ul className="divide-y divide-hairline border-y border-hairline">
					{groups.map((group, index) => {
						const open = mobileOpen === index;
						const mPanelId = `${baseId}-m-panel-${index}`;
						const btnId = `${baseId}-m-btn-${index}`;
						return (
							<li key={group.subject} data-testid={`myspace-subject-${index}`}>
								<button
									type="button"
									id={btnId}
									aria-expanded={open}
									aria-controls={mPanelId}
									onClick={() => setMobileOpen(open ? -1 : index)}
									className="flex w-full items-baseline justify-between gap-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
								>
									<span className="flex min-w-0 items-baseline gap-3">
										<span className="font-mono text-[0.75rem] tracking-[0.12em] text-ink-secondary">
											{formatIndex(index + 1)}
										</span>
										<span className="font-display text-lg font-medium tracking-tight text-ink">
											{group.subject}
										</span>
									</span>
									<span className="flex shrink-0 items-center gap-2">
										<span className="font-mono text-[0.7rem] tracking-[0.08em] text-ink-secondary uppercase">
											{group.tests.length} bài
										</span>
										<span
											aria-hidden
											className={`inline-block text-ink-secondary transition-transform duration-200 ${
												open ? 'rotate-180' : ''
											}`}
										>
											▾
										</span>
									</span>
								</button>
								{open ? (
									<div id={mPanelId} role="region" aria-labelledby={btnId} className="pb-2">
										<TestList tests={group.tests} />
									</div>
								) : null}
							</li>
						);
					})}
				</ul>
			</div>

			{/* Desktop master-detail with tab semantics */}
			<div className="hidden lg:grid lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] xl:gap-14">
				<nav aria-label="Môn học" data-testid="myspace-subjects-nav">
					<p
						id={tablistId}
						className="font-mono text-[0.7rem] tracking-[0.14em] text-ink-secondary uppercase"
					>
						Môn học
					</p>
					<ul
						className="mt-4 divide-y divide-hairline border-y border-hairline"
						role="tablist"
						aria-labelledby={tablistId}
						aria-orientation="vertical"
					>
						{groups.map((group, index) => {
							const selected = activeIndex === index;
							const tabId = `${baseId}-tab-${index}`;
							return (
								<li key={group.subject} role="presentation">
									<button
										type="button"
										ref={(el) => {
											tabRefs.current[index] = el;
										}}
										id={tabId}
										role="tab"
										data-testid={`myspace-subject-${index}`}
										aria-selected={selected}
										aria-controls={panelId}
										tabIndex={selected ? 0 : -1}
										onClick={() => selectSubject(index)}
										onKeyDown={(e) => onTabKeyDown(e, index)}
										className={`relative flex w-full items-baseline justify-between gap-3 py-3.5 pl-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
											selected ? 'text-ink' : 'text-ink-secondary hover:text-ink'
										}`}
									>
										{selected ? (
											<span
												aria-hidden
												className="absolute top-2 bottom-2 left-0 w-[2px] rounded-full bg-accent"
											/>
										) : null}
										<span className="flex min-w-0 items-baseline gap-3">
											<span
												className={`font-mono text-[0.75rem] tracking-[0.12em] ${
													selected ? 'text-accent' : 'text-ink-secondary'
												}`}
											>
												{formatIndex(index + 1)}
											</span>
											<span
												className={`font-display text-base font-medium tracking-tight ${
													selected ? 'text-ink' : ''
												}`}
											>
												{group.subject}
											</span>
										</span>
										<span className="shrink-0 font-mono text-[0.65rem] tracking-[0.08em] uppercase opacity-70">
											{group.tests.length}
										</span>
									</button>
								</li>
							);
						})}
					</ul>
				</nav>

				<section
					id={panelId}
					role="tabpanel"
					aria-labelledby={`${baseId}-tab-${activeIndex}`}
					data-testid="myspace-subject-panel"
				>
					{active ? (
						<>
							<header className="border-t border-hairline pt-4">
								<p className="font-mono text-[0.7rem] tracking-[0.14em] text-accent uppercase">
									{active.subject}
								</p>
								<p className="mt-2 font-sans text-sm text-ink-secondary">
									{active.tests.length} bài test · chọn một bài để bắt đầu
								</p>
							</header>
							<TestList tests={active.tests} listTestId="myspace-tests-list" />
						</>
					) : null}
				</section>
			</div>
		</div>
	);
}
