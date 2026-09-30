import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { getPostBySlug } from '@/services/postService';
import StoryCover from '@/features/experiences/StoryCover';
import { storyCoverSource } from '@/features/experiences/coverSource';

export const dynamic = 'force-dynamic';
type StoryProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: StoryProps): Promise<Metadata> {
	const { slug } = await params;
	const story = await getPostBySlug(slug);
	if (!story) return { title: 'Không tìm thấy câu chuyện', robots: { index: false } };
	return {
		title: `${story.title} — Trải nghiệm`,
		description: story.summary,
		alternates: { canonical: absoluteUrl(routes.experienceStory(slug)) },
	};
}

export default async function ExperienceStoryPage({ params }: StoryProps) {
	const { slug } = await params;
	const story = await getPostBySlug(slug);
	if (!story) notFound();
	return (
		<main className="personal-book book-experiences">
			<article className="experience-article">
				<Link href={`${routes.experiences}#cau-chuyen`} className="about-text-link">
					← Trải nghiệm của tôi
				</Link>
				<header>
					<h1 className="book-page-title">{story.title}</h1>
					{story.summary ? <p>{story.summary}</p> : null}
				</header>
				{story.thumbnailUrl ? (
					<StoryCover
						src={await storyCoverSource(story.thumbnailUrl)}
						className="experience-article-cover"
					/>
				) : null}
				{story.contentFormat === 'markdown' ? (
					<div className="experience-prose">
						<ReactMarkdown remarkPlugins={[remarkGfm]}>{story.content}</ReactMarkdown>
					</div>
				) : (
					<div
						className="experience-prose"
						dangerouslySetInnerHTML={{
							__html: DOMPurify.sanitize(story.content, { USE_PROFILES: { html: true } }),
						}}
					/>
				)}
			</article>
		</main>
	);
}
