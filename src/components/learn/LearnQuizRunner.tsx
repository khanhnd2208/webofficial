'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { LearnQuizForLearner, LearnQuizReview } from '@/features/learn/types';
import { adminFetch } from '@/lib/admin/client';

import { celebrate } from './celebrate';
import LearnLinkPending from './LearnLinkPending';

const LETTERS = 'ABCDEFGH';

function clock(seconds: number) {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}

function draftKey(sectionId: string) {
	return `ln:quiz-draft:${sectionId}`;
}

function readDraft(sectionId: string): Record<string, number> {
	try {
		const raw = window.sessionStorage.getItem(draftKey(sectionId));
		if (!raw) return {};
		const parsed = JSON.parse(raw) as unknown;
		if (!parsed || typeof parsed !== 'object') return {};
		return parsed as Record<string, number>;
	} catch {
		return {};
	}
}

export default function LearnQuizRunner({
	sectionId,
	quiz,
	initialReview,
	nextHref = null,
	finishesCourse = false,
	overviewHref,
}: {
	sectionId: string;
	quiz: LearnQuizForLearner;
	initialReview: LearnQuizReview | null;
	nextHref?: string | null;
	finishesCourse?: boolean;
	overviewHref?: string;
}) {
	const router = useRouter();
	const [review, setReview] = useState<LearnQuizReview | null>(initialReview);
	const [answers, setAnswers] = useState<Record<string, number>>({});
	const [draftReady, setDraftReady] = useState(Boolean(initialReview));
	const [confirming, setConfirming] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [secondsLeft, setSecondsLeft] = useState<number | null>(
		quiz.timeLimitMinutes && !initialReview ? quiz.timeLimitMinutes * 60 : null,
	);
	const answersRef = useRef(answers);
	useEffect(() => {
		answersRef.current = answers;
	}, [answers]);

	useEffect(() => {
		if (initialReview) return;
		setAnswers(readDraft(sectionId));
		setDraftReady(true);
	}, [sectionId, initialReview]);

	useEffect(() => {
		if (!draftReady || review) return;
		try {
			window.sessionStorage.setItem(draftKey(sectionId), JSON.stringify(answers));
		} catch {
			/* storage unavailable */
		}
	}, [answers, draftReady, review, sectionId]);

	const answeredCount = quiz.questions.filter((question) => answers[question.id] !== undefined).length;

	const submit = useCallback(async () => {
		setBusy(true);
		setError(null);
		try {
			const result = await adminFetch<LearnQuizReview>(`/api/learn/sections/${sectionId}/quiz`, {
				method: 'POST',
				body: JSON.stringify({ answers: answersRef.current }),
			});
			try {
				window.sessionStorage.removeItem(draftKey(sectionId));
			} catch {
				/* storage unavailable */
			}
			setReview(result);
			setSecondsLeft(null);
			setConfirming(false);
			if (result.result.passed && finishesCourse && overviewHref) {
				void celebrate();
				router.push(overviewHref);
				return;
			}
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không nộp được bài');
		} finally {
			setBusy(false);
		}
	}, [router, sectionId, finishesCourse, overviewHref]);

	useEffect(() => {
		if (secondsLeft === null || review) return;
		if (secondsLeft <= 0) {
			void submit();
			return;
		}
		const timer = setTimeout(() => setSecondsLeft((value) => (value === null ? null : value - 1)), 1000);
		return () => clearTimeout(timer);
	}, [secondsLeft, review, submit]);

	function retry() {
		setReview(null);
		setAnswers({});
		setSecondsLeft(quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : null);
		try {
			window.sessionStorage.removeItem(draftKey(sectionId));
		} catch {
			/* storage unavailable */
		}
	}

	function moveOption(questionId: string, optionIndex: number, optionCount: number, direction: 1 | -1) {
		const next = (optionIndex + direction + optionCount) % optionCount;
		setAnswers((current) => ({ ...current, [questionId]: next }));
		const group = document.getElementById(`ln-q-${questionId}`);
		const radios = group?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
		radios?.[next]?.focus();
	}

	const keyById = new Map(review?.key.map((item) => [item.id, item]));
	const shownAnswers = review ? review.result.answers : answers;
	const continueHref = review?.result.passed ? (finishesCourse ? overviewHref : nextHref) : null;

	return (
		<div className="ln-quiz">
			{review ? (
				<div className="ln-quiz__score" data-passed={review.result.passed ? 'true' : 'false'} role="status">
					<p className="ln-quiz__percent tabular-nums">{review.result.percentage}%</p>
					<div>
						<p className="font-medium">
							{review.result.passed ? 'Đạt' : 'Chưa đạt'} · {review.result.score}/{review.result.total}
						</p>
						<p className="text-sm text-ink-secondary">Cần {quiz.passingScorePercent}% để đạt.</p>
					</div>
					<button type="button" className="ln-btn" onClick={retry}>
						Làm lại
					</button>
					{continueHref ? (
						<Link href={continueHref} className="ln-btn ln-btn--primary">
							Tiếp tục →
							<LearnLinkPending />
						</Link>
					) : null}
				</div>
			) : (
				<div className="ln-quiz__bar">
					<div className="ln-quiz__bar-row">
						<span>
							{quiz.questions.length} câu · cần {quiz.passingScorePercent}% · đã làm {answeredCount}/{quiz.questions.length}
						</span>
						{secondsLeft !== null ? (
							<span className="tabular-nums" data-urgent={secondsLeft < 60 ? 'true' : undefined}>
								Còn {clock(secondsLeft)}
							</span>
						) : null}
					</div>
					<div className="ln-bar ln-bar--thin" aria-hidden="true">
						<span style={{ width: `${(answeredCount / quiz.questions.length) * 100}%` }} />
					</div>
				</div>
			)}

			{quiz.questions.length >= 6 ? (
				<nav className="ln-quiz__nav" aria-label="Đi tới câu hỏi">
					{quiz.questions.map((question, index) => {
						const key = keyById.get(question.id);
						const picked = shownAnswers[question.id];
						const state = key
							? picked === key.correctIndex
								? 'correct'
								: 'wrong'
							: picked !== undefined
								? 'answered'
								: undefined;
						return (
							<a
								key={question.id}
								href={`#ln-q-${question.id}`}
								className="ln-quiz__nav-item tabular-nums"
								data-state={state}
								aria-label={`Câu ${index + 1}${state === 'answered' ? ' (đã trả lời)' : state === 'correct' ? ' (đúng)' : state === 'wrong' ? ' (sai)' : ''}`}
							>
								{index + 1}
							</a>
						);
					})}
				</nav>
			) : null}

			<ol className="ln-quiz__list">
				{quiz.questions.map((question, index) => {
					const key = keyById.get(question.id);
					const picked = shownAnswers[question.id];
					const tabIndex = picked === undefined ? 0 : picked;
					return (
						<li key={question.id} id={`ln-q-${question.id}`} className="ln-quiz__item">
							<p className="ln-quiz__question">
								<span className="ln-quiz__number">Câu {index + 1}</span>
								{question.question}
							</p>
							<div className="ln-options" role="radiogroup" aria-label={`Câu ${index + 1}`}>
								{question.options.map((option, optionIndex) => {
									const state = key
										? optionIndex === key.correctIndex
											? 'correct'
											: optionIndex === picked
												? 'wrong'
												: 'muted'
										: picked === optionIndex
											? 'picked'
											: undefined;
									return (
										<button
											key={optionIndex}
											type="button"
											role="radio"
											aria-checked={picked === optionIndex}
											tabIndex={optionIndex === tabIndex ? 0 : -1}
											className="ln-option"
											data-state={state}
											disabled={Boolean(review) || busy}
											onClick={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
											onKeyDown={(event) => {
												if (review || busy) return;
												if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
													event.preventDefault();
													moveOption(question.id, optionIndex, question.options.length, 1);
												} else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
													event.preventDefault();
													moveOption(question.id, optionIndex, question.options.length, -1);
												}
											}}
										>
											<span className="ln-option__letter">{LETTERS[optionIndex]}</span>
											<span>{option}</span>
										</button>
									);
								})}
							</div>
							{key ? (
								<div className="ln-quiz__explain">
									<p className="font-medium">
										{picked === undefined ? 'Bỏ trống.' : picked === key.correctIndex ? 'Đúng.' : 'Chưa đúng.'} Đáp án:{' '}
										{LETTERS[key.correctIndex]}
									</p>
									{key.explanation ? <p>{key.explanation}</p> : null}
								</div>
							) : null}
						</li>
					);
				})}
			</ol>

			{!review ? (
				<div className="ln-quiz__submit">
					{confirming ? (
						<>
							<p className="text-sm">
								Còn {quiz.questions.length - answeredCount} câu chưa trả lời. Vẫn nộp bài?
							</p>
							<div className="flex gap-2">
								<button type="button" className="ln-btn" onClick={() => setConfirming(false)}>
									Làm tiếp
								</button>
								<button type="button" className="ln-btn ln-btn--primary" onClick={() => void submit()} disabled={busy}>
									Nộp bài
								</button>
							</div>
						</>
					) : (
						<>
							<p className="text-sm text-ink-secondary tabular-nums">
								Đã trả lời {answeredCount}/{quiz.questions.length}
							</p>
							<button
								type="button"
								className="ln-btn ln-btn--primary"
								disabled={busy || answeredCount === 0}
								onClick={() => (answeredCount < quiz.questions.length ? setConfirming(true) : void submit())}
							>
								{busy ? 'Đang chấm…' : 'Nộp bài'}
							</button>
						</>
					)}
					{error ? <p className="w-full text-sm text-error">{error}</p> : null}
				</div>
			) : null}
		</div>
	);
}
