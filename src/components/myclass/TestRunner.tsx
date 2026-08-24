'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { routes } from '@/config/routes';
import type {
	LearnerResponse,
	MyClassQuestionCheck,
	MyClassQuestionForPlay,
	MyClassTestForPlay,
	MyClassTestResult,
	QuestionOptionKey,
} from '@/features/my-class';
import { writeTestScore } from '@/features/my-class/client/testScoreStore';
import { positionLabel, seededShuffle } from '@/features/my-class/domain/shuffle';
import {
	McBadge,
	McButton,
	McEmpty,
	McIcon,
	McMeter,
	McPanel,
	McProgressRing,
	McRows,
} from '@/components/myclass/ui';

type DraftValue = string | string[] | Record<string, string>;
type DraftMap = Record<string, DraftValue>;
type PlayDraft = {
	answers?: DraftMap;
	current?: number;
	seed?: string;
	deadline?: number | null;
	startedAt?: number;
};

function jumpCellClass(isCurrent: boolean, isAnswered: boolean) {
	if (isCurrent) return 'bg-ink text-paper';
	if (isAnswered) return 'border border-mc-done bg-mc-done-subtle text-mc-done';
	return 'border border-mc-rule bg-paper text-ink-secondary';
}

function isAnswered(question: MyClassQuestionForPlay, value: DraftValue | undefined): boolean {
	if (value == null) return false;
	if (question.type === 'MCQ_MULTI') {
		return Array.isArray(value) ? value.length > 0 : typeof value === 'string' && value.length > 0;
	}
	if (question.type === 'FILL_BLANK') {
		if (typeof value !== 'object' || Array.isArray(value)) return false;
		return (question.blanks ?? []).every((blank) => String(value[blank.id] ?? '').length > 0);
	}
	return typeof value === 'string' && value.length > 0;
}

function asStringArray(value: DraftValue | undefined): string[] {
	if (Array.isArray(value)) return value;
	if (typeof value === 'string' && value) return [value];
	return [];
}

function toResponse(question: MyClassQuestionForPlay, value: DraftValue | undefined): LearnerResponse {
	if (question.type === 'MCQ_MULTI') {
		return { type: 'MCQ_MULTI', keys: asStringArray(value) as QuestionOptionKey[] };
	}
	if (question.type === 'FILL_BLANK') {
		const blanks = typeof value === 'object' && value && !Array.isArray(value) ? value : {};
		return { type: 'FILL_BLANK', blanks };
	}
	return { type: 'MCQ_SINGLE', key: (typeof value === 'string' ? value : 'A') as QuestionOptionKey };
}

function createSeed() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function readDraft(storageKey: string): PlayDraft {
	try {
		return JSON.parse(localStorage.getItem(storageKey) ?? '{}') as PlayDraft;
	} catch {
		return {};
	}
}

function optionText(options: Array<{ key: string; text: string }>, key: string) {
	return options.find((option) => option.key === key)?.text ?? key;
}

function reviewChoiceLabel(
	options: Array<{ key: string; text: string }>,
	keys: string,
	type: MyClassQuestionForPlay['type'],
) {
	if (type === 'FILL_BLANK') return keys;
	return keys
		.split(', ')
		.filter(Boolean)
		.map((key) => optionText(options, key))
		.join(', ');
}

function formatClock(ms: number) {
	const total = Math.max(0, Math.ceil(ms / 1000));
	const minutes = Math.floor(total / 60);
	const seconds = total % 60;
	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function CharacterBoxes({
	blankId,
	length,
	value,
	hint,
	disabled,
	onChange,
}: {
	blankId: string;
	length: number;
	value: string;
	hint?: string;
	disabled?: boolean;
	onChange: (next: string) => void;
}) {
	const chars = Array.from({ length }, (_, index) => value[index] ?? '');
	return (
		<div className="space-y-2">
			<div className="flex flex-wrap gap-1.5" data-testid={`fill-blank-${blankId}`}>
				{chars.map((char, index) => (
					<input
						key={`${blankId}-${index}`}
						aria-label={`Ô ${index + 1} chỗ trống ${blankId}`}
						maxLength={1}
						value={char}
						disabled={disabled}
						onChange={(event) => {
							const next = event.target.value.slice(-1);
							const letters = chars.map((item, itemIndex) => (itemIndex === index ? next : item));
							onChange(letters.join(''));
							const sibling = event.currentTarget.parentElement?.querySelectorAll('input')[index + 1];
							if (next && sibling instanceof HTMLInputElement) sibling.focus();
						}}
						onKeyDown={(event) => {
							if (event.key !== 'Backspace' || chars[index]) return;
							const prev = event.currentTarget.parentElement?.querySelectorAll('input')[index - 1];
							if (prev instanceof HTMLInputElement) prev.focus();
						}}
						className="h-11 w-9 rounded-[var(--mc-r-xs)] border border-mc-rule bg-paper text-center text-base font-semibold disabled:opacity-60"
					/>
				))}
			</div>
			{hint ? <p className="mc-meta">{hint}</p> : null}
		</div>
	);
}

export default function TestRunner({
	test,
	authenticated = false,
	submitUrl,
	embedded = false,
	onDismiss,
	onResult,
}: {
	test: MyClassTestForPlay;
	authenticated?: boolean;
	submitUrl?: string;
	embedded?: boolean;
	onDismiss?: () => void;
	onResult?: (result: { score: number; total: number }) => void;
}) {
	const storageKey = `my-class:test:${test.courseSlug}:${test.slug}`;
	const preview = Boolean(submitUrl?.includes('/preview'));
	const initialDraft = useMemo(() => readDraft(storageKey), [storageKey]);
	const [answers, setAnswers] = useState<DraftMap>(initialDraft.answers ?? {});
	const [current, setCurrent] = useState(initialDraft.current ?? 0);
	const [seed] = useState(() => initialDraft.seed ?? createSeed());
	const [startedAt] = useState(() => initialDraft.startedAt ?? Date.now());
	const [deadline] = useState<number | null>(() => {
		if (initialDraft.deadline) return initialDraft.deadline;
		if (test.timeLimitMinutes) return Date.now() + test.timeLimitMinutes * 60_000;
		return null;
	});
	const [remainingMs, setRemainingMs] = useState(() => (deadline ? Math.max(0, deadline - Date.now()) : null));
	const [result, setResult] = useState<MyClassTestResult | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [checks, setChecks] = useState<Record<string, MyClassQuestionCheck>>({});
	const [attemptsUsed, setAttemptsUsed] = useState(test.attemptsUsed ?? 0);
	const submittingRef = useRef(false);

	const playQuestions = useMemo(() => {
		const ordered = test.shuffleQuestions ? seededShuffle(test.questions, `${seed}:q`) : test.questions;
		if (!test.shuffleOptions) return ordered;
		return ordered.map((question) => ({
			...question,
			options: seededShuffle(question.options, `${seed}:o:${question.id}`),
		}));
	}, [seed, test.questions, test.shuffleOptions, test.shuffleQuestions]);

	const questionCount = playQuestions.length;
	const safeCurrent = questionCount ? Math.min(Math.max(current, 0), questionCount - 1) : 0;
	const question = playQuestions[safeCurrent];
	const answered = playQuestions.filter((item) => isAnswered(item, answers[item.id])).length;
	const unanswered = useMemo(
		() =>
			playQuestions
				.map((item, index) => ({ item, index }))
				.filter(({ item }) => !isAnswered(item, answers[item.id]))
				.map(({ index }) => index + 1),
		[answers, playQuestions],
	);
	const answeredPercent = playQuestions.length ? (answered / playQuestions.length) * 100 : 0;
	const loginHref = `${routes.login}?from=${encodeURIComponent(routes.myClassTest(test.courseSlug, test.slug))}`;
	const passScore = test.passScore ?? 70;
	const stickyTop = embedded ? 'top-[var(--mc-topbar-height)]' : 'top-0';
	const exhausted = !preview && test.maxAttempts != null && attemptsUsed >= test.maxAttempts;
	const canRetry = preview || test.maxAttempts == null || attemptsUsed < test.maxAttempts;
	const checkUrl = preview ? null : `/api/my-class/tests/${test.courseSlug}/${test.slug}/check`;

	const persist = useCallback(
		(nextAnswers: DraftMap, nextCurrent = current) => {
			try {
				localStorage.setItem(
					storageKey,
					JSON.stringify({
						answers: nextAnswers,
						current: nextCurrent,
						seed,
						deadline,
						startedAt,
					} satisfies PlayDraft),
				);
			} catch {
				/* private mode */
			}
		},
		[current, deadline, seed, startedAt, storageKey],
	);

	useEffect(() => {
		persist(answers, current);
	}, [answers, current, persist]);

	const submit = useCallback(
		async (timedOut = false) => {
			if (submittingRef.current) return;
			if (!timedOut && unanswered.length) {
				setError(`Còn câu ${unanswered.join(', ')}`);
				return;
			}
			submittingRef.current = true;
			setBusy(true);
			setError(null);
			try {
				const payload = Object.fromEntries(
					playQuestions
						.filter((item) => isAnswered(item, answers[item.id]))
						.map((item) => [item.id, toResponse(item, answers[item.id])]),
				);
				const response = await fetch(submitUrl ?? `/api/my-class/tests/${test.courseSlug}/${test.slug}/submit`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						answers: payload,
						timedOut,
						durationSeconds: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
					}),
				});
				const json = (await response.json()) as { ok: boolean; data?: MyClassTestResult; error?: string };
				if (!json.ok || !json.data) throw new Error(json.error ?? 'Không thể nộp bài');
				setResult(json.data);
				if (json.data.saved) setAttemptsUsed((used) => used + 1);
				writeTestScore(test.courseSlug, test.slug, { score: json.data.score, total: json.data.total });
				onResult?.({ score: json.data.score, total: json.data.total });
				try {
					localStorage.removeItem(storageKey);
				} catch {
					/* private mode */
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Lỗi mạng, thử lại');
			} finally {
				setBusy(false);
				submittingRef.current = false;
			}
		},
		[answers, onResult, playQuestions, startedAt, storageKey, submitUrl, test.courseSlug, test.slug, unanswered],
	);

	useEffect(() => {
		if (!deadline || result) return;
		const tick = () => {
			const left = deadline - Date.now();
			setRemainingMs(Math.max(0, left));
			if (left <= 0) void submit(true);
		};
		tick();
		const id = window.setInterval(tick, 250);
		return () => window.clearInterval(id);
	}, [deadline, result, submit]);

	useEffect(() => {
		if (!question || test.revealPolicy !== 'IMMEDIATE' || !checkUrl) return;
		if (!isAnswered(question, answers[question.id]) || checks[question.id]) return;
		let cancelled = false;
		void fetch(checkUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ questionId: question.id, answer: toResponse(question, answers[question.id]) }),
		})
			.then((response) => response.json())
			.then((json: { ok: boolean; data?: MyClassQuestionCheck }) => {
				if (!cancelled && json.ok && json.data) {
					setChecks((currentChecks) => ({ ...currentChecks, [question.id]: json.data! }));
				}
			})
			.catch(() => {
				/* keep answering */
			});
		return () => {
			cancelled = true;
		};
	}, [answers, checkUrl, checks, question, test.revealPolicy]);

	function setDraft(value: DraftValue) {
		if (question && checks[question.id]) return;
		const next = { ...answers, [question.id]: value };
		setAnswers(next);
		persist(next);
	}

	function choose(value: string) {
		setDraft(value);
	}

	function toggleMulti(key: string) {
		const currentValue = answers[question.id];
		const keys = Array.isArray(currentValue)
			? currentValue
			: typeof currentValue === 'string' && currentValue
				? [currentValue]
				: [];
		setDraft(keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key]);
	}

	function setBlank(blankId: string, text: string) {
		const currentValue = answers[question.id];
		const blanks =
			typeof currentValue === 'object' && currentValue && !Array.isArray(currentValue) ? currentValue : {};
		setDraft({ ...blanks, [blankId]: text });
	}

	if (exhausted && !result) {
		return (
			<section className={embedded ? 'mt-2' : 'mt-8'} data-testid="my-class-test-runner">
				<McEmpty
					title="Hết lượt làm bài"
					description={`Bạn đã dùng hết ${test.maxAttempts} lượt cho bài này.`}
					action={
						onDismiss ? (
							<McButton variant="secondary" onClick={onDismiss}>
								Đóng
							</McButton>
						) : undefined
					}
				/>
			</section>
		);
	}

	if (result) {
		const percent = result.total ? Math.round((result.score / result.total) * 100) : 0;
		const passed = percent >= passScore;
		const weak = [...(result.kuBreakdown ?? [])]
			.sort((a, b) => a.accuracy - b.accuracy)
			.filter((item) => item.accuracy < 0.7)
			.slice(0, 3);
		const showReview = test.revealPolicy !== 'NEVER' && result.review.length > 0;
		const back = onDismiss ? (
			<McButton variant="secondary" className="flex-1 md:flex-none" onClick={onDismiss}>
				Về bài học
			</McButton>
		) : (
			<Link
				href={test.returnTo.href}
				className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[var(--mc-r-sm)] border border-mc-rule px-5 text-sm font-semibold text-ink hover:bg-surface-sunken md:flex-none"
			>
				Về bài học
			</Link>
		);

		return (
			<section
				className={`${embedded ? 'mt-2' : 'mt-8'} space-y-6`}
				aria-live="polite"
				data-testid="my-class-test-result"
			>
				<McPanel className="flex flex-col items-center gap-6 p-5 md:flex-row md:items-center md:p-8">
					<McProgressRing value={percent} size={100} strokeWidth={8} tone="accent">
						<span className="mc-num text-xl font-semibold">{percent}%</span>
					</McProgressRing>
					<div className="min-w-0 flex-1 text-center md:text-left">
						<p className="mc-eyebrow">Kết quả</p>
						<p className="mc-num mt-1 text-[2.5rem] font-bold leading-none text-ink">
							{result.score}/{result.total}
						</p>
						{result.earnedPoints != null && result.totalPoints != null && result.totalPoints !== result.total ? (
							<p className="mc-meta mt-1">
								Điểm phần <span className="mc-num">{result.earnedPoints}</span>/
								<span className="mc-num">{result.totalPoints}</span>
							</p>
						) : null}
						<div className="mt-3">
							<McBadge
								variant={passed ? 'done' : 'error'}
								className="rounded-[var(--mc-r-full)] px-3 py-1"
							>
								{passed ? `Đạt - cần ${passScore}%` : `Chưa đạt - cần ${passScore}%`}
							</McBadge>
						</div>
						<p className="mc-meta mt-2">
							{result.saved ? 'Đã lưu kết quả.' : 'Kết quả phiên này.'}
						</p>
						{!result.saved && !authenticated ? (
							<p className="mc-meta mt-2">
								<Link href={loginHref} className="font-semibold text-accent underline">
									Đăng nhập
								</Link>{' '}
								để lưu kết quả vào tài khoản.
							</p>
						) : null}
					</div>
					<div className="flex w-full gap-3 md:w-auto">
						{canRetry ? (
							<McButton
								className="flex-1 md:flex-none"
								type="button"
								onClick={() => {
									setResult(null);
									setAnswers({});
									setCurrent(0);
									setChecks({});
									setError(null);
								}}
							>
								Làm lại
							</McButton>
						) : null}
						{back}
					</div>
				</McPanel>

				{weak.length ? (
					<McPanel as="section" className="p-4 md:p-6">
						<h2 className="mc-h3">Nên ôn lại</h2>
						<McRows as="ul" className="mt-3 border-t-0">
							{weak.map((item) => (
								<li key={item.slug} className="flex flex-wrap items-center justify-between gap-3 px-0 py-3">
									<div>
										<p className="font-semibold text-ink">{item.title}</p>
										<p className="mc-meta">
											Đúng <span className="mc-num">{Math.round(item.accuracy * 100)}%</span>
										</p>
									</div>
									{item.slug ? (
										<Link
											href={routes.myClassKnowledge(test.courseSlug, item.slug)}
											className="inline-flex min-h-9 items-center rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-sm font-semibold text-ink hover:bg-surface-sunken"
										>
											Ôn lại →
										</Link>
									) : null}
								</li>
							))}
						</McRows>
					</McPanel>
				) : null}

				{showReview ? (
					<details className="group" open>
						<summary className="flex cursor-pointer list-none items-center gap-2 text-ink marker:content-none [&::-webkit-details-marker]:hidden">
							<McIcon name="arrow_drop_down" size={24} className="transition-transform group-open:rotate-0 -rotate-90" />
							<h3 className="mc-h3">Xem câu trả lời</h3>
						</summary>
						<div className="mt-4 space-y-4">
							{result.review.map((item, index) => (
								<McPanel as="article" key={item.questionId} className="p-4 md:p-6">
									<p className="text-sm font-semibold leading-5 text-ink">
										{index + 1}. {item.stem}
									</p>
									<p className={`mt-2 text-base ${item.isCorrect ? 'text-mc-done' : 'text-error'}`}>
										{item.isCorrect
											? 'Đúng'
											: `Bạn chọn ${reviewChoiceLabel(item.options, item.chosenKey, item.type)} · Đáp án ${reviewChoiceLabel(item.options, item.correctKey, item.type)}`}
									</p>
									{item.options?.map((option) =>
										option.feedback ? (
											<p key={option.key} className="mc-meta mt-1">
												{option.key}. {option.feedback}
											</p>
										) : null,
									)}
									{item.explanation ? (
										<div
											className="mc-prose mt-4 rounded-[var(--mc-r-sm)] bg-surface-container-low p-4 text-base"
											dangerouslySetInnerHTML={{ __html: item.explanation }}
										/>
									) : null}
								</McPanel>
							))}
						</div>
					</details>
				) : null}
			</section>
		);
	}

	if (!question) {
		return (
			<section className={embedded ? 'mt-2' : 'mt-8'} data-testid="my-class-test-runner">
				<McEmpty
					title="Chưa có câu hỏi"
					description="Thêm câu từ ngân hàng trong studio, rồi mở lại bài này."
					action={
						onDismiss ? (
							<McButton variant="secondary" onClick={onDismiss}>
								Đóng
							</McButton>
						) : undefined
					}
				/>
			</section>
		);
	}

	const lastQuestion = safeCurrent === playQuestions.length - 1;
	const selectedMulti = asStringArray(answers[question.id]);
	const blankDraft =
		typeof answers[question.id] === 'object' && answers[question.id] && !Array.isArray(answers[question.id])
			? (answers[question.id] as Record<string, string>)
			: {};
	const locked = Boolean(checks[question.id]);
	const check = checks[question.id];

	return (
		<section className={embedded ? 'mt-2' : 'mt-8'} data-testid="my-class-test-runner">
			<div
				className={`sticky z-10 -mx-4 border-y border-mc-rule bg-canvas px-4 py-3 sm:mx-0 ${stickyTop}`}
			>
				<div className="flex items-center justify-between gap-3 text-sm">
					<span className="mc-num font-semibold text-ink">
						Câu {safeCurrent + 1}/{playQuestions.length}
					</span>
					<div className="flex items-center gap-3">
						{remainingMs != null ? (
							<span className="mc-num font-semibold text-ink" data-testid="my-class-test-timer">
								{formatClock(remainingMs)}
							</span>
						) : null}
						<span className="mc-meta mc-num">
							{answered}/{playQuestions.length} đã chọn
						</span>
					</div>
				</div>
				<McMeter value={answeredPercent} className="mt-2" tone="test" label="Tiến độ trả lời" />
			</div>

			<McPanel className="mt-6 p-4 md:p-6">
				<p className="text-lg font-semibold leading-snug text-ink">
					{safeCurrent + 1}. {question.stem}
				</p>
				{question.type === 'FILL_BLANK' ? (
					<div className="mt-5 space-y-4">
						{(question.blanks ?? []).map((blank) => (
							<CharacterBoxes
								key={blank.id}
								blankId={blank.id}
								length={blank.length}
								value={blankDraft[blank.id] ?? ''}
								hint={blank.hint}
								disabled={locked}
								onChange={(next) => setBlank(blank.id, next)}
							/>
						))}
					</div>
				) : question.type === 'MCQ_MULTI' ? (
					<div className="mt-5 grid gap-2" role="group" aria-label={`Câu ${safeCurrent + 1}`}>
						{question.options.map((option, index) => {
							const selected = selectedMulti.includes(option.key);
							const label = positionLabel(index);
							return (
								<label
									key={option.key}
									className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-[var(--mc-r-md)] border p-3.5 text-sm ${
										selected
											? 'border-ink bg-surface-sunken font-semibold'
											: 'border-mc-rule bg-paper hover:bg-surface-sunken'
									} ${locked ? 'pointer-events-none opacity-80' : ''}`}
								>
									<input
										type="checkbox"
										name={`${question.id}-${option.key}`}
										value={option.key}
										checked={selected}
										disabled={locked}
										onChange={() => toggleMulti(option.key)}
										className="mt-1"
									/>
									<span>
										{label}. {option.text}
									</span>
								</label>
							);
						})}
					</div>
				) : (
					<div className="mt-5 grid gap-2" role="radiogroup" aria-label={`Câu ${safeCurrent + 1}`}>
						{question.options.map((option, index) => {
							const selected = answers[question.id] === option.key;
							const label = positionLabel(index);
							return (
								<label
									key={option.key}
									className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-[var(--mc-r-md)] border p-3.5 text-sm ${
										selected
											? 'border-ink bg-surface-sunken font-semibold'
											: 'border-mc-rule bg-paper hover:bg-surface-sunken'
									} ${locked ? 'pointer-events-none opacity-80' : ''}`}
								>
									<input
										type="radio"
										name={question.id}
										value={option.key}
										checked={selected}
										disabled={locked}
										onChange={() => choose(option.key)}
										className="mt-1"
									/>
									<span>
										{label}. {option.text}
									</span>
								</label>
							);
						})}
					</div>
				)}
				{check ? (
					<p className={`mt-4 text-sm ${check.isCorrect ? 'text-mc-done' : 'text-error'}`}>
						{check.isCorrect ? 'Đúng' : `Sai · Đáp án ${check.correctLabel}`}
					</p>
				) : null}
				{check?.explanation ? (
					<div
						className="mc-prose mt-3 rounded-[var(--mc-r-sm)] bg-surface-container-low p-4 text-base"
						dangerouslySetInnerHTML={{ __html: check.explanation }}
					/>
				) : null}
			</McPanel>

			{error ? (
				<p role="alert" className="mt-4 text-sm text-error">
					{error}
				</p>
			) : null}

			<div className="mt-8 flex flex-wrap items-center justify-between gap-3">
				<McButton
					variant="secondary"
					disabled={safeCurrent === 0}
					onClick={() => {
						const next = current - 1;
						setCurrent(next);
						persist(answers, next);
					}}
				>
					Trước
				</McButton>
				{lastQuestion ? (
					<McButton
						className="w-full sm:w-auto"
						disabled={answered !== playQuestions.length}
						loading={busy}
						onClick={() => void submit()}
					>
						Nộp bài
					</McButton>
				) : (
					<div className="flex gap-2">
						<McButton
							variant="quiet"
							onClick={() => {
								const next = current + 1;
								setCurrent(next);
								persist(answers, next);
							}}
						>
							Bỏ qua
						</McButton>
						<McButton
							onClick={() => {
								const next = current + 1;
								setCurrent(next);
								persist(answers, next);
							}}
						>
							Tiếp
							<McIcon name="arrow_forward" size={18} />
						</McButton>
					</div>
				)}
			</div>

			<div className="mt-6 grid grid-cols-8 gap-1.5 sm:grid-cols-10" aria-label="Đi tới câu hỏi">
				{playQuestions.map((item, index) => {
					const isCurrent = index === safeCurrent;
					const itemAnswered = isAnswered(item, answers[item.id]);
					const status = itemAnswered ? 'đã chọn' : 'chưa chọn';
					return (
						<button
							key={item.id}
							type="button"
							aria-current={isCurrent ? 'true' : undefined}
							aria-label={`Câu ${index + 1}, ${status}`}
							onClick={() => {
								setCurrent(index);
								persist(answers, index);
							}}
							className={`mc-num flex h-9 min-w-0 items-center justify-center rounded-[var(--mc-r-xs)] text-xs font-semibold ${jumpCellClass(isCurrent, itemAnswered)}`}
						>
							{index + 1}
						</button>
					);
				})}
			</div>
		</section>
	);
}
