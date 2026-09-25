'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

import type { LearnQuizQuestion } from '@/features/learn/types';
import { adminFetch } from '@/lib/admin/client';

import LearnMarkdown from './LearnMarkdown';
import LearnStepperFinish from './LearnStepperFinish';
import { useStepperScroll } from './useStepperScroll';

const LETTERS = 'ABCDEFGH';

interface Saved {
	index: number;
	picks: Record<string, number>;
	completed: boolean;
}

function storageKey(sectionId: string) {
	return `ln:practice:${sectionId}`;
}

function readSaved(sectionId: string): Saved {
	try {
		const raw = window.localStorage.getItem(storageKey(sectionId));
		if (!raw) return { index: 0, picks: {}, completed: false };
		const parsed = JSON.parse(raw) as Partial<Saved>;
		return {
			index: typeof parsed.index === 'number' ? parsed.index : 0,
			picks: parsed.picks && typeof parsed.picks === 'object' ? parsed.picks : {},
			completed: Boolean(parsed.completed),
		};
	} catch {
		return { index: 0, picks: {}, completed: false };
	}
}

export default function LearnPracticeRunner({
	sectionId,
	questions,
	completed,
	nextHref = null,
	nextTitle = null,
	finishesCourse = false,
	overviewHref,
}: {
	sectionId: string;
	questions: LearnQuizQuestion[];
	completed: boolean;
	nextHref?: string | null;
	nextTitle?: string | null;
	finishesCourse?: boolean;
	overviewHref?: string;
}) {
	const [ready, setReady] = useState(false);
	const [index, setIndex] = useState(0);
	const [picks, setPicks] = useState<Record<string, number>>({});
	const [marked, setMarked] = useState(completed);
	const [summary, setSummary] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const nextRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		const saved = readSaved(sectionId);
		const frame = window.requestAnimationFrame(() => {
			setIndex(Math.min(saved.index, Math.max(questions.length - 1, 0)));
			setPicks(saved.picks);
			setMarked(completed || saved.completed);
			setReady(true);
		});
		return () => window.cancelAnimationFrame(frame);
	}, [sectionId, questions.length, completed]);

	useEffect(() => {
		if (!ready) return;
		try {
			window.localStorage.setItem(storageKey(sectionId), JSON.stringify({ index, picks, completed: marked }));
		} catch {
			/* storage unavailable */
		}
	}, [ready, sectionId, index, picks, marked]);

	const answered = questions.filter((question) => picks[question.id] !== undefined).length;
	const correct = questions.filter((question) => picks[question.id] === question.correctIndex).length;
	const wrongIds = questions.filter((question) => picks[question.id] !== undefined && picks[question.id] !== question.correctIndex).map((question) => question.id);

	useEffect(() => {
		if (!ready || marked || !questions.length || answered < questions.length) return;
		let cancelled = false;
		void adminFetch(`/api/learn/sections/${sectionId}/progress`, {
			method: 'PATCH',
			body: JSON.stringify({ completed: true }),
		})
			.then(() => {
				if (cancelled) return;
				setMarked(true);
			})
			.catch(() => {
				if (!cancelled) setMarked(false);
			});
		return () => {
			cancelled = true;
		};
	}, [ready, marked, answered, questions.length, sectionId]);

	/**
	 * Picking disables the options and retrying unmounts its button, which would drop focus to
	 * <body>, where ←/→ switch sections instead of questions. Keep focus inside the stepper.
	 */
	function keepFocus(target: 'next' | 'root') {
		window.requestAnimationFrame(() =>
			(target === 'next' ? nextRef.current : rootRef.current)?.focus({ preventScroll: true }),
		);
	}

	function pick(question: LearnQuizQuestion, optionIndex: number) {
		if (picks[question.id] !== undefined) return;
		setPicks((current) => ({ ...current, [question.id]: optionIndex }));
		keepFocus('next');
	}

	function go(next: number) {
		setSummary(false);
		setIndex(Math.max(0, Math.min(questions.length - 1, next)));
	}

	useStepperScroll(rootRef, `${index}:${summary ? 1 : 0}`, ready);

	const question = questions[index];
	const picked = question ? picks[question.id] : undefined;
	const showSummary = summary;

	return (
		<div
			ref={rootRef}
			tabIndex={-1}
			className="ln-stepper"
			data-ln-stepper=""
			onKeyDown={(event) => onStepperKey(event, questions.length, index, go, question, pick)}
		>
			<div className="ln-practice__bar">
				<nav className="ln-quiz__nav" aria-label="Đi tới câu hỏi">
					{questions.map((item, itemIndex) => {
						const choice = picks[item.id];
						const state = choice === undefined ? undefined : choice === item.correctIndex ? 'correct' : 'wrong';
						return (
							<button
								key={item.id}
								type="button"
								className="ln-quiz__nav-item tabular-nums"
								data-state={itemIndex === index && !showSummary ? 'current' : state}
								aria-label={`Câu ${itemIndex + 1}`}
								onClick={() => go(itemIndex)}
							>
								{itemIndex + 1}
							</button>
						);
					})}
				</nav>
				<p className="ln-practice__score tabular-nums">
					Đúng {correct} · Sai {answered - correct}
				</p>
			</div>

			{showSummary ? (
				<div className="ln-quiz__score" data-passed={wrongIds.length === 0 ? 'true' : 'false'} role="status">
					<p className="ln-quiz__percent tabular-nums">
						{correct}/{questions.length}
					</p>
					<div>
						<p className="font-medium">{wrongIds.length ? 'Xem lại các câu chưa đúng.' : 'Đã trả lời hết.'}</p>
					</div>
					{wrongIds.length ? (
						<button
							type="button"
							className="ln-btn"
							onClick={() => {
								setPicks((current) => {
									const next = { ...current };
									for (const id of wrongIds) delete next[id];
									return next;
								});
								const first = questions.findIndex((item) => wrongIds.includes(item.id));
								go(first < 0 ? 0 : first);
								keepFocus('root');
							}}
						>
							Làm lại câu sai
						</button>
					) : null}
					<button
						type="button"
						className="ln-btn"
						onClick={() => {
							setPicks({});
							go(0);
							keepFocus('root');
						}}
					>
						Làm lại từ đầu
					</button>
				</div>
			) : question ? (
				<section className="ln-stepper__card" aria-label={`Câu ${index + 1}`}>
					<div className="ln-stepper__question">
						<LearnMarkdown markdown={question.question} />
					</div>
					<div className="ln-options" role="radiogroup" aria-label={`Câu ${index + 1}`}>
						{question.options.map((option, optionIndex) => {
							const state =
								picked === undefined
									? undefined
									: optionIndex === question.correctIndex
										? 'correct'
										: optionIndex === picked
											? 'wrong'
											: 'muted';
							return (
								<button
									key={optionIndex}
									type="button"
									role="radio"
									aria-checked={picked === optionIndex}
									className="ln-option"
									data-state={state}
									disabled={picked !== undefined}
									onClick={() => pick(question, optionIndex)}
								>
									<span className="ln-option__letter">{LETTERS[optionIndex]}</span>
									<span>{option}</span>
								</button>
							);
						})}
					</div>
					{picked !== undefined ? (
						<div className="ln-check__result">
							<p className="font-medium">
								{picked === question.correctIndex ? 'Chính xác.' : `Chưa đúng. Đáp án: ${LETTERS[question.correctIndex]}`}
							</p>
							{question.explanation ? <LearnMarkdown markdown={question.explanation} /> : null}
							<button
								type="button"
								className="ln-link-btn"
								onClick={() => {
									setPicks((current) => {
										const next = { ...current };
										delete next[question.id];
										return next;
									});
									keepFocus('root');
								}}
							>
								Thử lại câu này
							</button>
						</div>
					) : null}
				</section>
			) : (
				<p className="mt-8 text-ink-secondary">Mục luyện tập này chưa có câu hỏi.</p>
			)}

			{questions.length ? (
				<div className="ln-stepper__dock">
					<div className="ln-stepper__nav">
						{showSummary ? (
							<span />
						) : (
							<button type="button" className="ln-btn" onClick={() => go(index - 1)} disabled={index === 0}>
								← Câu trước
							</button>
						)}
						{showSummary ? (
							<LearnStepperFinish
								sectionId={sectionId}
								completed={marked || answered === questions.length}
								nextHref={nextHref}
								nextTitle={nextTitle}
								finishesCourse={finishesCourse}
								overviewHref={overviewHref}
							/>
						) : (
							<button
								ref={nextRef}
								type="button"
								className="ln-btn ln-btn--primary"
								data-ln-primary=""
								onClick={() => (index >= questions.length - 1 ? setSummary(true) : go(index + 1))}
							>
								{index >= questions.length - 1 ? 'Xem tổng kết' : 'Câu tiếp →'}
							</button>
						)}
					</div>
				</div>
			) : null}
		</div>
	);
}

function onStepperKey(
	event: KeyboardEvent,
	total: number,
	index: number,
	go: (next: number) => void,
	question: LearnQuizQuestion | undefined,
	pick: (question: LearnQuizQuestion, optionIndex: number) => void,
) {
	if (event.altKey || event.ctrlKey || event.metaKey) return;
	const target = event.target as HTMLElement | null;
	if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
	if (event.key === 'ArrowLeft' && index > 0) {
		event.preventDefault();
		go(index - 1);
	} else if (event.key === 'ArrowRight' && index < total - 1) {
		event.preventDefault();
		go(index + 1);
	} else if (question && /^[a-h]$/i.test(event.key)) {
		const optionIndex = event.key.toUpperCase().charCodeAt(0) - 65;
		if (optionIndex < question.options.length) {
			event.preventDefault();
			pick(question, optionIndex);
		}
	}
}
