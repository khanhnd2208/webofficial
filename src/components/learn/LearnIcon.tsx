import CourseArtwork from './CourseArtwork';
import { Icon, type IconName } from '@/components/ui/Icon';

const ICON_MAP = {
	book: 'book',
	reading: 'menu_book',
	quiz: 'quiz',
	practice: 'assignment',
	discussion: 'forum',
	clock: 'schedule',
	layers: 'layers',
	check: 'check',
	checkCircle: 'check_circle',
	play: 'play_arrow',
	search: 'search',
	chevronLeft: 'chevron_left',
	chevronRight: 'chevron_right',
	chevronDown: 'expand_more',
	arrowLeft: 'arrow_back',
	sidebar: 'sidebar',
	note: 'note',
	trophy: 'trophy',
	target: 'track_changes',
	edit: 'edit',
	close: 'close',
	keyboard: 'keyboard',
	grid: 'grid',
	list: 'list',
	flag: 'flag',
} as const satisfies Record<string, IconName>;
export type LearnIconName = keyof typeof ICON_MAP;
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
		<Icon
			name={ICON_MAP[name]}
			size={size}
			strokeWidth={strokeWidth}
			filled={name === 'play'}
			className={className}
		/>
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
				<circle
					className="ln-ring__track"
					cx={size / 2}
					cy={size / 2}
					r={radius}
					strokeWidth={stroke}
					fill="none"
				/>
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
					{value >= 100 ? (
						<LearnIcon name="check" size={Math.round(size * 0.38)} strokeWidth={2.4} />
					) : (
						`${value}%`
					)}
				</span>
			) : null}
		</span>
	);
}

/** Editorial course imagery outside the reading workspace. */
export function LearnCourseCover({
	slug,
	className = '',
}: {
	hue: number;
	title: string;
	category?: string;
	slug?: string;
	className?: string;
}) {
	return <CourseArtwork slug={slug} className={`ln-cover ${className}`} />;
}
