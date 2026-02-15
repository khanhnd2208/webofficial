'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { LessonVocabularyItemDTO } from '@/types/lessonVocabulary';

/* ─── Helpers ─── */
function speak(text: string) {
	if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
	window.speechSynthesis.cancel();
	const u = new SpeechSynthesisUtterance(text);
	u.lang = 'en-US';
	u.rate = 0.9;
	window.speechSynthesis.speak(u);
}

/* ─── Component ─── */
export default function FlashcardsPage() {
	const p = useParams();
	const courseId = typeof p?.courseId === 'string' ? p.courseId : '';
	const unitId = typeof p?.unitId === 'string' ? p.unitId : '';
	const lessonId = typeof p?.lessonId === 'string' ? p.lessonId : '';

	const [items, setItems] = useState<LessonVocabularyItemDTO[] | null>(null);
	const [error, setError] = useState('');
	const [remaining, setRemaining] = useState<LessonVocabularyItemDTO[]>([]);
	const [mastered, setMastered] = useState<LessonVocabularyItemDTO[]>([]);
	const [index, setIndex] = useState(0);
	const [flipped, setFlipped] = useState(false);
	const [direction, setDirection] = useState(0); // -1 left, 1 right, 0 none
	const [showCompleted, setShowCompleted] = useState(false);

	const cardRef = useRef<HTMLDivElement>(null);

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
				setRemaining(data);
				setMastered([]);
				setIndex(0);
			})
			.catch((e) => {
				if (!cancelled) setError(e instanceof Error ? e.message : 'Lỗi');
			});
		return () => {
			cancelled = true;
		};
	}, [lessonId]);

	const total = items?.length ?? 0;
	const current = remaining[index] ?? null;
	const progress = total > 0 ? (mastered.length / total) * 100 : 0;

	const handleMastered = useCallback(() => {
		if (!current) return;
		setDirection(1);
		setTimeout(() => {
			setMastered((prev) => [...prev, current]);
			setRemaining((prev) => {
				const next = prev.filter((x) => x.id !== current.id);
				if (next.length === 0) {
					setShowCompleted(true);
					return next;
				}
				setIndex((i) => (i >= next.length ? 0 : i));
				return next;
			});
			setFlipped(false);
			setDirection(0);
		}, 250);
	}, [current]);

	const handleStillLearning = useCallback(() => {
		if (remaining.length === 0) return;
		setDirection(-1);
		setTimeout(() => {
			setFlipped(false);
			setIndex((prev) => (prev + 1) % remaining.length);
			setDirection(0);
		}, 250);
	}, [remaining.length]);

	const handleUndo = useCallback(() => {
		if (mastered.length === 0) return;
		const last = mastered[mastered.length - 1];
		setMastered((prev) => prev.slice(0, -1));
		setRemaining((prev) => [...prev, last]);
		setShowCompleted(false);
		setFlipped(false);
	}, [mastered]);

	const handleRestart = useCallback(() => {
		if (!items) return;
		setRemaining(items);
		setMastered([]);
		setIndex(0);
		setFlipped(false);
		setShowCompleted(false);
	}, [items]);

	/* ── Keyboard navigation ── */
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				setFlipped((v) => !v);
			} else if (e.key === 'ArrowRight' || e.key === 'l') {
				handleMastered();
			} else if (e.key === 'ArrowLeft' || e.key === 'h') {
				handleStillLearning();
			} else if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
				handleUndo();
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [handleMastered, handleStillLearning, handleUndo]);

	const basePath = `/courses/${encodeURIComponent(courseId)}/units/${encodeURIComponent(unitId)}/lessons/${encodeURIComponent(lessonId)}`;

	/* ── Loading ── */
	if (items === null && !error) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background-secondary">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
			</main>
		);
	}

	/* ── Error ── */
	if (error) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background-secondary px-6">
				<p className="text-sm text-error">{error}</p>
				<Link href={basePath} className="text-sm text-accent underline">
					Quay lại
				</Link>
			</main>
		);
	}

	/* ── Empty ── */
	if (total === 0) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background-secondary px-6">
				<p className="text-foreground-secondary">Bài học này chưa có từ vựng.</p>
				<Link href={basePath} className="text-sm text-accent underline">
					Quay lại
				</Link>
			</main>
		);
	}

	/* ── Completed ── */
	if (showCompleted || remaining.length === 0) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background-secondary px-6 text-center">
				<div className="flex justify-center"><svg className="h-14 w-14" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="cfc-p" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#ff5500" /><stop offset="50%" stopColor="#ffcc00" /><stop offset="100%" stopColor="#4a8c5c" /></linearGradient></defs><path d="M12 2l2.5 6.5L21 12l-6.5 2.5L12 22l-2.5-7.5L3 12l6.5-3.5L12 2z" fill="url(#cfc-p)" /><circle cx="12" cy="12" r="3" fill="#fff" opacity="0.4" /></svg></div>
				<h1 className="text-2xl font-bold">Tuyệt vời!</h1>
				<p className="text-foreground-secondary">
					Bạn đã thuộc tất cả <strong className="text-foreground">{total}</strong> từ vựng.
				</p>
				<div className="flex flex-wrap items-center justify-center gap-3">
					<button
						onClick={handleRestart}
						className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
					>
						Học lại
					</button>
					<Link
						href={`${basePath}/mcq`}
						className="rounded-lg bg-surface px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-hover"
					>
						Trắc nghiệm
					</Link>
					<Link
						href={`${basePath}/fill-blank`}
						className="rounded-lg bg-surface px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-hover"
					>
						Điền từ
					</Link>
					<Link
						href={basePath}
						className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-hover"
					>
						Quay lại bài học
					</Link>
				</div>
				{mastered.length > 0 ? (
					<button
						onClick={handleUndo}
						className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
					>
						Hoàn tác (⌘Z)
					</button>
				) : null}
			</main>
		);
	}

	/* ── Main flashcard ── */
	return (
		<main className="flex min-h-screen flex-col bg-background-secondary">
			{/* Top bar */}
			<header className="border-b border-border bg-surface">
				<div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
					<Link
						href={basePath}
						className="flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
						Bài học
					</Link>
					<h1 className="text-sm font-semibold">Flashcards</h1>
					<div className="flex items-center gap-2">
						<Link
							href={`${basePath}/mcq`}
							className="rounded-md bg-surface-hover px-2.5 py-1 text-[11px] font-semibold text-foreground-secondary hover:bg-surface-active"
						>
							MCQ
						</Link>
						<Link
							href={`${basePath}/fill-blank`}
							className="rounded-md bg-surface-hover px-2.5 py-1 text-[11px] font-semibold text-foreground-secondary hover:bg-surface-active"
						>
							FIB
						</Link>
					</div>
				</div>
			</header>

			{/* Progress bar */}
			<div className="border-b border-border bg-surface px-4 py-3 sm:px-6">
				<div className="mx-auto max-w-3xl">
					<div className="flex items-center justify-between text-xs font-semibold text-muted">
						<span>{mastered.length} đã thuộc</span>
						<span>{remaining.length} còn lại</span>
					</div>
					<div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-hover">
						<div
							className="h-full rounded-full bg-linear-to-r from-success to-success/80 transition-all duration-500"
							style={{ width: `${progress}%` }}
						/>
					</div>
					<div className="mt-1 text-center text-[10px] font-semibold text-muted">
						{mastered.length}/{total}
					</div>
				</div>
			</div>

			{/* Card area */}
			<div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
				{/* Card counter */}
				<div className="mb-4 flex items-center gap-2 text-xs text-muted">
					<span>
						{index + 1} / {remaining.length}
					</span>
					{mastered.length > 0 ? (
						<button
							onClick={handleUndo}
							className="text-accent underline underline-offset-2 hover:text-accent-hover"
						>
							Hoàn tác
						</button>
					) : null}
				</div>

				{/* Flashcard */}
				<div
					ref={cardRef}
					onClick={() => setFlipped((v) => !v)}
					className="w-full max-w-lg cursor-pointer select-none"
					style={{ perspective: '1200px' }}
				>
					<div
						className={`relative transition-transform duration-500 ${
							direction === 1
								? 'translate-x-[120%] opacity-0'
								: direction === -1
									? '-translate-x-[120%] opacity-0'
									: ''
						}`}
						style={{
							transformStyle: 'preserve-3d',
							transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
							transition: direction !== 0 ? 'transform 0.25s, opacity 0.25s' : 'transform 0.5s',
						}}
					>
						{/* Front */}
						<div
							className="flex min-h-70 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 shadow-md sm:min-h-80"
							style={{ backfaceVisibility: 'hidden' }}
						>
							<div className="text-center text-3xl font-bold sm:text-4xl">{current?.word}</div>
							{current?.partOfSpeech ? (
								<div className="mt-2 text-sm italic text-muted">{current.partOfSpeech}</div>
							) : null}
							<button
								onClick={(e) => {
									e.stopPropagation();
									if (current) speak(current.word);
								}}
								className="mt-5 flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
							>
								<svg
									className="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
									/>
								</svg>
								Phát âm
							</button>
							<div className="mt-6 text-[10px] font-medium uppercase tracking-widest text-muted">
								Nhấn để lật thẻ
							</div>
						</div>

						{/* Back */}
						<div
							className="absolute inset-0 flex min-h-70 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 shadow-md sm:min-h-80"
							style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
						>
							<div className="text-center text-2xl font-bold sm:text-3xl">{current?.meaningVi}</div>
							<div className="mt-3 text-center text-sm text-foreground-secondary">
								{current?.meaningEn}
							</div>
						</div>
					</div>
				</div>

				{/* Action buttons */}
				<div className="mt-8 flex items-center gap-4">
					<button
						onClick={handleStillLearning}
						className="flex items-center gap-2 rounded-xl border-2 border-error/30 bg-error-subtle px-6 py-3 text-sm font-semibold text-error transition-colors hover:border-error/50 hover:bg-error-subtle/80"
					>
						<svg
							className="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2.5}
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
						Chưa thuộc
					</button>
					<button
						onClick={handleMastered}
						className="flex items-center gap-2 rounded-xl border-2 border-success/30 bg-success-subtle px-6 py-3 text-sm font-semibold text-success transition-colors hover:border-success/50 hover:bg-success-subtle/80"
					>
						<svg
							className="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2.5}
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
						</svg>
						Đã thuộc
					</button>
				</div>

				{/* Keyboard hints */}
				<div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[10px] text-muted">
					<span>
						<kbd className="rounded border border-border px-1.5 py-0.5 font-mono">Space</kbd> lật
					</span>
					<span>
						<kbd className="rounded border border-border px-1.5 py-0.5 font-mono">←</kbd> chưa thuộc
					</span>
					<span>
						<kbd className="rounded border border-border px-1.5 py-0.5 font-mono">→</kbd> đã thuộc
					</span>
					<span>
						<kbd className="rounded border border-border px-1.5 py-0.5 font-mono">⌘Z</kbd> hoàn tác
					</span>
				</div>
			</div>
		</main>
	);
}
