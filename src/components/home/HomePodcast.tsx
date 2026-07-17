import Image from 'next/image';
import Link from 'next/link';

import { routes } from '@/config/routes';
import type { PodcastEpisode } from '@/content/podcast';

import styles from './home.module.css';

export default function HomePodcast({ episode }: { episode: PodcastEpisode }) {
	return (
		<div className={styles.podcastRow} aria-labelledby="latest-podcast-title">
			<div className={styles.podcastThumb}>
				<Image
					src={episode.coverImage}
					alt={`Ảnh bìa tập podcast ${episode.title}`}
					fill
					sizes="72px"
					className="object-cover"
				/>
			</div>
			<div className={styles.podcastMeta}>
				<p className={styles.podcastKicker}>Podcast</p>
				<h3 id="latest-podcast-title">{episode.title}</h3>
				{episode.duration ? <p className={styles.podcastDuration}>{episode.duration}</p> : null}
			</div>
			<Link href={routes.growthEpisode(episode.slug)} className={styles.textLink}>
				<span>Nghe tập</span>
				<span className={styles.arrow} aria-hidden>
					→
				</span>
			</Link>
		</div>
	);
}
