'use client';

import { aboutContent } from '@/content/about';
import HorizonReveal from '@/components/motion/HorizonReveal';
import { SectionHeading } from '@/components/marketing';
import { stagger } from '@/components/motion/tokens';

export default function HomeRoles() {
	return (
		<section className="section-space border-b border-hairline bg-paper/50">
			<div className="shell">
				<SectionHeading
					eyebrow="Ba vai trò"
					title="Educator · Learning Designer · Explorer"
					description="Ba cách tôi xuất hiện trong công việc — không phải ba thẻ dịch vụ."
				/>
				<ul className="mt-12 space-y-10 md:space-y-12">
					{aboutContent.roles.map((role, i) => (
						<HorizonReveal key={role.title} as="li" delay={i * stagger.default}>
							<div className="grid gap-3 border-t border-hairline pt-6 md:grid-cols-12 md:gap-8">
								<h3 className="font-display text-2xl font-medium text-ink md:col-span-4">
									{role.title}
								</h3>
								<p className="text-base leading-relaxed text-ink-secondary md:col-span-8 md:text-lg">
									{role.body}
								</p>
							</div>
						</HorizonReveal>
					))}
				</ul>
			</div>
		</section>
	);
}
