'use client';

import Link from 'next/link';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
	type PointerEvent as ReactPointerEvent,
} from 'react';

import type { ActiveRecallStudyDeck } from '@/features/active-recall';
import {
	recallHasContent,
	recallPreviewText,
	recallToStoredHtml,
} from '@/features/active-recall/richText';
import { Icon } from '@/components/ui/Icon';

import {
	markCardKnown,
	readDeckProgress,
	subscribeDeckProgress,
	writeDeckProgress,
} from './deckProgress';
import {
	DEFAULT_READING_SIZE,
	readStoredReadingSize,
	subscribeReadingSize,
	writeStoredReadingSize,
} from './readingSize';
import RecallFinishPanel from './RecallFinishPanel';
import RecallLanguageSwitch, { type RecallLanguage } from './RecallLanguageSwitch';
import RecallOptionsMenu from './RecallOptionsMenu';
import { usePresentationMode } from './usePresentationMode';
import { useRecallStudy } from './useRecallStudy';
import './recall-player.css';

type CardGesture = { x: number; y: number; skip: boolean; touch: boolean };
/** `review` runs only the cards not yet marked known. */
type Scope = 'all' | 'review';

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

/**
 * One deck, one card at a time: think of the answer, flip, then say honestly
 * whether it was there. "Đã nhớ" / "Chưa nhớ" are kept on this device so the
 * finish screen and the deck lists can offer the cards still to learn.
 */
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
	const [scope, setScope] = useState<Scope>('all');
	const [viMode, setViMode] = useState(false);
	const [splitView, setSplitView] = useState(false);
	const [hydrated, setHydrated] = useState(false);
	const readingSize = useSyncExternalStore(
		subscribeReadingSize,
		readStoredReadingSize,
		() => DEFAULT_READING_SIZE,
	);
	const knownKey = useSyncExternalStore(
		subscribeDeckProgress,
		() => (readDeckProgress(deck.id).known ?? []).join('|'),
		() => '',
	);
	const rootRef = useRef<HTMLElement>(null);
	const cardBodyRef = useRef<HTMLDivElement>(null);
	const cardGesture = useRef<CardGesture>({ x: 0, y: 0, skip: false, touch: false });
	const byId = useMemo(() => new Map(deck.cards.map((card) => [card.id, card])), [deck.cards]);
	const known = useMemo(
		() => new Set(knownKey.split('|').filter((id) => byId.has(id))),
		[byId, knownKey],
	);
	const hasVi = useMemo(
		() =>
			showViToggle &&
			deck.cards.some(
				(card) => recallHasContent(card.questionVi) || recallHasContent(card.answerVi),
			),
		[deck.cards, showViToggle],
	);
	const currentIndex = Math.max(0, ids.indexOf(currentId));
	const card = byId.get(currentId) ?? deck.cards[0];
	const language: RecallLanguage = !hasVi ? 'en' : splitView ? 'split' : viMode ? 'vi' : 'en';
	const { presentation, fallbackPresentation, leavePresentation, togglePresentation } =
		usePresentationMode(rootRef);

	useEffect(() => {
		const stored = readDeckProgress(deck.id);
		const timer = window.setTimeout(() => {
			if (stored.shuffled) {
				setIds(shuffle(originalIds));
				setShuffled(true);
			}
			if (stored.currentId && byId.has(stored.currentId)) setCurrentId(stored.currentId);
			if (showViToggle && stored.viMode) setViMode(true);
			if (showViToggle && stored.splitView) setSplitView(true);
			setHydrated(true);
		}, 0);
		return () => window.clearTimeout(timer);
	}, [byId, deck.id, originalIds, showViToggle]);

	useEffect(() => {
		if (!hydrated || !card) return;
		const previous = readDeckProgress(deck.id);
		writeDeckProgress(deck.id, {
			// A review run is a detour: resume the full deck where it was.
			currentId: scope === 'all' ? card.id : previous.currentId,
			shuffled,
			viMode: showViToggle ? viMode : Boolean(previous.viMode),
			splitView: showViToggle ? splitView : Boolean(previous.splitView),
			studiedAt: Date.now(),
		});
	}, [card, deck.id, hydrated, scope, shuffled, showViToggle, splitView, viMode]);

	useEffect(() => {
		const body = cardBodyRef.current;
		if (!body) return;
		const scrollers = [body, ...body.querySelectorAll<HTMLElement>('.recall-split-pane')];
		for (const scroller of scrollers) {
			if (typeof scroller.scrollTo === 'function') scroller.scrollTo({ top: 0, left: 0 });
			else scroller.scrollTop = 0;
		}
	}, [currentId, revealed, splitView, finished]);

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

	/** Grading only counts once the answer has been seen. */
	const grade = useCallback(
		(remembered: boolean) => {
			if (finished || !revealed || !card) return;
			markCardKnown(deck.id, card.id, remembered);
			move(1);
		},
		[card, deck.id, finished, move, revealed],
	);

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

	const startRun = useCallback(
		(nextIds: string[], nextScope: Scope, nextShuffled: boolean) => {
			if (!nextIds.length) return;
			if (nextIds[0] !== currentId) recordStudy(false);
			setIds(nextIds);
			setCurrentId(nextIds[0]!);
			setRevealed(false);
			setFinished(false);
			setScope(nextScope);
			setShuffled(nextShuffled);
		},
		[currentId, recordStudy],
	);

	const unknownIds = useMemo(
		() => originalIds.filter((id) => !known.has(id)),
		[known, originalIds],
	);

	const toggleShuffle = useCallback(() => {
		const base = scope === 'review' ? unknownIds : originalIds;
		startRun(shuffled ? base : shuffle(base), scope, !shuffled);
	}, [originalIds, scope, shuffled, startRun, unknownIds]);

	const reviewUnknown = useCallback(
		() => startRun(shuffled ? shuffle(unknownIds) : unknownIds, 'review', shuffled),
		[shuffled, startRun, unknownIds],
	);

	const studyAll = useCallback(
		(withShuffle: boolean) =>
			startRun(withShuffle ? shuffle(originalIds) : originalIds, 'all', withShuffle),
		[originalIds, startRun],
	);

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

	const resetProgress = useCallback(() => {
		writeDeckProgress(deck.id, { known: [] });
		if (scope === 'review') studyAll(shuffled);
	}, [deck.id, scope, shuffled, studyAll]);

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
			if (event.metaKey || event.ctrlKey || event.altKey) return;
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
			} else if (event.key === '1' && !presentation) {
				grade(false);
			} else if (event.key === '2' && !presentation) {
				grade(true);
			} else if (event.key.toLowerCase() === 'f') {
				event.preventDefault();
				void togglePresentation();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [flip, grade, leavePresentation, move, presentation, togglePresentation]);

	if (!card) return null;
	const first = currentIndex === 0;
	const last = currentIndex === ids.length - 1;
	const useVi = language === 'vi';
	const questionText = useVi && card.questionVi ? card.questionVi : card.question;
	const answerText = useVi && card.answerVi ? card.answerVi : card.answer;
	const recapText = recallPreviewText(splitView && hasVi ? card.question : questionText);
	const progress = finished ? 1 : (currentIndex + 1) / ids.length;
	const cardKnown = known.has(card.id);
	const showGrades = revealed && !finished && !presentation;
	const meta = [deck.subject, deck.lessonLabel].filter(Boolean).join(' · ');

	return (
		<main
			ref={rootRef}
			data-surface={surface}
			className={`recall-player text-ink ${presentation ? 'recall-player-presentation' : ''}`}
			data-reading-size={readingSize}
			data-mode={presentation ? 'presentation' : 'study'}
			data-lang={language}
			role={fallbackPresentation ? 'dialog' : undefined}
			aria-label={fallbackPresentation ? 'Chế độ trình chiếu Active Recall' : undefined}
			aria-modal={fallbackPresentation ? true : undefined}
		>
			<div className="recall-player-inner">
				<header className="recall-bar recall-player-chrome">
					{backHref && backLabel ? (
						<Link href={backHref} className="recall-back" aria-label={`Quay lại: ${backLabel}`}>
							<Icon name="arrow_back" size={20} aria-hidden="true" />
							<span className="recall-back-label">{backLabel}</span>
						</Link>
					) : null}
					<div className="recall-player-titles">
						{meta ? <p className="recall-player-meta">{meta}</p> : null}
						<h1 className="recall-player-title">{deck.title}</h1>
					</div>
					<div className="recall-bar-actions">
						{testHref ? (
							<Link href={testHref} className="recall-test-link">
								<Icon name="quiz" size={18} aria-hidden="true" />
								Làm Test
							</Link>
						) : null}
						<RecallOptionsMenu
							shuffled={shuffled}
							onToggleShuffle={toggleShuffle}
							readingSize={readingSize}
							onReadingSize={writeStoredReadingSize}
							onPresent={() => void togglePresentation()}
							knownCount={known.size}
							onResetProgress={resetProgress}
							onOpenChange={(open, byOutsideTap) => {
								// A tap that only closes the menu should not also flip the card underneath.
								if (!open && byOutsideTap) cardGesture.current.skip = true;
							}}
						/>
					</div>
				</header>

				<div className="recall-status recall-player-chrome">
					{hasVi ? <RecallLanguageSwitch value={language} onChange={changeLanguage} /> : null}
					{scope === 'review' ? (
						<button type="button" className="recall-scope-chip" onClick={() => studyAll(shuffled)}>
							Đang ôn thẻ chưa nhớ · <span>Học cả bộ</span>
						</button>
					) : null}
					<p className="recall-status-text" aria-live="polite">
						<span className="recall-count tabular-nums">
							{finished ? ids.length : currentIndex + 1}/{ids.length}
						</span>
						<span className="recall-status-known">
							<Icon name="check" size={14} aria-hidden="true" />
							Đã nhớ{' '}
							<span className="tabular-nums">
								{known.size}/{originalIds.length}
							</span>
						</span>
					</p>
				</div>

				<div className="recall-progress" aria-hidden="true">
					<span style={{ width: `${progress * 100}%` }} />
				</div>

				<section className="recall-card-shell" aria-live="polite" aria-atomic="true">
					{finished ? (
						<RecallFinishPanel
							total={originalIds.length}
							known={known.size}
							reviewing={scope === 'review'}
							testHref={testHref}
							onReviewUnknown={reviewUnknown}
							onRestartAll={() => studyAll(true)}
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
							className={`recall-card ${revealed ? 'is-revealed' : ''} ${splitView && hasVi ? 'is-split' : ''}`}
							data-side={revealed ? 'answer' : 'question'}
						>
							<div className="recall-card-head">
								<p className="recall-card-kicker">{revealed ? 'Đáp án' : 'Câu hỏi'}</p>
								{cardKnown ? (
									<span className="recall-card-known">
										<Icon name="check" size={14} aria-hidden="true" />
										Đã nhớ
									</span>
								) : null}
							</div>
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
								<div className="recall-card-content">
									{splitView && hasVi ? (
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
							</div>
							{!revealed ? (
								<p className="recall-card-cue recall-player-chrome" aria-hidden="true">
									Tự trả lời trong đầu, rồi chạm để lật
								</p>
							) : null}
						</article>
					)}
				</section>

				<nav
					className="recall-controls"
					data-grading={showGrades || undefined}
					aria-label={presentation ? 'Điều khiển trình chiếu' : 'Điều hướng thẻ'}
				>
					<button
						type="button"
						className="recall-nav-button recall-nav-step"
						aria-label="Thẻ trước"
						title="Thẻ trước (←)"
						onClick={() => move(-1)}
						disabled={first && !finished}
					>
						<Icon name="arrow_back" size={20} aria-hidden="true" />
					</button>
					{finished ? null : showGrades ? (
						<>
							<button
								type="button"
								className="recall-grade-button is-again"
								onClick={() => grade(false)}
							>
								<Icon name="retry" size={18} aria-hidden="true" />
								Chưa nhớ
								<kbd aria-hidden="true">1</kbd>
							</button>
							<button
								type="button"
								className="recall-grade-button is-known"
								onClick={() => grade(true)}
							>
								<Icon name="check" size={18} aria-hidden="true" />
								Đã nhớ
								<kbd aria-hidden="true">2</kbd>
							</button>
						</>
					) : (
						<>
							<button
								type="button"
								className={revealed ? 'recall-nav-button' : 'recall-reveal-button'}
								onClick={flip}
							>
								{revealed ? 'Xem câu hỏi' : 'Hiện đáp án'}
								<kbd aria-hidden="true">Space</kbd>
							</button>
							<button
								type="button"
								className="recall-nav-button recall-nav-step"
								aria-label={last ? 'Hoàn thành' : 'Thẻ tiếp theo'}
								title={last ? 'Hoàn thành' : 'Thẻ tiếp theo (→)'}
								onClick={() => move(1)}
							>
								<Icon name={last ? 'check' : 'arrow_forward'} size={20} aria-hidden="true" />
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
			</div>
		</main>
	);
}
