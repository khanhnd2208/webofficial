'use client';

import ConfettiGenerator from 'confetti-js';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import type { LessonVocabularyItemDTO } from '@/types/lessonVocabulary';

type LoadState =
	| { status: 'loading' }
	| { status: 'loaded'; items: LessonVocabularyItemDTO[] }
	| { status: 'error'; message: string };

function speak(text: string) {
	if (typeof window === 'undefined') return;
	if (!('speechSynthesis' in window)) return;
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = 'en-US';
	window.speechSynthesis.speak(utterance);
}

const EMPTY_ITEMS: LessonVocabularyItemDTO[] = [];

export default function LessonFlashcardsPage() {
	const routeParams = useParams();
	const lessonIdRaw = routeParams?.id;
	const lessonId = typeof lessonIdRaw === 'string' ? lessonIdRaw : Array.isArray(lessonIdRaw) ? lessonIdRaw[0] ?? '' : '';

	const [state, setState] = useState<LoadState>({ status: 'loading' });
	const [index, setIndex] = useState(0);
	const [flipped, setFlipped] = useState(false);
	const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const confettiRef = useRef<ConfettiGenerator | null>(null);

	useEffect(() => {
		if (!lessonId) return;
		let cancelled = false;
		fetch(`/api/lessons/${encodeURIComponent(lessonId)}/vocabulary`)
			.then(async (res) => {
				const json = (await res.json()) as unknown;
				const ok = typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true;
				if (!res.ok || !ok) {
					const message =
						typeof json === 'object' && json !== null && typeof (json as { error?: unknown }).error === 'string'
							? String((json as { error?: unknown }).error)
							: `HTTP ${res.status}`;
					throw new Error(message);
				}
				const data = (json as { data?: unknown }).data;
				const items = Array.isArray(data) ? (data as LessonVocabularyItemDTO[]) : [];
				if (!cancelled) setState({ status: 'loaded', items });
			})
			.catch((e) => {
				if (!cancelled) setState({ status: 'error', message: e instanceof Error ? e.message : 'Unknown error' });
			});
		return () => {
			cancelled = true;
		};
	}, [lessonId]);

	useEffect(() => {
		if (!confettiCanvasRef.current) return;
		confettiRef.current = new ConfettiGenerator({
			target: confettiCanvasRef.current,
			max: 120,
			animate: true,
			respawn: false,
		});
		confettiRef.current.render();
		confettiRef.current.clear();
		return () => {
			confettiRef.current?.clear();
			confettiRef.current = null;
		};
	}, []);

	const items = state.status === 'loaded' ? state.items : EMPTY_ITEMS;
	const current = useMemo(() => (items.length > 0 ? items[Math.min(index, items.length - 1)] : null), [items, index]);

	function onMastered() {
		if (!current || state.status !== 'loaded') return;

		confettiRef.current?.render();
		window.setTimeout(() => confettiRef.current?.clear(), 650);

		const nextItems = state.items.filter((x) => x.id !== current.id);
		setState({ status: 'loaded', items: nextItems });
		setFlipped(false);
		setIndex((prev) => {
			const nextIndex = prev >= nextItems.length ? Math.max(0, nextItems.length - 1) : prev;
			return nextIndex;
		});
	}

	function onNotMastered() {
		setFlipped(false);
		setIndex((prev) => {
			if (items.length === 0) return 0;
			return (prev + 1) % items.length;
		});
	}

	return (
		<main className="mx-auto max-w-3xl px-6 py-12">
			<canvas ref={confettiCanvasRef} className="pointer-events-none fixed inset-0 h-full w-full" />

			<header className="flex flex-wrap items-baseline justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">Flashcard</h1>
					<p className="mt-2 text-sm text-foreground/70">Click để lật thẻ. Nút loa dùng Web Speech API.</p>
				</div>
				<Link className="text-sm underline underline-offset-4" href={`/courses/lessons/${lessonId}`}>
					← Bài học
				</Link>
			</header>

			{state.status === 'loading' ? <p className="mt-8 text-sm text-foreground/70">Đang tải…</p> : null}
			{!lessonId ? <p className="mt-8 text-sm text-red-600">Lỗi: Missing lesson id</p> : null}
			{state.status === 'error' ? <p className="mt-8 text-sm text-red-600">Lỗi: {state.message}</p> : null}

			{state.status === 'loaded' ? (
				items.length === 0 ? (
					<p className="mt-8 text-sm text-foreground/70">Bài này chưa có từ vựng để luyện tập.</p>
				) : (
					<section className="mt-8">
						<div className="mb-3 text-xs text-foreground/60">
							{index + 1} / {items.length}
						</div>

						<div className="perspective-[1000px]">
							<motion.div
								className="relative mx-auto h-64 w-full max-w-md cursor-pointer select-none"
								onClick={() => setFlipped((v) => !v)}
								animate={{ rotateY: flipped ? 180 : 0 }}
								transition={{ duration: 0.4 }}
								style={{ transformStyle: 'preserve-3d' }}
							>
								<div
									className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-foreground/10 bg-background p-6"
									style={{ backfaceVisibility: 'hidden' }}
								>
									<div className="text-3xl font-semibold">{current?.word}</div>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											if (current?.word) speak(current.word);
										}}
										className="mt-4 rounded-md border border-foreground/15 px-3 py-1.5 text-sm"
									>
										🔊 Phát âm
									</button>
								</div>

								<div
									className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-foreground/10 bg-background p-6"
									style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
								>
									<div className="text-2xl font-semibold">{current?.meaningVi}</div>
									<div className="mt-2 text-sm text-foreground/70">{current?.meaningEn}</div>
								</div>
							</motion.div>
						</div>

						<div className="mt-6 flex items-center justify-center gap-3">
							<button
								type="button"
								onClick={onNotMastered}
								className="rounded-md border border-foreground/15 px-4 py-2 text-sm"
							>
								❌ Chưa thuộc
							</button>
							<button
								type="button"
								onClick={onMastered}
								className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
							>
								✅ Đã thuộc
							</button>
						</div>
					</section>
				)
			) : null}
		</main>
	);
}
