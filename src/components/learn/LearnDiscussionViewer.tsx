'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { LearnDiscussion } from '@/features/learn/types';
import { adminFetch } from '@/lib/admin/client';

import LearnMarkdown from './LearnMarkdown';

function storageKey(sectionId: string) {
	return `ln:discussion:${sectionId}`;
}

function readOpened(sectionId: string): string[] {
	try {
		const raw = window.localStorage.getItem(storageKey(sectionId));
		const parsed = raw ? (JSON.parse(raw) as unknown) : [];
		return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
	} catch {
		return [];
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

	useEffect(() => {
		const hash = window.location.hash.match(/^#cau-(\d+)$/);
		const fromHash = hash ? Number(hash[1]) - 1 : 0;
		const saved = readOpened(sectionId);
		const frame = window.requestAnimationFrame(() => {
			setIndex(Math.min(Math.max(fromHash, 0), Math.max(questions.length - 1, 0)));
			setOpened(saved);
			setMarked(completed);
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
			window.localStorage.setItem(storageKey(sectionId), JSON.stringify(opened));
		} catch {
			/* storage unavailable */
		}
	}, [ready, sectionId, opened]);

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

	const question = questions[index];

	return (
		<div
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
			<p className="text-sm text-ink-secondary">
				Câu {questions.length ? index + 1 : 0}/{questions.length}
				{opened.length ? ` · đã xem ${opened.length}` : ''}
			</p>
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

			{question ? (
				<section className="ln-stepper__card" aria-label={`Câu ${index + 1}`}>
					<div className="ln-stepper__question">
						<LearnMarkdown markdown={question.question} />
					</div>
					{opened.includes(question.id) ? (
						<div className="ln-sample">
							<p className="ln-sample__label">Đáp án mẫu</p>
							<LearnMarkdown markdown={question.answer || '_Chưa có đáp án mẫu._'} />
							<button
								type="button"
								className="ln-link-btn"
								onClick={() => setOpened((current) => current.filter((id) => id !== question.id))}
							>
								Ẩn đáp án
							</button>
						</div>
					) : (
						<button
							type="button"
							className="ln-btn"
							onClick={() => setOpened((current) => (current.includes(question.id) ? current : [...current, question.id]))}
						>
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
					<button type="button" className="ln-btn ln-btn--primary" onClick={() => go(index + 1)} disabled={index >= questions.length - 1}>
						Câu sau →
					</button>
				</div>
			) : null}
		</div>
	);
}
