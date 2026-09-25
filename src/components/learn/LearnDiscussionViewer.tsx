'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ANSWER_LABELS, discussionQuestionViews, splitLabelled } from '@/features/learn/discussionView';
import type { LearnDiscussion } from '@/features/learn/types';
import { adminFetch } from '@/lib/admin/client';

import LearnMarkdown from './LearnMarkdown';

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
		// Older builds stored the bare array of opened ids.
		const row = (Array.isArray(parsed) ? { opened: parsed } : parsed ?? {}) as Partial<Saved>;
		return {
			opened: Array.isArray(row.opened) ? row.opened.filter((item) => typeof item === 'string') : [],
			completed: Boolean(row.completed),
		};
	} catch {
		return { opened: [], completed: false };
	}
}

export default function LearnDiscussionViewer({
	sectionId,
	discussion,
	completed,
}: {
	sectionId: string;
	discussion: LearnDiscussion;
	completed: boolean;
}) {
	const router = useRouter();
	const questions = discussion.questions;
	const [ready, setReady] = useState(false);
	const [index, setIndex] = useState(0);
	const [opened, setOpened] = useState<string[]>([]);
	const [marked, setMarked] = useState(completed);
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const hash = window.location.hash.match(/^#cau-(\d+)$/);
		const fromHash = hash ? Number(hash[1]) - 1 : 0;
		const saved = readSaved(sectionId);
		const frame = window.requestAnimationFrame(() => {
			setIndex(Math.min(Math.max(fromHash, 0), Math.max(questions.length - 1, 0)));
			setOpened(saved.opened);
			setMarked(completed || saved.completed);
			setReady(true);
		});
		return () => window.cancelAnimationFrame(frame);
	}, [sectionId, questions.length, completed]);

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

	function go(next: number) {
		setIndex(Math.max(0, Math.min(questions.length - 1, next)));
	}

	/** The reveal and hide buttons unmount on click; keep focus here so ←/→ still switch questions. */
	function toggle(id: string, open: boolean) {
		setOpened((current) => (open ? (current.includes(id) ? current : [...current, id]) : current.filter((item) => item !== id)));
		window.requestAnimationFrame(() => rootRef.current?.focus({ preventScroll: true }));
	}

	const views = useMemo(() => discussionQuestionViews(questions.map((item) => item.question)), [questions]);

	const question = questions[index];
	const view = views[index];
	const isOpen = question ? opened.includes(question.id) : false;

	return (
		<div
			ref={rootRef}
			tabIndex={-1}
			className="ln-stepper"
			data-ln-stepper=""
			onKeyDown={(event) => {
				if (event.altKey || event.ctrlKey || event.metaKey) return;
				const target = event.target as HTMLElement | null;
				if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
				if (event.key === 'ArrowLeft') {
					event.preventDefault();
					go(index - 1);
				} else if (event.key === 'ArrowRight') {
					event.preventDefault();
					go(index + 1);
				}
			}}
		>
			{questions.length >= 2 ? (
				<nav className="ln-quiz__nav" aria-label="Đi tới câu hỏi">
					{questions.map((item, itemIndex) => (
						<button
							key={item.id}
							type="button"
							className="ln-quiz__nav-item tabular-nums"
							data-state={itemIndex === index ? 'current' : opened.includes(item.id) ? 'answered' : undefined}
							aria-label={`Câu ${itemIndex + 1}${opened.includes(item.id) ? ' (đã xem đáp án)' : ''}`}
							onClick={() => go(itemIndex)}
						>
							{itemIndex + 1}
						</button>
					))}
				</nav>
			) : null}

			{question && view ? (
				<section className="ln-stepper__card ln-disc" aria-label={`Câu ${index + 1}`}>
					{view.part || view.level || view.title ? (
						<header className="ln-disc__head">
							{view.part ? <p className="ln-disc__part">{view.part.replace(/^Phần\s+(\d+)\.\s*/i, 'Phần $1 · ')}</p> : null}
							{view.title ? (
								<h2 className="ln-disc__title">
									{view.level ? <span className="ln-disc__level">{view.level}</span> : null}
									{view.title}
								</h2>
							) : null}
						</header>
					) : null}
					{view.blocks.map((block, blockIndex) => (
						<div key={blockIndex} className="ln-disc__block" data-kind={block.label === 'Câu hỏi' || block.label === 'Yêu cầu' ? 'ask' : undefined}>
							{block.label ? <p className="ln-disc__label">{block.label}</p> : null}
							{block.markdown ? <LearnMarkdown markdown={block.markdown} /> : null}
						</div>
					))}
					{isOpen ? (
						<div className="ln-disc__answer">
							<div className="ln-disc__answer-head">
								<p className="ln-sample__label">Đáp án mẫu</p>
								<button type="button" className="ln-link-btn" onClick={() => toggle(question.id, false)}>
									Ẩn đáp án
								</button>
							</div>
							{question.answer.trim() ? (
								splitLabelled(question.answer, ANSWER_LABELS).map((block, blockIndex) => (
									<div key={blockIndex} className="ln-disc__block" data-kind={block.label === 'Điều rút ra' ? 'takeaway' : undefined}>
										{block.label ? <p className="ln-disc__label">{block.label}</p> : null}
										{block.markdown ? <LearnMarkdown markdown={block.markdown} /> : null}
									</div>
								))
							) : (
								<p className="text-ink-secondary">Chưa có đáp án mẫu.</p>
							)}
						</div>
					) : (
						<button type="button" className="ln-btn ln-disc__reveal" onClick={() => toggle(question.id, true)}>
							Xem đáp án mẫu
						</button>
					)}
				</section>
			) : (
				<p className="mt-8 text-ink-secondary">Mục này chưa có câu hỏi.</p>
			)}

			{questions.length > 1 ? (
				<div className="ln-stepper__nav">
					<button type="button" className="ln-btn" onClick={() => go(index - 1)} disabled={index === 0}>
						← Câu trước
					</button>
					<span className="text-sm tabular-nums text-ink-secondary">
						{index + 1}/{questions.length}
					</span>
					<button type="button" className="ln-btn" onClick={() => go(index + 1)} disabled={index >= questions.length - 1}>
						Câu sau →
					</button>
				</div>
			) : null}
		</div>
	);
}
