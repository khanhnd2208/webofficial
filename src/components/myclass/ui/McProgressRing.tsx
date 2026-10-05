type McProgressRingProps = {
	value: number;
	max?: number;
	size?: number;
	strokeWidth?: number;
	label?: string;
	tone?: 'accent' | 'done' | 'test';
	children?: React.ReactNode;
	className?: string;
};

const toneStroke = {
	accent: 'stroke-accent',
	done: 'stroke-mc-done',
	test: 'stroke-mc-test',
} as const;

export function McProgressRing({
	value,
	max = 100,
	size = 72,
	strokeWidth = 6,
	label,
	tone = 'accent',
	children,
	className = '',
}: McProgressRingProps) {
	const percent = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (percent / 100) * circumference;

	return (
		<div
			className={`relative inline-flex items-center justify-center ${className}`}
			style={{ width: size, height: size }}
			role="progressbar"
			aria-label={label ?? `Tiến độ ${percent}%`}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={percent}
		>
			<svg width={size} height={size} className="-rotate-90" aria-hidden>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					strokeWidth={strokeWidth}
					className="stroke-surface-active"
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					className={`transition-[stroke-dashoffset] duration-400 motion-reduce:transition-none ${toneStroke[tone]}`}
				/>
			</svg>
			<div className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums text-ink">
				{children ?? `${percent}%`}
			</div>
		</div>
	);
}
