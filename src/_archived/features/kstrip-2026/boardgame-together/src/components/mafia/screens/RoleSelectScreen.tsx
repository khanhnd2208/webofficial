'use client';

import { useT } from '@/components/i18n/LocaleProvider';
import MafiaHeader from '@/components/mafia/MafiaHeader';
import MafiaScreen from '@/components/mafia/MafiaScreen';
import { mafiaGlass, mafiaPrimary } from '@/components/mafia/mafiaStyles';
import {
	getEnabledRoles,
	getRoleById,
	getTotalRoleCount,
	getWerewolfWarning,
} from '@/config/mafiaGame';
import { useMafiaGame } from '@/components/mafia/hooks/useMafiaGame';
import RoleThumbnail from '@/components/mafia/RoleThumbnail';
import { Button } from '@/components/ui';
import { hapticLight } from '@/lib/haptics';
import { cn } from '@/lib/cn';
import { factionName, roleName } from '@/lib/mafia/localize';
import type { RoleSelection } from '@/types/mafiaGame';

interface RoleQuantityCardProps {
	roleId: string;
	count: number;
	onChange: (count: number) => void;
	maxTotal: number;
	currentTotal: number;
	t: (key: string, params?: Record<string, string | number>) => string;
}

export function RoleQuantityCard({
	roleId,
	count,
	onChange,
	maxTotal,
	currentTotal,
	t,
}: RoleQuantityCardProps) {
	const role = getRoleById(roleId);
	if (!role) return null;
	const localizedRoleName = roleName(role.roleId, t);

	return (
		<div className={cn('flex items-center gap-3 p-3', mafiaGlass)}>
			<RoleThumbnail src={role.image} alt={localizedRoleName} size="md" />
			<div className="min-w-0 flex-1">
				<p className="font-semibold uppercase tracking-wide text-[var(--mafia-foreground)]">
					{localizedRoleName}
				</p>
				<p className="text-xs text-[var(--mafia-muted)]">{factionName(role.faction, t)}</p>
			</div>
			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => {
						hapticLight();
						onChange(Math.max(0, count - 1));
					}}
					disabled={count <= 0}
					className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--mafia-border)] text-lg text-[var(--mafia-foreground)] disabled:opacity-30"
					aria-label={t('mafia.roles.decAria')}
				>
					−
				</button>
				<span className="w-6 text-center font-mono text-lg text-[var(--mafia-gold)]">{count}</span>
				<button
					type="button"
					onClick={() => {
						hapticLight();
						if (currentTotal < maxTotal) onChange(count + 1);
					}}
					disabled={currentTotal >= maxTotal}
					className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--mafia-border)] text-lg text-[var(--mafia-foreground)] disabled:opacity-30"
					aria-label={t('mafia.roles.incAria')}
				>
					+
				</button>
			</div>
		</div>
	);
}

export default function RoleSelectScreen() {
	const { game, setRoleSelections, applySuggestedRoles, updateGame } = useMafiaGame();
	const t = useT();
	const playerCount = game.players.length;
	const roles = getEnabledRoles();

	const selections: RoleSelection[] = roles.map((r) => {
		const existing = game.roleSelections.find((s) => s.roleId === r.roleId);
		return { roleId: r.roleId, count: existing?.count ?? 0 };
	});

	const total = getTotalRoleCount(selections);
	const diff = playerCount - total;
	const warningKey = getWerewolfWarning(selections, playerCount);

	const updateCount = (roleId: string, count: number) => {
		const next = selections.map((s) => (s.roleId === roleId ? { ...s, count } : s));
		setRoleSelections(next.filter((s) => s.count > 0));
	};

	const footerMessage =
		diff === 0
			? t('mafia.roles.footerOk', { total, playerCount })
			: diff > 0
				? t('mafia.roles.footerNeed', { total, playerCount, diff })
				: t('mafia.roles.footerTooMany', { total, playerCount, diff: -diff });

	return (
		<MafiaScreen
			className="pb-28"
			footer={
				<div className="fixed inset-x-0 bottom-0 border-t border-[var(--mafia-border)] bg-[var(--mafia-surface-elevated)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
					<p className="text-center text-sm text-[var(--mafia-foreground)]">
						{footerMessage}
					</p>
					<Button
						fullWidth
						className={cn('mt-2', mafiaPrimary)}
						disabled={total !== playerCount}
						onClick={() => updateGame({ status: 'SETUP_PIN' })}
					>
						{t('mafia.roles.continue')}
					</Button>
				</div>
			}
		>
			<MafiaHeader
				title={t('mafia.roles.title')}
				onBack={() => updateGame({ status: 'SETUP_ORDER' })}
			/>

			<Button
				type="button"
				variant="secondary"
				size="sm"
				className="mb-4 border-[var(--mafia-border)] bg-[var(--mafia-surface)] text-[var(--mafia-foreground)]"
				onClick={applySuggestedRoles}
			>
				{t('mafia.roles.suggest')}
			</Button>

			<div className="space-y-2">
				{roles.map((role) => {
					const sel = selections.find((s) => s.roleId === role.roleId)!;
					return (
						<RoleQuantityCard
							key={role.roleId}
							roleId={role.roleId}
							count={sel.count}
							onChange={(c) => updateCount(role.roleId, c)}
							maxTotal={playerCount}
							currentTotal={total}
							t={t}
						/>
					);
				})}
			</div>

			{warningKey ? (
				<p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
					{t(warningKey)}
				</p>
			) : null}
		</MafiaScreen>
	);
}
