type EditorialCoverProps = {
	title: string;
	kicker?: string | null;
	index?: string | number | null;
	aspectRatio?: string;
	className?: string;
	/** Dark closing scenes (related posts) */
	tone?: 'paper' | 'espresso';
};

/**
 * Art-directed typographic cover — never an empty white rectangle.
 */
export default function EditorialCover({
	title,
	kicker,
	index,
	aspectRatio = '16 / 10',
	className,
	tone = 'paper',
}: EditorialCoverProps) {
	const label =
		kicker && kicker !== 'Uncategorized'
			? kicker
			: index != null
				? `Chương ${index}`
				: 'Bài viết';

	const espresso = tone === 'espresso';

	return (
		<div
			className={`flex flex-col justify-between overflow-hidden rounded-[var(--radius-media)] border p-5 sm:p-6 ${
				espresso
					? 'border-[#35312B] bg-[#1A1815] text-[#F2ECE1]'
					: 'border-hairline bg-paper text-ink'
			} ${className ?? ''}`}
			style={{ aspectRatio }}
			role="img"
			aria-label={title}
		>
			<span
				className={`font-mono text-[10px] uppercase tracking-[0.22em] ${
					espresso ? 'text-[var(--vermilion)]' : 'text-vermilion'
				}`}
			>
				{label}
			</span>
			<div>
				{index != null ? (
					<span
						className={`block font-display text-4xl font-medium leading-none sm:text-5xl ${
							espresso ? 'text-[#F2ECE1]/20' : 'text-ink/20'
						}`}
					>
						{typeof index === 'number' ? String(index).padStart(2, '0') : index}
					</span>
				) : null}
				<p
					className={`mt-2 line-clamp-2 font-display text-base font-medium leading-snug sm:text-lg ${
						espresso ? 'text-[#F2ECE1]/55' : 'text-ink/55'
					} ${index == null ? 'mt-auto' : ''}`}
				>
					{title}
				</p>
			</div>
		</div>
	);
}
