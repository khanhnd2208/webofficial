import Link from 'next/link';

import { routes } from '@/config/routes';
import { homePageContent } from '@/content/home';
import type { PodcastEpisode } from '@/content/podcast';
import type { PostListItemDTO } from '@/types/post';

import HomePodcast from './HomePodcast';
import styles from './home.module.css';

type Props = {
	posts: PostListItemDTO[];
	podcast: PodcastEpisode | null;
};

function formatDate(value: string): string {
	return new Date(value).toLocaleDateString('vi-VN', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
}

function normalizeCopy(value: string): string {
	return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
}

function shouldShowSummary(title: string, summary: string | null | undefined): string | null {
	const trimmed = summary?.trim();
	if (!trimmed) return null;
	if (normalizeCopy(trimmed) === normalizeCopy(title)) return null;
	return trimmed;
}

export default function HomeWriting({ posts, podcast }: Props) {
	const { writing } = homePageContent;
	const latest = posts.slice(0, 3);

	return (
		<section className={`${styles.section} ${styles.writing}`} aria-labelledby="home-writing-title">
			<div className={`shell ${styles.homeFrame}`}>
				<header className={styles.writingHeading}>
					<p className={styles.eyebrow}>{writing.eyebrow}</p>
					<h2 id="home-writing-title" className={styles.writingTitle}>
						{writing.title}
					</h2>
					<p className={styles.writingIntro}>{writing.description}</p>
				</header>

				{latest.length > 0 ? (
					<ul className={styles.writingList}>
						{latest.map((post) => {
							const summary = shouldShowSummary(post.title, post.summary);
							return (
								<li key={post.id}>
									<Link href={routes.post(post.slug)} className={styles.writingRow}>
										<time dateTime={post.publishedAt ?? post.createdAt}>
											{formatDate(post.publishedAt ?? post.createdAt)}
										</time>
										<div className={styles.writingBody}>
											<h3>{post.title}</h3>
											{summary ? <p>{summary}</p> : null}
										</div>
										<span className={styles.writingArrow} aria-hidden>
											→
										</span>
									</Link>
								</li>
							);
						})}
					</ul>
				) : (
					<p className={styles.writingEmpty}>Những ghi chép mới đang được chuẩn bị.</p>
				)}

				<Link href={routes.posts} className={styles.textLink}>
					{writing.archiveLabel} <span aria-hidden>→</span>
				</Link>

				{podcast ? <HomePodcast episode={podcast} /> : null}
			</div>
		</section>
	);
}
