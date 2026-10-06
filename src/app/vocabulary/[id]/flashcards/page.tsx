'use client';

import { Icon } from '@/components/ui/Icon';
import { GRAPHIC_COLORS } from '@/config/graphicColors';
import Link from 'next/link';
import { useEffect, useState, useCallback, useRef } from 'react';
import FlashcardPrism from '@/components/vocab/FlashcardPrism';
import type { FlashcardWord } from '@/components/vocab/FlashcardPrism';
import {
	useVocabSetUrl,
	useVocabChrome,
	VocabPracticeFrame,
	VocabBackLink,
} from '@/components/vocab/practice/VocabApiProvider';
import {
	clearPracticeDraft,
	readPracticeDraft,
	writePracticeDraft,
} from '@/features/my-class/client/practiceDraft';

type Word = FlashcardWord;

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
	} catch {
		/* silent */
	}
}

/* ── Confetti burst ── */
function burstConfetti(container: HTMLElement) {
	const colors = [
		GRAPHIC_COLORS['c44b28'],
		GRAPHIC_COLORS['e8714f'],
		GRAPHIC_COLORS['4a8c5c'],
		GRAPHIC_COLORS['6aad7c'],
		GRAPHIC_COLORS['c48a1a'],
		GRAPHIC_COLORS['d4a03a'],
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
			left:50%;top:45%;
			opacity:1;
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

export default function FlashcardsPage({ params }: { params: Promise<{ id: string }> }) {
	const [id, setId] = useState('');
	const [allWords, setAllWords] = useState<Word[] | null>(null);
	const [error, setError] = useState('');

	const [remaining, setRemaining] = useState<Word[]>([]);
	const [mastered, setMastered] = useState<Word[]>([]);
	const [_stillLearning, setStillLearning] = useState<Word[]>([]);
	const [index, setIndex] = useState(0);
	const [animKey, setAnimKey] = useState(0);
	const vocabUrl = useVocabSetUrl();
	const containerRef = useRef<HTMLDivElement>(null);

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
			const draft = readPracticeDraft<{
				remainingIds: string[];
				masteredIds: string[];
				index: number;
			}>(`flashcards:${paramId}`);
			if (draft) {
				const byId = new Map(words.map((word) => [word.id, word]));
				const remainingRestored = draft.remainingIds
					.map((wordId) => byId.get(wordId))
					.filter((word): word is Word => Boolean(word));
				const masteredRestored = draft.masteredIds
					.map((wordId) => byId.get(wordId))
					.filter((word): word is Word => Boolean(word));
				if (remainingRestored.length) {
					setRemaining(remainingRestored);
					setMastered(masteredRestored);
					setIndex(Math.min(draft.index, remainingRestored.length - 1));
				} else {
					setRemaining(shuffle(words));
				}
			} else {
				setRemaining(shuffle(words));
			}
		});
	}, [params, vocabUrl]);

	useEffect(() => {
		if (!id || !allWords) return;
		if (remaining.length === 0) {
			clearPracticeDraft(`flashcards:${id}`);
			return;
		}
		writePracticeDraft(`flashcards:${id}`, {
			remainingIds: remaining.map((word) => word.id),
			masteredIds: mastered.map((word) => word.id),
			index,
		});
	}, [allWords, id, index, mastered, remaining]);

	const card = remaining[index] ?? null;
	const total = allWords?.length ?? 0;

	/* ── Card actions ── */

	const advanceCard = useCallback(
		(dir: 'left' | 'right') => {
			if (!card) return;
			setTimeout(() => {
				if (dir === 'right') {
					setMastered((prev) => [...prev, card]);
					setRemaining((prev) => prev.filter((_, i) => i !== index));
					setIndex((prev) => (prev >= remaining.length - 1 ? 0 : prev));
				} else {
					setStillLearning((prev) => [...prev, card]);
					setIndex((prev) => (prev + 1) % remaining.length);
				}
				setAnimKey((k) => k + 1);
			}, 50);
		},
		[card, index, remaining.length],
	);

	const markMastered = useCallback(() => advanceCard('right'), [advanceCard]);
	const markStillLearning = useCallback(() => advanceCard('left'), [advanceCard]);

	const undo = useCallback(() => {
		if (mastered.length === 0) return;
		const last = mastered[mastered.length - 1];
		setMastered((prev) => prev.slice(0, -1));
		setRemaining((prev) => [...prev, last]);
		setAnimKey((k) => k + 1);
	}, [mastered]);

	/* ── Touch / Mouse drag ── (handled by FlashcardPrism now) */

	/* ── Keyboard ── */
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'ArrowRight' || e.key === 'l') markMastered();
			else if (e.key === 'ArrowLeft' || e.key === 'h') markStillLearning();
			else if ((e.metaKey || e.ctrlKey) && e.key === 'z') undo();
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [markMastered, markStillLearning, undo]);

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

	/* ── Completion Screen ── */
	if (remaining.length === 0) {
		return (
			<VocabPracticeFrame className="min-h-screen">
				<div ref={containerRef}>
					<CompletionScreen
						total={total}
						id={id}
						containerRef={containerRef}
						onRestart={() => {
							setRemaining(shuffle(allWords));
							setMastered([]);
							setStillLearning([]);
							setIndex(0);
							setAnimKey(0);
						}}
					/>
				</div>
			</VocabPracticeFrame>
		);
	}

	const progress = total > 0 ? (mastered.length / total) * 100 : 0;

	return (
		<VocabPracticeFrame className="min-h-screen select-none">
			<div ref={containerRef}>
				{/* Top bar */}
				<div className="border-b border-border">
					<div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
						<VocabBackLink className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors" />
						<div className="flex items-center gap-3 text-xs text-muted">
							<span className="font-bold text-success">{mastered.length}</span>
							<span>/</span>
							<span>{total}</span>
							{mastered.length > 0 ? (
								<button onClick={undo} className="ml-1 text-accent hover:underline">
									Hoàn tác
								</button>
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

					{/* Prism card */}
					<FlashcardPrism
						word={card!}
						animKey={animKey}
						onSwipeLeft={markStillLearning}
						onSwipeRight={markMastered}
						onSpeak={(text) => speak(text)}
					/>

					{/* Controls */}
					<div className="mt-8 flex items-center justify-center gap-4">
						<button
							onClick={markStillLearning}
							className="group flex h-14 w-14 items-center justify-center rounded-full border-2 border-error/30 text-error transition-all hover:border-error hover:bg-error hover:text-white hover:scale-110 hover:shadow-lg active:scale-95"
							title="Chưa thuộc"
						>
							<Icon name="close" className="h-6 w-6" />
						</button>
						<button
							onClick={markMastered}
							className="group flex h-14 w-14 items-center justify-center rounded-full border-2 border-success/30 text-success transition-all hover:border-success hover:bg-success hover:text-white hover:scale-110 hover:shadow-lg active:scale-95"
							title="Đã thuộc"
						>
							<Icon name="check" className="h-6 w-6" />
						</button>
					</div>

					<p className="mt-5 text-center text-xs font-bold uppercase tracking-widest text-muted/40">
						Tap để xoay · ← Chưa thuộc · → Đã thuộc · ⌘Z Hoàn tác
					</p>
				</div>
			</div>
		</VocabPracticeFrame>
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
	const chrome = useVocabChrome();
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
							animation: show
								? 'celebrateBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both'
								: undefined,
						}}
					>
						<svg className="mx-auto h-16 w-16" viewBox="0 0 24 24" fill="none">
							<defs>
								<linearGradient id="fc-party" x1="0" y1="1" x2="1" y2="0">
									<stop offset="0%" stopColor={GRAPHIC_COLORS['ff5500']} />
									<stop offset="50%" stopColor={GRAPHIC_COLORS['ffcc00']} />
									<stop offset="100%" stopColor={GRAPHIC_COLORS['4a8c5c']} />
								</linearGradient>
							</defs>
							<path
								d="M12 2l2.5 6.5L21 12l-6.5 2.5L12 22l-2.5-7.5L3 12l6.5-3.5L12 2z"
								fill="url(#fc-party)"
							/>
							<circle cx="12" cy="12" r="3" fill={GRAPHIC_COLORS['fff']} opacity="0.4" />
						</svg>
					</div>
					<h1 className="mt-6 text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
						Xuất sắc!
					</h1>
					<p className="mt-3 text-sm text-foreground-secondary">
						Bạn đã ghi nhớ tất cả <span className="font-bold text-success">{total}</span> từ vựng.
					</p>
					<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
						<button
							onClick={() => {
								firedRef.current = false;
								onRestart();
							}}
							className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground active:scale-95"
						>
							<Icon name="retry" className="h-4 w-4" />
							Học lại
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
							{[
								{ href: chrome.modeHref(id, 'mcq'), label: 'Trắc nghiệm', color: 'text-success' },
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
