'use client';

import Link from 'next/link';
import { useCallback, useId, useState } from 'react';

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
					<div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
						<div className="min-w-0 flex-1">
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
							className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-[var(--radius-sm)] border border-ink bg-ink px-4 font-sans text-sm font-semibold text-canvas transition-colors hover:bg-transparent hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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

	const active = groups[activeIndex] ?? groups[0];

	const selectSubject = useCallback((index: number) => {
		setActiveIndex(index);
	}, []);

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
						const panelId = `${baseId}-m-panel-${index}`;
						const btnId = `${baseId}-m-btn-${index}`;
						return (
							<li key={group.subject} data-testid={`myspace-subject-${index}`}>
								<button
									type="button"
									id={btnId}
									aria-expanded={open}
									aria-controls={panelId}
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
									<span className="shrink-0 font-mono text-[0.7rem] tracking-[0.08em] text-ink-secondary uppercase">
										{group.tests.length} bài
									</span>
								</button>
								{open ? (
									<div id={panelId} role="region" aria-labelledby={btnId} className="pb-2">
										<TestList tests={group.tests} />
									</div>
								) : null}
							</li>
						);
					})}
				</ul>
			</div>

			{/* Desktop master-detail */}
			<div className="hidden lg:grid lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] xl:gap-14">
				<nav aria-label="Môn học" data-testid="myspace-subjects-nav">
					<p className="font-mono text-[0.7rem] tracking-[0.14em] text-ink-secondary uppercase">
						Môn học
					</p>
					<ul className="mt-4 divide-y divide-hairline border-y border-hairline">
						{groups.map((group, index) => {
							const selected = activeIndex === index;
							return (
								<li key={group.subject}>
									<button
										type="button"
										data-testid={`myspace-subject-${index}`}
										aria-pressed={selected}
										onMouseEnter={() => selectSubject(index)}
										onFocus={() => selectSubject(index)}
										onClick={() => selectSubject(index)}
										className={`flex w-full items-baseline justify-between gap-3 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
											selected ? 'text-ink' : 'text-ink-secondary hover:text-ink'
										}`}
									>
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
					aria-live="polite"
					aria-label={active ? `Bài test môn ${active.subject}` : 'Bài test'}
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
