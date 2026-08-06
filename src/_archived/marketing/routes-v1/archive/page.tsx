import type { Metadata } from 'next';
import Link from 'next/link';

import { archiveContent } from '@/content/about';
import { getPublishedResources } from '@/content/resources';
import { labCategoryForResource } from '@/content/lab';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';

export const metadata: Metadata = {
	title: 'Dự án và tài nguyên',
	description: archiveContent.intro,
	alternates: { canonical: absoluteUrl(routes.archive) },
	robots: { index: false, follow: false },
};

const resourceImages = [
	'/brand/hero-landscape.jpg',
	'/brand/hero-journey.jpg',
	'/brand/hero-figure.jpg',
] as const;

const typeLabel: Record<string, string> = {
	boardgame: 'Trò chơi học tập',
	tool: 'Công cụ',
	template: 'Tài nguyên',
	guide: 'Hướng dẫn',
	experiment: 'Thử nghiệm',
};

export default function ArchivePage() {
	const resources = getPublishedResources();

	return (
		<main className="min-h-screen bg-canvas">
			<section className="border-b border-hairline px-5 py-20 sm:px-8 sm:py-28 lg:py-36">
				<div className="shell">
					<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-accent">
						Dự án · Học cụ · Thử nghiệm
					</p>
					<h1 className="mt-6 max-w-4xl text-balance font-display text-[clamp(3.25rem,7vw,6.5rem)] font-normal leading-[0.95] tracking-[-0.04em] text-ink">
						Những ý tưởng đã bước ra khỏi trang giấy.
					</h1>
					<p className="mt-8 max-w-2xl text-base font-light leading-[1.85] text-ink-secondary sm:text-lg">
						Một tuyển chọn các trò chơi học tập, công cụ và tài nguyên tôi đã xây dựng hoặc đang tiếp tục thử nghiệm.
					</p>
				</div>
			</section>

			<section className="border-b border-hairline">
				<div className="shell flex gap-7 overflow-x-auto py-6 text-[0.625rem] font-semibold uppercase tracking-[0.16em] whitespace-nowrap text-ink-secondary">
					<span className="border-b border-ink pb-1 text-ink">Tất cả</span>
					<span>Trò chơi học tập</span>
					<span>Công cụ</span>
					<span>Tài nguyên</span>
				</div>
			</section>

			<section className="px-5 py-20 sm:px-8 sm:py-28 lg:py-36">
				<div className="shell">
					{resources.length > 0 ? (
						<div className="grid gap-x-12 gap-y-20 md:grid-cols-2 lg:gap-x-16 lg:gap-y-28">
							{resources.map((resource, index) => (
								<article key={resource.slug} className={`group ${index % 2 === 1 ? 'md:translate-y-20' : ''}`}>
									<Link href={`${routes.lab}/${labCategoryForResource(resource.type)}/${resource.slug}`} className="block outline-offset-4">
										<div className="overflow-hidden bg-paper">
											<img
												src={resourceImages[index % resourceImages.length]}
												alt=""
												className="aspect-[4/3] w-full object-cover grayscale-[35%] transition duration-700 group-hover:scale-[1.025] group-hover:grayscale-0"
											/>
										</div>
										<div className="mt-6 border-t border-hairline pt-5">
											<div className="flex items-start justify-between gap-4">
												<div>
													<p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-accent">
														{typeLabel[resource.type] ?? resource.type} · {resource.updatedAt}
													</p>
													<h2 className="mt-3 text-balance font-display text-[clamp(1.9rem,3vw,2.75rem)] font-normal leading-[1.05] tracking-[-0.025em] text-ink transition-colors group-hover:text-accent">
														{resource.title}
													</h2>
												</div>
												<span className="text-xl text-accent transition-transform group-hover:translate-x-1" aria-hidden>↗</span>
											</div>
											<p className="mt-4 max-w-xl text-sm leading-[1.75] text-ink-secondary">{resource.summary}</p>
										</div>
									</Link>
								</article>
							))}
						</div>
					) : (
						<p className="py-20 text-center font-display text-3xl text-ink">Các dự án đang được chuẩn bị.</p>
					)}
				</div>
			</section>

			<section className="border-t border-hairline bg-paper px-5 py-20 sm:px-8 sm:py-24">
				<div className="shell grid gap-10 lg:grid-cols-12 lg:gap-16">
					<div className="lg:col-span-4">
						<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-accent">Lưu trữ</p>
						<h2 className="mt-4 font-display text-4xl font-normal tracking-[-0.025em] text-ink">Nội dung cũ vẫn ở đây.</h2>
					</div>
					<ul className="lg:col-span-7 lg:col-start-6">
						<li className="border-t border-hairline py-5 text-sm text-ink-secondary">
							Thông tin công việc hiện nằm tại <Link href={routes.aboutServices} className="font-semibold text-accent hover:underline">trang Giới thiệu</Link>.
						</li>
						<li className="border-t border-hairline py-5 text-sm text-ink-secondary">
							Học viên tiếp tục sử dụng <Link href={routes.accountLearning} className="font-semibold text-accent hover:underline">Khu học tập</Link>.
						</li>
					</ul>
				</div>
			</section>
		</main>
	);
}
