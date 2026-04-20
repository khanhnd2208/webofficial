'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';

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
		const notes = [523.25, 659.25, 783.99];
		notes.forEach((freq, i) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
			gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.08 + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.3);
			osc.connect(gain).connect(ctx.destination);
			osc.start(ctx.currentTime + i * 0.08);
			osc.stop(ctx.currentTime + i * 0.08 + 0.3);
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
		gain.gain.setValueAtTime(0.06, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
		osc.connect(gain).connect(ctx.destination);
		osc.start();
		osc.stop(ctx.currentTime + 0.2);
	} catch { /* silent */ }
}

function playSuccess() {
	try {
		const ctx = new AudioContext();
		const notes = [523.25, 659.25, 783.99, 1046.5];
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

function burstConfetti(container: HTMLElement) {
	const colors = ['#c44b28', '#e8714f', '#4a8c5c', '#6aad7c', '#c48a1a', '#d4a03a', '#5b7fb5', '#8b6fb0', '#f0ece4', '#1a1a1a'];
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
			left:50%;top:45%;opacity:1;
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

export default function FillBlankPage({ params }: { params: Promise<{ id: string }> }) {
	const [id, setId] = useState('');
	const [allWords, setAllWords] = useState<Word[] | null>(null);
	const [error, setError] = useState('');

	const [questions, setQuestions] = useState<Word[]>([]);
	const [qIndex, setQIndex] = useState(0);
	const [letters, setLetters] = useState<string[]>([]);
	const [revealed, setRevealed] = useState(false);
	const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
	const [hintCount, setHintCount] = useState(0);
	const [correct, setCorrect] = useState(0);
	const [wrong, setWrong] = useState(0);
	const [finished, setFinished] = useState(false);
	const [animKey, setAnimKey] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	useEffect(() => {
		params.then(async ({ id: paramId }) => {
			setId(paramId);
			const res = await fetch(`/api/vocab-sets/${paramId}`);
			const json = await res.json();
			if (!json.ok) { setError(json.error); return; }
			const words = (json.data.set?.words ?? json.data.words ?? []) as Word[];
			setAllWords(words);
			const q = shuffle(words);
			setQuestions(q);
			resetForQuestion(q[0]);
		});
	}, [params]);

	function resetForQuestion(word: Word) {
		const len = word.term.length;
		setLetters(Array(len).fill(''));
		setRevealed(false);
		setIsCorrect(null);
		setHintCount(0);
		setAnimKey((k) => k + 1);
		setTimeout(() => inputRefs.current[0]?.focus(), 100);
	}

	const question = questions[qIndex] ?? null;
	const total = questions.length;
	const wordLen = question?.term.length ?? 0;

	/* ── Dynamic sizing for letter inputs ── */
	const letterSize = useMemo(() => {
		// Responsive: compute size based on word length
		// On mobile (320px viewport), we have about 280px usable width
		// On desktop, we have about 600px usable width
		if (wordLen <= 6) return { box: 'h-12 w-10 sm:h-14 sm:w-12 text-lg sm:text-xl', gap: 'gap-1.5 sm:gap-2.5' };
		if (wordLen <= 8) return { box: 'h-11 w-9 sm:h-13 sm:w-11 text-base sm:text-lg', gap: 'gap-1 sm:gap-2' };
		if (wordLen <= 10) return { box: 'h-10 w-8 sm:h-12 sm:w-10 text-sm sm:text-base', gap: 'gap-1 sm:gap-1.5' };
		if (wordLen <= 13) return { box: 'h-9 w-7 sm:h-11 sm:w-9 text-xs sm:text-sm', gap: 'gap-0.5 sm:gap-1' };
		return { box: 'h-8 w-6 sm:h-10 sm:w-8 text-[11px] sm:text-xs', gap: 'gap-0.5 sm:gap-1' };
	}, [wordLen]);

	const handleLetterChange = useCallback((idx: number, value: string) => {
		if (revealed) return;
		const char = value.slice(-1).toUpperCase();
		setLetters((prev) => {
			const next = [...prev];
			next[idx] = char;
			return next;
		});
		// Auto-advance to next empty input
		if (char && idx < wordLen - 1) {
			const nextEmpty = inputRefs.current.findIndex((el, i) => i > idx && el && !letters[i]);
			const target = nextEmpty >= 0 ? nextEmpty : idx + 1;
			inputRefs.current[target]?.focus();
		}
	}, [revealed, wordLen, letters]);

	const handleCheck = useCallback(() => {
		if (!question || revealed) return;
		const answer = letters.join('');
		const expected = question.term.toUpperCase();
		if (answer.length < expected.length) return; // not all filled

		const wasCorrect = answer === expected;

		if (wasCorrect) {
			setIsCorrect(true);
			setCorrect((v) => v + 1);
			playCorrect();
			speak(question.term);
		} else {
			setIsCorrect(false);
			setWrong((v) => v + 1);
			playWrong();
		}
		setRevealed(true);
	}, [question, letters, revealed]);

	const handleKeyDown = useCallback((idx: number, e: React.KeyboardEvent) => {
		if (revealed) return;
		if (e.key === 'Backspace') {
			if (!letters[idx] && idx > 0) {
				setLetters((prev) => {
					const next = [...prev];
					next[idx - 1] = '';
					return next;
				});
				inputRefs.current[idx - 1]?.focus();
			} else {
				setLetters((prev) => {
					const next = [...prev];
					next[idx] = '';
					return next;
				});
			}
			e.preventDefault();
		} else if (e.key === 'ArrowLeft' && idx > 0) {
			inputRefs.current[idx - 1]?.focus();
		} else if (e.key === 'ArrowRight' && idx < wordLen - 1) {
			inputRefs.current[idx + 1]?.focus();
		} else if (e.key === 'Enter') {
			handleCheck();
		}
	}, [revealed, letters, wordLen, handleCheck]);

	const handleHint = useCallback(() => {
		if (!question || revealed) return;
		const word = question.term.toUpperCase();
		// Find first empty or wrong letter
		for (let i = 0; i < word.length; i++) {
			if (letters[i] !== word[i]) {
				setLetters((prev) => {
					const next = [...prev];
					next[i] = word[i];
					return next;
				});
				setHintCount((v) => v + 1);
				// Focus next empty
				setTimeout(() => {
					const nextEmpty = inputRefs.current.findIndex((el, j) => j > i && el && !letters[j] && word[j] !== letters[j]);
					if (nextEmpty >= 0) inputRefs.current[nextEmpty]?.focus();
				}, 50);
				return;
			}
		}
	}, [question, revealed, letters]);

	const handleNext = useCallback(() => {
		if (qIndex + 1 >= total) {
			setFinished(true);
			return;
		}
		const nextQ = questions[qIndex + 1];
		setQIndex((v) => v + 1);
		resetForQuestion(nextQ);
	}, [qIndex, total, questions]);

	// Auto-check when all letters filled
	useEffect(() => {
		if (!question || revealed) return;
		if (letters.length === wordLen && letters.every((l) => l !== '')) {
			handleCheck();
		}
	}, [letters, question, revealed, wordLen, handleCheck]);

	/* ── Loading / Error ── */
	if (error) {
		return (
			<main className="min-h-screen flex items-center justify-center">
				<p className="text-sm text-error">{error}</p>
			</main>
		);
	}

	if (allWords === null) {
		return (
			<main className="min-h-screen flex items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
			</main>
		);
	}

	/* ── Completion screen ── */
	if (finished) {
		return (
			<main ref={containerRef} className="min-h-screen">
				<CompletionScreen
					correct={correct}
					wrong={wrong}
					total={total}
					id={id}
					containerRef={containerRef}
					onRestart={() => {
							const q = shuffle(allWords);
						setQuestions(q);
						setQIndex(0);
						setCorrect(0);
						setWrong(0);
						setFinished(false);
						resetForQuestion(q[0]);
					}}
				/>
			</main>
		);
	}

	const progress = total > 0 ? ((qIndex + 1) / total) * 100 : 0;

	return (
		<main ref={containerRef} className="min-h-screen select-none">
			{/* Top bar */}
			<div className="border-b border-border">
				<div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
				<Link href="/vocabulary" className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors">
					← Từ vựng
				</Link>
				<div className="flex items-center gap-3 text-xs text-muted">
						<span>{qIndex + 1}/{total}</span>
						<span className="font-bold text-success">✓ {correct}</span>
						{wrong > 0 && <span className="font-bold text-error">✗ {wrong}</span>}
					</div>
				</div>
				{/* Progress bar */}
				<div className="h-1 bg-surface-hover overflow-hidden">
					<div
						className="h-full bg-indigo"
						style={{
							width: `${progress}%`,
							transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
						}}
					/>
				</div>
			</div>

			{question && (
				<div
					key={animKey}
					className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-14"
					style={{
						animation: 'slideIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
					}}
				>
					{/* Question prompt */}
					<div className="text-center">
						<div className="flex items-center justify-center gap-2">
							<span className="inline-block rounded-full bg-indigo-subtle px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo">
								Điền từ vựng
							</span>
						</div>

						<h2 className="mt-5 text-xl font-bold leading-relaxed text-foreground sm:text-2xl">
							{question.definition}
						</h2>

						{question.partOfSpeech && (
							<p className="mt-2 text-sm italic text-muted">({question.partOfSpeech})</p>
						)}

						{question.example && (
							<p className="mt-3 text-sm italic text-muted-foreground">
								&ldquo;{question.example.replace(new RegExp(question.term, 'gi'), '_____')}&rdquo;
							</p>
						)}
					</div>

					{/* ── Letter inputs — fully responsive ── */}
					<div className="mt-8">
						{/* Scrollable wrapper for very long words on mobile */}
						<div className="flex justify-center overflow-x-auto pb-2">
							<div className={`flex flex-nowrap ${letterSize.gap}`}>
								{letters.map((letter, idx) => {
									const correctChar = question.term[idx]?.toUpperCase() ?? '';
									const isLetterCorrect = revealed && letter === correctChar;
									const isLetterWrong = revealed && letter !== correctChar;
									const isHinted = letter === correctChar && !revealed;

									return (
										<input
											key={idx}
											ref={(el) => { inputRefs.current[idx] = el; }}
											type="text"
											inputMode="text"
											autoCapitalize="characters"
											maxLength={1}
											value={revealed && !isCorrect ? correctChar : letter}
											onChange={(e) => handleLetterChange(idx, e.target.value)}
											onKeyDown={(e) => handleKeyDown(idx, e)}
											readOnly={revealed}
											className={`${letterSize.box} shrink-0 rounded-lg border-2 text-center font-mono font-black uppercase transition-all duration-200 focus:outline-none ${
												isLetterCorrect
													? 'border-success bg-success-subtle text-success'
													: isLetterWrong
														? 'border-error bg-error-subtle text-error'
														: isHinted
															? 'border-warning bg-warning-subtle text-warning'
															: letter
																? 'border-indigo bg-indigo-subtle text-foreground'
																: 'border-border bg-surface text-foreground focus:border-indigo focus:bg-indigo-subtle/50'
											}`}
											style={{
												animation: revealed
													? `letterReveal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.04}s both`
													: `letterBoxIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.03}s both`,
											}}
										/>
									);
								})}
							</div>
						</div>

						{/* Word length indicator for mobile */}
						<p className="mt-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted/50">
							{wordLen} ký tự
						</p>
					</div>

					{/* Actions */}
					{!revealed ? (
						<div className="mt-8 flex items-center justify-center gap-3">
							<button
								onClick={handleHint}
								className="inline-flex items-center gap-1.5 rounded-full border-2 border-warning/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-warning transition-all hover:border-warning hover:bg-warning-subtle active:scale-95"
							>
								<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
								</svg>
								Gợi ý {hintCount > 0 ? `(${hintCount})` : ''}
							</button>
							<button
								onClick={handleCheck}
								disabled={letters.some((l) => !l)}
								className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-5 py-2 text-xs font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
							>
								Kiểm tra
							</button>
						</div>
					) : (
						<div
							className="mt-8"
							style={{ animation: 'fadeUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both' }}
						>
							{/* Result */}
							<div className={`mx-auto max-w-md rounded-xl border-2 p-4 text-center ${
								isCorrect
									? 'border-success/40 bg-success-subtle'
									: 'border-error/40 bg-error-subtle'
							}`}>
								<div className="flex items-center justify-center gap-2">
									{isCorrect ? (
										<>
											<span className="text-lg">✓</span>
											<span className="text-sm font-bold text-success">Chính xác!</span>
										</>
									) : (
										<>
											<span className="text-lg">✗</span>
											<span className="text-sm font-bold text-error">
												Đáp án: <span className="font-black">{question.term}</span>
											</span>
										</>
									)}
								</div>
								<button
										onClick={() => speak(question.term)}
									className="mt-2 inline-flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
								>
									<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-3.14a.75.75 0 011.28.53v12.72a.75.75 0 01-1.28.53l-4.72-3.14H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
									</svg>
									Nghe phát âm
								</button>
							</div>

							<div className="mt-6 flex items-center justify-center">
								<button
									onClick={handleNext}
									className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground active:scale-95"
								>
									{qIndex + 1 >= total ? 'Xem kết quả' : 'Tiếp theo →'}
								</button>
							</div>
						</div>
					)}

					<p className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest text-muted/40">
						Enter để kiểm tra · ← → di chuyển · Backspace xóa
					</p>
				</div>
			)}

			{/* Animations */}
			<style>{`
				@keyframes slideIn {
					0% { transform: translateX(30px); opacity: 0; }
					100% { transform: translateX(0); opacity: 1; }
				}
				@keyframes letterBoxIn {
					0% { transform: scale(0.7) translateY(8px); opacity: 0; }
					100% { transform: scale(1) translateY(0); opacity: 1; }
				}
				@keyframes letterReveal {
					0% { transform: scale(1.2) rotateX(20deg); }
					50% { transform: scale(0.95) rotateX(-5deg); }
					100% { transform: scale(1) rotateX(0); }
				}
				@keyframes fadeUp {
					0% { transform: translateY(16px); opacity: 0; }
					100% { transform: translateY(0); opacity: 1; }
				}
			`}</style>
		</main>
	);
}

/* ── Completion Screen ── */
function CompletionScreen({
	correct,
	wrong,
	total,
	id,
	containerRef,
	onRestart,
}: {
	correct: number;
	wrong: number;
	total: number;
	id: string;
	containerRef: React.RefObject<HTMLDivElement | null>;
	onRestart: () => void;
}) {
	const [show, setShow] = useState(false);
	const firedRef = useRef(false);
	const score = total > 0 ? Math.round((correct / total) * 100) : 0;

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

	const resultIcon = score >= 90 ? (
		<svg className="h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="fb-trophy" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffcc00" /><stop offset="100%" stopColor="#ff8800" /></linearGradient></defs><path d="M6 2h12v4a6 6 0 01-12 0V2z" fill="url(#fb-trophy)" /><path d="M6 4H3a1 1 0 00-1 1v1a4 4 0 004 4" stroke="#ffcc00" strokeWidth="1.5" /><path d="M18 4h3a1 1 0 011 1v1a4 4 0 01-4 4" stroke="#ffcc00" strokeWidth="1.5" /><rect x="9" y="12" width="6" height="3" rx="1" fill="url(#fb-trophy)" opacity="0.6" /><rect x="7" y="15" width="10" height="2" rx="1" fill="url(#fb-trophy)" opacity="0.8" /></svg>
	) : score >= 70 ? (
		<svg className="h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="fb-party" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#ff5500" /><stop offset="50%" stopColor="#ffcc00" /><stop offset="100%" stopColor="#4a8c5c" /></linearGradient></defs><path d="M12 2l2.5 6.5L21 12l-6.5 2.5L12 22l-2.5-7.5L3 12l6.5-3.5L12 2z" fill="url(#fb-party)" /><circle cx="12" cy="12" r="3" fill="#fff" opacity="0.4" /></svg>
	) : score >= 50 ? (
		<svg className="h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#4a8c5c" opacity="0.2" stroke="#4a8c5c" strokeWidth="1.5" /><path d="M8 12.5l2.5 3L16 9" stroke="#4a8c5c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
	) : (
		<svg className="h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="fb-flame" x1=".5" y1="1" x2=".5" y2="0"><stop offset="0%" stopColor="var(--accent)" /><stop offset="100%" stopColor="var(--warning)" /></linearGradient></defs><path d="M12 2C9 7 4 11 4 16c0 5 3.5 7 8 7s8-2 8-7c0-6-5-10-8-15z" fill="url(#fb-flame)" opacity="0.7" /><path d="M12 10c-2 3-4 5-4 8 0 2.5 1.8 4 4 4s4-1.5 4-4c0-3-2-5-4-8z" fill="#fff" opacity="0.2" /></svg>
	);
	const message = score >= 90 ? 'Xuất sắc!' : score >= 70 ? 'Tuyệt vời!' : score >= 50 ? 'Khá tốt!' : 'Cần luyện thêm!';

	const practiceLinks = [
		{ href: `/vocabulary/${id}/flashcards`, label: 'Flashcards', color: 'text-accent' },
		{ href: `/vocabulary/${id}/mcq`, label: 'Trắc nghiệm', color: 'text-success' },
		{ href: `/vocabulary/${id}/matching`, label: 'Nối từ', color: 'text-purple' },
	];

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
						style={{ animation: show ? 'celebrateBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both' : undefined }}
					>
						{resultIcon}
					</div>
					<h1 className="mt-6 text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">{message}</h1>

					{/* Score ring */}
					<div className="mx-auto mt-6 flex items-center justify-center">
						<div className="relative flex h-24 w-24 items-center justify-center">
							<svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
								<circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-surface-hover" />
								<circle
									cx="50" cy="50" r="42" fill="none" strokeWidth="6"
									stroke={score >= 70 ? '#4a8c5c' : score >= 50 ? '#c48a1a' : '#c44b28'}
									strokeLinecap="round"
									strokeDasharray={`${score * 2.64} 264`}
									style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s' }}
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
					</div>

					{/* Actions */}
					<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
						<button
							onClick={() => { firedRef.current = false; onRestart(); }}
							className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground active:scale-95"
						>
							Làm lại
						</button>
						<Link
							href={`/vocabulary/${id}`}
							className="inline-flex items-center gap-2 rounded-full border-2 border-border px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-foreground transition-all hover:border-foreground active:scale-95"
						>
							Quay lại bộ từ
						</Link>
					</div>

					{/* Try other modes */}
					<div className="mt-6">
						<p className="text-[10px] font-bold uppercase tracking-widest text-muted">Thử chế độ khác</p>
						<div className="mt-2 flex flex-wrap items-center justify-center gap-2">
							{practiceLinks.map((link) => (
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
