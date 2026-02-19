import { notFound } from 'next/navigation';

import EditPostForm from './EditPostForm';

import { getAdminPostById } from '@/services/postService';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const post = await getAdminPostById(id);
	if (!post) notFound();

	return (
		<EditPostForm
			initial={{
				id: post.id,
				title: post.title,
				slug: post.slug,
				summary: post.summary,
				content: post.content,
				contentEn: post.contentEn,
				contentFormat: post.contentFormat,
				category: post.category,
				tags: post.tags,
				thumbnailUrl: post.thumbnailUrl,
				chapterNumber: post.chapterNumber,
				isPinned: post.isPinned,
				isPublished: post.isPublished,
			}}
		/>
	);
}
