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
	const listClassName = [
		styles.writingList,
		latest.length === 1
			? styles.writingListSingle
			: latest.length === 2
				? styles.writingListDouble
				: styles.writingListTriple,
	].join(' ');

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
					<ul className={listClassName}>
						{latest.map((post) => (
							<li key={post.id}>
								<Link href={routes.post(post.slug)} className={styles.writingCard}>
									<time dateTime={post.publishedAt ?? post.createdAt}>
										{formatDate(post.publishedAt ?? post.createdAt)}
									</time>
									<h3>{post.title}</h3>
									{post.summary?.trim() ? <p>{post.summary.trim()}</p> : null}
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
