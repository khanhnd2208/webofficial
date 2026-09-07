import type { Metadata } from 'next';
import Link from 'next/link';

import { listPublishedRecallDecks } from '@/features/active-recall';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Active Recall',
	description: 'Bộ thẻ câu hỏi và đáp án để tự kiểm tra kiến thức.',
};

export default async function ActiveRecallIndexPage() {
	const decks = await listPublishedRecallDecks();
	return (
		<main className="min-h-svh bg-canvas px-6 pt-24 pb-24 sm:px-8 sm:pt-28">
			<div className="shell max-w-5xl">
				<header className="border-t border-hairline pt-5">
					<h1 className="mt-1 font-display text-[clamp(2.1rem,5vw,4.5rem)] font-medium tracking-tight text-ink">
						Active Recall
					</h1>
					<p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-secondary">
						Tự trả lời trước khi lật thẻ để đối chiếu. Mỗi bộ tập trung vào một bài học hoặc
						chủ đề.
					</p>
				</header>
				<section className="mt-10 border-t border-hairline" aria-label="Các bộ thẻ công khai">
					{decks.length ? (
						decks.map((deck) => (
							<Link
								key={deck.id}
								href={routes.activeRecallDeck(deck.slug)}
								className="recall-deck-row group"
							>
								<div className="recall-stack-mark" aria-hidden="true">
									<i />
									<i />
									<i />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-sm text-ink-secondary">
										{[deck.subject, deck.lessonLabel].filter(Boolean).join(' · ') ||
											'Bộ thẻ'}
									</p>
									<h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-ink transition-colors group-hover:text-[#765625]">
										{deck.title}
									</h2>
									{deck.description ? (
										<p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-secondary">
											{deck.description}
										</p>
									) : null}
								</div>
								<span className="shrink-0 text-sm tabular-nums text-ink-secondary">
									{deck.cardCount} thẻ →
								</span>
							</Link>
						))
					) : (
						<p className="py-12 text-sm text-ink-secondary">
							Chưa có bộ thẻ nào được xuất bản.
						</p>
					)}
				</section>
			</div>
		</main>
	);
}
