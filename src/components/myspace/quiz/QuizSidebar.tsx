'use client';

import Link from 'next/link';
import { useState } from 'react';

import { routes } from '@/config/routes';

import QuestionNav from './QuestionNav';
import type { Reveal } from './types';

interface QuizSidebarProps {
	title: string;
	subject: string;
	total: number;
	currentIndex: number;
	answeredCount: number;
	correctCount: number;
	reveals: Record<string, Reveal>;
	questionIds: string[];
	answered: boolean;
	onJump: (index: number) => void;
}

export default function QuizSidebar({
	title,
	subject,
	total,
	currentIndex,
	answeredCount,
	correctCount,
	reveals,
	questionIds,
	answered,
	onJump,
}: QuizSidebarProps) {
	const [navOpen, setNavOpen] = useState(false);
	const pct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

	return (
		<aside
			className="hidden space-y-5 lg:sticky lg:top-6 lg:block lg:max-h-[calc(100svh-3rem)] lg:self-start lg:overflow-y-auto"
			data-testid="myspace-quiz-sidebar"
		>
			<Link
				href={routes.mySpaceTests}
				className="inline-flex min-h-11 items-center font-sans text-sm text-ink-secondary transition-colors hover:text-ink"
				data-testid="myspace-quiz-back-desktop"
			>
				← Tests
			</Link>

			<div>
				<p className="font-mono text-[0.7rem] tracking-[0.14em] text-accent uppercase">{subject}</p>
				<p className="mt-2 font-display text-lg font-medium leading-snug tracking-tight text-ink text-balance">
					{title}
				</p>
			</div>

			<div>
				<p className="font-sans text-sm text-ink">
					<span className="font-semibold tabular-nums">{answeredCount}</span>
					<span className="text-ink-secondary"> / {total} answered</span>
					{answeredCount > 0 ? (
						<span className="text-ink-secondary">
							{' '}
							· <span className="font-semibold text-success">{correctCount}</span> correct
						</span>
					) : null}
				</p>
				<div
					className="mt-2.5 h-1 overflow-hidden rounded-full bg-hairline"
					role="progressbar"
					aria-valuenow={pct}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-label="Completion percent"
				>
					<div
						className="h-full rounded-full bg-ink transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
						style={{ width: `${pct}%` }}
					/>
				</div>
			</div>

			<div>
				<button
					type="button"
					onClick={() => setNavOpen((v) => !v)}
					aria-expanded={navOpen}
					aria-controls="myspace-quiz-desktop-nav"
					className="inline-flex min-h-11 items-center gap-2 font-sans text-sm font-medium text-ink transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
					data-testid="myspace-quiz-nav-toggle"
				>
					{navOpen ? 'Hide questions' : 'All questions'}
					<span
						aria-hidden
						className={`inline-block text-ink-secondary transition-transform duration-200 ${
							navOpen ? 'rotate-180' : ''
						}`}
					>
						▾
					</span>
				</button>

				{navOpen ? (
					<div id="myspace-quiz-desktop-nav" className="mt-3">
						<QuestionNav
							total={total}
							currentIndex={currentIndex}
							reveals={reveals}
							questionIds={questionIds}
							answered={answered}
							onJump={onJump}
						/>
					</div>
				) : null}
			</div>
		</aside>
	);
}
