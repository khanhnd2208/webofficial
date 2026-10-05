'use client';

import { Icon } from '@/components/ui/Icon';
import { GRAPHIC_COLORS } from '@/config/graphicColors';
import Link from 'next/link';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
	useVocabSetUrl,
	useVocabScoreUrl,
	useVocabChrome,
	VocabPracticeFrame,
	VocabBackLink,
} from '@/components/vocab/practice/VocabApiProvider';

type Word = { id: string; term: string; definition: string; partOfSpeech: string; example: string };
type WordRecord = { startTime: number; endTime: number; penaltyMs: number; correct: boolean };

const WORD_TIME = 30; // seconds per word

async function submitScore(scoreUrl: string, records: WordRecord[]) {
	try {
		const res = await fetch(scoreUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ mode: 'FILL_BLANK', words: records }),
		});
		const json = await res.json();
		return json.ok ? json.data : null;
	} catch {
		return null;
	}
}

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
	} catch {
		/* silent */
	}
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
	} catch {
		/* silent */
	}
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
	} catch {
		/* silent */
	}
}

function burstConfetti(container: HTMLElement) {
	const colors = [
		GRAPHIC_COLORS['c44b28'],
		GRAPHIC_COLORS['e8714f'],
		GRAPHIC_COLORS['4a8c5c'],
		GRAPHIC_COLORS['6aad7c'],
		GRAPHIC_COLORS['c48a1a'],
		GRAPHIC_COLORS['d4a03a'],
		GRAPHIC_COLORS['5b7fb5'],
		GRAPHIC_COLORS['8b6fb0'],
		GRAPHIC_COLORS['f0ece4'],
		GRAPHIC_COLORS['1a1a1a'],
	];
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
		const angle = Math.random() * 360 * (Math.PI / 180);
		const velocity = Math.random() * 400 + 200;
		const vx = Math.cos(angle) * velocity;
		const vy = Math.sin(angle) * velocity - 200;
		const rotation = Math.random() * 720 - 360;
		el.animate(
			[
				{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
				{ transform: `translate(${vx}px, ${vy + 600}px) rotate(${rotation}deg)`, opacity: 0 },
			],
			{
				duration: 1200 + Math.random() * 600,
				easing: 'cubic-bezier(.25,.46,.45,.94)',
				fill: 'forwards',
			},
		).onfinish = () => el.remove();
	}
}

export default function FillBlankPage({ params }: { params: Promise<{ id: string }> }) {
	const vocabUrl = useVocabSetUrl();
	const [id, setId] = useState('');
	const [allWords, setAllWords] = useState<Word[] | null>(null);
	const [error, setError] = useState('');

	const [questions, setQuestions] = useState<Word[]>([]);
	const [qIndex, setQIndex] = useState(0);
	const [letters, setLetters] = useState<string[]>([]);
	const [revealed, setRevealed] = useState(false);
	const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
	const [hintUsed, setHintUsed] = useState(false); // max 1 per word
	const [correct, setCorrect] = useState(0);
	const [wrong, setWrong] = useState(0);
	const [timeLeft, setTimeLeft] = useState(WORD_TIME);
	const [finished, setFinished] = useState(false);
	const [animKey, setAnimKey] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	// Anti-cheat timestamps
	const wordStartTimeRef = useRef<number>(Date.now());
	const wordPenaltyMsRef = useRef<number>(0); // accumulated penalty for current word
	const wordRecordsRef = useRef<WordRecord[]>([]);

	useEffect(() => {
		params.then(async ({ id: paramId }) => {
			setId(paramId);
			const res = await fetch(vocabUrl(paramId));
			const json = await res.json();
			if (!json.ok) {
				setError(json.error);
				return;
			}
			const words = (json.data.set?.words ?? json.data.words ?? []) as Word[];
			setAllWords(words);
			const q = shuffle(words);
			setQuestions(q);
			resetForQuestion(q[0]);
		});
	}, [params, vocabUrl]);

	function resetForQuestion(word: Word) {
		const len = word.term.length;
		setLetters(Array(len).fill(''));
		setRevealed(false);
		setIsCorrect(null);
		setHintUsed(false);
		setAnimKey((k) => k + 1);
		// Reset timer refs
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
		wordStartTimeRef.current = Date.now();
		wordPenaltyMsRef.current = 0;
		setTimeLeft(WORD_TIME);
		// Start cosmetic countdown
		timerRef.current = setInterval(() => {
			const elapsed = (Date.now() - wordStartTimeRef.current + wordPenaltyMsRef.current) / 1000;
			setTimeLeft(Math.max(0, Math.ceil(WORD_TIME - elapsed)));
		}, 200);
		setTimeout(() => inputRefs.current[0]?.focus(), 100);
	}

	// Cleanup timer on unmount
	useEffect(
		() => () => {
			if (timerRef.current) clearInterval(timerRef.current);
		},
		[],
	);

	const question = questions[qIndex] ?? null;
	const total = questions.length;
	const wordLen = question?.term.length ?? 0;

	/* ── Dynamic sizing for letter inputs ── */
	const letterSize = useMemo(() => {
		// Responsive: compute size based on word length
		// On mobile (320px viewport), we have about 280px usable width
		// On desktop, we have about 600px usable width
		if (wordLen <= 6)
			return { box: 'h-12 w-10 sm:h-14 sm:w-12 text-lg sm:text-xl', gap: 'gap-1.5 sm:gap-2.5' };
		if (wordLen <= 8)
			return { box: 'h-11 w-9 sm:h-13 sm:w-11 text-base sm:text-lg', gap: 'gap-1 sm:gap-2' };
		if (wordLen <= 10)
			return { box: 'h-10 w-8 sm:h-12 sm:w-10 text-sm sm:text-base', gap: 'gap-1 sm:gap-1.5' };
		if (wordLen <= 13)
			return { box: 'h-9 w-7 sm:h-11 sm:w-9 text-xs sm:text-sm', gap: 'gap-0.5 sm:gap-1' };
		return { box: 'h-8 w-6 sm:h-10 sm:w-8 text-xs sm:text-xs', gap: 'gap-0.5 sm:gap-1' };
	}, [wordLen]);

	const handleLetterChange = useCallback(
		(idx: number, value: string) => {
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
		},
		[revealed, wordLen, letters],
	);

	const handleCheck = useCallback(() => {
		if (!question || revealed) return;
		const answer = letters.join('');
		const expected = question.term.toUpperCase();
		if (answer.length < expected.length) return;

		const wasCorrect = answer === expected;

		if (wasCorrect) {
			const endTime = Date.now();
			wordRecordsRef.current.push({
				startTime: wordStartTimeRef.current,
				endTime,
				penaltyMs: wordPenaltyMsRef.current,
				correct: true,
			});
			setIsCorrect(true);
			setCorrect((v) => v + 1);
			playCorrect();
			speak(question.term);
			setRevealed(true);
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		} else {
			// Wrong answer: -10s penalty
			wordPenaltyMsRef.current += 10_000;
			const effectiveElapsed =
				(Date.now() - wordStartTimeRef.current + wordPenaltyMsRef.current) / 1000;
			playWrong();
			if (effectiveElapsed >= WORD_TIME) {
				// Time exhausted → reveal answer
				const endTime = Date.now();
				wordRecordsRef.current.push({
					startTime: wordStartTimeRef.current,
					endTime,
					penaltyMs: wordPenaltyMsRef.current,
					correct: false,
				});
				setIsCorrect(false);
				setWrong((v) => v + 1);
				setRevealed(true);
				if (timerRef.current) {
					clearInterval(timerRef.current);
					timerRef.current = null;
				}
			}
			// If still time left, just play wrong and keep going (don't reveal)
		}
	}, [question, letters, revealed]);

	const handleKeyDown = useCallback(
		(idx: number, e: React.KeyboardEvent) => {
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
		},
		[revealed, letters, wordLen, handleCheck],
	);

	const handleHint = useCallback(() => {
		if (!question || revealed || hintUsed) return;
		setHintUsed(true);
		// Penalty: -10s
		wordPenaltyMsRef.current += 10_000;

		const word = question.term.toUpperCase();
		setLetters((prev) => {
			const next = [...prev];
			// If word.length <= 3: show only first letter
			// If word.length > 3: show first AND last letter
			next[0] = word[0];
			if (word.length > 3) next[word.length - 1] = word[word.length - 1];
			return next;
		});
		// Focus first unfilled input
		setTimeout(() => {
			const firstEmpty = inputRefs.current.findIndex((el, i) => el && !letters[i]);
			if (firstEmpty >= 0) inputRefs.current[firstEmpty]?.focus();
			else inputRefs.current[1]?.focus();
		}, 50);
	}, [question, revealed, hintUsed, letters]);

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

	// Auto-timeout: when effective time reaches 0, reveal answer (score=0)
	useEffect(() => {
		if (revealed || !question || finished || timeLeft > 0) return;
		const endTime = Date.now();
		wordRecordsRef.current.push({
			startTime: wordStartTimeRef.current,
			endTime,
			penaltyMs: wordPenaltyMsRef.current,
			correct: false,
		});
		setIsCorrect(false);
		setWrong((v) => v + 1);
		setRevealed(true);
		playWrong();
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [timeLeft, revealed, finished]);

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
						total={total}
						id={id}
						wordRecords={wordRecordsRef.current}
						containerRef={containerRef}
						onRestart={() => {
							wordRecordsRef.current = [];
							const q = shuffle(allWords);
							setQuestions(q);
							setQIndex(0);
							setCorrect(0);
							setWrong(0);
							setFinished(false);
							resetForQuestion(q[0]);
						}}
					/>
				</div>
			</VocabPracticeFrame>
		);
	}

	const progress = total > 0 ? ((qIndex + 1) / total) * 100 : 0;

	return (
		<VocabPracticeFrame className="min-h-screen select-none">
			<div ref={containerRef}>
				{/* Top bar */}
				<div className="border-b border-border">
					<div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
						<VocabBackLink className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors" />
						<div className="flex items-center gap-3 text-xs text-muted">
							<span>
								{qIndex + 1}/{total}
							</span>
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
								<span className="inline-block rounded-full bg-indigo-subtle px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo">
									Điền từ vựng
								</span>
								{!revealed &&
									(() => {
										const frac = timeLeft / WORD_TIME;
										const color =
											frac > 0.5
												? GRAPHIC_COLORS['5b7fb5']
												: frac > 0.25
													? GRAPHIC_COLORS['c48a1a']
													: GRAPHIC_COLORS['c44b28'];
										return (
											<div className="flex items-center gap-1.5">
												<Icon name="schedule" className="h-8 w-8 -rotate-90" />
												<span
													className="w-5 text-center text-sm font-black tabular-nums"
													style={{ color }}
												>
													{timeLeft}
												</span>
											</div>
										);
									})()}
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
												ref={(el) => {
													inputRefs.current[idx] = el;
												}}
												type="text"
												inputMode="text"
												autoCapitalize="characters"
												maxLength={1}
												value={revealed && !isCorrect ? correctChar : letter}
												onChange={(e) => handleLetterChange(idx, e.target.value)}
												onKeyDown={(e) => handleKeyDown(idx, e)}
												readOnly={revealed}
												className={`${letterSize.box} shrink-0 rounded-lg border-2 text-center font-mono font-black uppercase transition-all duration-250 focus:outline-none ${
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
							<p className="mt-2 text-center text-xs font-bold uppercase tracking-widest text-muted/50">
								{wordLen} ký tự
							</p>
						</div>

						{/* Actions */}
						{!revealed ? (
							<div className="mt-8 flex items-center justify-center gap-3">
								<button
									onClick={handleHint}
									disabled={hintUsed}
									className={`inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
										hintUsed
											? 'border-warning/20 text-warning/40 opacity-40 cursor-not-allowed'
											: 'border-warning/40 text-warning hover:border-warning hover:bg-warning-subtle'
									}`}
								>
									<Icon name="help" className="h-3.5 w-3.5" />
									{hintUsed ? 'Đã dùng gợi ý' : 'Gợi ý (−10s)'}
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
								<div
									className={`mx-auto max-w-md rounded-xl border-2 p-4 text-center ${
										isCorrect
											? 'border-success/40 bg-success-subtle'
											: 'border-error/40 bg-error-subtle'
									}`}
								>
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
										<Icon name="volume_up" className="h-3.5 w-3.5" />
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

						<p className="mt-6 text-center text-xs font-bold uppercase tracking-widest text-muted/40">
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
			</div>
		</VocabPracticeFrame>
	);
}

/* ── Completion Screen ── */
function CompletionScreen({
	correct,
	wrong,
	total,
	id,
	wordRecords,
	containerRef,
	onRestart,
}: {
	correct: number;
	wrong: number;
	total: number;
	id: string;
	wordRecords: WordRecord[];
	containerRef: React.RefObject<HTMLDivElement | null>;
	onRestart: () => void;
}) {
	const chrome = useVocabChrome();
	const scoreUrlFor = useVocabScoreUrl();
	const [show, setShow] = useState(false);
	const firedRef = useRef(false);
	const [avgScore, setAvgScore] = useState<number | null>(null);
	const [scoreResult, setScoreResult] = useState<{
		isNewBest: boolean;
		previousBest: number;
	} | null>(null);
	const scoreSubmittedRef = useRef(false);
	const score = total > 0 ? Math.round((correct / total) * 100) : 0;

	useEffect(() => {
		if (scoreSubmittedRef.current || wordRecords.length === 0) return;
		scoreSubmittedRef.current = true;
		submitScore(scoreUrlFor(id), wordRecords).then((data) => {
			if (data) {
				setAvgScore(Math.round(data.score));
				setScoreResult({
					isNewBest: data.isNewBest,
					previousBest: Math.round(data.previousBest ?? 0),
				});
			}
		});
	}, [id, scoreUrlFor, wordRecords]);

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

	const resultIcon = (
		<Icon
			name={
				score >= 90
					? 'trophy'
					: score >= 70
						? 'verified'
						: score >= 50
							? 'check_circle'
							: 'track_changes'
			}
			className="h-[1em] w-[1em] text-accent"
		/>
	);
	const message =
		score >= 90
			? 'Xuất sắc!'
			: score >= 70
				? 'Tuyệt vời!'
				: score >= 50
					? 'Khá tốt!'
					: 'Cần luyện thêm!';

	const practiceLinks = [
		{ href: chrome.modeHref(id, 'flashcards'), label: 'Flashcards', color: 'text-accent' },
		{ href: chrome.modeHref(id, 'mcq'), label: 'Trắc nghiệm', color: 'text-success' },
		{ href: chrome.modeHref(id, 'matching'), label: 'Nối từ', color: 'text-purple' },
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
						style={{
							animation: show
								? 'celebrateBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both'
								: undefined,
						}}
					>
						{resultIcon}
					</div>
					<h1 className="mt-6 text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
						{message}
					</h1>

					{/* Score ring */}
					<div className="mx-auto mt-6 flex items-center justify-center">
						<div className="relative flex h-24 w-24 items-center justify-center">
							<svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
								<circle
									cx="50"
									cy="50"
									r="42"
									fill="none"
									stroke="currentColor"
									strokeWidth="6"
									className="text-surface-hover"
								/>
								<circle
									cx="50"
									cy="50"
									r="42"
									fill="none"
									strokeWidth="6"
									stroke={
										score >= 70
											? GRAPHIC_COLORS['4a8c5c']
											: score >= 50
												? GRAPHIC_COLORS['c48a1a']
												: GRAPHIC_COLORS['c44b28']
									}
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
							<p className="text-xs font-bold uppercase tracking-widest text-muted">Đúng</p>
						</div>
						<div className="h-8 w-px bg-border" />
						<div className="text-center">
							<p className="text-2xl font-black text-error">{wrong}</p>
							<p className="text-xs font-bold uppercase tracking-widest text-muted">Sai</p>
						</div>
					</div>

					{/* Score from API */}
					{avgScore !== null && (
						<div
							className="mx-auto mt-4 max-w-xs rounded-xl border border-border bg-surface px-4 py-3 text-center"
							style={{ animation: 'fadeUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s both' }}
						>
							<p className="text-xs font-bold uppercase tracking-widest text-muted">
								Điểm trung bình
							</p>
							<p className="mt-1 text-3xl font-black tabular-nums text-foreground">
								{avgScore.toLocaleString()}
							</p>
							{scoreResult && (
								<p
									className={`mt-1 text-xs font-bold ${scoreResult.isNewBest ? 'text-success' : 'text-muted'}`}
								>
									{scoreResult.isNewBest
										? `🏆 Kỷ lục mới! (Trước: ${scoreResult.previousBest.toLocaleString()})`
										: `Kỷ lục: ${scoreResult.previousBest.toLocaleString()}`}
								</p>
							)}
						</div>
					)}

					{/* Actions */}
					<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
						<button
							onClick={() => {
								firedRef.current = false;
								onRestart();
							}}
							className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground active:scale-95"
						>
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
						<p className="text-xs font-bold uppercase tracking-widest text-muted">
							Thử chế độ khác
						</p>
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
