'use client';

import Link from 'next/link';

import HorizonReveal from '@/components/motion/HorizonReveal';
import { SectionHeading } from '@/components/marketing';
import { routes } from '@/config/routes';
import type { Service } from '@/content/types';
import { stagger } from '@/components/motion/tokens';

type Props = {
	services: Service[];
};

export default function HomeServices({ services }: Props) {
	return (
		<section id="hanh-trinh" className="section-space scroll-mt-[calc(var(--header-height)+1rem)] border-b border-hairline">
			<div className="shell">
				<SectionHeading
					eyebrow="Đồng hành"
					title="Ba cách tôi có thể đi cùng bạn"
					description="Giảng dạy, thiết kế học tập, và tư vấn phát triển — AI là năng lực xuyên suốt, không phải dịch vụ riêng."
				/>
				<ul className="mt-12 space-y-0">
					{services.map((service, i) => (
						<HorizonReveal key={service.slug} as="li" delay={i * stagger.default}>
							<div className="grid gap-3 border-t border-hairline py-8 md:grid-cols-12 md:gap-8">
								<div className="md:col-span-4">
									<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
										0{i + 1}
									</p>
									<h3 className="mt-2 font-display text-xl font-medium text-ink sm:text-2xl">
										{service.title}
									</h3>
								</div>
								<div className="md:col-span-8">
									<p className="text-base leading-relaxed text-ink-secondary">{service.summary}</p>
									<Link
										href={`${routes.about}#${service.anchorId}`}
										className="mt-4 inline-flex text-xs font-semibold uppercase tracking-wider text-accent transition-colors duration-[180ms] hover:text-ink"
									>
										Tìm hiểu thêm →
									</Link>
								</div>
							</div>
						</HorizonReveal>
					))}
				</ul>
			</div>
		</section>
	);
}
