'use client';

import type { PlayerPublicDTO } from '@/features/spy-fall/types/spyGame';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import Badge from '@/features/spy-fall/components/ui/Badge';
import Stamp from '@/features/spy-fall/components/ui/Stamp';
import { cn } from '@/features/spy-fall/lib/cn';
import { hapticLight } from '@/features/spy-fall/lib/haptics';
import { getRoleLabel } from '@/features/spy-fall/lib/spy/i18n';
import GameIcon from '@/features/spy-fall/components/ui/GameIcon';

import ConnectionDot from './ConnectionDot';
import PassportAvatar from './PassportAvatar';

interface Props {
	players: PlayerPublicDTO[];
	/** Marks "You" on your own row. */
	selfId?: string | null;
	/** Marks the player who speaks first this round. */
	firstSpeakerId?: string | null;
	onSelect?: (id: string) => void;
	onKick?: (id: string) => void;
	showVoted?: boolean;
	selectable?: boolean;
	selectedId?: string | null;
	disabled?: boolean;
}

export default function PlayerList({
	players,
	selfId,
	firstSpeakerId,
	onSelect,
	onKick,
	showVoted,
	selectable,
	selectedId,
	disabled,
}: Props) {
	const t = useT();

	return (
		<ul className="space-y-2" role="list">
			{players.map((p) => {
				const eliminated = p.isEliminated;
				const selected = selectedId === p.id;
				const isFirst = firstSpeakerId === p.id && !eliminated;
				const isSelf = selfId === p.id;

				const content = (
					<>
						<div className="flex min-w-0 items-center gap-3">
							<PassportAvatar name={p.name} avatarSeed={p.avatarSeed} />
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<span className={cn('truncate font-semibold', eliminated && 'line-through')}>
										{p.name}
									</span>
									<ConnectionDot connected={p.connected} />
								</div>
								<div className="mt-0.5 flex flex-wrap items-center gap-1.5">
									{isSelf ? <Badge variant="accent">{t('spy.player.you')}</Badge> : null}
									{p.isHost ? <Badge variant="muted">{t('spy.player.host')}</Badge> : null}
									{isFirst ? <Badge variant="warning"><GameIcon name="sound" size={13} /> {t('spy.player.speaksFirst')}</Badge> : null}
									{eliminated && p.role ? (
										<Stamp label={getRoleLabel(t, p.role)} variant="suspect" className="text-[8px]" />
									) : null}
								</div>
							</div>
						</div>
						{showVoted && !eliminated ? (
							<span
								className={cn(
									'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
									p.hasVoted ? 'bg-success-subtle text-success' : 'text-muted',
								)}
							>
								{p.hasVoted ? `✓ ${t('spy.player.voted')}` : t('spy.player.notVoted')}
							</span>
						) : null}
						{selectable ? (
							<span
								aria-hidden
								className={cn(
									'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
									selected ? 'border-accent bg-accent text-accent-foreground' : 'border-border',
								)}
							>
								{selected ? '✓' : ''}
							</span>
						) : null}
					</>
				);

				if (!selectable) {
					return (
						<li
							key={p.id}
							className={cn(
								'flex min-h-16 items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3',
								isFirst && 'border-warning bg-warning-subtle',
								eliminated && 'opacity-50',
							)}
						>
							{content}
							{onKick && !p.isHost ? (
								<button
									type="button"
									onClick={() => onKick(p.id)}
									className="min-h-9 shrink-0 rounded-lg px-2 text-xs font-medium text-danger hover:bg-danger-subtle"
								>
									{t('spy.lobby.kick')}
								</button>
							) : null}
						</li>
					);
				}

				const blocked = disabled || eliminated;
				return (
					<li key={p.id}>
						<button
							type="button"
							disabled={blocked}
							aria-pressed={selected}
							onClick={() => {
								if (blocked) return;
								hapticLight();
								onSelect?.(p.id);
							}}
							className={cn(
								'flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-[border-color,background-color,box-shadow] duration-[var(--dur-fast)] active:scale-[0.99]',
								selected
									? 'border-accent bg-accent-subtle ring-2 ring-accent/30'
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
