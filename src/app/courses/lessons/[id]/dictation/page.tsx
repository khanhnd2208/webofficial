'use client';

import ConfettiGenerator from 'confetti-js';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { LessonVocabularyItemDTO } from '@/types/lessonVocabulary';

type LoadState =
	| { status: 'loading' }
	| { status: 'loaded'; items: LessonVocabularyItemDTO[] }
	| { status: 'error'; message: string };

function playDing() {
	if (typeof window === 'undefined') return;
	const AudioContextCtor = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
	if (!AudioContextCtor) return;
	const ctx = new AudioContextCtor();
	const oscillator = ctx.createOscillator();
	const gain = ctx.createGain();
	oscillator.type = 'sine';
	oscillator.frequency.value = 880;
	gain.gain.value = 0.12;
	oscillator.connect(gain);
	gain.connect(ctx.destination);
	oscillator.start();
	window.setTimeout(() => {
		oscillator.stop();
		void ctx.close();
	}, 120);
}

const EMPTY_ITEMS: LessonVocabularyItemDTO[] = [];

export default function LessonDictationPage() {
	const routeParams = useParams();
	const lessonIdRaw = routeParams?.id;
	const lessonId = typeof lessonIdRaw === 'string' ? lessonIdRaw : Array.isArray(lessonIdRaw) ? lessonIdRaw[0] ?? '' : '';

	const [state, setState] = useState<LoadState>({ status: 'loading' });
	const [index, setIndex] = useState(0);
	const [answer, setAnswer] = useState('');
	const [feedback, setFeedback] = useState<{ type: 'idle' | 'correct' | 'wrong'; message?: string }>({
		type: 'idle',
	});
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
			max: 140,
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

	async function onSubmit() {
		if (!current || state.status !== 'loaded') return;
		const expected = (current.word || '').trim().toLowerCase();
		const got = answer.trim().toLowerCase();

		if (!got) return;

		if (got === expected) {
			setFeedback({ type: 'correct', message: 'Đúng!' });
			playDing();
			confettiRef.current?.render();
			window.setTimeout(() => confettiRef.current?.clear(), 650);

			const nextItems = state.items.filter((x) => x.id !== current.id);
			setState({ status: 'loaded', items: nextItems });
			setAnswer('');
			setFeedback({ type: 'idle' });
			setIndex((prev) => {
				const nextIndex = prev >= nextItems.length ? Math.max(0, nextItems.length - 1) : prev;
				return nextIndex;
			});
		} else {
			setFeedback({ type: 'wrong', message: `Sai! Đáp án đúng là "${current.word}".` });
		}
	}

	return (
		<main className="mx-auto max-w-3xl px-6 py-12">
			<canvas ref={confettiCanvasRef} className="pointer-events-none fixed inset-0 h-full w-full" />

			<header className="flex flex-wrap items-baseline justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">Dictation</h1>
					<p className="mt-2 text-sm text-foreground/70">Nhìn nghĩa Tiếng Việt → gõ từ tiếng Anh.</p>
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
					<section className="mt-8 space-y-4">
						<div className="text-xs text-foreground/60">
							{index + 1} / {items.length}
						</div>

						<div className="rounded-xl border border-foreground/10 p-6">
							<div className="text-sm text-foreground/60">Nghĩa</div>
							<div className="mt-2 text-2xl font-semibold">{current?.meaningVi}</div>
						</div>

						<form
							onSubmit={(e) => {
								e.preventDefault();
								void onSubmit();
							}}
							className="space-y-3"
						>
							<label className="block">
								<div className="text-sm font-medium">Nhập từ tiếng Anh</div>
								<input
									value={answer}
									onChange={(e) => {
										setAnswer(e.target.value);
										if (feedback.type !== 'idle') setFeedback({ type: 'idle' });
									}}
									className="mt-2 w-full rounded-md border border-foreground/15 px-3 py-2 text-sm"
									placeholder="Nhập từ tiếng Anh..."
									autoComplete="off"
								/>
							</label>
							<button type="submit" className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
								Enter
							</button>
						</form>

						{feedback.type === 'correct' ? <p className="text-sm text-green-700">{feedback.message}</p> : null}
						{feedback.type === 'wrong' ? <p className="text-sm text-red-600">{feedback.message}</p> : null}
					</section>
				)
			) : null}
		</main>
	);
}
