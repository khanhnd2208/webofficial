import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import AudioPlayer from '@/components/podcast/AudioPlayer';
import { getPodcastEpisodeBySlug, hasPublishedPodcastEpisodes } from '@/content/podcast';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const ep = getPodcastEpisodeBySlug(slug);
	if (!ep) return { title: 'Tập podcast', robots: { index: false } };
	return {
		title: ep.title,
		description: ep.description,
		alternates: { canonical: absoluteUrl(routes.growthEpisode(ep.slug)) },
	};
}

export default async function GrowthEpisodePage({ params }: Props) {
	if (!hasPublishedPodcastEpisodes()) notFound();
	const { slug } = await params;
	const ep = getPodcastEpisodeBySlug(slug);
	if (!ep) notFound();

	return (
		<main className="min-h-screen">
			<section className="section-space">
				<div className="shell max-w-3xl">
					<Link
						href={routes.growth}
						className="text-xs font-semibold uppercase tracking-wider text-ink-secondary hover:text-accent"
					>
						← Phát triển bản thân
					</Link>
					<div className="mt-6 grid gap-6 md:grid-cols-12">
						<div className="relative aspect-square overflow-hidden md:col-span-4">
							<Image src={ep.coverImage} alt="" fill sizes="33vw" className="object-cover" />
						</div>
						<div className="md:col-span-8">
							<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent">
								Tập {ep.episodeNumber}
							</p>
							<h1 className="mt-2 font-display type-page-title font-medium text-ink">{ep.title}</h1>
							<p className="type-lead mt-3 text-ink-secondary">{ep.description}</p>
							<div className="mt-5">
								<AudioPlayer audioUrl={ep.audioUrl} title={ep.title} durationLabel={ep.duration} />
							</div>
						{ep.transcript ? (
							<section className="mt-8" aria-labelledby="transcript-title">
								<h2 id="transcript-title" className="font-display type-section font-medium text-ink">
									Bản chép lời
								</h2>
								<div className="prose-article mt-4 whitespace-pre-wrap text-ink-secondary">
									{ep.transcript}
								</div>
							</section>
						) : null}
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
