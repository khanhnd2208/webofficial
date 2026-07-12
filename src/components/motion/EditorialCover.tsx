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
	aspectRatio = '4 / 5',
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
			className={`flex flex-col justify-between overflow-hidden rounded-[18px] border p-6 sm:p-8 ${
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
						className={`block font-display text-5xl font-medium leading-none sm:text-6xl ${
							espresso ? 'text-[#F2ECE1]/20' : 'text-ink/20'
						}`}
					>
						{typeof index === 'number' ? String(index).padStart(2, '0') : index}
					</span>
				) : (
					<span
						className={`block font-display text-4xl font-medium leading-none ${
							espresso ? 'text-[#F2ECE1]/20' : 'text-ink/20'
						}`}
					>
						Aa
					</span>
				)}
				<p
					className={`mt-3 line-clamp-3 font-display text-lg font-medium leading-snug sm:text-xl ${
						espresso ? 'text-[#F2ECE1]/55' : 'text-ink/55'
					}`}
				>
					{title}
				</p>
			</div>
		</div>
	);
}
