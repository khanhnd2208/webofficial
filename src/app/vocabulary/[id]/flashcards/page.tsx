'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useRef } from 'react';

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

function playSuccess() {
	try {
		const ctx = new AudioContext();
		const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
		notes.forEach((freq, i) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
			gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.08 + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25);
			osc.connect(gain).connect(ctx.destination);
			osc.start(ctx.currentTime + i * 0.08);
			osc.stop(ctx.currentTime + i * 0.08 + 0.25);
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

export default function FlashcardsPage({ params }: { params: Promise<{ id: string }> }) {
	const [id, setId] = useState('');
	const [allWords, setAllWords] = useState<Word[] | null>(null);
	const [error, setError] = useState('');

	const [remaining, setRemaining] = useState<Word[]>([]);
	const [mastered, setMastered] = useState<Word[]>([]);
	const [stillLearning, setStillLearning] = useState<Word[]>([]);
	const [index, setIndex] = useState(0);
	const [flipped, setFlipped] = useState(false);
	const [swipeState, setSwipeState] = useState<'idle' | 'swiping-left' | 'swiping-right' | 'exit-left' | 'exit-right'>('idle');
	const [dragX, setDragX] = useState(0);
	const [animKey, setAnimKey] = useState(0); // triggers entrance animation
	const containerRef = useRef<HTMLDivElement>(null);
	const cardRef = useRef<HTMLDivElement>(null);
	const startXRef = useRef(0);
	const isDraggingRef = useRef(false);

	useEffect(() => {
		params.then(async ({ id: paramId }) => {
			setId(paramId);
			const res = await fetch(`/api/vocab-sets/${paramId}`);
			const json = await res.json();
			if (!json.ok) { setError(json.error); return; }
			const words = json.data.words as Word[];
			setAllWords(words);
			setRemaining(shuffle(words));
		});
	}, [params]);

	const card = remaining[index] ?? null;
	const total = allWords?.length ?? 0;

	/* ── Card actions ── */
	const flip = useCallback(() => {
		setFlipped((v) => !v);
		if (!flipped && card) speak(card.term);
	}, [flipped, card]);

	const advanceCard = useCallback((dir: 'left' | 'right') => {
		if (!card) return;
		setSwipeState(dir === 'right' ? 'exit-right' : 'exit-left');

		setTimeout(() => {
			if (dir === 'right') {
				setMastered((prev) => [...prev, card]);
				setRemaining((prev) => prev.filter((_, i) => i !== index));
				setIndex((prev) => (prev >= remaining.length - 1 ? 0 : prev));
			} else {
				setStillLearning((prev) => [...prev, card]);
				setIndex((prev) => (prev + 1) % remaining.length);
			}
			setFlipped(false);
			setSwipeState('idle');
			setDragX(0);
			setAnimKey((k) => k + 1);
		}, 350);
	}, [card, index, remaining.length]);

	const markMastered = useCallback(() => advanceCard('right'), [advanceCard]);
	const markStillLearning = useCallback(() => advanceCard('left'), [advanceCard]);

	const undo = useCallback(() => {
		if (mastered.length === 0) return;
		const last = mastered[mastered.length - 1];
		setMastered((prev) => prev.slice(0, -1));
		setRemaining((prev) => [...prev, last]);
		setAnimKey((k) => k + 1);
	}, [mastered]);

	/* ── Touch / Mouse drag ── */
	const onPointerDown = useCallback((e: React.PointerEvent) => {
		if (swipeState !== 'idle') return;
		startXRef.current = e.clientX;
		isDraggingRef.current = true;
		setSwipeState('swiping-left');
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}, [swipeState]);

	const onPointerMove = useCallback((e: React.PointerEvent) => {
		if (!isDraggingRef.current) return;
		const dx = e.clientX - startXRef.current;
		setDragX(dx);
		setSwipeState(dx > 0 ? 'swiping-right' : 'swiping-left');
	}, []);

	const onPointerUp = useCallback(() => {
		if (!isDraggingRef.current) return;
		isDraggingRef.current = false;
		const threshold = 100;
		if (dragX > threshold) {
			advanceCard('right');
		} else if (dragX < -threshold) {
			advanceCard('left');
		} else {
			setSwipeState('idle');
			setDragX(0);
		}
	}, [dragX, advanceCard]);

	/* ── Keyboard ── */
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
			else if (e.key === 'ArrowRight' || e.key === 'l') markMastered();
			else if (e.key === 'ArrowLeft' || e.key === 'h') markStillLearning();
			else if ((e.metaKey || e.ctrlKey) && e.key === 'z') undo();
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [flip, markMastered, markStillLearning, undo]);

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

	/* ── Completion Screen ── */
	if (remaining.length === 0) {
		return (
			<main ref={containerRef} className="min-h-screen">
				<CompletionScreen
					total={total}
					id={id}
					containerRef={containerRef}
						onRestart={() => {
							setRemaining(shuffle(allWords));
							setMastered([]);
							setStillLearning([]);
							setIndex(0);
							setFlipped(false);
							setAnimKey(0);
						}}
				/>
			</main>
		);
	}

	const progress = total > 0 ? (mastered.length / total) * 100 : 0;

	// Calculate card transform based on drag
	const rotation = dragX * 0.08;
	const opacity = 1 - Math.abs(dragX) / 500;
	const isExiting = swipeState === 'exit-left' || swipeState === 'exit-right';
	const exitX = swipeState === 'exit-right' ? 800 : swipeState === 'exit-left' ? -800 : 0;
	const exitRotation = swipeState === 'exit-right' ? 20 : swipeState === 'exit-left' ? -20 : 0;

	// Swipe direction indicators
	const showMastered = dragX > 40;
	const showLearning = dragX < -40;
	const indicatorOpacity = Math.min(Math.abs(dragX) / 120, 1);

	return (
		<main ref={containerRef} className="min-h-screen select-none">
			{/* Top bar */}
			<div className="border-b border-border">
				<div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
					<Link href="/vocabulary" className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors">
						← Từ vựng
					</Link>
					<div className="flex items-center gap-3 text-xs text-muted">
						<span className="font-bold text-success">{mastered.length}</span>
						<span>/</span>
						<span>{total}</span>
						{mastered.length > 0 ? (
							<button onClick={undo} className="ml-1 text-accent hover:underline">Hoàn tác</button>
						) : null}
					</div>
				</div>
				{/* Progress bar */}
				<div className="h-1 bg-surface-hover overflow-hidden">
					<div
						className="h-full bg-success"
						style={{
							width: `${progress}%`,
							transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
						}}
					/>
				</div>
			</div>

			{/* Card area */}
			<div className="mx-auto max-w-2xl px-6 py-10 sm:py-14">
				{/* Counter chip */}
				<div className="mb-6 flex items-center justify-center">
					<span className="rounded-full bg-surface-hover px-4 py-1.5 text-xs font-bold tracking-wider text-muted">
						{index + 1} / {remaining.length} còn lại
					</span>
				</div>

				{/* Card with perspective */}
				<div className="relative" style={{ perspective: '1200px' }}>
					{/* Swipe indicators */}
					{showMastered && (
						<div
							className="absolute -right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-success px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg"
							style={{ opacity: indicatorOpacity, transform: `translateY(-50%) scale(${0.8 + indicatorOpacity * 0.2})` }}
						>
							✓ Đã thuộc
						</div>
					)}
					{showLearning && (
						<div
							className="absolute -left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-error px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg"
							style={{ opacity: indicatorOpacity, transform: `translateY(-50%) scale(${0.8 + indicatorOpacity * 0.2})` }}
						>
							✗ Chưa thuộc
						</div>
					)}

					{/* The Card */}
					<div
						key={animKey}
						ref={cardRef}
						onPointerDown={onPointerDown}
						onPointerMove={onPointerMove}
						onPointerUp={onPointerUp}
						onClick={() => { if (Math.abs(dragX) < 5 && !isDraggingRef.current) flip(); }}
						className="relative cursor-pointer touch-none"
						style={{
							transformStyle: 'preserve-3d',
							transform: isExiting
								? `translateX(${exitX}px) rotate(${exitRotation}deg) scale(0.9)`
								: swipeState.startsWith('swiping')
									? `translateX(${dragX}px) rotate(${rotation}deg)`
									: 'translateX(0) rotate(0)',
							opacity: isExiting ? 0 : opacity,
							transition: isExiting
								? 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
								: swipeState === 'idle'
									? 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
									: 'none',
							animation: swipeState === 'idle' && !isExiting ? 'cardEntrance 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined,
						}}
					>
						{/* Inner flip container */}
						<div
							style={{
								transformStyle: 'preserve-3d',
								transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
								transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
							}}
						>
							{/* Front */}
							<div
								className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 sm:min-h-80"
								style={{
									backfaceVisibility: 'hidden',
									boxShadow: '0 8px 32px -4px rgba(0,0,0,0.08), 0 4px 12px -2px rgba(0,0,0,0.04)',
								}}
							>
									<span className="text-center text-2xl font-black tracking-tight text-foreground sm:text-3xl lg:text-4xl">
										{card?.term}
									</span>
								{card?.partOfSpeech ? (
									<span className="mt-3 rounded-full bg-surface-hover px-3 py-1 text-xs font-medium italic text-muted">
										{card.partOfSpeech}
									</span>
								) : null}
								<button
									onClick={(e) => { e.stopPropagation(); if (card) speak(card.term); }}
									className="mt-5 flex h-10 w-10 items-center justify-center rounded-full bg-surface-hover text-muted transition-all hover:bg-accent hover:text-accent-foreground hover:scale-110 active:scale-95"
								>
									<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-3.14a.75.75 0 011.28.53v12.72a.75.75 0 01-1.28.53l-4.72-3.14H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
									</svg>
								</button>
								<p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted/50">
									Nhấn để lật
								</p>
							</div>
							{/* Back */}
							<div
								className="absolute inset-0 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 sm:min-h-80"
								style={{
									backfaceVisibility: 'hidden',
									transform: 'rotateY(180deg)',
									boxShadow: '0 8px 32px -4px rgba(0,0,0,0.08), 0 4px 12px -2px rgba(0,0,0,0.04)',
								}}
							>
								<span className="text-center text-xl font-bold leading-relaxed text-foreground sm:text-2xl">
									{card?.definition}
								</span>
								{card?.example ? (
									<p className="mt-5 max-w-sm text-center text-sm italic leading-relaxed text-muted">
										&ldquo;{card.example}&rdquo;
									</p>
								) : null}
							</div>
						</div>
					</div>
				</div>

				{/* Controls */}
				<div className="mt-8 flex items-center justify-center gap-4">
					<button
						onClick={markStillLearning}
						className="group flex h-14 w-14 items-center justify-center rounded-full border-2 border-error/30 text-error transition-all hover:border-error hover:bg-error hover:text-white hover:scale-110 hover:shadow-lg active:scale-95"
						title="Chưa thuộc"
					>
						<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
					<button
						onClick={flip}
						className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border text-foreground transition-all hover:border-foreground hover:scale-105 active:scale-95"
						title="Lật thẻ"
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
						</svg>
					</button>
					<button
						onClick={markMastered}
						className="group flex h-14 w-14 items-center justify-center rounded-full border-2 border-success/30 text-success transition-all hover:border-success hover:bg-success hover:text-white hover:scale-110 hover:shadow-lg active:scale-95"
						title="Đã thuộc"
					>
						<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
						</svg>
					</button>
				</div>

				<p className="mt-5 text-center text-[10px] font-bold uppercase tracking-widest text-muted/40">
					Vuốt hoặc · ← Chưa thuộc · → Đã thuộc · Space Lật · ⌘Z Hoàn tác
				</p>
			</div>

			{/* Entrance animation keyframes */}
			<style>{`
				@keyframes cardEntrance {
					0% { transform: translateY(30px) scale(0.95); opacity: 0; }
					100% { transform: translateY(0) scale(1); opacity: 1; }
				}
			`}</style>
		</main>
	);
}

/* ── Completion Screen Component ── */
function CompletionScreen({
	total,
	id,
	containerRef,
	onRestart,
}: {
	total: number;
	id: string;
	containerRef: React.RefObject<HTMLDivElement | null>;
	onRestart: () => void;
}) {
	const [show, setShow] = useState(false);
	const firedRef = useRef(false);

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
						<svg className="mx-auto h-16 w-16" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="fc-party" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#ff5500" /><stop offset="50%" stopColor="#ffcc00" /><stop offset="100%" stopColor="#4a8c5c" /></linearGradient></defs><path d="M12 2l2.5 6.5L21 12l-6.5 2.5L12 22l-2.5-7.5L3 12l6.5-3.5L12 2z" fill="url(#fc-party)" /><circle cx="12" cy="12" r="3" fill="#fff" opacity="0.4" /></svg>
					</div>
					<h1 className="mt-6 text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
						Xuất sắc!
					</h1>
					<p className="mt-3 text-sm text-foreground-secondary">
						Bạn đã ghi nhớ tất cả <span className="font-bold text-success">{total}</span> từ vựng.
					</p>
					<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
						<button
							onClick={() => { firedRef.current = false; onRestart(); }}
							className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground active:scale-95"
						>
							<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
							</svg>
							Học lại
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
								{ href: `/vocabulary/${id}/mcq`, label: 'Trắc nghiệm', color: 'text-success' },
								{ href: `/vocabulary/${id}/fill-blank`, label: 'Điền từ', color: 'text-indigo' },
								{ href: `/vocabulary/${id}/matching`, label: 'Nối từ', color: 'text-purple' },
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
