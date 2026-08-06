'use client';

import { useT } from '@/components/i18n/LocaleProvider';
import { getRoleById } from '@/config/mafiaGame';
import RoleThumbnail from '@/components/mafia/RoleThumbnail';
import { mafiaGlass } from '@/components/mafia/mafiaStyles';
import { sortPlayersBySeat } from '@/components/mafia/hooks/useMafiaGame';
import { cn } from '@/lib/cn';
import { factionName, roleName } from '@/lib/mafia/localize';
import type { Player } from '@/types/mafiaGame';

interface HostRoleOverviewProps {
	players: Player[];
	onSelectPlayer?: (id: string) => void;
}

export default function HostRoleOverview({ players, onSelectPlayer }: HostRoleOverviewProps) {
	const t = useT();
	const sorted = sortPlayersBySeat(players);

	return (
		<ul className="space-y-2">
			{sorted.map((player, index) => {
				const role = player.roleId ? getRoleById(player.roleId) : null;
				return (
					<li key={player.id}>
						<button
							type="button"
							onClick={() => onSelectPlayer?.(player.id)}
							className={cn(
								'flex w-full items-center gap-3 p-3 text-left transition hover:bg-white/5',
								mafiaGlass,
							)}
						>
							<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--mafia-surface-elevated)] text-sm font-semibold text-[var(--mafia-gold)]">
								{index + 1}
							</span>
							{role ? <RoleThumbnail src={role.image} alt={roleName(role.roleId, t)} size="sm" /> : null}
							<div className="min-w-0 flex-1">
								<p className="font-medium text-[var(--mafia-foreground)]">{player.name}</p>
								<p className="text-xs text-[var(--mafia-muted)]">
									{role ? roleName(role.roleId, t) : '—'} · {role ? factionName(role.faction, t) : ''}
								</p>
								<p className="text-xs text-[var(--mafia-muted)]">
									{t(`mafia.viewStatus.${player.viewStatus}`)}
								</p>
							</div>
						</button>
					</li>
				);
			})}
		</ul>
	);
}
