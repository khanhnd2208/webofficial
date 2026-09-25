'use client';

import { useEffect, useMemo, useState } from 'react';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import PassportAvatar from '@/features/spy-fall/components/spy/PassportAvatar';
import { Button } from '@/features/spy-fall/components/ui';
import { getRoleById } from '@/features/werewolf/config/roles';
import { withBasePath } from '@/features/spy-fall/lib/basePath';
import { cn } from '@/features/spy-fall/lib/cn';
import type { Faction, WerewolfPlayerView } from '@/features/werewolf/types';

const FACTION_TEXT: Record<Faction, string> = {
	villager: 'text-emerald-700 dark:text-emerald-300',
	werewolf: 'text-rose-700 dark:text-rose-300',
	solo: 'text-violet-700 dark:text-violet-300',
};

interface Props {
	code: string;
	players: WerewolfPlayerView[];
	busy: boolean;
	canRedeal: boolean;
	onRedeal: () => void;
	onBackToLobby: () => void;
	onKick: (token: string, name: string) => void;
}

const hideKey = (code: string) => `werewolf-hide-board:${code}`;

export default function HostBoard({ code, players, busy, canRedeal, onRedeal, onBackToLobby, onKick }: Props) {
	const t = useT();
	const [hidden, setHidden] = useState(false);

	useEffect(() => {
		setHidden(localStorage.getItem(hideKey(code)) === '1');
	}, [code]);

	function toggleHidden() {
		const next = !hidden;
		setHidden(next);
		localStorage.setItem(hideKey(code), next ? '1' : '0');
	}

	const summary = useMemo(() => {
		const tally = new Map<Faction, number>();
		for (const player of players) {
			const faction = player.roleId ? getRoleById(player.roleId)?.faction : undefined;
			if (!faction) continue;
			tally.set(faction, (tally.get(faction) ?? 0) + 1);
		}
		return [...tally.entries()];
	}, [players]);

	return (
		<section className="space-y-4">
			<div className="flex items-center justify-between gap-3">
				<h2 className="font-display text-lg font-semibold text-ink">{t('mafia.host.title')}</h2>
				<Button type="button" variant="secondary" size="sm" onClick={toggleHidden}>
					{hidden ? t('mafia.host.show') : t('mafia.host.hide')}
				</Button>
			</div>

			<div className={cn('relative', hidden && 'select-none')}>
				{hidden ? (
					<p className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-sm font-medium text-ink">
						{t('mafia.host.hidden')}
					</p>
				) : null}
				<ul className={cn('space-y-2', hidden && 'pointer-events-none blur-xl')}>
					{players.map((player) => {
						const role = player.roleId ? getRoleById(player.roleId) : undefined;
						return (
							<li key={player.token} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2">
								<PassportAvatar name={player.name} avatarSeed={player.avatarSeed} size="sm" />
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-ink">{player.name}</p>
									<p className={cn('truncate text-xs', role ? FACTION_TEXT[role.faction] : 'text-muted')}>
										{role ? t(`mafia.role.${role.roleId}.name`) : t('mafia.host.noRole')}
										{' · '}
										{player.left
											? t('mafia.host.left')
											: player.viewed
												? t('mafia.host.viewed')
												: t('mafia.host.notViewed')}
									</p>
								</div>
								{role ? (
									<img src={withBasePath(role.image)} alt="" className="h-12 w-9 rounded object-cover" />
								) : null}
								{player.left ? null : (
									<Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => onKick(player.token, player.name)}>
										{t('mafia.host.kick')}
									</Button>
								)}
							</li>
						);
					})}
				</ul>
			</div>

			{summary.length > 0 ? (
				<p className={cn('text-sm text-muted-foreground', hidden && 'blur-md')}>
					{t('mafia.host.summary')}:{' '}
					{summary.map(([faction, count]) => `${count} ${t(`mafia.faction.${faction}`)}`).join(' · ')}
				</p>
			) : null}

			{canRedeal ? null : (
				<p className="text-sm text-muted-foreground">{t('mafia.host.redealBlocked')}</p>
			)}
			<div className="grid grid-cols-2 gap-2">
				<Button
					type="button"
					variant="secondary"
					disabled={busy || !canRedeal}
					onClick={() => {
						if (window.confirm(t('mafia.host.redealConfirm'))) onRedeal();
					}}
				>
					{t('mafia.host.redeal')}
				</Button>
				<Button
					type="button"
					variant="tertiary"
					disabled={busy}
					onClick={() => {
						if (window.confirm(t('mafia.host.backLobbyConfirm'))) onBackToLobby();
					}}
				>
					{t('mafia.host.backLobby')}
				</Button>
			</div>
		</section>
	);
}
