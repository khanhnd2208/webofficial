import Link from 'next/link';

import { routes } from '@/config/routes';
import { getAllPosts } from '@/services/postService';
import type { GetAllPostsResult } from '@/types/post';
import StoryCover from './StoryCover';
import { storyCoverSource } from './coverSource';

/** Uses the existing editor; the service only returns published stories. */
export default async function StoryList({ page }: { page: number }) {
	let result: GetAllPostsResult;
	try {
		result = await getAllPosts(page, 9, undefined, undefined, 'newest');
	} catch {
		return (
			<p className="experience-quiet" role="status">
				Chưa tải được những câu chuyện. Bạn có thể ghé lại sau.
			</p>
		);
	}
	if (!result.items.length) {
		return (
			<p className="experience-quiet">Những câu chuyện và ảnh chuyến đi sẽ được lưu lại ở đây.</p>
		);
	}
	const covers = await Promise.all(
		result.items.map((story) => (story.thumbnailUrl ? storyCoverSource(story.thumbnailUrl) : null)),
	);
	return (
		<>
			<ul className="experience-story-grid">
				{result.items.map((story, index) => (
					<li key={story.id}>
						<Link href={routes.experienceStory(story.slug)} className="experience-story-card">
							{story.thumbnailUrl ? <StoryCover src={covers[index]!} /> : null}
							<h3>
								{story.title} <span aria-hidden="true">↗</span>
							</h3>
							{story.summary ? <p>{story.summary}</p> : null}
						</Link>
					</li>
				))}
			</ul>
			{result.totalPages > 1 ? (
				<nav className="experience-pagination" aria-label="Trang câu chuyện">
					{page > 1 ? (
						<Link href={`${routes.experiences}?page=${page - 1}#cau-chuyen`}>← Mới hơn</Link>
					) : null}
					<span>
						Trang {result.page} / {result.totalPages}
					</span>
					{page < result.totalPages ? (
						<Link href={`${routes.experiences}?page=${page + 1}#cau-chuyen`}>Cũ hơn →</Link>
					) : null}
				</nav>
			) : null}
		</>
	);
}
