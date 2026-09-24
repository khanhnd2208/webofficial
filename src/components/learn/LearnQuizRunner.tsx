'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { LearnQuizForLearner, LearnQuizReview } from '@/features/learn/types';
import { adminFetch } from '@/lib/admin/client';

const LETTERS = 'ABCDEFGH';

function clock(seconds: number) {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}

export default function LearnQuizRunner({
	sectionId,
	quiz,
	initialReview,
}: {
	sectionId: string;
	quiz: LearnQuizForLearner;
	initialReview: LearnQuizReview | null;
}) {
	const router = useRouter();
	const [review, setReview] = useState<LearnQuizReview | null>(initialReview);
	const [answers, setAnswers] = useState<Record<string, number>>({});
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

	const answeredCount = quiz.questions.filter((question) => answers[question.id] !== undefined).length;

	const submit = useCallback(async () => {
		setBusy(true);
		setError(null);
		try {
			const result = await adminFetch<LearnQuizReview>(`/api/learn/sections/${sectionId}/quiz`, {
				method: 'POST',
				body: JSON.stringify({ answers: answersRef.current }),
			});
			setReview(result);
			setSecondsLeft(null);
			setConfirming(false);
			window.scrollTo({ top: 0, behavior: 'smooth' });
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không nộp được bài');
		} finally {
			setBusy(false);
		}
	}, [router, sectionId]);

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
	}

	const keyById = new Map(review?.key.map((item) => [item.id, item]));
	const shownAnswers = review ? review.result.answers : answers;

	return (
		<div className="ln-quiz">
			{review ? (
				<div className="ln-quiz__score" data-passed={review.result.passed ? 'true' : 'false'}>
					<p className="ln-quiz__percent tabular-nums">{review.result.percentage}%</p>
					<div>
						<p className="font-medium">
							{review.result.passed ? 'Đạt yêu cầu' : 'Chưa đạt'} · {review.result.score}/{review.result.total} câu đúng
						</p>
						<p className="text-sm text-ink-secondary">Cần {quiz.passingScorePercent}% để đạt. Xem lại giải thích bên dưới.</p>
					</div>
					<button type="button" className="ln-btn" onClick={retry}>
						Làm lại
					</button>
				</div>
			) : (
				<div className="ln-quiz__bar">
					<span>
						{quiz.questions.length} câu · cần {quiz.passingScorePercent}% để đạt
					</span>
					{secondsLeft !== null ? (
						<span className="tabular-nums" data-urgent={secondsLeft < 60 ? 'true' : undefined}>
							Còn {clock(secondsLeft)}
						</span>
					) : null}
				</div>
			)}

			<ol className="ln-quiz__list">
				{quiz.questions.map((question, index) => {
					const key = keyById.get(question.id);
					const picked = shownAnswers[question.id];
					return (
						<li key={question.id} className="ln-quiz__item">
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
											className="ln-option"
											data-state={state}
											disabled={Boolean(review) || busy}
											onClick={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
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
