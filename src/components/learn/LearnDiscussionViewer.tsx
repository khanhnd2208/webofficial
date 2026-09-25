'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
	ANSWER_LABELS,
	ASK_LABELS,
	RECALL_LABELS,
	STEP_LABELS,
	TAKEAWAY_LABELS,
	discussionQuestionViews,
	splitLabelled,
} from '@/features/learn/discussionView';
import type { LearnDiscussion } from '@/features/learn/types';
import { adminFetch } from '@/lib/admin/client';

import LearnMarkdown from './LearnMarkdown';
import LearnStepperFinish from './LearnStepperFinish';
import { useStepperScroll } from './useStepperScroll';

function storageKey(sectionId: string) {
	return `ln:discussion:${sectionId}`;
}

interface Saved {
	opened: string[];
	/** Auto-completed once on this device, so un-marking by hand is not undone on the next visit. */
	completed: boolean;
}

function readSaved(sectionId: string): Saved {
	try {
		const raw = window.localStorage.getItem(storageKey(sectionId));
		const parsed = raw ? (JSON.parse(raw) as unknown) : null;
		const row = (Array.isArray(parsed) ? { opened: parsed } : parsed ?? {}) as Partial<Saved>;
		return {
			opened: Array.isArray(row.opened) ? row.opened.filter((item) => typeof item === 'string') : [],
			completed: Boolean(row.completed),
		};
	} catch {
		return { opened: [], completed: false };
	}
}

function formatPart(part: string) {
	return part.replace(/^Phần\s+(\d+)\.\s*/i, 'Phần $1 · ');
}

function blockKind(label: string | null) {
	if (!label) return undefined;
	if (ASK_LABELS.includes(label)) return 'ask';
	if (TAKEAWAY_LABELS.includes(label)) return 'takeaway';
	if (RECALL_LABELS.includes(label)) return 'recall';
	if (STEP_LABELS.includes(label)) return 'steps';
	return undefined;
}

export default function LearnDiscussionViewer({
	sectionId,
	discussion,
	completed,
	nextHref = null,
	nextTitle = null,
	finishesCourse = false,
	overviewHref,
}: {
	sectionId: string;
	discussion: LearnDiscussion;
	completed: boolean;
	nextHref?: string | null;
	nextTitle?: string | null;
	finishesCourse?: boolean;
	overviewHref?: string;
}) {
	const router = useRouter();
	const questions = discussion.questions;
	const [ready, setReady] = useState(false);
	const [index, setIndex] = useState(0);
	const [opened, setOpened] = useState<string[]>([]);
	const [marked, setMarked] = useState(completed);
	const rootRef = useRef<HTMLDivElement>(null);
	const touched = useRef(false);
	const popoverId = `ln-q-${sectionId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

	useEffect(() => {
		let cancel = false;
		const hash = window.location.hash.match(/^#cau-(\d+)$/);
		const saved = readSaved(sectionId);
		const firstUnopened = questions.findIndex((question) => !saved.opened.includes(question.id));
		const fromHash = hash ? Number(hash[1]) - 1 : firstUnopened < 0 ? 0 : firstUnopened;
		const frame = window.requestAnimationFrame(() => {
			if (cancel) return;
			setMarked(completed || saved.completed);
			setReady(true);
			if (touched.current) return;
			setIndex(Math.min(Math.max(fromHash, 0), Math.max(questions.length - 1, 0)));
			setOpened(saved.opened);
		});
		return () => {
			cancel = true;
			window.cancelAnimationFrame(frame);
		};
	}, [sectionId, questions, completed]);

	useEffect(() => {
		if (!ready) return;
		const next = `#cau-${index + 1}`;
		if (window.location.hash !== next) window.history.replaceState(null, '', next);
	}, [ready, index]);

	useEffect(() => {
		if (!ready) return;
		try {
			window.localStorage.setItem(storageKey(sectionId), JSON.stringify({ opened, completed: marked }));
		} catch {
			/* storage unavailable */
		}
	}, [ready, sectionId, opened, marked]);

	useEffect(() => {
		if (!ready || marked || !questions.length || opened.length < questions.length) return;
		if (!questions.every((question) => opened.includes(question.id))) return;
		let cancelled = false;
		void adminFetch(`/api/learn/sections/${sectionId}/progress`, {
			method: 'PATCH',
			body: JSON.stringify({ completed: true }),
		})
			.then(() => {
				if (cancelled) return;
				setMarked(true);
				router.refresh();
			})
			.catch(() => {
				if (!cancelled) setMarked(false);
			});
		return () => {
			cancelled = true;
		};
	}, [ready, marked, opened, questions, sectionId, router]);

	useStepperScroll(rootRef, index, ready);

	function focusStepper() {
		window.requestAnimationFrame(() => rootRef.current?.focus({ preventScroll: true }));
	}

	function go(next: number) {
		touched.current = true;
		setIndex(Math.max(0, Math.min(questions.length - 1, next)));
		focusStepper();
	}

	/** The reveal and hide buttons unmount on click; keep focus here so ←/→ still switch questions. */
	function toggle(id: string, open: boolean) {
		touched.current = true;
		setOpened((current) => (open ? (current.includes(id) ? current : [...current, id]) : current.filter((item) => item !== id)));
		focusStepper();
	}

	const views = useMemo(() => discussionQuestionViews(questions.map((item) => item.question)), [questions]);

	const question = questions[index];
	const view = views[index];
	const isOpen = question ? opened.includes(question.id) : false;
	const allOpened = questions.length > 0 && questions.every((item) => opened.includes(item.id));
	const seen = questions.filter((item) => opened.includes(item.id)).length;
	const last = index >= questions.length - 1;

	const groups = useMemo(() => {
		const rows: Array<{ part: string | null; items: number[] }> = [];
		views.forEach((item, itemIndex) => {
			const current = rows.at(-1);
			if (!current || current.part !== item.part) rows.push({ part: item.part, items: [itemIndex] });
			else current.items.push(itemIndex);
		});
		return rows;
	}, [views]);

	function activatePrimary() {
		rootRef.current?.querySelector<HTMLElement>('[data-ln-primary]')?.click();
	}

	return (
		<div
			ref={rootRef}
			tabIndex={-1}
			className="ln-stepper"
			data-ln-stepper=""
			onKeyDown={(event) => {
				if (event.altKey || event.ctrlKey || event.metaKey) return;
				const target = event.target as HTMLElement | null;
				if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
				if (event.key === 'ArrowLeft') {
					event.preventDefault();
					go(index - 1);
				} else if (event.key === 'ArrowRight') {
					event.preventDefault();
					go(index + 1);
				} else if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
					event.preventDefault();
					activatePrimary();
				}
			}}
		>
			{questions.length >= 2 ? (
				<div className="ln-stepper__head">
					<p className="ln-stepper__part">{view?.part ? formatPart(view.part) : null}</p>
					<button
						type="button"
						className="ln-stepper__jump tabular-nums"
						popoverTarget={popoverId}
						aria-label={`Danh sách câu, đang ở câu ${index + 1} trên ${questions.length}`}
					>
						{index + 1}/{questions.length} ▾
					</button>
					<div id={popoverId} popover="auto" className="ln-stepper__menu">
						{groups.map((group) => (
							<div key={group.part ?? 'all'} className="ln-stepper__menu-group">
								{group.part ? <p className="ln-stepper__menu-part">{formatPart(group.part)}</p> : null}
								{group.items.map((itemIndex) => {
									const item = questions[itemIndex];
									const itemView = views[itemIndex];
									return (
										<button
											key={item.id}
											type="button"
											className="ln-stepper__menu-item"
											aria-current={itemIndex === index ? 'true' : undefined}
											onClick={(event) => {
												go(itemIndex);
												event.currentTarget.closest<HTMLElement>('[popover]')?.hidePopover();
											}}
										>
											<span className="tabular-nums">{itemIndex + 1}</span>
											{itemView?.level ? <span className="ln-disc__level">{itemView.level}</span> : null}
											<span className="ln-stepper__menu-title">{itemView?.title ?? `Câu ${itemIndex + 1}`}</span>
											{opened.includes(item.id) ? <span aria-label="đã xem">✓</span> : null}
										</button>
									);
								})}
							</div>
						))}
					</div>
					<div className="ln-bar ln-bar--thin" aria-hidden="true">
						<span style={{ width: `${questions.length ? (seen / questions.length) * 100 : 0}%` }} />
					</div>
				</div>
			) : null}

			{question && view ? (
				<section className="ln-stepper__card ln-disc" aria-label={`Câu ${index + 1}`}>
					{view.level || view.title ? (
						<header className="ln-disc__head">
							{view.title ? (
								<h2 className="ln-disc__title">
									{view.level ? <span className="ln-disc__level">{view.level}</span> : null}
									{view.title}
								</h2>
							) : null}
						</header>
					) : null}
					{view.blocks.map((block, blockIndex) => (
						<div key={blockIndex} className="ln-disc__block" data-kind={blockKind(block.label)}>
							{block.label ? <p className="ln-disc__label">{block.label}</p> : null}
							{block.markdown ? <LearnMarkdown markdown={block.markdown} /> : null}
						</div>
					))}
					{isOpen ? (
						<div className="ln-disc__answer">
							<div className="ln-disc__answer-head">
								<p className="ln-disc__answer-title">Đáp án mẫu</p>
								<button type="button" className="ln-link-btn" onClick={() => toggle(question.id, false)}>
									Ẩn đáp án
								</button>
							</div>
							{question.answer.trim() ? (
								splitLabelled(question.answer, ANSWER_LABELS).map((block, blockIndex) => (
									<div key={blockIndex} className="ln-disc__block" data-kind={blockKind(block.label)}>
										{block.label ? <p className="ln-disc__label">{block.label}</p> : null}
										{block.markdown ? <LearnMarkdown markdown={block.markdown} /> : null}
									</div>
								))
							) : (
								<p className="text-ink-secondary">Chưa có đáp án mẫu.</p>
							)}
						</div>
					) : null}
				</section>
			) : (
				<p className="mt-8 text-ink-secondary">Mục này chưa có câu hỏi.</p>
			)}

			{question ? (
				<div className="ln-stepper__dock">
					<div className="ln-stepper__nav">
						{questions.length > 1 ? (
							<button type="button" className="ln-btn" onClick={() => go(index - 1)} disabled={index === 0}>
								← Câu trước
							</button>
						) : (
							<span />
						)}
						{!isOpen ? (
							<button type="button" className="ln-btn ln-btn--primary" data-ln-primary="" onClick={() => toggle(question.id, true)}>
								Xem đáp án mẫu
							</button>
						) : !last ? (
							<button type="button" className="ln-btn ln-btn--primary" data-ln-primary="" onClick={() => go(index + 1)}>
								Câu tiếp →
							</button>
						) : (
							<LearnStepperFinish
								sectionId={sectionId}
								completed={marked || allOpened}
								nextHref={nextHref}
								nextTitle={nextTitle}
								finishesCourse={finishesCourse}
								overviewHref={overviewHref}
							/>
						)}
					</div>
					{!isOpen ? <p className="ln-stepper__hint">Tự trả lời trước rồi hãy so với đáp án.</p> : null}
				</div>
			) : null}
		</div>
	);
}
