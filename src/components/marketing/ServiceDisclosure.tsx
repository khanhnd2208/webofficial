'use client';

import type { ReactNode } from 'react';

import { trackEvent } from '@/lib/analytics';

export function ServiceDisclosure({
	serviceId,
	title,
	summaryLabel,
	defaultOpen = false,
	children,
}: {
	serviceId: string;
	title: string;
	/** Accessible summary; defaults to a clear secondary-detail label. */
	summaryLabel?: string;
	defaultOpen?: boolean;
	children: ReactNode;
}) {
	const label = summaryLabel ?? `Hình thức, đầu ra và cách làm — ${title}`;

	return (
		<details
			className="service-disclosure"
			open={defaultOpen}
			onToggle={(event) => {
				if (event.currentTarget.open)
					trackEvent('service_detail_open', { label: serviceId, sourcePage: '/dich-vu' });
			}}
		>
			<summary className="flex items-center justify-between gap-5 border-y border-hairline text-sm font-semibold tracking-[0.02em] text-ink">
				<span>{label}</span>
				<span className="service-disclosure__icon text-xl font-light text-accent" aria-hidden>
					+
				</span>
			</summary>
			{children}
		</details>
	);
}
