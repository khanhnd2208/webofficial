'use client';

import { useCallback, useState } from 'react';

interface ReactionBarProps {
	slug: string;
	initialReactions: {
		like: number;
		love: number;
		fire: number;
		clap: number;
	};
}

const REACTIONS = [
	{ key: 'like' as const, emoji: '👍', label: 'Like' },
	{ key: 'love' as const, emoji: '❤️', label: 'Love' },
	{ key: 'fire' as const, emoji: '🔥', label: 'Fire' },
	{ key: 'clap' as const, emoji: '👏', label: 'Clap' },
];

export default function ReactionBar({ slug, initialReactions }: ReactionBarProps) {
	const [reactions, setReactions] = useState(initialReactions);
	const [animating, setAnimating] = useState<string | null>(null);

	const react = useCallback(
		async (type: 'like' | 'love' | 'fire' | 'clap') => {
			// Optimistic update
			setReactions((prev) => ({ ...prev, [type]: prev[type] + 1 }));
			setAnimating(type);
			setTimeout(() => setAnimating(null), 600);

			try {
				const res = await fetch(`/api/posts/${slug}/reactions`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ reaction: type }),
				});
				const json = (await res.json()) as unknown;
				if (
					typeof json === 'object' &&
					json !== null &&
					(json as { ok?: unknown }).ok === true
				) {
					const data = (json as { data?: { reactions?: typeof reactions } }).data;
					if (data?.reactions) setReactions(data.reactions);
				}
			} catch {
				// Revert on error
				setReactions((prev) => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
			}
		},
		[slug]
	);

	const total = reactions.like + reactions.love + reactions.fire + reactions.clap;

	return (
		<div className="flex items-center gap-1">
			{REACTIONS.map(({ key, emoji, label }) => (
				<button
					key={key}
					onClick={() => void react(key)}
					className={`group inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm transition-all hover:border-border-hover hover:bg-surface-hover active:scale-95 ${
						animating === key ? 'scale-110' : ''
					}`}
					title={label}
				>
					<span
						className={`transition-transform ${animating === key ? 'animate-bounce' : 'group-hover:scale-125'}`}
					>
						{emoji}
					</span>
					{reactions[key] > 0 ? (
						<span className="text-xs font-bold text-foreground-secondary">{reactions[key]}</span>
					) : null}
				</button>
			))}
			{total > 0 ? (
				<span className="ml-2 text-xs text-muted">{total} reactions</span>
			) : null}
		</div>
	);
}
