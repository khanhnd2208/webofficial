import { homePageContent } from '@/content/home';
import type { PodcastEpisode } from '@/content/podcast';

import HomePodcast from './HomePodcast';
import styles from './home.module.css';

type Props = {
	podcast: PodcastEpisode | null;
};

export default function HomeWriting({ podcast }: Props) {
	const { writingInterlude } = homePageContent;

	return (
		<section
			className={`${styles.section} ${styles.writing} ${styles.interludeSection}`}
			aria-label="Suy ngẫm về cảm xúc và trưởng thành"
		>
			<div className="shell">
				<div className={styles.personalInterlude}>
					<span className={styles.interludeMark} aria-hidden>
						“
					</span>
					<blockquote>{writingInterlude.quote}</blockquote>
					<p>{writingInterlude.body}</p>
				</div>

				{podcast ? <HomePodcast episode={podcast} /> : null}
			</div>
		</section>
	);
}
