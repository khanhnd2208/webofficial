import Image from 'next/image';
import Link from 'next/link';

import AudioPlayer from '@/components/podcast/AudioPlayer';
import { routes } from '@/config/routes';
import type { PodcastEpisode } from '@/content/podcast';

import styles from './home.module.css';

export default function HomePodcast({ episode }: { episode: PodcastEpisode }) {
	return (
		<div className={styles.podcastPause} aria-labelledby="latest-podcast-title">
			<div className={styles.podcastIntro}>
				<p className={styles.eyebrow}>PODCAST</p>
				<blockquote>Có những điều chỉ có thể nghe thấy khi thế giới bớt ồn.</blockquote>
			</div>
			<article className={styles.podcastCard}>
				<div className={styles.podcastCover}>
					<Image
						src={episode.coverImage}
						alt={`Ảnh bìa tập podcast ${episode.title}`}
						fill
						sizes="(max-width: 639px) 100vw, 260px"
						className="object-cover"
					/>
				</div>
				<div className={styles.podcastBody}>
					<p className={styles.podcastKicker}>THE LATEST CONVERSATION</p>
					<h3 id="latest-podcast-title">{episode.title}</h3>
					<p>{episode.description}</p>
					<AudioPlayer
						audioUrl={episode.audioUrl}
						title={episode.title}
						durationLabel={episode.duration}
					/>
					<Link href={routes.growthEpisode(episode.slug)} className={styles.textLink}>
						<span>Nghe và đọc transcript</span>
						<span className={styles.arrow} aria-hidden>
							→
						</span>
					</Link>
				</div>
			</article>
		</div>
	);
}
