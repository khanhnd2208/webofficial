'use client';

import type { ReactNode } from 'react';

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

function Panel({
	label,
	children,
	className = '',
}: {
	label: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<section
			className={`rounded-[var(--radius-sm)] border border-hairline bg-paper/40 p-4 sm:p-5 ${className}`}
		>
			<p className="font-mono text-[0.75rem] font-semibold tracking-[0.1em] text-accent uppercase">
				{label}
			</p>
			<div className="mt-3">{children}</div>
		</section>
	);
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
	const pct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

	return (
		<aside
			className="hidden space-y-4 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:block lg:self-start"
			data-testid="myspace-quiz-sidebar"
		>
			<Panel label="Bài test">
				<p className="font-display text-lg font-medium leading-snug tracking-tight text-ink text-balance">
					{title}
				</p>
				<p className="mt-2 font-sans text-sm text-ink-secondary">
					{subject} · {total} câu
				</p>
			</Panel>

			<Panel label="Câu hỏi">
				<QuestionNav
					total={total}
					currentIndex={currentIndex}
					reveals={reveals}
					questionIds={questionIds}
					answered={answered}
					onJump={onJump}
				/>
			</Panel>

			<Panel label="Tiến độ">
				<p className="font-sans text-sm text-ink">
					<span className="font-semibold">{answeredCount}</span>
					<span className="text-ink-secondary"> / {total} đã làm</span>
				</p>
				<p className="mt-1.5 font-sans text-sm text-ink">
					<span className="font-semibold text-success">{correctCount}</span>
					<span className="text-ink-secondary"> đúng · {pct}%</span>
				</p>
				<div
					className="mt-3 h-2 overflow-hidden rounded-full bg-hairline"
					role="progressbar"
					aria-valuenow={pct}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-label="Phần trăm hoàn thành"
				>
					<div
						className="h-full rounded-full bg-ink transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
						style={{ width: `${pct}%` }}
					/>
				</div>
			</Panel>
		</aside>
	);
}
