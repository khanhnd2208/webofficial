import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import AudioPlayer from '@/components/podcast/AudioPlayer';
import {
	getPublishedPodcastEpisodes,
	hasPublishedPodcastEpisodes,
} from '@/content/podcast';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';

export const metadata: Metadata = {
	title: 'Phát triển bản thân',
	description: 'Podcast và ghi chép về phát triển bản thân.',
	alternates: { canonical: absoluteUrl(routes.growth) },
};

export default function GrowthPage() {
	if (!hasPublishedPodcastEpisodes()) {
		notFound();
	}

	const episodes = getPublishedPodcastEpisodes();

	return (
		<main className="min-h-screen">
			<section className="section-space border-b border-hairline">
				<div className="shell max-w-2xl">
					<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent">
						Podcast
					</p>
					<h1 className="mt-2.5 font-display type-page-title font-medium text-ink">
						Phát triển bản thân
					</h1>
					<p className="type-lead mt-4 text-ink-secondary">
						Những cuộc trò chuyện để nghe chậm, nghĩ kỹ và nhìn lại điều đang diễn ra trong mình.
					</p>
				</div>
			</section>

			<section className="section-space">
				<div className="shell space-y-10">
					{episodes.map((ep) => (
						<article key={ep.slug} className="grid gap-5 border-t border-hairline pt-6 md:grid-cols-12">
							<div className="relative aspect-square overflow-hidden md:col-span-3">
								<Image
									src={ep.coverImage}
									alt=""
									fill
									sizes="(max-width: 768px) 100vw, 25vw"
									className="object-cover"
								/>
							</div>
							<div className="md:col-span-9">
								<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent">
									Tập {ep.episodeNumber}
								</p>
								<h2 className="mt-2 text-[1.0625rem] font-semibold leading-snug tracking-[-0.01em] text-ink">
									<Link href={routes.growthEpisode(ep.slug)} className="hover:text-accent">
										{ep.title}
									</Link>
								</h2>
								<p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-secondary">
									{ep.description}
								</p>
								<div className="mt-4">
									<AudioPlayer
										audioUrl={ep.audioUrl}
										title={ep.title}
										durationLabel={ep.duration}
									/>
								</div>
							</div>
						</article>
					))}
				</div>
			</section>
		</main>
	);
}
