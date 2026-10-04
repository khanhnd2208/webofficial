'use client';

import { useEffect, useRef } from 'react';
import type { SlashCommand } from './slashCommands';

export interface SlashState {
	query: string;
	index: number;
	top: number;
	left: number;
}

export default function SlashMenu({
	state,
	items,
	onPick,
	onHover,
}: {
	state: SlashState;
	items: SlashCommand[];
	onPick: (command: SlashCommand) => void;
	onHover: (index: number) => void;
}) {
	const listRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
	}, [state.index]);

	if (!items.length) return null;
	return (
		<div
			ref={listRef}
			className="ln-slash"
			style={{ top: state.top, left: state.left }}
			role="listbox"
			aria-label="Chèn khối"
		>
			{items.map((item, index) => {
				const header = item.group !== items[index - 1]?.group ? item.group : null;
				return (
					<div key={item.id}>
						{header ? <p className="ln-slash__group">{header}</p> : null}
						<button
							type="button"
							role="option"
							aria-selected={index === state.index}
							data-active={index === state.index ? 'true' : undefined}
							className="ln-slash__item"
							onMouseDown={(event) => event.preventDefault()}
							onMouseEnter={() => onHover(index)}
							onClick={() => onPick(item)}
						>
							{item.id.startsWith('callout-') ? (
								<span className="ln-kind-dot" data-kind={item.id.slice(8)} />
							) : (
								<span className="ln-kind-dot" />
							)}
							<span className="ln-slash__label">{item.label}</span>
							<span className="ln-slash__hint">{item.hint}</span>
						</button>
					</div>
				);
			})}
		</div>
	);
}
