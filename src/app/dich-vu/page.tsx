import type { Metadata } from 'next';

import SectionReveal from '@/components/motion/SectionReveal';
import { StaggerGroup, StaggerItem } from '@/components/motion/StaggerGroup';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { serviceOffers, servicesPage } from '@/content/services';
import {
	AiWorkflowGraphic,
	LearnerStackGraphic,
	ManagementSystemGraphic,
	ProgramDesignGraphic,
	ServiceCard,
	ServicesClosing,
	ServicesFaq,
	ServicesHero,
	TrustStrip,
} from '@/features/services';

export const metadata: Metadata = {
	title: 'Dịch vụ',
	description: servicesPage.metaDescription,
	alternates: { canonical: absoluteUrl(routes.services) },
};

const [managementOffer, aiOffer, learningOffer] = serviceOffers;

export default function ServicesPage() {
	return (
		<main className="bg-canvas">
			{/* 01 — Hero */}
			<SectionReveal>
				<ServicesHero />
			</SectionReveal>

			{/* 02 — Trust */}
			<SectionReveal>
				<TrustStrip />
			</SectionReveal>

			{/* 03 — Offers */}
			<section
				id="huong-lam-viec"
				className="shell scroll-mt-20 border-b border-hairline py-14 md:py-20"
				aria-labelledby="offers-heading"
			>
				<SectionReveal>
					<h2
						id="offers-heading"
						className="font-display text-[clamp(1.75rem,3vw,2.25rem)] font-medium tracking-[-0.02em] text-ink"
					>
						{servicesPage.offersHeading}
					</h2>
				</SectionReveal>

				<StaggerGroup className="mt-10 grid gap-6 lg:grid-cols-2">
					<StaggerItem>
						<ServiceCard
							offer={managementOffer}
							graphic={<ManagementSystemGraphic />}
						/>
					</StaggerItem>
					<StaggerItem>
						<ServiceCard offer={aiOffer} graphic={<AiWorkflowGraphic />} />
					</StaggerItem>
				</StaggerGroup>

				<SectionReveal className="mt-6">
					<ServiceCard
						offer={learningOffer}
						graphic={<LearnerStackGraphic />}
						variant="supporting"
					/>
				</SectionReveal>
			</section>

			{/* 04 — Method infographic */}
			<SectionReveal>
				<ProgramDesignGraphic />
			</SectionReveal>

			{/* 05 — FAQ */}
			<section
				className="shell border-b border-hairline py-14 md:py-20"
				aria-labelledby="faq-title"
			>
				<SectionReveal>
					<h2
						id="faq-title"
						className="font-display text-[clamp(1.75rem,3vw,2.25rem)] font-medium tracking-[-0.02em] text-ink"
					>
						Một vài câu hỏi thường gặp
					</h2>
					<div className="mx-auto max-w-(--measure-wide)">
						<ServicesFaq />
					</div>
				</SectionReveal>
			</section>

			{/* 06 — Closing */}
			<SectionReveal>
				<ServicesClosing />
			</SectionReveal>
		</main>
	);
}
