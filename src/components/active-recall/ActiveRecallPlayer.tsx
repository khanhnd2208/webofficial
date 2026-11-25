'use client';

import Link from 'next/link';
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
	type PointerEvent as ReactPointerEvent,
} from 'react';

import { usePresentationMode } from './usePresentationMode';
import { useRecallStudy } from './useRecallStudy';

import type { ActiveRecallStudyDeck } from '@/features/active-recall';
import {
	recallHasContent,
	recallPreviewText,
	recallToStoredHtml,
} from '@/features/active-recall/richText';
import { Icon } from '@/components/ui/Icon';

import {
	DEFAULT_READING_SIZE,
	READING_SIZE_LABELS,
	READING_SIZES,
	readStoredReadingSize,
	subscribeReadingSize,
	writeStoredReadingSize,
} from './readingSize';
import RecallFinishPanel from './RecallFinishPanel';
import RecallHintButton, { RecallPresentIcon, RecallSizeGlyph } from './RecallHintButton';
import RecallLanguageSwitch, { type RecallLanguage } from './RecallLanguageSwitch';

type StoredState = {
	currentId?: string;
	shuffled?: boolean;
	viMode?: boolean;
	splitView?: boolean;
};

type CardGesture = { x: number; y: number; skip: boolean; touch: boolean };

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

const CARD_DRAG_PX = 8;
const CARD_SWIPE_PX = 56;
const PRIVACY_NOTE = 'Lượt học được thống kê bằng mã trình duyệt ẩn danh, không cần đăng nhập.';

function RecallText({ children }: { children: string }) {
	return (
		<div
			className="recall-text"
			suppressHydrationWarning
			dangerouslySetInnerHTML={{ __html: recallToStoredHtml(children) }}
		/>
	);
}

function RecallSplitPane({
	label,
	html,
	emptyLabel,
}: {
	label: string;
	html: string;
	emptyLabel: string;
}) {
	return (
		<section className="recall-split-pane" aria-label={label}>
			<p className="recall-split-label">{label}</p>
			{recallHasContent(html) ? (
				<RecallText>{html}</RecallText>
			) : (
				<p className="recall-split-empty">{emptyLabel}</p>
			)}
		</section>
	);
}

export default function ActiveRecallPlayer({
	deck,
	backHref,
	backLabel,
	showViToggle = false,
	surface,
	classSlug,
	testHref,
}: {
	deck: ActiveRecallStudyDeck;
	backHref?: string;
	backLabel?: string;
	showViToggle?: boolean;
	surface?: 'teaching';
	classSlug?: string;
	/** "Test yourself" for this deck: a boss quizzes the learner. */
	testHref?: string;
}) {
	const recordStudy = useRecallStudy(deck.id, classSlug);
	const originalIds = useMemo(() => deck.cards.map((card) => card.id), [deck.cards]);
	const [ids, setIds] = useState(originalIds);
	const [currentId, setCurrentId] = useState(deck.cards[0]?.id ?? '');
	const [revealed, setRevealed] = useState(false);
	const [finished, setFinished] = useState(false);
	const [shuffled, setShuffled] = useState(false);
	const [viMode, setViMode] = useState(false);
	const [splitView, setSplitView] = useState(false);
	const [hydrated, setHydrated] = useState(false);
	const [optionsOpen, setOptionsOpen] = useState(false);
	const readingSize = useSyncExternalStore(
		subscribeReadingSize,
		readStoredReadingSize,
		() => DEFAULT_READING_SIZE,
	);
	const optionsId = useId();
	const rootRef = useRef<HTMLElement>(null);
	const cardBodyRef = useRef<HTMLDivElement>(null);
	const toolsRef = useRef<HTMLDivElement>(null);
	const optionsToggleRef = useRef<HTMLButtonElement>(null);
	const cardGesture = useRef<CardGesture>({ x: 0, y: 0, skip: false, touch: false });
	const storageKey = `active-recall:${deck.id}`;
	const byId = useMemo(() => new Map(deck.cards.map((card) => [card.id, card])), [deck.cards]);
	const currentIndex = Math.max(0, ids.indexOf(currentId));
	const card = byId.get(currentId) ?? deck.cards[0];
	const language: RecallLanguage = splitView ? 'split' : viMode ? 'vi' : 'en';
	const closeOptions = useCallback(() => setOptionsOpen(false), []);
	const { presentation, fallbackPresentation, leavePresentation, togglePresentation } =
		usePresentationMode(rootRef, closeOptions);

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
				if (showViToggle && stored.viMode) setViMode(true);
				if (showViToggle && stored.splitView) setSplitView(true);
				setHydrated(true);
			}, 0);
			return () => {
				cancelled = true;
				window.clearTimeout(timer);
			};
		} catch {
			const timer = window.setTimeout(() => setHydrated(true), 0);
			return () => window.clearTimeout(timer);
		}
	}, [byId, originalIds, showViToggle, storageKey]);

	useEffect(() => {
		if (!hydrated || !card) return;
		try {
			let previous: StoredState = {};
			try {
				previous = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as StoredState;
			} catch {
				previous = {};
			}
			localStorage.setItem(
				storageKey,
				JSON.stringify({
					currentId: card.id,
					shuffled,
					viMode: showViToggle ? viMode : Boolean(previous.viMode),
					splitView: showViToggle ? splitView : Boolean(previous.splitView),
				} satisfies StoredState),
			);
		} catch {
			// Device-local resume is optional.
		}
	}, [card, hydrated, shuffled, showViToggle, splitView, storageKey, viMode]);

	useEffect(() => {
		const body = cardBodyRef.current;
		if (!body) return;
		const scrollers = [body, ...body.querySelectorAll<HTMLElement>('.recall-split-pane')];
		for (const scroller of scrollers) {
			if (typeof scroller.scrollTo === 'function') scroller.scrollTo({ top: 0, left: 0 });
			else scroller.scrollTop = 0;
		}
	}, [currentId, revealed, splitView, finished]);

	useEffect(() => {
		if (!optionsOpen) return;
		const onPointerDown = (event: PointerEvent) => {
			if (event.target instanceof Node && toolsRef.current?.contains(event.target)) return;
			// A tap that only closes the menu should not also flip the card underneath.
			cardGesture.current.skip = true;
			setOptionsOpen(false);
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			event.stopImmediatePropagation();
			setOptionsOpen(false);
			optionsToggleRef.current?.focus();
		};
		document.addEventListener('pointerdown', onPointerDown);
		window.addEventListener('keydown', onKeyDown, true);
		return () => {
			document.removeEventListener('pointerdown', onPointerDown);
			window.removeEventListener('keydown', onKeyDown, true);
		};
	}, [optionsOpen]);

	const move = useCallback(
		(direction: -1 | 1) => {
			if (finished) {
				// Back from the summary returns to the last card; forward has nowhere to go.
				if (direction === -1) setFinished(false);
				return;
			}
			if (direction === 1 && currentIndex === ids.length - 1) {
				setFinished(true);
				setRevealed(false);
				return;
			}
			const next = Math.min(Math.max(0, currentIndex + direction), ids.length - 1);
			if (ids[next] && ids[next] !== currentId) {
				recordStudy(false);
				setCurrentId(ids[next]);
			}
			setRevealed(false);
		},
		[currentId, currentIndex, finished, ids, recordStudy],
	);
	const flip = useCallback(() => {
		if (finished) return;
		recordStudy(!revealed);
		setRevealed((value) => !value);
	}, [finished, recordStudy, revealed]);

	const onCardPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
		cardGesture.current = {
			x: event.clientX,
			y: event.clientY,
			skip: hasTextSelection(),
			touch: event.pointerType !== 'mouse',
		};
	}, []);

	const onCardPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
		const gesture = cardGesture.current;
		if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > CARD_DRAG_PX) {
			gesture.skip = true;
		}
	}, []);

	const onCardPointerUp = useCallback(
		(event: ReactPointerEvent<HTMLElement>) => {
			const gesture = cardGesture.current;
			if (hasTextSelection()) {
				gesture.skip = true;
				return;
			}
			const dx = event.clientX - gesture.x;
			const dy = event.clientY - gesture.y;
			// A clear sideways swipe on a touch screen changes card; vertical drags stay scrolls.
			if (gesture.touch && Math.abs(dx) >= CARD_SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
				gesture.skip = true;
				move(dx < 0 ? 1 : -1);
			}
		},
		[move],
	);

	const onCardClick = useCallback(() => {
		if (cardGesture.current.skip || hasTextSelection()) return;
		flip();
	}, [flip]);

	const applyOrder = useCallback((nextIds: string[], nextShuffled: boolean) => {
		setIds(nextIds);
		setCurrentId(nextIds[0] ?? '');
		setRevealed(false);
		setFinished(false);
		setShuffled(nextShuffled);
	}, []);

	const toggleShuffle = useCallback(() => {
		setOptionsOpen(false);
		if (shuffled) {
			applyOrder(originalIds, false);
			return;
		}
		applyOrder(shuffle(originalIds), true);
	}, [applyOrder, originalIds, shuffled]);

	const restart = useCallback(() => {
		if (ids[0] !== currentId) recordStudy(false);
		setCurrentId(ids[0]!);
		setRevealed(false);
		setFinished(false);
	}, [currentId, ids, recordStudy]);

	const changeLanguage = useCallback(
		(next: RecallLanguage) => {
			if (next === 'split') {
				if (!splitView) recordStudy(false);
				setSplitView(true);
				return;
			}
			setSplitView(false);
			setViMode(next === 'vi');
		},
		[recordStudy, splitView],
	);

	const chooseReadingSize = useCallback((size: (typeof READING_SIZES)[number]) => {
		writeStoredReadingSize(size);
	}, []);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (
				event.key === 'Escape' &&
				(presentation || document.fullscreenElement === rootRef.current)
			) {
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
				flip();
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
	}, [flip, leavePresentation, move, presentation, togglePresentation]);

	if (!card) return null;
	const first = currentIndex === 0;
	const last = currentIndex === ids.length - 1;
	const flipLabel = revealed ? 'Xem câu hỏi' : 'Hiện đáp án';
	const questionText = viMode && card.questionVi ? card.questionVi : card.question;
	const answerText = viMode && card.answerVi ? card.answerVi : card.answer;
	const recapText = recallPreviewText(splitView ? card.question : questionText);
	const progress = finished ? 1 : (currentIndex + 1) / ids.length;

	return (
		<main
			ref={rootRef}
			data-surface={surface}
			className={`recall-player min-h-svh bg-canvas text-ink ${presentation ? 'recall-player-presentation' : ''}`}
			data-reading-size={readingSize}
			data-has-back={backHref && backLabel ? 'true' : 'false'}
			data-has-lang={showViToggle ? 'true' : 'false'}
			data-mode={presentation ? 'presentation' : 'study'}
			data-lang={language}
			role={fallbackPresentation ? 'dialog' : undefined}
			aria-label={fallbackPresentation ? 'Chế độ trình chiếu Active Recall' : undefined}
			aria-modal={fallbackPresentation ? true : undefined}
		>
			<div className="recall-player-inner">
				<div className="recall-player-top recall-player-chrome">
					{backHref && backLabel ? (
						<Link href={backHref} className="recall-player-back">
							<span aria-hidden="true">←</span>{' '}
							<span className="recall-player-back-label">{backLabel}</span>
						</Link>
					) : null}

					<header className="recall-player-head">
						<div className="recall-player-titles">
							<p className="recall-player-meta text-sm text-ink-secondary">
								{[deck.subject, deck.lessonLabel].filter(Boolean).join(' · ')}
							</p>
							<h1 className="recall-player-title">{deck.title}</h1>
						</div>
						<div className="recall-player-tools" ref={toolsRef}>
							{showViToggle ? (
								<RecallLanguageSwitch value={language} onChange={changeLanguage} />
							) : null}
							{testHref ? (
								<Link href={testHref} className="recall-test-link">
									<Icon name="quiz" size={18} aria-hidden="true" />
									Làm Test
								</Link>
							) : null}
							<span className="recall-count tabular-nums">
								{currentIndex + 1}/{ids.length}
							</span>
							<button
								ref={optionsToggleRef}
								type="button"
								className="recall-options-toggle"
								aria-label="Tùy chọn"
								aria-expanded={optionsOpen}
								aria-controls={optionsId}
								onClick={() => setOptionsOpen((open) => !open)}
							>
								<Icon name="more_horiz" size={22} aria-hidden="true" />
							</button>
							<div className="recall-options" id={optionsId} data-open={optionsOpen}>
								<button
									type="button"
									className="recall-quiet-button"
									aria-pressed={shuffled}
									onClick={toggleShuffle}
								>
									{shuffled ? 'Về thứ tự ban đầu' : 'Xáo câu'}
								</button>
								<div className="recall-options-row">
									<span className="recall-options-label" aria-hidden="true">
										Cỡ chữ
									</span>
									<div className="recall-size-group" role="radiogroup" aria-label="Cỡ chữ">
										{READING_SIZES.map((size) => (
											<RecallHintButton
												key={size}
												role="radio"
												aria-checked={readingSize === size}
												className="recall-icon-button"
												label={READING_SIZE_LABELS[size]}
												hint={size === 'small' ? 'Cỡ chữ nhỏ' : 'Cỡ chữ lớn'}
												onClick={() => chooseReadingSize(size)}
											>
												<RecallSizeGlyph size={size} />
											</RecallHintButton>
										))}
									</div>
								</div>
								<RecallHintButton
									className="recall-icon-button"
									tipClassName="recall-present-tip"
									label="Trình chiếu"
									hint="Trình chiếu toàn màn hình"
									onClick={() => void togglePresentation()}
								>
									<RecallPresentIcon />
								</RecallHintButton>
								<details className="recall-options-note">
									<summary>Thông tin ôn tập</summary>
									<p>Chạm thẻ để lật, vuốt ngang để chuyển thẻ.</p>
									<p>{PRIVACY_NOTE}</p>
								</details>
							</div>
						</div>
					</header>
				</div>

				<div className="recall-progress" aria-hidden="true">
					<span style={{ width: `${progress * 100}%` }} />
				</div>

				<section className="recall-card-shell" aria-live="polite" aria-atomic="true">
					{finished ? (
						<RecallFinishPanel
							total={ids.length}
							testHref={testHref}
							onShuffleRestart={() => applyOrder(shuffle(originalIds), true)}
							backHref={backHref}
							backLabel={backLabel}
						/>
					) : (
						<article
							role="button"
							tabIndex={0}
							aria-label={
								revealed ? 'Thẻ đáp án. Chạm để xem câu hỏi' : 'Thẻ câu hỏi. Chạm để hiện đáp án'
							}
							onPointerDown={onCardPointerDown}
							onPointerMove={onCardPointerMove}
							onPointerUp={onCardPointerUp}
							onClick={onCardClick}
							onKeyDown={(event) => {
								if (event.key === ' ' || event.key === 'Enter') {
									event.preventDefault();
									event.stopPropagation();
									flip();
								}
							}}
							className={`recall-card ${revealed ? 'is-revealed' : ''} ${splitView ? 'is-split' : ''}`}
							data-side={revealed ? 'answer' : 'question'}
						>
							<p className="recall-card-kicker">{revealed ? 'Đáp án' : 'Câu hỏi'}</p>
							{revealed && recapText ? (
								<div className="recall-card-recap">
									<p className="recall-card-recap-text">
										<span className="sr-only">Câu hỏi: </span>
										{recapText}
									</p>
								</div>
							) : null}
							<div
								className="recall-card-body"
								ref={cardBodyRef}
								onScrollCapture={() => {
									cardGesture.current.skip = true;
								}}
							>
								{splitView ? (
									<div className="recall-split">
										<RecallSplitPane
											label="EN"
											html={revealed ? card.answer : card.question}
											emptyLabel="Không có nội dung"
										/>
										<RecallSplitPane
											label="VI"
											html={revealed ? card.answerVi : card.questionVi}
											emptyLabel="Chưa có bản tiếng Việt"
										/>
									</div>
								) : (
									<RecallText>{revealed ? answerText : questionText}</RecallText>
								)}
							</div>
						</article>
					)}
				</section>

				<p className="recall-player-hint recall-player-chrome">
					Space để lật · ← → để chuyển · F để trình chiếu
				</p>
				<nav
					className="recall-controls"
					aria-label={presentation ? 'Điều khiển trình chiếu' : 'Điều hướng thẻ'}
				>
					<button
						type="button"
						className="recall-nav-button"
						aria-label="← Trước"
						title="Thẻ trước"
						onClick={() => move(-1)}
						disabled={first && !finished}
					>
						<Icon name="arrow_back" size={20} aria-hidden="true" />{' '}
						<span className="recall-direction-label">Trước</span>
					</button>
					{finished ? (
						<button type="button" className="recall-reveal-button" onClick={restart}>
							Học lại từ đầu
						</button>
					) : (
						<>
							<button
								type="button"
								className={revealed ? 'recall-nav-button' : 'recall-reveal-button'}
								onClick={flip}
							>
								{flipLabel}
							</button>
							<button
								type="button"
								className={
									revealed
										? 'recall-reveal-button'
										: last
											? 'recall-nav-button recall-nav-button-finish'
											: 'recall-nav-button'
								}
								aria-label={last ? 'Hoàn thành' : 'Tiếp →'}
								title={last ? 'Hoàn thành' : 'Thẻ tiếp theo'}
								onClick={() => move(1)}
							>
								{last ? (
									'Hoàn thành'
								) : (
									<>
										<span className="recall-direction-label">Tiếp</span>{' '}
										<Icon name="arrow_forward" size={20} aria-hidden="true" />
									</>
								)}
							</button>
						</>
					)}
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
				<p className="recall-player-privacy recall-player-chrome">{PRIVACY_NOTE}</p>
			</div>
		</main>
	);
}
