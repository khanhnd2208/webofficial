type McMeterProps = {
	value: number;
	max?: number;
	label?: string;
	tone?: 'accent' | 'done' | 'test' | 'vocab';
	showValue?: boolean;
	className?: string;
};

const toneClass = {
	accent: 'bg-accent',
	done: 'bg-mc-done',
	test: 'bg-mc-test',
	vocab: 'bg-mc-vocab',
} as const;

/** Compact product progress bar. */
export function McMeter({
	value,
	max = 100,
	label,
	tone = 'accent',
	showValue = false,
	className = '',
}: McMeterProps) {
	const percent = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;
	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<div
				className="h-1 flex-1 overflow-hidden rounded-full bg-surface-container-high"
				role="progressbar"
				aria-label={label ?? `Tiến độ ${percent}%`}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={percent}
			>
				<div
					className={`h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none ${toneClass[tone]}`}
					style={{ width: `${percent}%` }}
				/>
			</div>
			{showValue ? (
				<span className="mc-num text-xs font-semibold text-ink-secondary">{percent}%</span>
			) : null}
		</div>
	);
}

/** @deprecated Use McMeter. Kept as alias during migration. */
export function McProgressBar({
	value,
	max = 100,
	label,
	tone = 'accent',
	size: _size,
	className = '',
}: McMeterProps & { size?: 'sm' | 'md' }) {
	return <McMeter value={value} max={max} label={label} tone={tone} className={className} />;
}
