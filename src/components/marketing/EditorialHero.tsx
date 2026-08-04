import type { ReactNode } from 'react';

type EditorialHeroProps = {
	eyebrow: string;
	title: string;
	lead?: string;
	children?: ReactNode;
	className?: string;
};

export function EditorialHero({ eyebrow, title, lead, children, className = '' }: EditorialHeroProps) {
	return (
		<section className={`editorial-section border-b border-hairline ${className}`}>
			<div className="shell grid gap-8 lg:grid-cols-12 lg:items-end">
				<header className="lg:col-span-8">
					<p className="editorial-label">{eyebrow}</p>
					<h1 className="premium-display mt-5 max-w-[18ch] text-ink">{title}</h1>
				</header>
				{(lead || children) && (
					<div className="lg:col-span-4">
						{lead ? <p className="premium-lead">{lead}</p> : null}
						{children}
					</div>
				)}
			</div>
		</section>
	);
}
