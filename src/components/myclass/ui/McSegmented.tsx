'use client';

import type { ReactNode } from 'react';

export type McSegmentOption<T extends string = string> = {
	value: T;
	label: ReactNode;
	hint?: string;
};

type McSegmentedProps<T extends string = string> = {
	options: McSegmentOption<T>[];
	value: T;
	onChange: (value: T) => void;
	label?: string;
	className?: string;
};

/** Rule-bordered segmented control. Active = ink fill. */
export function McSegmented<T extends string = string>({
	options,
	value,
	onChange,
	label,
	className = '',
}: McSegmentedProps<T>) {
	const nowrap = /\b(whitespace-nowrap|flex-nowrap)\b/.test(className);
	return (
		<div
			role="tablist"
			aria-label={label}
			className={`inline-flex gap-0 rounded-[var(--mc-r-sm)] border border-mc-rule/30 bg-surface-container p-1 shadow-sm ${nowrap ? 'flex-nowrap' : 'flex-wrap'} ${className}`}
		>
			{options.map((option) => {
				const active = option.value === value;
				return (
					<button
						key={option.value}
						type="button"
						role="tab"
						aria-selected={active}
						title={option.hint}
						onClick={() => onChange(option.value)}
						className={`min-h-10 shrink-0 touch-manipulation whitespace-nowrap rounded-[var(--mc-r-xs)] px-6 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
							active ? 'bg-ink text-paper shadow-sm' : 'text-ink-secondary hover:text-ink'
						}`}
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}
