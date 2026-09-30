'use client';

import type { ReactNode } from 'react';

import { TeachingPopover } from '@/components/teaching/TeachingPopover';

export type TeachingQuickMenuItem = {
	id: string;
	label: string;
	tone?: 'default' | 'danger';
	disabled?: boolean;
	onSelect: () => void;
};

export function TeachingQuickMenu({
	label,
	items,
	disabled = false,
}: {
	label: string;
	items: TeachingQuickMenuItem[];
	disabled?: boolean;
}) {
	return (
		<div
			className="relative"
			onClick={(event) => {
				event.preventDefault();
				event.stopPropagation();
			}}
			onKeyDown={(event) => event.stopPropagation()}
		>
			<TeachingPopover
				ariaLabel={label}
				trigger={({ open: _open, toggle, triggerRef, triggerProps }) => (
					<button
						ref={triggerRef}
						{...triggerProps}
						disabled={disabled}
						onClick={(event) => {
							event.preventDefault();
							event.stopPropagation();
							toggle();
						}}
						className="inline-flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink disabled:opacity-50"
						aria-label={label}
						data-testid="teaching-quick-menu"
					>
						⋯
					</button>
				)}
			>
				<div className="min-w-44 py-1" role="none">
					{items.map((item) => (
						<button
							key={item.id}
							type="button"
							role="menuitem"
							disabled={item.disabled}
							onClick={item.onSelect}
							className={`flex min-h-11 w-full items-center rounded-[var(--mc-r-sm)] px-3 text-left text-sm font-semibold disabled:opacity-50 ${
								item.tone === 'danger'
									? 'text-error hover:bg-error/10'
									: 'text-ink hover:bg-surface-hover'
							}`}
						>
							{item.label}
						</button>
					))}
				</div>
			</TeachingPopover>
		</div>
	);
}

export function TeachingBusyBanner({ children }: { children: ReactNode }) {
	return (
		<p role="status" className="text-sm font-semibold text-ink-secondary">
			{children}
		</p>
	);
}
