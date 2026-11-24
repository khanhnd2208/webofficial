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
			className="public-notes-panel max-w-3xl"
		>
			<Link href={routes.teachingPublicRecallTest(slug)} className="recall-test-cta mb-4">
				<span className="recall-test-cta-title">Test yourself</span>
				<span className="recall-test-cta-text">
					Chọn bộ câu hỏi, gặp boss ngẫu nhiên và để boss kiểm tra bài cũ.
				</span>
				<span aria-hidden="true">→</span>
			</Link>
			<ul className="mc-surface divide-y divide-mc-rule overflow-hidden">
				{decks.map((deck) => (
					<li key={deck.id}>
						<Link
							href={routes.teachingPublicRecallDeck(slug, deck.slug)}
							className="block min-h-14 px-4 py-3 transition-colors hover:bg-surface-hover"
						>
							<div className="flex items-center justify-between gap-2 text-xs text-ink-secondary">
								<span className="truncate">{deck.lessonLabel || 'Bộ thẻ'}</span>
								<span className="mc-num shrink-0">{deck.cardCount} thẻ →</span>
							</div>
							<p className="mt-1 text-sm font-semibold text-ink sm:text-base">{deck.title}</p>
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
