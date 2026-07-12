import Link from 'next/link';

import EditorialMedia from '@/components/motion/EditorialMedia';
import SectionReveal from '@/components/motion/SectionReveal';
import { routes } from '@/config/routes';
import { formatDateShort } from '@/utils/formatDate';

type PostCard = {
	id: string;
	slug: string;
	title: string;
	summary: string | null | undefined;
	thumbnailUrl?: string | null;
	category?: string | null;
	chapterNumber?: string | number | null;
	publishedAt?: string | null;
	createdAt: string;
	views?: number;
};

function estimateRead(summary: string | null | undefined) {
	if (!summary) return null;
	const mins = Math.max(1, Math.round(summary.split(/\s+/).length / 40));
	return `${mins} phút đọc`;
}

export function FeaturedSpread({ posts }: { posts: PostCard[] }) {
	if (posts.length === 0) return null;
	const [lead, side] = posts;

	return (
		<section className="border-b border-hairline">
			<div className="shell py-[var(--section-space)]">
				<div className="flex items-end justify-between gap-4">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">
							Bài chọn lọc
						</p>
						<h2 className="mt-2 font-display type-section font-medium text-ink">Bài chọn lọc</h2>
					</div>
					<Link
						href={routes.posts}
						className="hidden text-xs font-semibold uppercase tracking-widest text-ink-secondary transition-colors hover:text-ink sm:inline"
					>
						Tất cả →
					</Link>
				</div>

				<div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-12">
					<SectionReveal className="lg:col-span-8">
						<article>
							<Link href={routes.post(lead.slug)} className="group block">
								<EditorialMedia
									src={lead.thumbnailUrl}
									alt=""
									title={lead.title}
									kicker={lead.category}
									index={lead.chapterNumber ?? '01'}
									aspectRatio="16 / 10"
									priority
								/>
								<p className="mt-6 font-mono text-[10px] tracking-[0.2em] text-vermilion">01</p>
								<h3 className="mt-2 font-display text-3xl font-medium leading-tight text-ink transition-colors group-hover:text-vermilion sm:text-4xl">
									{lead.title}
								</h3>
								{lead.summary ? (
									<p className="mt-3 max-w-xl text-base leading-relaxed text-ink-secondary">{lead.summary}</p>
								) : null}
								<p className="mt-4 font-mono text-[11px] text-ink-secondary">
									{lead.category && lead.category !== 'Uncategorized' ? `${lead.category} · ` : ''}
									<time>{formatDateShort(lead.publishedAt ?? lead.createdAt)}</time>
									{estimateRead(lead.summary) ? ` · ${estimateRead(lead.summary)}` : ''}
								</p>
							</Link>
						</article>
					</SectionReveal>

					{side ? (
						<SectionReveal className="lg:col-span-4" delay={0.08}>
							<article className="lg:pt-16">
								<Link href={routes.post(side.slug)} className="group block">
									<EditorialMedia
										src={side.thumbnailUrl}
										alt=""
										title={side.title}
										kicker={side.category}
										index={side.chapterNumber ?? '02'}
										aspectRatio="4 / 5"
									/>
									<p className="mt-5 font-mono text-[10px] tracking-[0.2em] text-vermilion">02</p>
									<h3 className="mt-2 font-display text-2xl font-medium leading-snug text-ink transition-colors group-hover:text-vermilion">
										{side.title}
									</h3>
									<p className="mt-3 font-mono text-[11px] text-ink-secondary">
										<time>{formatDateShort(side.publishedAt ?? side.createdAt)}</time>
									</p>
								</Link>
							</article>
						</SectionReveal>
					) : null}
				</div>
			</div>
		</section>
	);
}

export function RecentJournal({ posts }: { posts: PostCard[] }) {
	if (posts.length === 0) return null;

	return (
		<section>
			<div className="shell py-[var(--section-space)]">
				<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Mới cập nhật</p>
				<h2 className="mt-2 font-display type-section font-medium text-ink">Mới cập nhật</h2>

				<div className="mt-12 space-y-0">
					{posts.map((post, i) => {
						const pattern = i % 3;
						const isWide = pattern === 1;
						const textOnly = !post.thumbnailUrl || pattern === 2;
						const aspect = textOnly ? '4 / 5' : isWide ? '16 / 10' : '4 / 5';

						return (
							<SectionReveal key={post.id}>
								<article className="border-t border-hairline py-10 first:border-t-0 first:pt-0">
									<Link
										href={routes.post(post.slug)}
										className={`group grid gap-8 ${
											textOnly ? 'md:grid-cols-[0.9fr_1.2fr]' : isWide ? 'md:grid-cols-[1.4fr_1fr]' : 'md:grid-cols-[0.9fr_1.2fr]'
										}`}
									>
										<EditorialMedia
											src={textOnly ? null : post.thumbnailUrl}
											alt=""
											title={post.title}
											kicker={post.category}
											index={post.chapterNumber ?? i + 1}
											aspectRatio={aspect}
										/>
										<div className="flex flex-col justify-center">
											{(post.category && post.category !== 'Uncategorized') || post.chapterNumber ? (
												<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-secondary">
													{post.chapterNumber ? `Chương ${post.chapterNumber}` : null}
													{post.chapterNumber && post.category && post.category !== 'Uncategorized'
														? ' · '
														: null}
													{post.category && post.category !== 'Uncategorized' ? post.category : null}
												</p>
											) : null}
											<h3 className="mt-2 font-display text-2xl font-medium leading-snug text-ink transition-colors group-hover:text-vermilion sm:text-3xl">
												{post.title}
											</h3>
											{post.summary ? (
												<p className="mt-3 line-clamp-3 text-base leading-relaxed text-ink-secondary">
													{post.summary}
												</p>
											) : null}
											<p className="mt-5 font-mono text-[11px] text-ink-secondary">
												<time>{formatDateShort(post.publishedAt ?? post.createdAt)}</time>
											</p>
										</div>
									</Link>
								</article>
							</SectionReveal>
						);
					})}
				</div>
			</div>
		</section>
	);
}
