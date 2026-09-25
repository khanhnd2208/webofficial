/** Line icons for the learner surfaces (catalog, overview, player); stroke follows currentColor. */

const PATHS = {
	book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5',
	reading: 'M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z',
	quiz: 'M9 4h6l1 2h3v15H5V6h3zM9 12l2 2 4-4M9 17h6',
	practice: 'M8 4h8v16H8zM8 8h8M10 12l1.2 1.2L14 10.5M10 16h4',
	discussion: 'M5 5h10a2 2 0 0 1 2 2v5H8l-3 3V7a2 2 0 0 1 2-2zM11 15h6l3 3v-6a2 2 0 0 0-2-2h-1',
	clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
	layers: 'M12 3 3 8l9 5 9-5zM3 13l9 5 9-5',
	check: 'M5 12.5l4.5 4.5L19 7.5',
	checkCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.5l2.7 2.7L16 10',
	play: 'M8 5.5v13l10.5-6.5z',
	search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
	chevronLeft: 'M15 5l-7 7 7 7',
	chevronRight: 'M9 5l7 7-7 7',
	chevronDown: 'M5 9l7 7 7-7',
	arrowLeft: 'M19 12H5M11 6l-6 6 6 6',
	sidebar: 'M3.5 4.5h17v15h-17zM9.5 4.5v15',
	note: 'M5 4h10l4 4v12H5zM15 4v4h4M8.5 12h7M8.5 16h5',
	trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3.5 3.5 0 0 0 4 3.5M16 6h3.5a3.5 3.5 0 0 1-4 3.5M12 13v4M8.5 20h7M10 17h4v3h-4z',
	target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 12h.01',
	edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
	close: 'M6 6l12 12M18 6 6 18',
	keyboard: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
	grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
	list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
	flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
} as const;

export type LearnIconName = keyof typeof PATHS;

export function LearnIcon({
	name,
	size = 16,
	strokeWidth = 1.8,
	className,
}: {
	name: LearnIconName;
	size?: number;
	strokeWidth?: number;
	className?: string;
}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={name === 'play' ? 'currentColor' : 'none'}
			stroke="currentColor"
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			className={className}
		>
			<path d={PATHS[name]} />
		</svg>
	);
}

/** Circular progress; the percentage is also announced through `label`. */
export function LearnProgressRing({
	percent,
	size = 44,
	stroke = 4,
	label,
	showValue = true,
}: {
	percent: number;
	size?: number;
	stroke?: number;
	label?: string;
	showValue?: boolean;
}) {
	const radius = (size - stroke) / 2;
	const circumference = 2 * Math.PI * radius;
	const value = Math.max(0, Math.min(100, percent));
	return (
		<span
			className="ln-ring"
			style={{ width: size, height: size }}
			role="img"
			aria-label={label ?? `Hoàn thành ${value}%`}
			data-complete={value >= 100 ? 'true' : undefined}
		>
			<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
				<circle className="ln-ring__track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" />
				<circle
					className="ln-ring__value"
					cx={size / 2}
					cy={size / 2}
					r={radius}
					strokeWidth={stroke}
					fill="none"
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={circumference * (1 - value / 100)}
					transform={`rotate(-90 ${size / 2} ${size / 2})`}
				/>
			</svg>
			{showValue ? (
				<span className="ln-ring__label tabular-nums">
					{value >= 100 ? <LearnIcon name="check" size={Math.round(size * 0.38)} strokeWidth={2.4} /> : `${value}%`}
				</span>
			) : null}
		</span>
	);
}

/** Generated cover (no uploads needed): a hue per course plus its initials. */
export function LearnCourseCover({
	hue,
	title,
	category,
	className = '',
}: {
	hue: number;
	title: string;
	category?: string;
	className?: string;
}) {
	const initials = title
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word[0]?.toUpperCase())
		.join('');
	return (
		<div className={`ln-cover ${className}`} style={{ ['--ln-hue' as string]: hue }} aria-hidden="true">
			<span className="ln-cover__initials">{initials || '·'}</span>
			{category ? <span className="ln-cover__tag">{category}</span> : null}
		</div>
	);
}
