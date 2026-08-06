import { servicesPage } from '@/content/services';

/**
 * Four short trust signals — one row on desktop, 2×2 on mobile.
 */
export function TrustStrip() {
	return (
		<section
			className="shell border-b border-hairline py-8 md:py-10"
			aria-label="Điểm tin cậy"
		>
			<ul className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4 md:gap-0">
				{servicesPage.trustStrip.map((item, index) => (
					<li
						key={item}
						className={`flex items-start gap-3 text-sm leading-snug text-ink md:px-4 md:first:pl-0 md:last:pr-0 ${
							index < servicesPage.trustStrip.length - 1
								? 'md:border-r md:border-hairline'
								: ''
						}`}
					>
						<span
							className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
							aria-hidden
						/>
						<span className="font-medium tracking-[-0.01em]">{item}</span>
					</li>
				))}
			</ul>
		</section>
	);
}
