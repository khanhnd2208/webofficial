'use client';

import type { PlayerPublicDTO } from '@/features/spy-fall/types/spyGame';

import Badge from '@/features/spy-fall/components/ui/Badge';
import Stamp from '@/features/spy-fall/components/ui/Stamp';
import { cn } from '@/features/spy-fall/lib/cn';
import { hapticLight } from '@/features/spy-fall/lib/haptics';

import ConnectionDot from './ConnectionDot';
import PassportAvatar from './PassportAvatar';

interface Props {
	players: PlayerPublicDTO[];
	highlightToken?: string | null;
	onSelect?: (token: string) => void;
	onKick?: (token: string) => void;
	showSuspicion?: boolean;
	showSpoken?: boolean;
	showReady?: boolean;
	selectable?: boolean;
	selectedToken?: string | null;
	selectedTokens?: string[];
	eliminatedTokens?: string[];
}

export default function PlayerList({
	players,
	highlightToken,
	onSelect,
	onKick,
	showSuspicion,
	showSpoken,
	showReady,
	selectable,
	selectedToken,
	selectedTokens,
	eliminatedTokens = [],
}: Props) {
	return (
		<ul className="space-y-2" role="list">
			{players.map((p) => {
				const eliminated = eliminatedTokens.includes(p.token) || p.isEliminated;
				const selected = selectedTokens
					? selectedTokens.includes(p.token)
					: selectedToken === p.token;
				const highlighted = highlightToken === p.token;

				const content = (
					<>
						<div className="flex min-w-0 items-center gap-3">
							<PassportAvatar name={p.name} avatarSeed={p.avatarSeed} />
							<div className="min-w-0">
								<div className="flex flex-wrap items-center gap-2">
									<span className="truncate font-semibold">{p.name}</span>
									{p.isHost ? <Badge variant="muted">Host</Badge> : null}
									<ConnectionDot connected={p.connected} />
								</div>
								<div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted">
									{showReady ? (
										<span className={p.isReady ? 'text-success' : ''}>
											{p.isReady ? '✓ Sẵn sàng' : 'Chưa sẵn sàng'}
										</span>
									) : null}
									{showSpoken ? (
										<span className={p.hasSpoken ? 'text-success' : ''}>
											{p.hasSpoken ? '✓ Đã khai báo' : 'Chưa khai báo'}
										</span>
									) : null}
								</div>
							</div>
						</div>
						{showSuspicion && p.suspicionCount > 0 ? (
							<div className="shrink-0 text-right">
								<Stamp label={`${p.suspicionCount} nghi`} variant="suspect" className="text-[9px]" />
							</div>
						) : showSuspicion ? (
							<div className="shrink-0 font-mono text-2xl font-bold tabular-nums text-muted">
								{p.suspicionCount}
							</div>
						) : null}
					</>
				);

				if (!selectable) {
					return (
						<li
							key={p.token}
							className={cn(
								'flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3',
								highlighted && 'border-warning bg-warning-subtle',
								eliminated && 'opacity-50',
							)}
						>
							{content}
							{onKick && !p.isHost ? (
								<button
									type="button"
									onClick={() => onKick(p.token)}
									className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-danger hover:bg-danger-subtle"
								>
									Mời rời
								</button>
							) : null}
						</li>
					);
				}

				return (
					<li key={p.token}>
						<button
							type="button"
							disabled={eliminated}
							onClick={() => {
								if (eliminated) return;
								hapticLight();
								onSelect?.(p.token);
							}}
							className={cn(
								'flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-[border-color,background-color,box-shadow] duration-[var(--dur-fast)]',
								selected
									? 'border-accent bg-accent-subtle ring-2 ring-accent/30'
									: highlighted
										? 'border-warning bg-warning-subtle'
										: 'border-border bg-surface hover:bg-surface-hover',
								eliminated && 'opacity-50',
							)}
						>
							{content}
						</button>
					</li>
				);
			})}
		</ul>
	);
}
