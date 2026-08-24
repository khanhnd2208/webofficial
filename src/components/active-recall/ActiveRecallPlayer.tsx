'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ActiveRecallDeckDTO } from '@/features/active-recall';

type StoredState = { currentId?: string; shuffled?: boolean };

function shuffle<T>(items: T[]) {
	const next = [...items];
	for (let index = next.length - 1; index > 0; index -= 1) {
		const swap = Math.floor(Math.random() * (index + 1));
		[next[index], next[swap]] = [next[swap]!, next[index]!];
	}
	return next;
}

function RecallText({ children }: { children: string }) {
	return <div className="recall-text whitespace-pre-wrap">{children}</div>;
}

export default function ActiveRecallPlayer({ deck }: { deck: ActiveRecallDeckDTO }) {
	const [ids, setIds] = useState(() => deck.cards.map((card) => card.id));
	const [currentId, setCurrentId] = useState(deck.cards[0]?.id ?? '');
	const [revealed, setRevealed] = useState(false);
	const [presentation, setPresentation] = useState(false);
	const rootRef = useRef<HTMLElement>(null);
	const storageKey = `active-recall:${deck.id}`;
	const byId = useMemo(() => new Map(deck.cards.map((card) => [card.id, card])), [deck.cards]);
	const currentIndex = Math.max(0, ids.indexOf(currentId));
	const card = byId.get(currentId) ?? deck.cards[0];

	useEffect(() => {
		try {
			const stored = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as StoredState;
			if (!stored.shuffled && (!stored.currentId || !byId.has(stored.currentId))) return;
			const timer = window.setTimeout(() => {
				if (stored.shuffled) setIds(shuffle(deck.cards.map((item) => item.id)));
				if (stored.currentId && byId.has(stored.currentId)) setCurrentId(stored.currentId);
			}, 0);
			return () => window.clearTimeout(timer);
		} catch {
			// A private browser mode should not block studying.
		}
	}, [byId, deck.cards, storageKey]);

	useEffect(() => {
		if (!card) return;
		try {
			localStorage.setItem(
				storageKey,
				JSON.stringify({
					currentId: card.id,
					shuffled: ids.join(',') !== deck.cards.map((item) => item.id).join(','),
				} satisfies StoredState),
			);
		} catch {
			// Device-local resume is optional.
		}
	}, [card, deck.cards, ids, storageKey]);

	useEffect(() => {
		const onFullscreen = () => setPresentation(Boolean(document.fullscreenElement));
		document.addEventListener('fullscreenchange', onFullscreen);
		return () => document.removeEventListener('fullscreenchange', onFullscreen);
	}, []);

	const move = useCallback(
		(direction: -1 | 1) => {
			setCurrentId((current) => {
				const index = ids.indexOf(current);
				const next = Math.min(Math.max(0, index + direction), ids.length - 1);
				return ids[next] ?? current;
			});
			setRevealed(false);
		},
		[ids],
	);
	const flip = useCallback(() => setRevealed((value) => !value), []);

	const togglePresentation = useCallback(async () => {
		const root = rootRef.current;
		if (!root) return;
		if (document.fullscreenElement) {
			await document.exitFullscreen?.();
			return;
		}
		if (root.requestFullscreen) {
			try {
				await root.requestFullscreen();
				return;
			} catch {
				// Fall through to the visual fallback below.
			}
		}
		setPresentation((value) => !value);
	}, []);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			const target = event.target;
			if (
				target instanceof Element &&
				target.matches('input, textarea, select, [contenteditable="true"]')
			)
				return;
			if (event.key === ' ' || event.key === 'Enter') {
				event.preventDefault();
				setRevealed((value) => !value);
			} else if (event.key === 'ArrowLeft') {
				event.preventDefault();
				move(-1);
			} else if (event.key === 'ArrowRight') {
				event.preventDefault();
				move(1);
			} else if (event.key.toLowerCase() === 'f') {
				event.preventDefault();
				void togglePresentation();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [move, togglePresentation]);

	if (!card) return null;
	const first = currentIndex === 0;
	const last = currentIndex === ids.length - 1;

	return (
		<main
			ref={rootRef}
			className={`recall-player min-h-svh bg-canvas text-ink ${presentation ? 'recall-player-presentation' : ''}`}
		>
			<div className="recall-player-inner mx-auto flex min-h-svh w-full max-w-[76rem] flex-col px-5 pt-24 pb-6 sm:px-8 sm:pt-28">
				<header className="recall-player-head flex flex-wrap items-end justify-between gap-4 border-t border-hairline pt-4">
					<div>
						<p className="text-sm text-ink-secondary">
							{[deck.subject, deck.lessonLabel].filter(Boolean).join(' · ')}
						</p>
						<h1 className="mt-1 font-display text-2xl font-medium tracking-tight sm:text-3xl">
							{deck.title}
						</h1>
					</div>
					<div
						className="flex items-center gap-3 text-sm text-ink-secondary"
						aria-label="Tiến độ thẻ"
					>
						<span className="tabular-nums">
							{currentIndex + 1}/{ids.length}
						</span>
						<button
							type="button"
							className="recall-quiet-button"
							onClick={() => {
								const shuffledIds = shuffle(deck.cards.map((item) => item.id));
								setIds(shuffledIds);
								setCurrentId(shuffledIds[0] ?? '');
								setRevealed(false);
							}}
						>
							Xáo câu
						</button>
						<button
							type="button"
							className="recall-quiet-button"
							onClick={() => void togglePresentation()}
						>
							{presentation ? 'Thoát trình chiếu' : 'Trình chiếu'}
						</button>
					</div>
				</header>

				<div className="recall-progress mt-5" aria-hidden="true">
					<span style={{ width: `${((currentIndex + 1) / ids.length) * 100}%` }} />
				</div>

				<section
					className="recall-card-shell my-6 flex min-h-0 flex-1 items-center justify-center"
					aria-live="polite"
					aria-atomic="true"
				>
					<article
						role="button"
						tabIndex={0}
						aria-label={revealed ? 'Xem lại câu hỏi' : 'Hiện đáp án'}
						onClick={flip}
						onKeyDown={(event) => {
							if (event.key === ' ' || event.key === 'Enter') {
								event.preventDefault();
								event.stopPropagation();
								flip();
							}
						}}
						className={`recall-card ${revealed ? 'is-revealed' : ''}`}
						data-side={revealed ? 'answer' : 'question'}
					>
						<p className="recall-card-order" aria-hidden="true">
							{currentIndex + 1} / {ids.length}
						</p>
						<RecallText>{revealed ? card.answer : card.question}</RecallText>
					</article>
				</section>

				<nav
					className="recall-controls flex items-center justify-between gap-4"
					aria-label="Điều hướng thẻ"
				>
					<button
						type="button"
						className="recall-nav-button"
						onClick={() => move(-1)}
						disabled={first}
					>
						← Trước
					</button>
					<p className="hidden text-center text-xs text-ink-secondary sm:block">
						Space để lật · ← → để chuyển · F để trình chiếu
					</p>
					<button
						type="button"
						className="recall-nav-button recall-nav-button-primary"
						onClick={() => move(1)}
						disabled={last}
					>
						Tiếp →
					</button>
				</nav>
			</div>
		</main>
	);
}
