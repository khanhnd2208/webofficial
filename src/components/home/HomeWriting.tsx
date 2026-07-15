import Link from 'next/link';

import { routes } from '@/config/routes';
import { homePageContent } from '@/content/home';
import type { PodcastEpisode } from '@/content/podcast';
import type { PostListItemDTO } from '@/types/post';

import HomePodcast from './HomePodcast';
import HomeSectionHeading from './HomeSectionHeading';
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

export default function HomeWriting({ posts, podcast }: Props) {
	const { writing } = homePageContent;
	const latest = posts.slice(0, 3);

	return (
		<section className={`${styles.section} ${styles.writing}`} aria-labelledby="home-writing-title">
			<div className="shell">
				<HomeSectionHeading
					eyebrow={writing.eyebrow}
					title={writing.title}
					description={writing.description}
					id="home-writing-title"
				/>

				{latest.length > 0 ? (
					<ul className={styles.writingList}>
						{latest.map((post) => (
							<li key={post.id}>
								<Link href={routes.post(post.slug)} className={styles.writingCard}>
									<time dateTime={post.publishedAt ?? post.createdAt}>
										{formatDate(post.publishedAt ?? post.createdAt)}
									</time>
									<h3>{post.title}</h3>
									<p>{post.summary?.trim() || 'Mở bài để đọc ghi chép này.'}</p>
									<span>Đọc bài viết →</span>
								</Link>
							</li>
						))}
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
