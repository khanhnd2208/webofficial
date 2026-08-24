'use client';

import { useEffect, useRef, useState } from 'react';

import { McIcon } from '@/components/myclass/ui';
import type { TeachingTutorialRecord } from '@/features/teaching/types';

export function TutorialSwitcher({
	tutorials,
	value,
	onChange,
	allowAll = false,
	allLabel = 'Tất cả tutorial',
}: {
	tutorials: TeachingTutorialRecord[];
	value: string;
	onChange: (id: string) => void;
	allowAll?: boolean;
	allLabel?: string;
}) {
	const [open, setOpen] = useState(false);
	const root = useRef<HTMLDivElement>(null);
	const current = allowAll && !value
		? { id: '', code: 'Tất cả', name: allLabel }
		: (tutorials.find((tutorial) => tutorial.id === value) ?? (allowAll ? { id: '', code: 'Tất cả', name: allLabel } : tutorials[0]));

	useEffect(() => {
		function onPointer(event: MouseEvent) {
			if (!root.current?.contains(event.target as Node)) setOpen(false);
		}
		function onKey(event: KeyboardEvent) {
			if (event.key === 'Escape') setOpen(false);
		}
		document.addEventListener('mousedown', onPointer);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onPointer);
			document.removeEventListener('keydown', onKey);
		};
	}, []);

	if (!current && !allowAll) return null;

	return (
		<div ref={root} className="relative">
			<button
				type="button"
				className="inline-flex min-h-9 items-center gap-2 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-xs font-semibold uppercase tracking-wide text-ink-secondary hover:bg-surface-sunken"
				aria-haspopup="listbox"
				aria-expanded={open}
				onClick={() => setOpen((val) => !val)}
			>
				<McIcon name="groups" size={18} />
				Tutorial Class: {current?.code ?? 'Tất cả'}
				<McIcon name="expand_more" size={16} />
			</button>
			{open ? (
				<div className="mc-tutorial-menu" role="listbox" aria-label="Tutorial class">
					{allowAll ? (
						<button
							type="button"
							role="option"
							aria-selected={!value}
							data-active={!value}
							onClick={() => {
								onChange('');
								setOpen(false);
							}}
						>
							{allLabel}
						</button>
					) : null}
					{tutorials.map((tutorial) => (
						<button
							key={tutorial.id}
							type="button"
							role="option"
							aria-selected={tutorial.id === value}
							data-active={tutorial.id === value}
							onClick={() => {
								onChange(tutorial.id);
								setOpen(false);
							}}
						>
							{tutorial.code} · {tutorial.name}
						</button>
					))}
				</div>
			) : null}
		</div>
	);
}
