import Link from 'next/link';

export type BreadcrumbItem = {
	label: string;
	href?: string;
};

type BreadcrumbProps = {
	items: BreadcrumbItem[];
};

/**
 * Simple breadcrumb for marketing/service pages.
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
	if (items.length === 0) return null;

	return (
		<nav aria-label="Breadcrumb" className="text-xs text-ink-secondary">
			<ol className="flex flex-wrap items-center gap-2">
				{items.map((item, index) => {
					const isLast = index === items.length - 1;
					return (
						<li key={`${item.label}-${index}`} className="flex items-center gap-2">
							{index > 0 ? (
								<span aria-hidden className="text-ink-secondary/50">
									/
								</span>
							) : null}
							{item.href && !isLast ? (
								<Link href={item.href} className="uppercase tracking-wider transition-colors hover:text-ink">
									{item.label}
								</Link>
							) : (
								<span
									className={isLast ? 'font-semibold uppercase tracking-wider text-ink' : 'uppercase tracking-wider'}
									aria-current={isLast ? 'page' : undefined}
								>
									{item.label}
								</span>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
