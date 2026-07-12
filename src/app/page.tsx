import HomeHero from '@/components/home/HomeHero';
import { FeaturedSpread, RecentJournal } from '@/components/home/EditorialSections';
import TeachingInterlude from '@/components/home/TeachingInterlude';
import ClosingFrame from '@/components/home/ClosingFrame';
import { routes } from '@/config/routes';
import { SITE_NAME, SITE_DESCRIPTION, siteProfile } from '@/config/site';
import { auth } from '@/lib/auth';
import { getAllPosts } from '@/services/postService';

export const revalidate = 60;

export const metadata = {
	title: { absolute: SITE_NAME },
	description: SITE_DESCRIPTION,
};

export default async function Home() {
	const [result, session] = await Promise.all([getAllPosts(1, 8), auth()]);
	const posts = result.items;
	const featured = posts.filter((p) => p.isPinned).slice(0, 2);
	const recentPool = featured.length > 0 ? posts.filter((p) => !p.isPinned) : posts;
	const highlight = featured.length > 0 ? featured : recentPool.slice(0, 2);
	const more = (featured.length > 0 ? recentPool : recentPool.slice(2)).slice(0, 4);
	const heroImage = highlight[0]?.thumbnailUrl
		? { src: highlight[0].thumbnailUrl, alt: highlight[0].title }
		: null;

	const isLearner = !!session?.user;

	return (
		<main className="min-h-screen">
		{/* Hồi 1 — Arrival */}
		<HomeHero
			roleLabel={siteProfile.role}
			primaryCta={{ href: routes.posts, label: 'Đọc bài chọn lọc' }}
			secondaryCta={
				isLearner
					? { href: routes.learn, label: 'Tiếp tục học' }
					: { href: routes.teaching, label: 'Tìm hiểu khóa học' }
			}
			featuredImage={heroImage}
		/>

			{/* Hồi 2 — Selected Writing */}
			{highlight.length > 0 ? <FeaturedSpread posts={highlight} /> : null}

			{/* Hồi 3 — Teaching Interlude */}
			<TeachingInterlude />

			{/* Hồi 4 — Recent Journal */}
			{more.length > 0 ? (
				<RecentJournal posts={more} />
			) : posts.length === 0 ? (
				<section>
					<div className="shell py-24 text-center">
						<p className="font-display text-3xl font-medium text-ink">Sắp có nội dung</p>
						<p className="mt-3 text-sm text-ink-secondary">Bài viết sẽ xuất hiện tại đây.</p>
					</div>
				</section>
			) : null}

			{/* Hồi 5 — Closing Frame */}
			<ClosingFrame />
		</main>
	);
}
