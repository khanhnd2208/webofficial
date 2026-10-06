'use client';

import { trackEvent } from '@/lib/analytics';
import { servicesFaq } from '@/content/services';

/**
 * FAQ accordion — always shows the question on all viewports.
 */
export function ServicesFaq() {
	return (
		<div className="mt-8 space-y-0 border-t border-hairline md:mt-10">
			{servicesFaq.map((item, index) => (
				<details
					key={item.question}
					className="group border-b border-hairline"
					onToggle={(event) => {
						if (event.currentTarget.open) {
							trackEvent('service_detail_open', {
								label: `faq-${index}`,
								sourcePage: '/dich-vu',
							});
						}
					}}
				>
					<summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-left text-base font-semibold tracking-[-0.01em] text-ink [&::-webkit-details-marker]:hidden md:text-lg">
						<span className="font-display font-medium">{item.question}</span>
						<span
							className="shrink-0 text-xl font-light text-accent transition-transform duration-250 group-open:rotate-45"
							aria-hidden
						>
							+
						</span>
					</summary>
					<p className="max-w-[var(--measure)] pb-6 text-base leading-[1.75] text-ink-secondary">
						{item.answer}
					</p>
				</details>
			))}
		</div>
	);
}
