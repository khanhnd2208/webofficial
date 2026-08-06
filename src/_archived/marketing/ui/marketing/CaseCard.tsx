import Link from 'next/link';

type CaseCardProps = {
	href: string;
	title: string;
	context: string;
	isAnonymous?: boolean;
	clientName?: string;
};

/**
 * Case study teaser. Anonymous cases must not render client names or logos.
 */
export function CaseCard({ href, title, context, isAnonymous, clientName }: CaseCardProps) {
	const clientLine = isAnonymous ? 'Case ẩn danh' : clientName;

	return (
		<article className="border-t border-hairline pt-5">
			{clientLine ? (
				<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-secondary">{clientLine}</p>
			) : null}
			<h3 className="mt-2 font-display text-xl font-medium text-ink">
				<Link href={href} className="transition-colors hover:text-vermilion">
					{title}
				</Link>
			</h3>
			<p className="mt-2 text-sm leading-relaxed text-ink-secondary">{context}</p>
		</article>
	);
}
