'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button } from '@/features/spy-fall/components/ui';
import {
	MIN_PLAYERS,
	getEnabledRoles,
	getSuggestedRoleSet,
	getTotalRoleCount,
	getWerewolfWarning,
} from '@/features/werewolf/config/roles';
import { withBasePath } from '@/features/spy-fall/lib/basePath';
import { cn } from '@/features/spy-fall/lib/cn';
import { canonicalRoleCounts, reconcileRoleDraft } from '@/features/werewolf/lib/roleDraft';
import type { Faction, RoleCount } from '@/features/werewolf/types';
import GameIcon, { type GameIconName } from '@/features/spy-fall/components/ui/GameIcon';

const FACTION_ORDER: Faction[] = ['villager', 'werewolf', 'solo'];
const FACTION_ICONS: Record<Faction, GameIconName> = {
	villager: 'users',
	werewolf: 'wolf',
	solo: 'target',
};

interface Props {
	playerCount: number;
	roleCounts: RoleCount[];
	saving: boolean;
	onChange: (counts: RoleCount[]) => void;
	onDeal: () => void;
	dealBusy: boolean;
}

function countOf(counts: RoleCount[], roleId: string): number {
	return counts.find((entry) => entry.roleId === roleId)?.count ?? 0;
}

function withCount(counts: RoleCount[], roleId: string, count: number): RoleCount[] {
	const next = counts.filter((entry) => entry.roleId !== roleId);
	if (count > 0) next.push({ roleId, count });
	return next;
}

export default function RoleSetupPanel({
	playerCount,
	roleCounts,
	saving,
	onChange,
	onDeal,
	dealBusy,
}: Props) {
	const t = useT();
	const roles = useMemo(() => getEnabledRoles(), []);
	const total = getTotalRoleCount(roleCounts);
	const diff = total - playerCount;
	const warningKey = getWerewolfWarning(roleCounts, playerCount);
	const canDeal = playerCount >= MIN_PLAYERS && total === playerCount && !saving && !dealBusy;

	const footer =
		diff === 0
			? t('mafia.roles.footerOk', { total, playerCount })
			: diff < 0
				? t('mafia.roles.footerNeed', { total, playerCount, diff: -diff })
				: t('mafia.roles.footerTooMany', { total, playerCount, diff });

	return (
		<section className="space-y-4">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h2 className="font-display text-lg font-semibold text-ink">{t('mafia.roles.title')}</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						{t('mafia.roles.counter', { total, playerCount })}
						{saving ? ` · ${t('mafia.roles.saving')}` : ''}
					</p>
				</div>
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={() => onChange(getSuggestedRoleSet(Math.max(playerCount, MIN_PLAYERS)))}
				>
					{t('mafia.roles.suggest')}
				</Button>
			</div>

			{FACTION_ORDER.map((faction) => (
				<div key={faction} className="space-y-2">
					<h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
						<GameIcon name={FACTION_ICONS[faction]} size={15} />
						{t(`mafia.faction.${faction}`)}
					</h3>
					<ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{roles
							.filter((role) => role.faction === faction)
							.map((role) => {
								const count = countOf(roleCounts, role.roleId);
								return (
									<li
										key={role.roleId}
										className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2"
									>
										<img
											src={withBasePath(role.image)}
											alt=""
											className="h-12 w-9 rounded-md object-cover"
										/>
										<span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
											{t(`mafia.role.${role.roleId}.name`)}
										</span>
										<div className="flex items-center gap-1">
											<button
												type="button"
												className="h-9 w-9 rounded-lg border border-border text-lg"
												aria-label={t('mafia.roles.decAria')}
												onClick={() =>
													onChange(withCount(roleCounts, role.roleId, Math.max(0, count - 1)))
												}
											>
												<GameIcon name="minus" size={15} />
											</button>
											<span className="w-6 text-center font-mono text-sm">{count}</span>
											<button
												type="button"
												className="h-9 w-9 rounded-lg border border-border text-lg"
												aria-label={t('mafia.roles.incAria')}
												onClick={() => onChange(withCount(roleCounts, role.roleId, count + 1))}
											>
												<GameIcon name="plus" size={15} />
											</button>
										</div>
									</li>
								);
							})}
					</ul>
				</div>
			))}

			<p className={cn('text-sm', diff === 0 ? 'text-success' : 'text-warning-foreground')}>
				{footer}
			</p>
			{playerCount < MIN_PLAYERS ? (
				<p className="text-sm text-muted-foreground">
					{t('mafia.roles.needPlayers', { min: MIN_PLAYERS })}
				</p>
			) : null}
			{warningKey ? <p className="text-sm text-warning-foreground">{t(warningKey)}</p> : null}

			<Button type="button" fullWidth disabled={!canDeal} loading={dealBusy} onClick={onDeal}>
				{t('mafia.roles.deal')}
			</Button>
		</section>
	);
}

export function useDebouncedRoleCounts(
	serverCounts: RoleCount[],
	onSave: (counts: RoleCount[]) => Promise<unknown> | void,
) {
	const serverKey = canonicalRoleCounts(serverCounts);
	const [draft, setDraft] = useState(serverCounts);
	const [dirty, setDirty] = useState(false);
	const [seenServer, setSeenServer] = useState(serverKey);
	const [holdKey, setHoldKey] = useState<string | null>(null);
	const saveGen = useRef(0);

	const action = reconcileRoleDraft({ dirty, holdKey, seenServer, serverKey });
	if (action === 'caught-up') {
		setHoldKey(null);
		setSeenServer(serverKey);
	} else if (action === 'adopt') {
		setSeenServer(serverKey);
		setDraft(serverCounts);
	}

	function updateCounts(next: RoleCount[]) {
		setDirty(true);
		setDraft(next);
	}

	useEffect(() => {
		if (!dirty) return;
		const generation = ++saveGen.current;
		const payload = draft;
		const payloadKey = canonicalRoleCounts(payload);
		const timer = window.setTimeout(() => {
			void Promise.resolve(onSave(payload))
				.then(() => {
					if (saveGen.current !== generation) return;
					setDirty(false);
					setHoldKey(payloadKey);
				})
				.catch(() => {
					// Keep the draft dirty so the next edit, or a retry, can save again.
				});
		}, 400);
		return () => window.clearTimeout(timer);
	}, [dirty, draft, onSave]);

	return { counts: draft, setCounts: updateCounts, saving: dirty };
}
