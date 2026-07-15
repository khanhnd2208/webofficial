/**
 * Local podcast catalog for /phat-trien-ban-than.
 * Publication gate: nav + page only publish when at least one non-draft episode
 * has real audio, cover, and metadata. Do not invent episodes.
 */

export type PodcastEpisode = {
	episodeNumber: number;
	title: string;
	slug: string;
	description: string;
	publishedAt: string;
	duration: string;
	coverImage: string;
	audioUrl: string;
	spotifyUrl?: string;
	youtubeUrl?: string;
	transcript?: string;
	featured: boolean;
	draft: boolean;
};

/**
 * Empty until the owner adds a real episode (audio + cover + metadata).
 * Keep this array free of placeholders.
 */
export const podcastEpisodes: PodcastEpisode[] = [];

export function getPublishedPodcastEpisodes(): PodcastEpisode[] {
	return podcastEpisodes
		.filter(
			(ep) =>
				!ep.draft &&
				Boolean(ep.audioUrl) &&
				Boolean(ep.coverImage) &&
				Boolean(ep.title) &&
				Boolean(ep.description) &&
				Boolean(ep.publishedAt) &&
				Boolean(ep.duration) &&
				Boolean(ep.transcript?.trim()),
		)
		.sort((a, b) => b.episodeNumber - a.episodeNumber);
}

export function hasPublishedPodcastEpisodes(): boolean {
	return getPublishedPodcastEpisodes().length > 0;
}

export function getLatestPodcastEpisode(): PodcastEpisode | null {
	return getPublishedPodcastEpisodes()[0] ?? null;
}

/** Homepage only publishes episodes that include an accessible transcript. */
export function getHomePodcastEpisode(): PodcastEpisode | null {
	return (
		getPublishedPodcastEpisodes().find((episode) => Boolean(episode.transcript?.trim())) ?? null
	);
}

export function getFeaturedPodcastEpisode(): PodcastEpisode | null {
	const published = getPublishedPodcastEpisodes();
	return published.find((ep) => ep.featured) ?? published[0] ?? null;
}

export function getPodcastEpisodeBySlug(slug: string): PodcastEpisode | undefined {
	return getPublishedPodcastEpisodes().find((ep) => ep.slug === slug);
}
