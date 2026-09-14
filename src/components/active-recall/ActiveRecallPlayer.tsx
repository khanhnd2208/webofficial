'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import type { ActiveRecallDeckDTO } from '@/features/active-recall';
import { recallToStoredHtml } from '@/features/active-recall/richText';

import {
	DEFAULT_READING_SIZE,
	READING_SIZE_LABELS,
	READING_SIZES,
	readStoredReadingSize,
	subscribeReadingSize,
	writeStoredReadingSize,
} from './readingSize';

type StoredState = { currentId?: string; shuffled?: boolean };

function shuffle<T>(items: T[]) {
	const next = [...items];
	for (let index = next.length - 1; index > 0; index -= 1) {
		const swap = Math.floor(Math.random() * (index + 1));
		[next[index], next[swap]] = [next[swap]!, next[index]!];
	}
	return next;
}

function hasTextSelection() {
	const selection = window.getSelection();
	return Boolean(selection && !selection.isCollapsed && selection.toString().trim());
}

function RecallText({ children }: { children: string }) {
	return (
		<div
			className="recall-text"
			suppressHydrationWarning
			dangerouslySetInnerHTML={{ __html: recallToStoredHtml(children) }}
		/>
	);
}

export default function ActiveRecallPlayer({
	deck,
	backHref,
	backLabel,
}: {
	deck: ActiveRecallDeckDTO;
	backHref?: string;
	backLabel?: string;
}) {
	const originalIds = useMemo(() => deck.cards.map((card) => card.id), [deck.cards]);
	const [ids, setIds] = useState(originalIds);
	const [currentId, setCurrentId] = useState(deck.cards[0]?.id ?? '');
	const [revealed, setRevealed] = useState(false);
	const [shuffled, setShuffled] = useState(false);
	const [hydrated, setHydrated] = useState(false);
	const [presentation, setPresentation] = useState(false);
	const [nativeFullscreen, setNativeFullscreen] = useState(false);
	const readingSize = useSyncExternalStore(
		subscribeReadingSize,
		readStoredReadingSize,
		() => DEFAULT_READING_SIZE,
	);
	const rootRef = useRef<HTMLElement>(null);
	const cardBodyRef = useRef<HTMLDivElement>(null);
	const restoreFocusRef = useRef<HTMLElement | null>(null);
	const storageKey = `active-recall:${deck.id}`;
	const byId = useMemo(() => new Map(deck.cards.map((card) => [card.id, card])), [deck.cards]);
	const currentIndex = Math.max(0, ids.indexOf(currentId));
	const card = byId.get(currentId) ?? deck.cards[0];
	const fallbackPresentation = presentation && !nativeFullscreen;

	useEffect(() => {
		let cancelled = false;
		try {
			const stored = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as StoredState;
			const timer = window.setTimeout(() => {
				if (cancelled) return;
				if (stored.shuffled) {
					setIds(shuffle(originalIds));
					setShuffled(true);
				}
				if (stored.currentId && byId.has(stored.currentId)) setCurrentId(stored.currentId);
				setHydrated(true);
			}, 0);
			return () => {
				cancelled = true;
				window.clearTimeout(timer);
			};
		} catch {
			setHydrated(true);
		}
	}, [byId, originalIds, storageKey]);

	useEffect(() => {
		if (!hydrated || !card) return;
		try {
			localStorage.setItem(
				storageKey,
				JSON.stringify({
					currentId: card.id,
					shuffled,
				} satisfies StoredState),
			);
		} catch {
			// Device-local resume is optional.
		}
	}, [card, hydrated, shuffled, storageKey]);

	useEffect(() => {
		const onFullscreen = () => {
			const ours = document.fullscreenElement === rootRef.current;
			setNativeFullscreen(ours);
			if (ours) setPresentation(true);
			else if (!document.fullscreenElement) setPresentation(false);
		};
		document.addEventListener('fullscreenchange', onFullscreen);
		return () => document.removeEventListener('fullscreenchange', onFullscreen);
	}, []);

	useEffect(() => {
		const body = cardBodyRef.current;
		if (!body) return;
		if (typeof body.scrollTo === 'function') body.scrollTo({ top: 0, left: 0 });
		else body.scrollTop = 0;
	}, [currentId, revealed]);

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

	const applyOrder = useCallback((nextIds: string[], nextShuffled: boolean) => {
		setIds(nextIds);
		setCurrentId(nextIds[0] ?? '');
		setRevealed(false);
		setShuffled(nextShuffled);
	}, []);

	const toggleShuffle = useCallback(() => {
		if (shuffled) {
			applyOrder(originalIds, false);
			return;
		}
		applyOrder(shuffle(originalIds), true);
	}, [applyOrder, originalIds, shuffled]);

	const chooseReadingSize = useCallback((size: (typeof READING_SIZES)[number]) => {
		writeStoredReadingSize(size);
	}, []);

	const leavePresentation = useCallback(async () => {
		try {
			if (document.fullscreenElement === rootRef.current) {
				await document.exitFullscreen?.();
			}
		} catch {
			// Check the actual fullscreen state below; a browser can reject while completing
			// the exit, or reject while still keeping the player fullscreen.
		}
		if (document.fullscreenElement === rootRef.current) return;
		setNativeFullscreen(false);
		setPresentation(false);
		window.requestAnimationFrame(() => restoreFocusRef.current?.focus?.());
	}, []);

	const enterPresentation = useCallback(async () => {
		const root = rootRef.current;
		if (!root) return;
		restoreFocusRef.current =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;
		if (root.requestFullscreen) {
			let timer = 0;
			try {
				await Promise.race([
					root.requestFullscreen(),
					new Promise((_, reject) => {
						timer = window.setTimeout(() => reject(new Error('fullscreen-timeout')), 500);
					}),
				]);
			} catch {
				// Fall through to the visual fallback below.
			} finally {
				window.clearTimeout(timer);
			}
		}
		setPresentation(true);
	}, []);

	const togglePresentation = useCallback(async () => {
		if (presentation || document.fullscreenElement === rootRef.current) {
			await leavePresentation();
			return;
		}
		await enterPresentation();
	}, [enterPresentation, leavePresentation, presentation]);

	useEffect(() => {
		if (!presentation || nativeFullscreen) return;
		const previousOverflow = document.body.style.overflow;
		const previousPadding = document.body.style.paddingRight;
		const scrollbar = window.innerWidth - document.documentElement.clientWidth;
		document.body.style.overflow = 'hidden';
		if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
		return () => {
			document.body.style.overflow = previousOverflow;
			document.body.style.paddingRight = previousPadding;
		};
	}, [nativeFullscreen, presentation]);

	useEffect(() => {
		if (!presentation || nativeFullscreen) return;
		const root = rootRef.current;
		if (!root) return;

		const focusable = () =>
			Array.from(
				root.querySelectorAll<HTMLElement>(
					'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
				),
			).filter((element) => element.offsetParent !== null);

		focusable()[0]?.focus();

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Tab') return;
			const items = focusable();
			if (items.length === 0) return;
			const first = items[0]!;
			const last = items[items.length - 1]!;
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};
		document.addEventListener('keydown', onKeyDown, true);
		return () => document.removeEventListener('keydown', onKeyDown, true);
	}, [nativeFullscreen, presentation]);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && (presentation || document.fullscreenElement === rootRef.current)) {
				event.preventDefault();
				void leavePresentation();
				return;
			}
			const target = event.target;
			if (
				target instanceof Element &&
				target.closest(
					'a, button, input, textarea, select, summary, [role="button"], [contenteditable="true"]',
				)
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
	}, [leavePresentation, move, presentation, togglePresentation]);

	if (!card) return null;
	const first = currentIndex === 0;
	const last = currentIndex === ids.length - 1;
	const flipLabel = revealed ? 'Xem câu hỏi' : 'Hiện đáp án';

	return (
		<main
			ref={rootRef}
			className={`recall-player min-h-svh bg-canvas text-ink ${presentation ? 'recall-player-presentation' : ''}`}
			data-reading-size={readingSize}
			data-has-back={backHref && backLabel ? 'true' : 'false'}
			data-mode={presentation ? 'presentation' : 'study'}
			role={fallbackPresentation ? 'dialog' : undefined}
			aria-label={fallbackPresentation ? 'Chế độ trình chiếu Active Recall' : undefined}
			aria-modal={fallbackPresentation ? true : undefined}
		>
			<div className="recall-player-inner">
				{backHref && backLabel ? (
					<Link href={backHref} className="recall-player-back recall-player-chrome">
						← {backLabel}
					</Link>
				) : null}

				<header className="recall-player-head recall-player-chrome">
					<div>
						<p className="text-sm text-ink-secondary">
							{[deck.subject, deck.lessonLabel].filter(Boolean).join(' · ')}
						</p>
						<h1 className="recall-player-title">{deck.title}</h1>
					</div>
					<div className="recall-player-tools" aria-label="Tiến độ thẻ">
						<span className="tabular-nums">
							{currentIndex + 1}/{ids.length}
						</span>
						<button
							type="button"
							className="recall-quiet-button"
							aria-pressed={shuffled}
							onClick={toggleShuffle}
						>
							{shuffled ? 'Về thứ tự ban đầu' : 'Xáo câu'}
						</button>
						<div className="recall-size-group" role="radiogroup" aria-label="Cỡ chữ">
							{READING_SIZES.map((size) => (
								<button
									key={size}
									type="button"
									role="radio"
									aria-checked={readingSize === size}
									className="recall-size-button"
									onClick={() => chooseReadingSize(size)}
								>
									{READING_SIZE_LABELS[size]}
								</button>
							))}
						</div>
						<button
							type="button"
							className="recall-quiet-button"
							onClick={() => void togglePresentation()}
						>
							Trình chiếu
						</button>
					</div>
				</header>

				<div className="recall-progress" aria-hidden="true">
					<span style={{ width: `${((currentIndex + 1) / ids.length) * 100}%` }} />
				</div>

				<section
					className="recall-card-shell"
					aria-live="polite"
					aria-atomic="true"
				>
					<article
						role="button"
						tabIndex={0}
						aria-label={revealed ? 'Thẻ đáp án. Chạm để xem câu hỏi' : 'Thẻ câu hỏi. Chạm để hiện đáp án'}
						onClick={() => {
							if (hasTextSelection()) return;
							flip();
						}}
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
						<p className="recall-card-kicker">{revealed ? 'Đáp án' : 'Câu hỏi'}</p>
						<div className="recall-card-body" ref={cardBodyRef}>
							<RecallText>{revealed ? card.answer : card.question}</RecallText>
						</div>
					</article>
				</section>
				<p className="recall-player-chrome mb-3 text-center text-xs text-ink-secondary sm:hidden">
					Chạm vào thẻ để lật câu hỏi và đáp án.
				</p>
				{last ? (
					<button
						type="button"
						className="recall-quiet-button recall-player-chrome mb-3 min-h-11 self-center"
						onClick={() => {
							setCurrentId(ids[0]!);
							setRevealed(false);
						}}
					>
						Học lại từ đầu
					</button>
				) : null}

				<p className="recall-player-hint recall-player-chrome">
					Space để lật · ← → để chuyển · F để trình chiếu
				</p>
				<nav className="recall-controls" aria-label={presentation ? 'Điều khiển trình chiếu' : 'Điều hướng thẻ'}>
					<button
						type="button"
						className="recall-nav-button"
						onClick={() => move(-1)}
						disabled={first}
					>
						← Trước
					</button>
					<button type="button" className="recall-reveal-button" onClick={flip}>
						{flipLabel}
					</button>
					<button
						type="button"
						className="recall-nav-button"
						onClick={() => move(1)}
						disabled={last}
					>
						Tiếp →
					</button>
					{presentation ? (
						<button
							type="button"
							className="recall-nav-button recall-nav-button-exit"
							onClick={() => void leavePresentation()}
						>
							Thoát
						</button>
					) : null}
				</nav>
			</div>
		</main>
	);
}
