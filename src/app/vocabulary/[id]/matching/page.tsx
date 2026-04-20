'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useRef } from 'react';

type Word = { id: string; term: string; definition: string; partOfSpeech: string; example: string };

type Card = { id: string; text: string; wordId: string; type: 'word' | 'definition' };

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function playMatch() {
	try {
		const ctx = new AudioContext();
		const notes = [523.25, 783.99]; // C5, G5
		notes.forEach((freq, i) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
			gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.08 + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25);
			osc.connect(gain).connect(ctx.destination);
			osc.start(ctx.currentTime + i * 0.08);
			osc.stop(ctx.currentTime + i * 0.08 + 0.25);
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
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
		osc.connect(gain).connect(ctx.destination);
		osc.start();
		osc.stop(ctx.currentTime + 0.15);
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

/* ── Match sparkle particles ── */
function sparkleMatch(el1: HTMLElement, el2: HTMLElement) {
	const rects = [el1.getBoundingClientRect(), el2.getBoundingClientRect()];
	const colors = ['#4a8c5c', '#6aad7c', '#a7d9b3', '#d4f0de'];

	rects.forEach((rect) => {
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;

		for (let i = 0; i < 8; i++) {
			const el = document.createElement('div');
			const size = Math.random() * 6 + 3;
			el.style.cssText = `
				position:fixed;z-index:9999;pointer-events:none;
				width:${size}px;height:${size}px;
				background:${colors[Math.floor(Math.random() * colors.length)]};
				border-radius:50%;
				left:${cx}px;top:${cy}px;opacity:1;
			`;
			document.body.appendChild(el);

			const angle = (Math.random() * 360) * (Math.PI / 180);
			const v = Math.random() * 80 + 40;
			el.animate(
				[
					{ transform: 'translate(0,0) scale(1)', opacity: 1 },
					{ transform: `translate(${Math.cos(angle) * v}px, ${Math.sin(angle) * v}px) scale(0)`, opacity: 0 },
				],
				{ duration: 450, easing: 'ease-out', fill: 'forwards' }
			).onfinish = () => el.remove();
		}
	});
}

export default function MatchingPage({ params }: { params: Promise<{ id: string }> }) {
	const [id, setId] = useState('');
	const [allWords, setAllWords] = useState<Word[] | null>(null);
	const [error, setError] = useState('');

	const [cards, setCards] = useState<Card[]>([]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [matched, setMatched] = useState<Set<string>>(new Set());
	const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
	const [recentMatch, setRecentMatch] = useState<Set<string>>(new Set());
	const [moves, setMoves] = useState(0);
	const [startTime, setStartTime] = useState(0);
	const [elapsed, setElapsed] = useState(0);
	const [gameReady, setGameReady] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

	const startGame = useCallback((words: Word[]) => {
		const subset = shuffle(words).slice(0, 8);
		const wordCards: Card[] = subset.map((t, i) => ({
			id: `w-${i}`,
			text: t.term,
			wordId: t.id,
			type: 'word',
		}));
		const defCards: Card[] = subset.map((t, i) => ({
			id: `d-${i}`,
			text: t.definition,
			wordId: t.id,
			type: 'definition',
		}));
		setCards(shuffle([...wordCards, ...defCards]));
		setSelectedId(null);
		setMatched(new Set());
		setRecentMatch(new Set());
		setWrongPair(null);
		setMoves(0);
		setStartTime(Date.now());
		setElapsed(0);
		setGameReady(true);
	}, []);

	useEffect(() => {
		params.then(async ({ id: paramId }) => {
			setId(paramId);
			const res = await fetch(`/api/vocab-sets/${paramId}`);
			const json = await res.json();
			if (!json.ok) { setError(json.error); return; }
			const t = json.data.words as Word[];
			setAllWords(t);
			startGame(t);
		});
	}, [params, startGame]);

	// Timer
	useEffect(() => {
		if (startTime === 0 || (cards.length > 0 && matched.size === cards.length)) return;
		const interval = setInterval(() => {
			setElapsed(Math.floor((Date.now() - startTime) / 1000));
		}, 1000);
		return () => clearInterval(interval);
	}, [startTime, matched.size, cards.length]);

	const finished = cards.length > 0 && matched.size === cards.length;

	const handleCardClick = useCallback((card: Card) => {
		if (matched.has(card.id) || wrongPair) return;

		if (!selectedId) {
			setSelectedId(card.id);
			return;
		}

		if (selectedId === card.id) {
			setSelectedId(null);
			return;
		}

		const first = cards.find((c) => c.id === selectedId);
		if (!first) { setSelectedId(null); return; }

		setMoves((v) => v + 1);

		if (first.wordId === card.wordId && first.type !== card.type) {
			// Match!
			playMatch();

			// Sparkle effect
			const el1 = cardRefs.current.get(first.id);
			const el2 = cardRefs.current.get(card.id);
			if (el1 && el2) sparkleMatch(el1, el2);

			// Animate recent match
			setRecentMatch(new Set([first.id, card.id]));
			setTimeout(() => setRecentMatch(new Set()), 600);

			setMatched((prev) => {
				const next = new Set(prev);
				next.add(first.id);
				next.add(card.id);
				return next;
			});
			setSelectedId(null);
		} else {
			// Wrong
			playWrong();
			setWrongPair([first.id, card.id]);
			setTimeout(() => {
				setWrongPair(null);
				setSelectedId(null);
			}, 600);
		}
	}, [selectedId, cards, matched, wrongPair]);

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
					moves={moves}
					elapsed={elapsed}
					pairsCount={cards.length / 2}
					id={id}
					containerRef={containerRef}
					onRestart={() => {
						startGame(allWords);
					}}
				/>
			</main>
		);
	}

	const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
	const matchedPairs = matched.size / 2;
	const totalPairs = cards.length / 2;
	const progress = totalPairs > 0 ? (matchedPairs / totalPairs) * 100 : 0;

	return (
		<main ref={containerRef} className="min-h-screen select-none">
			{/* Top bar */}
			<div className="border-b border-border">
				<div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
				<Link href="/vocabulary" className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors">
					← Từ vựng
				</Link>
				<div className="flex items-center gap-4 text-xs text-muted">
						<span className="flex items-center gap-1.5">
							<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
							</svg>
							{moves}
						</span>
						<span className="flex items-center gap-1.5">
							<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							{formatTime(elapsed)}
						</span>
						<span className="font-bold text-success">{matchedPairs}/{totalPairs}</span>
					</div>
				</div>
				{/* Progress bar */}
				<div className="h-1 bg-surface-hover overflow-hidden">
					<div
						className="h-full bg-success"
						style={{
							width: `${progress}%`,
							transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
							boxShadow: '0 0 12px rgba(74, 140, 92, 0.4)',
						}}
					/>
				</div>
			</div>

			<div className="mx-auto max-w-4xl px-6 py-8 sm:py-12">
				{/* Instruction */}
				<div className="mb-6 flex items-center justify-between">
					<span className="rounded-full bg-surface-hover px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted">
						Nối từ với nghĩa
					</span>
					{matched.size > 0 && matched.size < cards.length && (
						<span className="text-xs text-muted">
							Còn <span className="font-bold text-foreground">{totalPairs - matchedPairs}</span> cặp
						</span>
					)}
				</div>

				{/* Cards grid */}
				<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 sm:gap-3">
					{cards.map((card, cardIndex) => {
						const isMatched = matched.has(card.id);
						const isSelected = selectedId === card.id;
						const isWrong = wrongPair?.includes(card.id);
						const isRecentlyMatched = recentMatch.has(card.id);

						return (
							<button
								key={card.id}
								ref={(el) => { if (el) cardRefs.current.set(card.id, el); }}
								onClick={() => handleCardClick(card)}
								disabled={isMatched}
								className={`group relative rounded-xl border-2 p-3 text-left transition-all duration-200 sm:p-4 ${
									isMatched
										? 'border-success/30 bg-success-subtle cursor-default'
										: isWrong
											? 'border-error bg-error-subtle cursor-default'
											: isSelected
												? 'border-accent bg-accent-subtle cursor-pointer shadow-lg'
												: 'border-border bg-surface hover:border-border-hover hover:bg-surface-hover hover:shadow-md cursor-pointer'
								} ${!isMatched && !isWrong ? 'active:scale-[0.97]' : ''}`}
								style={{
									animation: gameReady
										? isRecentlyMatched
											? 'matchPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
											: isWrong
												? 'wrongShake 0.5s ease'
												: isMatched
													? 'matchFadeOut 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards'
													: `cardAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${cardIndex * 0.03}s both`
										: undefined,
									opacity: isMatched && !isRecentlyMatched ? 0.5 : 1,
								}}
							>
								{/* Type indicator dot */}
								<div className="mb-2 flex items-center gap-1.5">
									<div
										className={`h-2 w-2 rounded-full ${
											card.type === 'word' ? 'bg-accent' : 'bg-blue-400'
										}`}
									/>
									<span className={`text-[9px] font-bold uppercase tracking-widest ${
										card.type === 'word' ? 'text-accent' : 'text-blue-400'
									}`}>
										{card.type === 'word' ? 'Từ' : 'Nghĩa'}
									</span>
								</div>

								{/* Card text */}
								<span className={`block text-sm font-medium leading-relaxed transition-colors ${
									isMatched ? 'text-success' : 'text-foreground'
								}`}>
									{card.text}
								</span>

								{/* Matched checkmark */}
								{isMatched && (
									<div
										className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-success text-white shadow-md"
										style={{ animation: 'iconPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
									>
										<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
										</svg>
									</div>
								)}

								{/* Selected ring effect */}
								{isSelected && (
									<div
										className="absolute inset-0 rounded-xl border-2 border-accent"
										style={{ animation: 'selectPulse 1.5s ease-in-out infinite' }}
									/>
								)}
							</button>
						);
					})}
				</div>

				<p className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest text-muted/40">
					Chọn 1 thẻ từ và 1 thẻ nghĩa tương ứng để ghép cặp
				</p>
			</div>

			{/* Animations */}
			<style>{`
				@keyframes cardAppear {
					0% { transform: translateY(20px) scale(0.9); opacity: 0; }
					100% { transform: translateY(0) scale(1); opacity: 1; }
				}
				@keyframes matchPop {
					0% { transform: scale(1); }
					30% { transform: scale(1.08); }
					60% { transform: scale(0.97); }
					100% { transform: scale(1); }
				}
				@keyframes matchFadeOut {
					0% { transform: scale(1.05); opacity: 1; }
					100% { transform: scale(1); opacity: 0.5; }
				}
				@keyframes wrongShake {
					0%, 100% { transform: translateX(0); }
					15% { transform: translateX(-5px); }
					30% { transform: translateX(5px); }
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
				@keyframes selectPulse {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.4; }
				}
			`}</style>
		</main>
	);
}

/* ── Completion Screen ── */
function CompletionScreen({
	moves,
	elapsed,
	pairsCount,
	id,
	containerRef,
	onRestart,
}: {
	moves: number;
	elapsed: number;
	pairsCount: number;
	id: string;
	containerRef: React.RefObject<HTMLDivElement | null>;
	onRestart: () => void;
}) {
	const [show, setShow] = useState(false);
	const firedRef = useRef(false);

	// Rating based on moves efficiency
	const efficiency = pairsCount > 0 ? pairsCount / moves : 0;
	const stars = efficiency >= 0.8 ? 3 : efficiency >= 0.5 ? 2 : 1;

	useEffect(() => {
		const t = setTimeout(() => setShow(true), 100);
		return () => clearTimeout(t);
	}, []);

	useEffect(() => {
		if (show && !firedRef.current && containerRef.current) {
			firedRef.current = true;
			playSuccess();
			burstConfetti(containerRef.current);
		}
	}, [show, containerRef]);

	const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

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
					{/* Stars */}
					<div className="flex items-center justify-center gap-2">
						{[1, 2, 3].map((s) => (
							<span
								key={s}
								className="text-4xl"
								style={{
									animation: show
										? `starPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.3 + s * 0.15}s both`
										: undefined,
									filter: s <= stars ? 'none' : 'grayscale(1) opacity(0.3)',
								}}
							>
								<svg className="h-10 w-10" viewBox="0 0 24 24" fill="none">
									<defs>
										<linearGradient id={`star-${s}`} x1="0.5" y1="0" x2="0.5" y2="1">
											<stop offset="0%" stopColor="#ffcc00" />
											<stop offset="100%" stopColor="#ff8800" />
										</linearGradient>
									</defs>
									<path d="M12 2l2.4 5.8 6.1.5-4.6 4 1.5 6L12 15.5 6.6 18.3l1.5-6-4.6-4 6.1-.5L12 2z" fill={`url(#star-${s})`} stroke="#ff9900" strokeWidth="0.5" strokeLinejoin="round" />
									<path d="M12 2l2.4 5.8 6.1.5-4.6 4 1.5 6L12 15.5" fill="#fff" opacity="0.15" />
								</svg>
							</span>
						))}
					</div>

					<h1 className="mt-6 text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
						{stars === 3 ? 'Hoàn hảo!' : stars === 2 ? 'Tuyệt vời!' : 'Hoàn thành!'}
					</h1>

					{/* Stats */}
					<div className="mx-auto mt-6 flex max-w-xs items-center justify-center gap-6">
						<div className="text-center">
							<p className="text-2xl font-black text-foreground">{moves}</p>
							<p className="text-[10px] font-bold uppercase tracking-widest text-muted">Lượt</p>
						</div>
						<div className="h-8 w-px bg-border" />
						<div className="text-center">
							<p className="text-2xl font-black text-foreground">{formatTime(elapsed)}</p>
							<p className="text-[10px] font-bold uppercase tracking-widest text-muted">Thời gian</p>
						</div>
						<div className="h-8 w-px bg-border" />
						<div className="text-center">
							<p className="text-2xl font-black text-success">{pairsCount}</p>
							<p className="text-[10px] font-bold uppercase tracking-widest text-muted">Cặp</p>
						</div>
					</div>

					<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
						<button
							onClick={() => { firedRef.current = false; onRestart(); }}
							className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground active:scale-95"
						>
							<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
							</svg>
							Chơi lại
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
							{[
								{ href: `/vocabulary/${id}/flashcards`, label: 'Flashcards', color: 'text-accent' },
								{ href: `/vocabulary/${id}/mcq`, label: 'Trắc nghiệm', color: 'text-success' },
								{ href: `/vocabulary/${id}/fill-blank`, label: 'Điền từ', color: 'text-indigo' },
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
				@keyframes starPop {
					0% { transform: scale(0) rotate(-30deg); opacity: 0; }
					60% { transform: scale(1.3) rotate(10deg); }
					100% { transform: scale(1) rotate(0); opacity: 1; }
				}
			`}</style>
		</div>
	);
}
