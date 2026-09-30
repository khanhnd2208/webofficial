import type { ReactNode } from 'react';

import { StudioButton } from './StudioButton';

export function StudioFilterBar({
	action,
	q,
	qName = 'q',
	qLabel,
	qPlaceholder,
	hidden,
	children,
	clearHref,
}: {
	action: string;
	q?: string;
	qName?: string;
	qLabel: string;
	qPlaceholder: string;
	hidden?: Record<string, string | undefined | null>;
	children?: ReactNode;
	clearHref?: string;
}) {
	return (
		<form
			action={action}
			className="mc-surface mt-7 grid gap-3 p-3 sm:grid-cols-[minmax(12rem,1fr)_repeat(auto-fit,minmax(10rem,12rem))_auto]"
		>
			{Object.entries(hidden ?? {}).map(([name, value]) =>
				value ? <input key={name} type="hidden" name={name} value={value} /> : null,
			)}
			<label className="min-w-0">
				<span className="sr-only">{qLabel}</span>
				<input
					name={qName}
					defaultValue={q}
					placeholder={qPlaceholder}
					aria-label={qLabel}
					className="min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm"
				/>
			</label>
			{children}
			<div className="flex flex-wrap gap-2">
				<StudioButton type="submit" variant="secondary" size="md">
					Áp dụng
				</StudioButton>
				{clearHref ? (
					<a
						href={clearHref}
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] border border-transparent px-4 text-sm font-semibold text-ink-secondary hover:bg-surface-sunken hover:text-ink"
					>
						Xóa lọc
					</a>
				) : null}
			</div>
		</form>
	);
}

export function StudioFilterSelect({
	name,
	label,
	value,
	children,
}: {
	name: string;
	label: string;
	value?: string;
	children: ReactNode;
}) {
	return (
		<label>
			<span className="sr-only">{label}</span>
			<select
				name={name}
				defaultValue={value ?? ''}
				aria-label={label}
				className="min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm"
			>
				{children}
			</select>
		</label>
	);
}
