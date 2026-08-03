import type { Metadata } from 'next';
import Link from 'next/link';

import { ResourceBadge, SectionHeading } from '@/components/marketing';
import { getPublishedResources } from '@/content';
import { labCategoryForResource } from '@/content/lab';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';

export const metadata: Metadata = {
	title: 'Góc của Khánh',
	description: 'Những trò chơi, công cụ, tài nguyên và bản thử nghiệm được Khánh chia sẻ để tham khảo.',
	alternates: { canonical: absoluteUrl(routes.lab) },
	robots: { index: false, follow: false },
};

const GROUPS = [
	{ id: 'boardgame', title: 'Trò chơi học tập', href: routes.labBoardgame, type: 'boardgame' as const },
	{ id: 'tool', title: 'Công cụ', href: routes.labTools, type: 'tool' as const },
	{ id: 'template', title: 'Tài nguyên', href: routes.labResources, types: ['template', 'guide'] as const },
	{ id: 'experiment', title: 'Thử nghiệm', href: routes.labExperiments, type: 'experiment' as const },
];

export default function LabHubPage() {
	const resources = getPublishedResources();

	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline">
				<div className="shell py-10 sm:py-12">
					<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent">
						Thử nghiệm
					</p>
					<h1 className="mt-2.5 font-display type-page-title font-medium text-ink">Góc của Khánh</h1>
					<p className="type-lead mt-4 max-w-xl text-ink-secondary">
						Nơi lưu những trò chơi, công cụ và tài nguyên đang được thử nghiệm. Mỗi mục đều ghi rõ mức
						độ hoàn thiện trước khi bạn sử dụng.
					</p>
				</div>
			</section>

			<section className="border-b border-hairline">
				<div className="shell py-12">
					<nav className="flex flex-wrap gap-4">
						{GROUPS.map((g) => (
							<Link
								key={g.id}
								href={g.href}
								className="text-xs font-semibold uppercase tracking-wider text-ink-secondary hover:text-ink"
							>
								{g.title}
							</Link>
						))}
					</nav>
				</div>
			</section>

			<section>
				<div className="shell py-14 sm:py-16">
					<SectionHeading title="Đang mở" />
					{resources.length === 0 ? (
						<p className="mt-6 text-sm text-ink-secondary">Chưa có tài nguyên nào được chia sẻ.</p>
					) : (
						<ul className="mt-8 grid gap-8 sm:grid-cols-2">
							{resources.map((resource) => (
								<li key={resource.slug} className="border-t border-hairline pt-5">
									<ResourceBadge productStatus={resource.productStatus} access={resource.access} />
									<p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-secondary">
										{resource.audience.join(' · ')} · cập nhật {resource.updatedAt}
									</p>
									<h2 className="mt-3 font-display text-xl font-medium text-ink">
										<Link
											href={`${routes.lab}/${labCategoryForResource(resource.type)}/${resource.slug}`}
											className="hover:text-vermilion"
										>
											{resource.title}
										</Link>
									</h2>
									<p className="mt-2 text-sm text-ink-secondary">{resource.summary}</p>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>
		</main>
	);
}
