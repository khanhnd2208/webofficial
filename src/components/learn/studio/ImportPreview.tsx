'use client';

import { useRef, useState } from 'react';

import DiscussionQuestionCard from '@/components/learn/DiscussionQuestionCard';
import LearnMarkdown from '@/components/learn/LearnMarkdown';
import { estimateReadingMinutes, formatMinutes } from '@/features/learn/content';
import { discussionQuestionViews } from '@/features/learn/discussionView';
import type { ImportReport } from '@/features/learn/importChecks';
import type { ImportedCourse } from '@/features/learn/lessonImport';
import { LEARN_SECTION_KIND_SHORT, type LearnDiscussionQuestion } from '@/features/learn/types';

/** "12 câu · 1 lỗi · 2 lưu ý": the one line an admin reads before saving. */
export function ImportSummary({
	count,
	unit,
	report,
}: {
	count: number;
	unit: string;
	report: ImportReport;
}) {
	return (
		<p
			className="ln-import-summary"
			data-level={report.errors ? 'error' : report.warnings ? 'warn' : 'ok'}
		>
			<strong className="tabular-nums">
				{count} {unit}
			</strong>
			{report.errors ? ` · ${report.errors} lỗi cần sửa` : ''}
			{report.warnings ? ` · ${report.warnings} lưu ý` : ''}
			{!report.errors && !report.warnings && count ? ' · đúng định dạng' : ''}
		</p>
	);
}

export function ImportIssues({
	report,
	onJump,
}: {
	report: ImportReport;
	onJump?: (question: number) => void;
}) {
	if (!report.issues.length) return null;
	return (
		<ul className="ln-issues" aria-label="Kết quả kiểm tra">
			{report.issues.map((issue, index) => (
				<li key={index} className="ln-issue" data-level={issue.level}>
					<span className="ln-issue__level">{issue.level === 'error' ? 'Lỗi' : 'Lưu ý'}</span>
					<span className="min-w-0 flex-1">
						{issue.question && onJump ? (
							<button type="button" className="ln-link-btn" onClick={() => onJump(issue.question!)}>
								Câu {issue.question}
							</button>
						) : null}
						{issue.question && onJump ? ': ' : ''}
						{issue.text}
						{issue.fix ? <span className="ln-issue__fix">{issue.fix}</span> : null}
					</span>
				</li>
			))}
		</ul>
	);
}

function formatPart(part: string) {
	return part.replace(/^Phần\s+(\d+)\.\s*/i, 'Phần $1 · ');
}

/** Each pasted question exactly as the learner page draws it, answers open. */
export function DiscussionImportPreview({
	questions,
	report,
}: {
	questions: LearnDiscussionQuestion[];
	report: ImportReport;
}) {
	const listRef = useRef<HTMLOListElement>(null);
	const [closed, setClosed] = useState<Set<string>>(() => new Set());
	const views = discussionQuestionViews(questions.map((item) => item.question));
	const flagged = new Map<number, 'error' | 'warn'>();
	for (const issue of report.issues) {
		if (!issue.question) continue;
		if (issue.level === 'error' || !flagged.has(issue.question))
			flagged.set(issue.question, issue.level);
	}

	function jump(question: number) {
		listRef.current
			?.querySelector(`[data-question="${question}"]`)
			?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	return (
		<>
			<ImportIssues report={report} onJump={jump} />
			{questions.length > 1 ? (
				<nav className="ln-import-chips" aria-label="Đi tới câu">
					{questions.map((item, index) => (
						<button
							key={item.id}
							type="button"
							className="ln-chip tabular-nums"
							data-level={flagged.get(index + 1)}
							onClick={() => jump(index + 1)}
						>
							{index + 1}
						</button>
					))}
				</nav>
			) : null}
			<ol ref={listRef} className="ln-preview__list ln-import-cards">
				{questions.map((item, index) => (
					<li key={item.id} data-question={index + 1}>
						{views[index]?.part && views[index].part !== views[index - 1]?.part ? (
							<p className="ln-stepper__part">{formatPart(views[index].part!)}</p>
						) : null}
						<DiscussionQuestionCard
							index={index}
							view={views[index]}
							answer={item.answer}
							open={!closed.has(item.id)}
							onOpenChange={(open) =>
								setClosed((current) => {
									const next = new Set(current);
									if (open) next.delete(item.id);
									else next.add(item.id);
									return next;
								})
							}
						/>
					</li>
				))}
			</ol>
		</>
	);
}

/** Lessons and their sections; a reading section opens to show its rendered body. */
export function LessonImportPreview({
	parsed,
	report,
}: {
	parsed: ImportedCourse;
	report: ImportReport;
}) {
	const offsets = parsed.lessons.map((_, index) =>
		parsed.lessons.slice(0, index).reduce((sum, lesson) => sum + lesson.sections.length, 0),
	);
	return (
		<>
			<ImportIssues report={report} />
			{parsed.lessons.map((lesson, lessonIndex) => (
				<div key={lessonIndex} className="mt-3">
					<p className="font-display text-xl font-medium">{lesson.lessonTitle}</p>
					{lesson.lessonDescription ? (
						<p className="mt-1 text-sm text-ink-secondary">{lesson.lessonDescription}</p>
					) : null}
					<ol className="ln-preview__sections">
						{lesson.sections.map((section, index) => {
							const position = offsets[lessonIndex] + index + 1;
							const meta =
								section.type === 'DISCUSSION'
									? `${section.discussion?.questions.length ?? 0} câu`
									: `${section.wordCount} từ · ${formatMinutes(section.durationMinutes ?? estimateReadingMinutes(section.markdown))}`;
							return (
								<li key={index}>
									<details className="ln-import-section">
										<summary>
											<span className="ln-preview__index tabular-nums">{position}</span>
											<span className="min-w-0 flex-1 font-medium">
												{section.type !== 'READING'
													? `${LEARN_SECTION_KIND_SHORT[section.type]} · `
													: ''}
												{section.title}
											</span>
											<span className="text-xs text-ink-secondary tabular-nums">{meta}</span>
										</summary>
										{section.summary ? (
											<p className="text-sm text-ink-secondary">{section.summary}</p>
										) : null}
										{section.markdown ? (
											<LearnMarkdown markdown={section.markdown} showMissingImages />
										) : null}
									</details>
								</li>
							);
						})}
					</ol>
				</div>
			))}
		</>
	);
}
