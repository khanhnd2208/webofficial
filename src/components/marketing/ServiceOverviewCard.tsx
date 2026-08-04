import Link from 'next/link';

type ServiceOverviewCardProps = {
	number: string;
	title: string;
	overview: string;
	href: string;
};

export function ServiceOverviewCard({ number, title, overview, href }: ServiceOverviewCardProps) {
	return (
		<a
			href={href}
			className="marketing-card group block p-6 transition-colors sm:p-8"
		>
			<span className="font-mono text-xs text-accent">{number}</span>
			<h2 className="type-h3 mt-4 transition-colors group-hover:text-accent">{title}</h2>
			<p className="mt-4 text-base leading-[1.7] text-ink-secondary">{overview}</p>
			<span className="editorial-text-link mt-6">
				Xem chi tiết{' '}
				<span className="marketing-card-arrow inline-block transition-transform" aria-hidden>
					→
				</span>
			</span>
		</a>
	);
}

export function ServiceOverviewLink({
	number,
	title,
	overview,
	href,
}: ServiceOverviewCardProps) {
	return (
		<Link href={href} className="marketing-card group block p-6 sm:p-8">
			<span className="font-mono text-xs text-accent">{number}</span>
			<h2 className="type-h3 mt-4 transition-colors group-hover:text-accent">{title}</h2>
			<p className="mt-4 text-base leading-[1.7] text-ink-secondary">{overview}</p>
			<span className="editorial-text-link mt-6">
				Xem chi tiết{' '}
				<span className="marketing-card-arrow inline-block transition-transform" aria-hidden>
					→
				</span>
			</span>
		</Link>
	);
}
