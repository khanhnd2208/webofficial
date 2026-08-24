'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useVocabSetUrl, useVocabScoreUrl, useVocabChrome, VocabPracticeFrame, VocabBackLink } from '@/components/vocab/practice/VocabApiProvider';

type Word = { id: string; term: string; definition: string; partOfSpeech: string; example: string };

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function speak(text: string) {
	if (typeof window === 'undefined' || !window.speechSynthesis) return;
	const u = new SpeechSynthesisUtterance(text);
	u.lang = 'en-US';
	u.rate = 0.9;
	window.speechSynthesis.cancel();
	window.speechSynthesis.speak(u);
}

function playCorrect() {
	try {
		const ctx = new AudioContext();
		const notes = [523.25, 659.25]; // C5, E5
		notes.forEach((freq, i) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
			gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.1 + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
			osc.connect(gain).connect(ctx.destination);
			osc.start(ctx.currentTime + i * 0.1);
			osc.stop(ctx.currentTime + i * 0.1 + 0.3);
		});
	} catch { /* silent */ }
}

function playWrong() {
	try {
		const ctx = new AudioContext();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sawtooth';
		osc.frequency.value = 200;
		gain.gain.setValueAtTime(0.08, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
		osc.connect(gain).connect(ctx.destination);
		osc.start();
		osc.stop(ctx.currentTime + 0.25);
	} catch { /* silent */ }
}

function playSuccess() {
	try {
		const ctx = new AudioContext();
		const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
		notes.forEach((freq, i) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
			gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.1 + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.4);
			osc.connect(gain).connect(ctx.destination);
			osc.start(ctx.currentTime + i * 0.1);
			osc.stop(ctx.currentTime + i * 0.1 + 0.4);
		});
	} catch { /* silent */ }
}

/* ── Confetti burst ── */
function burstConfetti(container: HTMLElement) {
	const colors = ['#c44b28', '#e8714f', '#4a8c5c', '#6aad7c', '#c48a1a', '#d4a03a', '#f0ece4', '#1a1a1a'];
	const count = 60;

	for (let i = 0; i < count; i++) {
		const el = document.createElement('div');
		const size = Math.random() * 8 + 4;
		const isCircle = Math.random() > 0.5;
		el.style.cssText = `
			position:fixed;z-index:9999;pointer-events:none;
			width:${size}px;height:${isCircle ? size : size * 0.5}px;
			background:${colors[Math.floor(Math.random() * colors.length)]};
			border-radius:${isCircle ? '50%' : '2px'};
			left:50%;top:45%;
			opacity:1;
		`;
		container.appendChild(el);

		const angle = (Math.random() * 360) * (Math.PI / 180);
		const velocity = Math.random() * 400 + 200;
		const vx = Math.cos(angle) * velocity;
		const vy = Math.sin(angle) * velocity - 200;
		const rotation = Math.random() * 720 - 360;

		el.animate(
			[
				{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
				{ transform: `translate(${vx}px, ${vy + 600}px) rotate(${rotation}deg)`, opacity: 0 },
			],
			{ duration: 1200 + Math.random() * 600, easing: 'cubic-bezier(.25,.46,.45,.94)', fill: 'forwards' }
		).onfinish = () => el.remove();
	}
}

/* ── Floating particles for correct answer ── */
function burstSmallParticles(button: HTMLElement) {
	const rect = button.getBoundingClientRect();
	const cx = rect.left + rect.width / 2;
	const cy = rect.top + rect.height / 2;
	const colors = ['#4a8c5c', '#6aad7c', '#a7d9b3'];

	for (let i = 0; i < 12; i++) {
		const el = document.createElement('div');
		const size = Math.random() * 5 + 3;
		el.style.cssText = `
			position:fixed;z-index:9999;pointer-events:none;
			width:${size}px;height:${size}px;
			background:${colors[Math.floor(Math.random() * colors.length)]};
			border-radius:50%;
			left:${cx}px;top:${cy}px;
			opacity:1;
		`;
		document.body.appendChild(el);

		const angle = (Math.random() * 360) * (Math.PI / 180);
		const velocity = Math.random() * 120 + 60;
		const vx = Math.cos(angle) * velocity;
		const vy = Math.sin(angle) * velocity;

		el.animate(
			[
				{ transform: 'translate(0,0) scale(1)', opacity: 1 },
				{ transform: `translate(${vx}px, ${vy}px) scale(0)`, opacity: 0 },
			],
			{ duration: 500 + Math.random() * 300, easing: 'ease-out', fill: 'forwards' }
		).onfinish = () => el.remove();
	}
}

type Question = {
	word: Word;
	options: string[];
	correctIndex: number;
	mode: 'word-to-def' | 'def-to-word';
};
type QuestionRecord = { startTime: number; endTime: number; correct: boolean };

const QUESTION_TIME = 30; // seconds per question

async function _submitScore(scoreUrl: string, records: QuestionRecord[]) {
	try {
		const res = await fetch(scoreUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ mode: 'MCQ', questions: records }),
		});
		const json = await res.json();
		return json.ok ? json.data : null;
	} catch { return null; }
}

function generateQuestions(words: Word[]): Question[] {
	const shuffled = shuffle(words);
	return shuffled.map((word) => {
		const mode: Question['mode'] = Math.random() > 0.5 ? 'word-to-def' : 'def-to-word';
		const correctAnswer = mode === 'word-to-def' ? word.definition : word.term;
		const pool = words
			.filter((t) => t.term !== word.term)
			.map((t) => (mode === 'word-to-def' ? t.definition : t.term));
		const distractors = shuffle(pool).slice(0, 3);
		const options = shuffle([correctAnswer, ...distractors]);
		const correctIndex = options.indexOf(correctAnswer);
		return { word, options, correctIndex, mode };
	});
}

export default function MCQPage({ params }: { params: Promise<{ id: string }> }) {
	const vocabUrl = useVocabSetUrl();
	const [id, setId] = useState('');
	const [allWords, setAllWords] = useState<Word[] | null>(null);
	const [error, setError] = useState('');

	const [questions, setQuestions] = useState<Question[]>([]);
	const [qIndex, setQIndex] = useState(0);
	const [selected, setSelected] = useState<number | null>(null);
	const [answered, setAnswered] = useState(false);
	const [correct, setCorrect] = useState(0);
	const [wrong, setWrong] = useState(0);
	const [streak, setStreak] = useState(0);
	const [bestStreak, setBestStreak] = useState(0);
	const [finished, setFinished] = useState(false);
	const [questionAnim, setQuestionAnim] = useState<'enter' | 'exit' | 'idle'>('idle');
	const [shakeWrong, setShakeWrong] = useState(false);
	const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
	const containerRef = useRef<HTMLDivElement>(null);
	const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
	const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	// Anti-cheat: wall-clock timestamp for current question
	const questionStartTimeRef = useRef<number>(Date.now());
	// Accumulated per-question timing data
	const questionRecordsRef = useRef<QuestionRecord[]>([]);

	const clearAllTimers = useCallback(() => {
		if (autoAdvanceRef.current) { clearTimeout(autoAdvanceRef.current); autoAdvanceRef.current = null; }
		if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
	}, []);

	const startQuestionTimer = useCallback(() => {
		clearAllTimers();
		questionStartTimeRef.current = Date.now();
		setTimeLeft(QUESTION_TIME);
		timerIntervalRef.current = setInterval(() => {
			const elapsed = (Date.now() - questionStartTimeRef.current) / 1000;
			setTimeLeft(Math.max(0, Math.ceil(QUESTION_TIME - elapsed)));
		}, 200);
	}, [clearAllTimers]);

	useEffect(() => {
		params.then(async ({ id: paramId }) => {
			setId(paramId);
			const res = await fetch(vocabUrl(paramId));
			const json = await res.json();
			if (!json.ok) { setError(json.error); return; }
			const words = (json.data.set?.words ?? json.data.words ?? []) as Word[];
			setAllWords(words);
			const q = generateQuestions(words);
			setQuestions(q);
			setQuestionAnim('enter');
		});
	}, [params, vocabUrl]);

	// Start/reset timer when question index changes (or questions load)
	useEffect(() => {
		if (questions.length > 0 && !finished) {
			startQuestionTimer();
		}
		return clearAllTimers;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [qIndex, questions.length]);

	// Auto-timeout: when timer reaches 0, treat as wrong
	useEffect(() => {
		if (answered || !question || finished || timeLeft > 0) return;
		const endTime = Date.now();
		clearAllTimers();
		questionRecordsRef.current.push({ startTime: questionStartTimeRef.current, endTime, correct: false });
		setAnswered(true);
		setSelected(null);
		setWrong((v) => v + 1);
		setStreak(0);
		playWrong();
		setShakeWrong(true);
		setTimeout(() => setShakeWrong(false), 500);
		autoAdvanceRef.current = setTimeout(() => handleNext(), 2500);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [timeLeft, answered, finished]);

	const question = questions[qIndex] ?? null;
	const total = questions.length;

	const handleNext = useCallback(() => {
		clearAllTimers();
		if (autoAdvanceRef.current) {
			clearTimeout(autoAdvanceRef.current);
			autoAdvanceRef.current = null;
		}

		if (qIndex + 1 >= total) {
			setFinished(true);
			return;
		}

		// Exit animation
		setQuestionAnim('exit');
		setTimeout(() => {
			setQIndex((prev) => prev + 1);
			setSelected(null);
			setAnswered(false);
			setQuestionAnim('enter');
		}, 300);
	}, [clearAllTimers, qIndex, total]);

	const handleSelect = useCallback((optIdx: number) => {
		if (answered || !question) return;
		const endTime = Date.now();
		clearAllTimers();
		setSelected(optIdx);
		setAnswered(true);

		const isCorrect = optIdx === question.correctIndex;
		questionRecordsRef.current.push({ startTime: questionStartTimeRef.current, endTime, correct: isCorrect });

		if (isCorrect) {
			playCorrect();
			setCorrect((v) => v + 1);
			setStreak((v) => {
				const next = v + 1;
				setBestStreak((best) => Math.max(best, next));
				return next;
			});
			// Burst particles from the button
			const btn = optionRefs.current[optIdx];
			if (btn) burstSmallParticles(btn);
			// Speak the word
			speak(question.word.term);
		} else {
			playWrong();
			setWrong((v) => v + 1);
			setStreak(0);
			setShakeWrong(true);
			setTimeout(() => setShakeWrong(false), 500);
		}

		// Auto-advance after delay
		autoAdvanceRef.current = setTimeout(() => {
			handleNext();
		}, isCorrect ? 1500 : 2500);
	}, [answered, clearAllTimers, question, handleNext]);

	// Keyboard shortcuts (1-4 to select, Enter/Space to advance)
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (!question) return;

			if (!answered) {
				const num = parseInt(e.key);
				if (num >= 1 && num <= 4 && num <= question.options.length) {
					e.preventDefault();
					handleSelect(num - 1);
				}
			} else {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					handleNext();
				}
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [question, answered, handleSelect, handleNext]);

	// Cleanup all timers on unmount
	useEffect(() => () => clearAllTimers(), [clearAllTimers]);

	/* ── Loading / Error ── */
	if (error) {
		return (
			<VocabPracticeFrame className="min-h-screen flex items-center justify-center">
				<p className="text-sm text-error">{error}</p>
			</VocabPracticeFrame>
		);
	}

	if (allWords === null) {
		return (
			<VocabPracticeFrame className="min-h-screen flex items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
			</VocabPracticeFrame>
		);
	}

	/* ── Completion screen ── */
	if (finished) {
		return (
			<VocabPracticeFrame className="min-h-screen">
				<div ref={containerRef}>
				<CompletionScreen
					correct={correct}
					wrong={wrong}
					bestStreak={bestStreak}
					total={total}
					id={id}
					containerRef={containerRef}
					questionRecords={questionRecordsRef.current}
					onRestart={() => {
						const q = generateQuestions(allWords);
						setQuestions(q);
						setQIndex(0);
						setSelected(null);
						setAnswered(false);
						setCorrect(0);
						setWrong(0);
						setStreak(0);
						setBestStreak(0);
						setFinished(false);
						setQuestionAnim('enter');
						questionRecordsRef.current = [];
					}}
				/>
				</div>
			</VocabPracticeFrame>
		);
	}

	const progress = total > 0 ? ((qIndex + 1) / total) * 100 : 0;
	const optionLabels = ['A', 'B', 'C', 'D'];

	return (
		<VocabPracticeFrame className="min-h-screen select-none">
			<div ref={containerRef}>
			{/* Top bar */}
			<div className="border-b border-border">
				<div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
				<VocabBackLink className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors" />
				<div className="flex items-center gap-4 text-xs text-muted">
					<span>{qIndex + 1}/{total}</span>
						<span className="font-bold text-success">✓ {correct}</span>
						{streak >= 3 && (
							<span
								className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 font-bold text-accent"
								style={{ animation: 'streakPulse 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
							>
								<svg className="h-3 w-3" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="mcq-streak" x1=".5" y1="1" x2=".5" y2="0"><stop offset="0%" stopColor="#ff5500" /><stop offset="100%" stopColor="#ffbb33" /></linearGradient></defs><path d="M12 2C9 7 4 11 4 16c0 5 3.5 7 8 7s8-2 8-7c0-6-5-10-8-15z" fill="url(#mcq-streak)" /></svg> {streak}
							</span>
						)}
					</div>
				</div>
				{/* Progress bar with glow */}
				<div className="h-1 bg-surface-hover overflow-hidden">
					<div
						className="h-full bg-accent"
						style={{
							width: `${progress}%`,
							transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
							boxShadow: '0 0 12px rgba(196, 75, 40, 0.4)',
						}}
					/>
				</div>
			</div>

			{question && (
				<div
					className="mx-auto max-w-2xl px-6 py-10 sm:py-14"
					style={{
						opacity: questionAnim === 'exit' ? 0 : 1,
						transform:
							questionAnim === 'enter'
								? 'translateX(0) scale(1)'
								: questionAnim === 'exit'
									? 'translateX(-30px) scale(0.97)'
									: 'none',
						transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
						animation: questionAnim === 'enter' ? 'questionSlideIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined,
					}}
				>
				{/* Question type badge + timer */}
				<div className="mb-3 flex items-center justify-between gap-2">
					<span className="rounded-full bg-surface-hover px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted">
						{question.mode === 'word-to-def' ? 'Chọn nghĩa đúng' : 'Chọn từ đúng'}
					</span>
					{!answered && (() => {
						const frac = timeLeft / QUESTION_TIME;
						const color = frac > 0.5 ? '#4a8c5c' : frac > 0.25 ? '#c48a1a' : '#c44b28';
						return (
							<div className="flex items-center gap-1.5">
								<svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36">
									<circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-surface-hover" />
									<circle cx="18" cy="18" r="15" fill="none" strokeWidth="3" stroke={color}
										strokeDasharray={`${frac * 94.25} 94.25`}
										style={{ transition: 'stroke-dasharray 0.2s linear, stroke 0.3s' }}
										strokeLinecap="round" />
								</svg>
								<span className="w-5 text-center text-sm font-black tabular-nums" style={{ color }}>{timeLeft}</span>
							</div>
						);
					})()}
				</div>					{/* Question prompt */}
					<div className="flex items-start gap-4">
					<h2 className="text-xl font-black tracking-tight text-foreground sm:text-2xl lg:text-3xl">
						{question.mode === 'word-to-def' ? question.word.term : question.word.definition}
					</h2>
						{question.mode === 'word-to-def' && (
						<button
							onClick={() => speak(question.word.term)}
								className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-hover text-muted transition-all hover:bg-accent hover:text-accent-foreground hover:scale-110 active:scale-95"
							>
								<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-3.14a.75.75 0 011.28.53v12.72a.75.75 0 01-1.28.53l-4.72-3.14H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
								</svg>
							</button>
						)}
					</div>

				{question.word.partOfSpeech && question.mode === 'word-to-def' && (
					<p className="mt-1.5 text-sm italic text-muted">({question.word.partOfSpeech})</p>
				)}					{/* Options */}
					<div className={`mt-8 space-y-3 ${shakeWrong ? '' : ''}`}>
						{question.options.map((opt, idx) => {
							const isCorrectOption = idx === question.correctIndex;
							const isSelected = selected === idx;
							const isWrongSelected = answered && isSelected && !isCorrectOption;

							let borderClass = 'border-border hover:border-border-hover';
							let bgClass = 'bg-surface hover:bg-surface-hover';
							let textClass = 'text-foreground';
							let labelBg = 'bg-surface-hover text-muted';
							let extraStyle = '';

							if (answered) {
								if (isCorrectOption) {
									borderClass = 'border-success';
									bgClass = 'bg-success-subtle';
									textClass = 'text-success';
									labelBg = 'bg-success text-white';
									extraStyle = 'correctReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
								} else if (isWrongSelected) {
									borderClass = 'border-error';
									bgClass = 'bg-error-subtle';
									textClass = 'text-error';
									labelBg = 'bg-error text-white';
									extraStyle = 'wrongShake 0.5s ease';
								} else {
									borderClass = 'border-border/50';
									bgClass = 'bg-surface/50';
									textClass = 'text-muted';
									labelBg = 'bg-surface-hover text-muted/50';
								}
							}

							return (
								<button
									key={idx}
									ref={(el) => { optionRefs.current[idx] = el; }}
									onClick={() => handleSelect(idx)}
									disabled={answered}
									className={`group relative flex w-full items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all duration-200 ${borderClass} ${bgClass} ${
										!answered ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'
									}`}
									style={{
										animation: extraStyle || (questionAnim === 'enter'
											? `optionFadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.08}s both`
											: undefined),
									}}
								>
									{/* Label badge */}
									<span
										className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all duration-200 ${labelBg} ${
											!answered ? 'group-hover:bg-accent group-hover:text-accent-foreground' : ''
										}`}
									>
										{optionLabels[idx]}
									</span>

									{/* Option text */}
									<span className={`text-sm font-medium leading-relaxed transition-colors duration-200 ${textClass}`}>
										{opt}
									</span>

									{/* Result icon */}
									{answered && isCorrectOption && (
										<span
											className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success text-white"
											style={{ animation: 'iconPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both' }}
										>
											<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
												<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
											</svg>
										</span>
									)}
									{isWrongSelected && (
										<span
											className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-error text-white"
											style={{ animation: 'iconPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both' }}
										>
											<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
												<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</span>
									)}
								</button>
							);
						})}
					</div>

					{/* After answer: show example & next button */}
					{answered && (
						<div
							className="mt-6"
							style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both' }}
						>
						{question.word.example && (
							<div className="rounded-xl border border-border bg-surface p-4">
								<p className="text-xs font-bold uppercase tracking-widest text-muted">Ví dụ</p>
								<p className="mt-1.5 text-sm italic leading-relaxed text-foreground-secondary">
									&ldquo;{question.word.example}&rdquo;
								</p>
							</div>
						)}
							<div className="mt-5 flex items-center justify-between">
								<p className="text-[10px] font-bold uppercase tracking-widest text-muted/50">
									Enter hoặc Space để tiếp tục
								</p>
								<button
									onClick={handleNext}
									className="rounded-full border-2 border-foreground bg-foreground px-5 py-2 text-xs font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground active:scale-95"
								>
									{qIndex + 1 >= total ? 'Xem kết quả' : 'Tiếp theo →'}
								</button>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Keyboard hint */}
			{!answered && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2">
					<div className="rounded-full bg-surface/80 backdrop-blur-sm border border-border px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted/50 shadow-lg">
						Phím 1–4 để chọn đáp án
					</div>
				</div>
			)}

			{/* Animations */}
			<style>{`
				@keyframes questionSlideIn {
					0% { transform: translateX(40px) scale(0.96); opacity: 0; }
					100% { transform: translateX(0) scale(1); opacity: 1; }
				}
				@keyframes optionFadeIn {
					0% { transform: translateY(12px); opacity: 0; }
					100% { transform: translateY(0); opacity: 1; }
				}
				@keyframes correctReveal {
					0% { transform: scale(1); }
					30% { transform: scale(1.02); }
					100% { transform: scale(1); }
				}
				@keyframes wrongShake {
					0%, 100% { transform: translateX(0); }
					15% { transform: translateX(-6px); }
					30% { transform: translateX(6px); }
					45% { transform: translateX(-4px); }
					60% { transform: translateX(4px); }
					75% { transform: translateX(-2px); }
					90% { transform: translateX(2px); }
				}
				@keyframes iconPop {
					0% { transform: scale(0) rotate(-45deg); opacity: 0; }
					60% { transform: scale(1.3) rotate(5deg); }
					100% { transform: scale(1) rotate(0); opacity: 1; }
				}
				@keyframes fadeSlideUp {
					0% { transform: translateY(16px); opacity: 0; }
					100% { transform: translateY(0); opacity: 1; }
				}
				@keyframes streakPulse {
					0% { transform: scale(0.5); opacity: 0; }
					60% { transform: scale(1.2); }
					100% { transform: scale(1); opacity: 1; }
				}
			`}</style>
			</div>
		</VocabPracticeFrame>
	);
}

/* ── Completion Screen Component ── */
function CompletionScreen({
	correct,
	wrong,
	bestStreak,
	total,
	id,
	containerRef,
	questionRecords,
	onRestart,
}: {
	correct: number;
	wrong: number;
	bestStreak: number;
	total: number;
	id: string;
	containerRef: React.RefObject<HTMLDivElement | null>;
	questionRecords: QuestionRecord[];
	onRestart: () => void;
}) {
	const chrome = useVocabChrome();
	const scoreUrlFor = useVocabScoreUrl();
	const [show, setShow] = useState(false);
	const firedRef = useRef(false);
	const score = total > 0 ? Math.round((correct / total) * 100) : 0;
	// Average score per question (0–3000)
	const avgScore = questionRecords.length > 0
		? Math.round(
				questionRecords.reduce((sum, r) => {
					if (!r.correct) return sum;
					const elapsed = (r.endTime - r.startTime) / 1000;
					return sum + Math.max(0, 3000 - elapsed * 100);
				}, 0) / questionRecords.length
			)
		: 0;
	const [scoreResult, setScoreResult] = useState<{ score: number; isNewBest: boolean; previousBest: number | null } | null>(null);
	const submittedRef = useRef(false);

	useEffect(() => {
		const t = setTimeout(() => setShow(true), 100);
		return () => clearTimeout(t);
	}, []);

	useEffect(() => {
		if (show && !firedRef.current && containerRef.current) {
			firedRef.current = true;
			playSuccess();
			if (score >= 50) burstConfetti(containerRef.current);
		}
	}, [show, containerRef, score]);

	// Submit score once on mount
	useEffect(() => {
		if (submittedRef.current || questionRecords.length === 0) return;
		submittedRef.current = true;
		(async () => {
			try {
				const res = await fetch(scoreUrlFor(id), {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ mode: 'MCQ', questions: questionRecords }),
				});
				const json = await res.json();
				if (json.ok) setScoreResult({ score: json.data.score, isNewBest: json.data.isNewBest, previousBest: json.data.previousBest });
			} catch { /* silent — leaderboard update is non-critical */ }
		})();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const resultIcon = score >= 90 ? (
		<svg className="h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="trophy-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffcc00" /><stop offset="100%" stopColor="#ff8800" /></linearGradient></defs><path d="M6 2h12v4a6 6 0 01-12 0V2z" fill="url(#trophy-g)" /><path d="M6 4H3a1 1 0 00-1 1v1a4 4 0 004 4" stroke="#ffcc00" strokeWidth="1.5" /><path d="M18 4h3a1 1 0 011 1v1a4 4 0 01-4 4" stroke="#ffcc00" strokeWidth="1.5" /><rect x="9" y="12" width="6" height="3" rx="1" fill="url(#trophy-g)" opacity="0.6" /><rect x="7" y="15" width="10" height="2" rx="1" fill="url(#trophy-g)" opacity="0.8" /></svg>
	) : score >= 70 ? (
		<svg className="h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="party-g" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#ff5500" /><stop offset="50%" stopColor="#ffcc00" /><stop offset="100%" stopColor="#4a8c5c" /></linearGradient></defs><path d="M12 2l2.5 6.5L21 12l-6.5 2.5L12 22l-2.5-7.5L3 12l6.5-3.5L12 2z" fill="url(#party-g)" /><circle cx="12" cy="12" r="3" fill="#fff" opacity="0.4" /></svg>
	) : score >= 50 ? (
		<svg className="h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#4a8c5c" opacity="0.2" stroke="#4a8c5c" strokeWidth="1.5" /><path d="M8 12.5l2.5 3L16 9" stroke="#4a8c5c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
	) : (
		<svg className="h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="muscle-g" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="var(--accent)" /><stop offset="100%" stopColor="var(--warning)" /></linearGradient></defs><path d="M12 2C9 7 4 11 4 16c0 5 3.5 7 8 7s8-2 8-7c0-6-5-10-8-15z" fill="url(#muscle-g)" opacity="0.7" /><path d="M12 10c-2 3-4 5-4 8 0 2.5 1.8 4 4 4s4-1.5 4-4c0-3-2-5-4-8z" fill="#fff" opacity="0.2" /></svg>
	);
	const message = score >= 90 ? 'Xuất sắc!' : score >= 70 ? 'Tuyệt vời!' : score >= 50 ? 'Khá tốt!' : 'Cần luyện thêm!';

	return (
		<div className="flex min-h-[80vh] flex-col items-center justify-center px-6">
			<div
				style={{
					opacity: show ? 1 : 0,
					transform: show ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.9)',
					transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
				}}
			>
				<div className="text-center">
					<div
						className="text-7xl"
						style={{
							animation: show ? 'celebrateBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both' : undefined,
						}}
					>
						{resultIcon}
					</div>
					<h1 className="mt-6 text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
						{message}
					</h1>

					{/* Score ring */}
					<div className="mx-auto mt-6 flex items-center justify-center gap-8">
						<div className="relative flex h-24 w-24 items-center justify-center">
							<svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
								<circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-surface-hover" />
								<circle
									cx="50" cy="50" r="42" fill="none" strokeWidth="6"
									stroke={score >= 70 ? '#4a8c5c' : score >= 50 ? '#c48a1a' : '#c44b28'}
									strokeLinecap="round"
									strokeDasharray={`${score * 2.64} 264`}
									style={{
										transition: 'stroke-dasharray 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s',
									}}
								/>
							</svg>
							<span className="absolute text-2xl font-black text-foreground">{score}%</span>
						</div>
					</div>

					{/* Stats */}
					<div className="mx-auto mt-6 flex max-w-xs items-center justify-center gap-6">
						<div className="text-center">
							<p className="text-2xl font-black text-success">{correct}</p>
							<p className="text-[10px] font-bold uppercase tracking-widest text-muted">Đúng</p>
						</div>
						<div className="h-8 w-px bg-border" />
						<div className="text-center">
							<p className="text-2xl font-black text-error">{wrong}</p>
							<p className="text-[10px] font-bold uppercase tracking-widest text-muted">Sai</p>
						</div>
						<div className="h-8 w-px bg-border" />
						<div className="text-center">
							<p className="inline-flex items-center gap-1 text-2xl font-black text-accent"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="res-streak" x1=".5" y1="1" x2=".5" y2="0"><stop offset="0%" stopColor="#ff5500" /><stop offset="100%" stopColor="#ffbb33" /></linearGradient></defs><path d="M12 2C9 7 4 11 4 16c0 5 3.5 7 8 7s8-2 8-7c0-6-5-10-8-15z" fill="url(#res-streak)" /></svg> {bestStreak}</p>
							<p className="text-[10px] font-bold uppercase tracking-widest text-muted">Streak</p>
						</div>
					</div>

					{/* Average score */}
					<div className="mx-auto mt-4 flex max-w-xs items-center justify-center gap-2 rounded-xl border border-border bg-surface p-3">
						<span className="text-xs font-bold uppercase tracking-widest text-muted">Điểm TB / câu</span>
						<span className="ml-auto text-xl font-black text-foreground">{avgScore}</span>
						<span className="text-xs text-muted">/ 3000</span>
					</div>

					{/* Leaderboard feedback */}
					{scoreResult && (
						<div className={`mx-auto mt-3 max-w-xs rounded-xl border px-4 py-2.5 text-sm ${scoreResult.isNewBest ? 'border-success/40 bg-success-subtle text-success' : 'border-border bg-surface text-muted'}`}>
							{scoreResult.isNewBest
								? <><span className="font-bold">🎉 Kỷ lục mới!</span> {Math.round(scoreResult.score)} điểm</>
								: <>Kỷ lục của bạn: <span className="font-bold">{Math.round(scoreResult.previousBest ?? 0)}</span> điểm</>
							}
						</div>
					)}

					<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
						<button
							onClick={() => { firedRef.current = false; onRestart(); }}
							className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground active:scale-95"
						>
							<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
							</svg>
							Làm lại
						</button>
						<Link
							href={chrome.setHref(id)}
							className="inline-flex items-center gap-2 rounded-full border-2 border-border px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-foreground transition-all hover:border-foreground active:scale-95"
						>
							Quay lại bộ từ
						</Link>
					</div>

					{/* Try other modes */}
					<div className="mt-6">
						<p className="text-[10px] font-bold uppercase tracking-widest text-muted">Thử chế độ khác</p>
						<div className="mt-2 flex flex-wrap items-center justify-center gap-2">
							{[
								{ href: chrome.modeHref(id, 'flashcards'), label: 'Flashcards', color: 'text-accent' },
								{ href: chrome.modeHref(id, 'fill-blank'), label: 'Điền từ', color: 'text-indigo' },
								{ href: chrome.modeHref(id, 'matching'), label: 'Nối từ', color: 'text-purple' },
							].map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className={`rounded-full border border-border px-3 py-1 text-xs font-bold transition-all hover:bg-surface-hover ${link.color}`}
								>
									{link.label}
								</Link>
							))}
						</div>
					</div>
				</div>
			</div>

			<style>{`
				@keyframes celebrateBounce {
					0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
					50% { transform: scale(1.2) rotate(5deg); }
					100% { transform: scale(1) rotate(0); opacity: 1; }
				}
			`}</style>
		</div>
	);
}
