import type { PublicOrganization, PublicTestimonial } from '@/content/publicProof';
import { TestimonialBlock } from './TestimonialBlock';

type SocialProofSectionProps = {
	testimonials: PublicTestimonial[];
	organizations: PublicOrganization[];
};

export function SocialProofSection({ testimonials, organizations }: SocialProofSectionProps) {
	if (testimonials.length === 0 && organizations.length === 0) return null;

	return (
		<section
			className="editorial-section border-b border-hairline"
			aria-labelledby="social-proof-title"
		>
			<div className="shell">
				<header className="max-w-3xl">
					<p className="editorial-label">Góc nhìn từ người đã làm việc cùng</p>
					<h2 id="social-proof-title" className="editorial-heading mt-5">
						Bằng chứng tốt nhất đến từ trải nghiệm thật.
					</h2>
				</header>

				{testimonials.length > 0 ? (
					<div className="mt-12 grid gap-10 md:grid-cols-2">
						{testimonials.map((testimonial) => (
							<TestimonialBlock
								key={testimonial.id}
								quote={testimonial.quote}
								personName={testimonial.personName}
								role={testimonial.role}
								organization={testimonial.organization}
								anonymous={testimonial.anonymous}
							/>
						))}
					</div>
				) : null}

				{organizations.length > 0 ? (
					<div className="mt-12 border-t border-hairline pt-8">
						<p className="editorial-label">Đơn vị đã được xác nhận</p>
						<ul className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
							{organizations.map((organization) => (
								<li key={organization.id} className="text-sm text-ink-secondary">
									{organization.href ? (
										<a
											href={organization.href}
											target="_blank"
											rel="noopener noreferrer"
											className="editorial-text-link"
										>
											{organization.name}
										</a>
									) : (
										organization.name
									)}
								</li>
							))}
						</ul>
					</div>
				) : null}
			</div>
		</section>
	);
}
