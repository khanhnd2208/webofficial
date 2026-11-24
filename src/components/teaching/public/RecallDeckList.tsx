'use client';

import Link from 'next/link';

import { routes } from '@/config/routes';
import type { PublicRecallDeckListItem } from '@/features/teaching/types';

export function RecallDeckList({
	slug,
	decks,
}: {
	slug: string;
	decks: PublicRecallDeckListItem[];
}) {
	return (
		<div
			id="public-panel-recall"
			role="tabpanel"
			aria-labelledby="public-tab-recall"
			className="public-notes-panel"
		>
			<Link href={routes.teachingPublicRecallTest(slug)} className="recall-test-cta mb-4">
				<span className="recall-test-cta-title">Test yourself</span>
				<span className="recall-test-cta-text">
					Chọn bộ câu hỏi, gặp boss ngẫu nhiên và để boss kiểm tra bài cũ.
				</span>
				<span aria-hidden="true">→</span>
			</Link>
			<ul className="space-y-3">
				{decks.map((deck) => (
					<li key={deck.id}>
						<Link
							href={routes.teachingPublicRecallDeck(slug, deck.slug)}
							className="mc-surface block px-4 py-4 hover:border-accent"
						>
							<p className="text-xs text-ink-secondary">{deck.lessonLabel || 'Bộ thẻ'}</p>
							<p className="mt-1 text-base font-semibold text-ink">{deck.title}</p>
							{deck.description ? (
								<p className="mt-1 text-sm text-ink-secondary">{deck.description}</p>
							) : null}
							<p className="mt-2 text-xs tabular-nums text-ink-secondary">{deck.cardCount} thẻ →</p>
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
