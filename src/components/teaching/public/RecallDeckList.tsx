'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';

import { routes } from '@/config/routes';
import type { PublicRecallDeckListItem } from '@/features/teaching/types';

import { parseDeckTitle } from './recallDeckTitle';

/** Deck ids this browser has opened before; the player saves its place per deck. */
function readStartedDecks(decks: PublicRecallDeckListItem[]): string {
	try {
		return decks
			.filter((deck) => window.localStorage.getItem(`active-recall:${deck.id}`))
			.map((deck) => deck.id)
			.join(' ');
	} catch {
		return '';
	}
}

export function RecallDeckList({
	slug,
	decks,
}: {
	slug: string;
	decks: PublicRecallDeckListItem[];
}) {
	const started = useSyncExternalStore(
		() => () => {},
		() => readStartedDecks(decks),
		() => '',
	);
	const startedIds = new Set(started.split(' ').filter(Boolean));
	const totalCards = decks.reduce((sum, deck) => sum + deck.cardCount, 0);

	return (
		<div
			id="public-panel-recall"
			role="tabpanel"
			aria-labelledby="public-tab-recall"
			className="public-notes-panel recall-board"
		>

			<Link href={routes.teachingPublicRecallTest(slug)} className="recall-board-test">
				<span className="min-w-0">
					<span className="recall-board-test-title">Test yourself</span>
					<span className="recall-board-test-text">
						Chọn các bài muốn ôn, trả lời câu hỏi ngẫu nhiên và xem mình nhớ đến đâu.
					</span>
				</span>
				<span className="recall-board-test-action">Bắt đầu</span>
			</Link>

			<div className="recall-board-label">
				<h3>Thẻ ghi nhớ theo bài</h3>
				<span className="mc-num">
					{decks.length} bài · {totalCards} thẻ
				</span>
			</div>
			<ol className="recall-board-list">
				{decks.map((deck) => {
					const heading = parseDeckTitle(deck.title, deck.lessonLabel);
					const inProgress = startedIds.has(deck.id);
					return (
						<li key={deck.id}>
							<Link
								href={routes.teachingPublicRecallDeck(slug, deck.slug)}
								className="recall-board-row"
							>
								<span className="recall-board-num mc-num" aria-hidden={!heading.number}>
									{heading.number ?? '·'}
								</span>
								<span className="min-w-0">
									<span className="recall-board-title">
										{heading.number ? <span className="sr-only">Bài {heading.number}: </span> : null}
										{heading.title}
									</span>
									<span className="recall-board-meta mc-num">
										{deck.cardCount} thẻ
										{inProgress ? <span className="recall-board-progress"> · Đang ôn</span> : null}
									</span>
								</span>
								<span aria-hidden="true" className="recall-board-chevron">
									›
								</span>
							</Link>
						</li>
					);
				})}
			</ol>
		</div>
	);
}
