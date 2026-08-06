'use client';

import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useState, useTransition } from 'react';

import {
	MobileQuizBar,
	QuestionPanel,
	QuizResultView,
	QuizSidebar,
	type McqCorrectOption,
	type PublicQuizQuestion,
	type QuizPhase,
	type Reveal,
	type SessionSubmitResult,
} from '@/components/myspace/quiz';
import { routes } from '@/config/routes';
import type { CheckAnswerResult, SessionStartResult } from '@/features/myspace-tests';

const KEY_TO_OPTION: Record<string, McqCorrectOption> = {
	a: 'A',
	b: 'B',
	c: 'C',
	d: 'D',
	'1': 'A',
	'2': 'B',
	'3': 'C',
	'4': 'D',
};

export default function QuizPlayClient({
	slug,
	initialSession,
}: {
	slug: string;
	initialSession: SessionStartResult;
}) {
	const reduceMotion = useReducedMotion() ?? false;
	const [phase, setPhase] = useState<QuizPhase>('playing');
	const [error, setError] = useState<string | null>(null);
	const [sessionId, setSessionId] = useState(initialSession.sessionId);
	const [title, setTitle] = useState(initialSession.title);
	const [subject, setSubject] = useState(initialSession.subject);
	const [questions, setQuestions] = useState<PublicQuizQuestion[]>(initialSession.questions);
	const [index, setIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, McqCorrectOption>>({});
	const [reveals, setReveals] = useState<Record<string, Reveal>>({});
	const [result, setResult] = useState<SessionSubmitResult | null>(null);
	const [focusKey, setFocusKey] = useState<McqCorrectOption>('A');
	const [isPending, startTransition] = useTransition();

	const current = questions[index];
	const currentReveal = current ? reveals[current.id] : undefined;
	const chosen = current ? answers[current.id] : undefined;
	const answered = Boolean(currentReveal);
	const answeredCount = Object.keys(reveals).length;
	const correctCount = Object.values(reveals).filter((r) => r.isCorrect).length;
	const questionIds = questions.map((q) => q.id);

	async function restart() {
		setError(null);
		setAnswers({});
		setReveals({});
		setIndex(0);
		setResult(null);
		setFocusKey('A');
		try {
			const res = await fetch(`/api/myspace-tests/${slug}/sessions`, { method: 'POST' });
			const json = (await res.json()) as {
				ok: boolean;
				data?: SessionStartResult;
				error?: string;
			};
			if (!json.ok || !json.data) {
				setError(json.error ?? 'Không bắt đầu được bài');
				setPhase('error');
				return;
			}
			startTransition(() => {
				setSessionId(json.data!.sessionId);
				setTitle(json.data!.title);
				setSubject(json.data!.subject);
				setQuestions(json.data!.questions);
				setPhase('playing');
			});
		} catch {
			setError('Không kết nối được server');
			setPhase('error');
		}
	}

	const choose = useCallback(
		async (key: McqCorrectOption) => {
			if (!current || answered || phase !== 'playing') return;
			setPhase('checking');
			setAnswers((prev) => ({ ...prev, [current.id]: key }));
			try {
				const res = await fetch(
					`/api/myspace-tests/${slug}/sessions/${sessionId}/check`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ questionId: current.id, chosen: key }),
					},
				);
				const json = (await res.json()) as {
					ok: boolean;
					data?: CheckAnswerResult;
					error?: string;
				};
				if (!json.ok || !json.data) {
					setError(json.error ?? 'Không kiểm tra được đáp án');
					setPhase('error');
					return;
				}
				setReveals((prev) => ({ ...prev, [current.id]: json.data! }));
				setPhase('playing');
			} catch {
				setError('Không kết nối được server');
				setPhase('error');
			}
		},
		[answered, current, phase, sessionId, slug],
	);

	const goNext = useCallback(async () => {
		if (!current || !answered) return;
		if (index < questions.length - 1) {
			setIndex((i) => i + 1);
			setFocusKey('A');
			return;
		}
		setPhase('submitting');
		try {
			const payload = {
				answers: questions.map((q) => ({
					questionId: q.id,
					chosen: answers[q.id]!,
				})),
			};
			const res = await fetch(
				`/api/myspace-tests/${slug}/sessions/${sessionId}/submit`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				},
			);
			const json = (await res.json()) as {
				ok: boolean;
				data?: SessionSubmitResult;
				error?: string;
			};
			if (!json.ok || !json.data) {
				setError(json.error ?? 'Nộp bài thất bại');
				setPhase('error');
				return;
			}
			setResult(json.data);
			setPhase('done');
		} catch {
			setError('Không kết nối được server');
			setPhase('error');
		}
	}, [answered, answers, current, index, questions, sessionId, slug]);

	const goPrev = useCallback(() => {
		if (index <= 0) return;
		setIndex((i) => i - 1);
		setFocusKey('A');
	}, [index]);

	function jumpTo(i: number) {
		const q = questions[i];
		if (!q) return;
		const revealed = Boolean(reveals[q.id]);
		const isCurrent = i === index;
		const isNextOpen = i === index + 1 && answered;
		if (!revealed && !isCurrent && !isNextOpen && i > index) return;
		if (!revealed && i > index && !answered) return;
		setIndex(i);
		setFocusKey('A');
	}

	// Global keyboard shortcuts
	useEffect(() => {
		if (phase !== 'playing' && phase !== 'checking') return;

		function onKeyDown(e: KeyboardEvent) {
			const target = e.target as HTMLElement | null;
			if (
				target &&
				(target.tagName === 'INPUT' ||
					target.tagName === 'TEXTAREA' ||
					target.isContentEditable)
			) {
				return;
			}

			const opt = KEY_TO_OPTION[e.key.toLowerCase()];
			const current = questions[index];
			const availableKeys = new Set(current?.options.map((o) => o.key) ?? []);
			if (opt && availableKeys.has(opt) && phase === 'playing' && !answered) {
				e.preventDefault();
				setFocusKey(opt);
				void choose(opt);
				return;
			}

			if (e.key === 'ArrowRight' || (e.key === 'Enter' && answered)) {
				if (answered && phase === 'playing') {
					e.preventDefault();
					void goNext();
				}
				return;
			}

			if (e.key === 'ArrowLeft') {
				if (index > 0) {
					e.preventDefault();
					goPrev();
				}
			}
		}

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [answered, choose, goNext, goPrev, index, phase, questions]);

	if (phase === 'error') {
		return (
			<main className="flex min-h-svh flex-col items-center justify-center bg-canvas px-6 text-center">
				<p className="font-sans text-base text-ink-secondary">{error}</p>
				<button
					type="button"
					onClick={() => void restart()}
					className="mt-6 inline-flex min-h-11 items-center font-sans text-base font-medium text-ink underline decoration-ink/30 underline-offset-8 transition-colors hover:decoration-ink"
				>
					Thử lại
				</button>
				<Link
					href={routes.mySpaceTests}
					className="mt-8 font-sans text-sm text-ink-secondary"
				>
					← Tests
				</Link>
			</main>
		);
	}

	if (phase === 'done' && result) {
		return (
			<QuizResultView
				title={title}
				result={result}
				onRestart={() => void restart()}
				isPending={isPending}
			/>
		);
	}

	if (!current) {
		return (
			<main className="flex min-h-svh items-center justify-center bg-canvas px-6">
				<p className="font-sans text-base text-ink-secondary">
					Không có câu hỏi trong session.
				</p>
			</main>
		);
	}

	return (
		<main
			className="min-h-svh bg-canvas pt-20 pb-28 sm:pt-24 sm:pb-32"
			data-testid="myspace-quiz-play"
		>
			<div className="shell">
				<MobileQuizBar
					total={questions.length}
					currentIndex={index}
					answeredCount={answeredCount}
					correctCount={correctCount}
					reveals={reveals}
					questionIds={questionIds}
					answered={answered}
					onJump={jumpTo}
				/>

				<div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-10">
					<QuizSidebar
						title={title}
						subject={subject}
						total={questions.length}
						currentIndex={index}
						answeredCount={answeredCount}
						correctCount={correctCount}
						reveals={reveals}
						questionIds={questionIds}
						answered={answered}
						onJump={jumpTo}
					/>

					<QuestionPanel
						question={current}
						index={index}
						total={questions.length}
						chosen={chosen}
						reveal={currentReveal}
						phase={phase}
						reduceMotion={reduceMotion}
						focusKey={focusKey}
						onChoose={(key) => void choose(key)}
						onFocusKey={setFocusKey}
						onPrev={goPrev}
						onNext={() => void goNext()}
						canPrev={index > 0}
						canNext={answered}
					/>
				</div>
			</div>
		</main>
	);
}
