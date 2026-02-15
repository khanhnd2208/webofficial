'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { LessonVocabularyItemDTO } from '@/types/lessonVocabulary';

/* ─── Helpers ─── */
function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function playDing() {
	if (typeof window === 'undefined') return;
	const Ctor =
		window.AudioContext ??
		(window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
	if (!Ctor) return;
	const ctx = new Ctor();
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.type = 'sine';
	osc.frequency.value = 880;
	gain.gain.value = 0.1;
	osc.connect(gain);
	gain.connect(ctx.destination);
	osc.start();
	setTimeout(() => {
		osc.stop();
		void ctx.close();
	}, 120);
}

/* ─── Component ─── */
export default function FillBlankPage() {
	const p = useParams();
	const courseId = typeof p?.courseId === 'string' ? p.courseId : '';
	const unitId = typeof p?.unitId === 'string' ? p.unitId : '';
	const lessonId = typeof p?.lessonId === 'string' ? p.lessonId : '';

	const [items, setItems] = useState<LessonVocabularyItemDTO[] | null>(null);
	const [error, setError] = useState('');
	const [queue, setQueue] = useState<LessonVocabularyItemDTO[]>([]);
	const [qIndex, setQIndex] = useState(0);
	const [letters, setLetters] = useState<string[]>([]);
	const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
	const [correct, setCorrect] = useState(0);
	const [wrong, setWrong] = useState(0);
	const [showAnswer, setShowAnswer] = useState(false);
	const [finished, setFinished] = useState(false);

	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	function initLetters(word: string) {
		const cleaned = word.trim();
		setLetters(new Array(cleaned.length).fill(''));
		setFeedback('idle');
		setShowAnswer(false);
		setTimeout(() => inputRefs.current[0]?.focus(), 50);
	}

	/* ── Fetch vocabulary ── */
	useEffect(() => {
		if (!lessonId) return;
		let cancelled = false;
		fetch(`/api/lessons/${encodeURIComponent(lessonId)}/vocabulary`)
			.then(async (res) => {
				if (!res.ok) throw new Error('Không thể tải dữ liệu');
				const json = await res.json();
				if (!json?.ok) throw new Error('Không thể tải dữ liệu');
				return (json.data ?? []) as LessonVocabularyItemDTO[];
			})
			.then((data) => {
				if (cancelled) return;
				setItems(data);
				const shuffled = shuffle(data);
				setQueue(shuffled);
				initLetters(shuffled[0]?.word ?? '');
			})
			.catch((e) => {
				if (!cancelled) setError(e instanceof Error ? e.message : 'Lỗi');
			});
		return () => {
			cancelled = true;
		};
	}, [lessonId]);

	const current = queue[qIndex] ?? null;
	const total = queue.length;
	const progress = total > 0 ? ((qIndex + (feedback !== 'idle' ? 1 : 0)) / total) * 100 : 0;

	const handleLetterChange = useCallback(
		(idx: number, value: string) => {
			if (feedback !== 'idle') return;
			const char = value.slice(-1);
			setLetters((prev) => {
				const next = [...prev];
				next[idx] = char;
				return next;
			});
			if (char && idx < (current?.word.trim().length ?? 0) - 1) {
				setTimeout(() => inputRefs.current[idx + 1]?.focus(), 10);
			}
		},
		[feedback, current],
	);

	const handleCheck = useCallback(() => {
		if (!current || feedback !== 'idle') return;
		const answer = letters.join('').toLowerCase();
		const expected = current.word.trim().toLowerCase();

		if (answer === expected) {
			setFeedback('correct');
			setCorrect((c) => c + 1);
			playDing();
		} else {
			setFeedback('wrong');
			setWrong((w) => w + 1);
		}
	}, [current, letters, feedback]);

	const handleNext = useCallback(() => {
		if (qIndex + 1 >= total) {
			setFinished(true);
		} else {
			const nextIdx = qIndex + 1;
			setQIndex(nextIdx);
			initLetters(queue[nextIdx]?.word ?? '');
		}
	}, [qIndex, total, queue]);

	const handleKeyDown = useCallback(
		(idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === 'Backspace' && !letters[idx] && idx > 0) {
				e.preventDefault();
				inputRefs.current[idx - 1]?.focus();
				setLetters((prev) => {
					const next = [...prev];
					next[idx - 1] = '';
					return next;
				});
			} else if (e.key === 'Enter') {
				e.preventDefault();
				if (feedback === 'idle') handleCheck();
				else handleNext();
			}
		},
		[letters, feedback, handleCheck, handleNext],
	);

	const handleReveal = useCallback(() => {
		if (!current) return;
		setShowAnswer(true);
		setLetters(current.word.trim().split(''));
	}, [current]);

	const handleRestart = useCallback(() => {
		if (!items) return;
		const shuffled = shuffle(items);
		setQueue(shuffled);
		setQIndex(0);
		setCorrect(0);
		setWrong(0);
		setFinished(false);
		initLetters(shuffled[0]?.word ?? '');
	}, [items]);

	const basePath = `/courses/${encodeURIComponent(courseId)}/units/${encodeURIComponent(unitId)}/lessons/${encodeURIComponent(lessonId)}`;

	/* ── Loading ── */
	if (items === null && !error) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background-secondary">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
			</main>
		);
	}

	/* ── Error / empty ── */
	if (error || total === 0) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background-secondary px-6">
				<p className="text-foreground-secondary">{error || 'Chưa có từ vựng.'}</p>
				<Link href={basePath} className="text-sm text-accent underline">
					Quay lại
				</Link>
			</main>
		);
	}

	/* ── Finished ── */
	if (finished) {
		const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
		return (
			<main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background-secondary px-6 text-center">
				<div className="flex justify-center">{pct >= 80 ? <svg className="h-14 w-14" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="cfb-p" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#ff5500" /><stop offset="50%" stopColor="#ffcc00" /><stop offset="100%" stopColor="#4a8c5c" /></linearGradient></defs><path d="M12 2l2.5 6.5L21 12l-6.5 2.5L12 22l-2.5-7.5L3 12l6.5-3.5L12 2z" fill="url(#cfb-p)" /><circle cx="12" cy="12" r="3" fill="#fff" opacity="0.4" /></svg> : pct >= 50 ? <svg className="h-14 w-14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#4a8c5c" opacity="0.2" stroke="#4a8c5c" strokeWidth="1.5" /><path d="M8 12.5l2.5 3L16 9" stroke="#4a8c5c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg> : <svg className="h-14 w-14" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="cfb-f" x1=".5" y1="1" x2=".5" y2="0"><stop offset="0%" stopColor="#c44b28" /><stop offset="100%" stopColor="#c48a1a" /></linearGradient></defs><path d="M12 2C9 7 4 11 4 16c0 5 3.5 7 8 7s8-2 8-7c0-6-5-10-8-15z" fill="url(#cfb-f)" opacity="0.7" /></svg>}</div>
				<h1 className="text-2xl font-bold">Kết quả Điền từ</h1>
				<div className="flex items-center gap-6 text-lg">
					<div className="text-center">
						<div className="text-3xl font-bold text-success">{correct}</div>
						<div className="text-xs text-muted">Đúng</div>
					</div>
					<div className="h-8 w-px bg-border" />
					<div className="text-center">
						<div className="text-3xl font-bold text-error">{wrong}</div>
						<div className="text-xs text-muted">Sai</div>
					</div>
					<div className="h-8 w-px bg-border" />
					<div className="text-center">
						<div className="text-3xl font-bold text-accent">{pct}%</div>
						<div className="text-xs text-muted">Điểm</div>
					</div>
				</div>
				<div className="flex flex-wrap items-center justify-center gap-3">
					<button
						onClick={handleRestart}
						className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
					>
						Làm lại
					</button>
					<Link
						href={`${basePath}/flashcards`}
						className="rounded-lg bg-surface px-5 py-2.5 text-sm font-semibold hover:bg-surface-hover"
					>
						Flashcards
					</Link>
					<Link
						href={`${basePath}/mcq`}
						className="rounded-lg bg-surface px-5 py-2.5 text-sm font-semibold hover:bg-surface-hover"
					>
						Trắc nghiệm
					</Link>
					<Link
						href={basePath}
						className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-hover"
					>
						Bài học
					</Link>
				</div>
			</main>
		);
	}

	/* ── Main quiz ── */
	const wordChars = current ? current.word.trim().split('') : [];

	return (
		<main className="flex min-h-screen flex-col bg-background-secondary">
			{/* Top bar */}
			<header className="border-b border-border bg-surface">
				<div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
					<Link
						href={basePath}
						className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
						Bài học
					</Link>
					<h1 className="text-sm font-semibold">Điền từ</h1>
					<div className="flex items-center gap-2">
						<Link
							href={`${basePath}/flashcards`}
							className="rounded-md bg-surface-hover px-2.5 py-1 text-[11px] font-semibold text-foreground-secondary hover:bg-surface-active"
						>
							Cards
						</Link>
						<Link
							href={`${basePath}/mcq`}
							className="rounded-md bg-surface-hover px-2.5 py-1 text-[11px] font-semibold text-foreground-secondary hover:bg-surface-active"
						>
							MCQ
						</Link>
					</div>
				</div>
			</header>

			{/* Progress */}
			<div className="border-b border-border bg-surface px-4 py-3 sm:px-6">
				<div className="mx-auto max-w-3xl">
					<div className="flex items-center justify-between text-xs font-semibold text-muted">
						<span>
							Từ {qIndex + 1}/{total}
						</span>
						<span className="flex items-center gap-2">
							<span className="text-success">{correct} đúng</span>
							<span className="text-error">{wrong} sai</span>
						</span>
					</div>
					<div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-hover">
						<div
							className="h-full rounded-full bg-accent transition-all duration-300"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			</div>

			{/* Question */}
			<div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
				{current ? (
					<div className="w-full max-w-lg">
						{/* Vietnamese meaning */}
						<div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
							Nghĩa tiếng Việt
						</div>
						<div className="rounded-xl border border-border bg-surface p-6 text-center shadow-sm">
							<div className="text-2xl font-bold sm:text-3xl">{current.meaningVi}</div>
							{current.partOfSpeech ? (
								<div className="mt-1 text-sm italic text-muted">{current.partOfSpeech}</div>
							) : null}
						</div>

						{/* Letter hint */}
						<div className="mt-2 text-center text-xs text-muted">
							{wordChars.length} ký tự
							{wordChars.includes(' ') ? ' (có dấu cách)' : ''}
						</div>

						{/* Letter inputs */}
						<div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
							{wordChars.map((char, i) => {
								if (char === ' ') {
									return <div key={i} className="w-4" />;
								}

								let borderColor = 'border-border focus-within:border-accent';
								if (feedback === 'correct') {
									borderColor = 'border-success bg-success-subtle';
								} else if (feedback === 'wrong' && showAnswer) {
									borderColor =
										letters[i]?.toLowerCase() === char.toLowerCase()
											? 'border-success bg-success-subtle'
											: 'border-error bg-error-subtle';
								} else if (feedback === 'wrong') {
									borderColor = 'border-error';
								}

								return (
									<input
										key={i}
										ref={(el) => {
											inputRefs.current[i] = el;
										}}
										type="text"
										maxLength={2}
										value={letters[i] || ''}
										onChange={(e) => handleLetterChange(i, e.target.value)}
										onKeyDown={(e) => handleKeyDown(i, e)}
										disabled={feedback !== 'idle'}
										className={`h-12 w-10 rounded-lg border-2 text-center text-lg font-bold uppercase outline-none transition-colors sm:h-14 sm:w-12 sm:text-xl ${borderColor} bg-surface disabled:bg-surface-secondary`}
										autoComplete="off"
										autoCapitalize="off"
										autoCorrect="off"
										spellCheck={false}
									/>
								);
							})}
						</div>

						{/* Feedback */}
						{feedback === 'correct' ? (
							<div className="mt-4 text-center text-sm font-semibold text-success">✓ Chính xác!</div>
						) : null}
						{feedback === 'wrong' && !showAnswer ? (
							<div className="mt-4 text-center text-sm font-semibold text-error">
								Không đúng.
								<button onClick={handleReveal} className="ml-2 text-accent underline underline-offset-2">
									Xem đáp án
								</button>
							</div>
						) : null}
						{feedback === 'wrong' && showAnswer ? (
							<div className="mt-4 text-center text-sm font-semibold text-foreground-secondary">
								Đáp án: <span className="text-accent">{current.word}</span>
							</div>
						) : null}

						{/* Action buttons */}
						<div className="mt-6 flex items-center justify-center gap-3">
							{feedback === 'idle' ? (
								<button
									onClick={handleCheck}
									disabled={letters.some((l, i) => wordChars[i] !== ' ' && !l)}
									className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
								>
									Kiểm tra
								</button>
							) : (
								<button
									onClick={handleNext}
									className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
								>
									{qIndex + 1 >= total ? 'Xem kết quả' : 'Từ tiếp →'}
								</button>
							)}
						</div>

						{/* Keyboard hint */}
						<div className="mt-6 text-center text-[10px] text-muted">
							<kbd className="rounded border border-border px-1.5 py-0.5 font-mono">Enter</kbd> kiểm tra /
							tiếp
						</div>
					</div>
				) : null}
			</div>
		</main>
	);
}
