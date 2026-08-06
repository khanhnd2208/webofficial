'use client';

import { useState } from 'react';

import { useT } from '@/components/i18n/LocaleProvider';
import DistributionProgress from '@/components/mafia/DistributionProgress';
import HostRoleOverview from '@/components/mafia/HostRoleOverview';
import MafiaHeader from '@/components/mafia/MafiaHeader';
import MafiaScreen from '@/components/mafia/MafiaScreen';
import RoleThumbnail from '@/components/mafia/RoleThumbnail';
import HostReorderScreen from '@/components/mafia/screens/HostReorderScreen';
import { mafiaGlass, mafiaPrimary } from '@/components/mafia/mafiaStyles';
import { getRoleById } from '@/config/mafiaGame';
import { useMafiaGame } from '@/components/mafia/hooks/useMafiaGame';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { factionName, roleDescription, roleName } from '@/lib/mafia/localize';

type HostView = 'overview' | 'redeal' | 'cancel' | 'reorder' | 'player';

export default function HostOverview() {
	const {
		game,
		viewedCount,
		lockHostMode,
		redealAllRoles,
		cancelGame,
		startHandoff,
		allowReplay,
	} = useMafiaGame();
	const t = useT();
	const [view, setView] = useState<HostView>('overview');
	const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

	const selectedPlayer = selectedPlayerId
		? game.players.find((p) => p.id === selectedPlayerId)
		: null;

	if (view === 'redeal') {
		return (
			<MafiaScreen
				footer={
					<div className="space-y-2">
						<Button
							fullWidth
							variant="destructive"
							onClick={() => {
								redealAllRoles();
								setView('overview');
							}}
						>
							{t('mafia.hostRedeal.confirm')}
						</Button>
						<Button fullWidth variant="ghost" className="text-[var(--mafia-muted)]" onClick={() => setView('overview')}>
							{t('mafia.common.cancel')}
						</Button>
					</div>
				}
			>
				<MafiaHeader title={t('mafia.hostRedeal.title')} />
				<p className="text-sm text-[var(--mafia-muted)]">
					{t('mafia.hostRedeal.body')}
				</p>
			</MafiaScreen>
		);
	}

	if (view === 'cancel') {
		return (
			<MafiaScreen
				footer={
					<div className="space-y-2">
						<Button fullWidth variant="destructive" onClick={cancelGame}>
							{t('mafia.hostCancel.confirm')}
						</Button>
						<Button fullWidth variant="ghost" className="text-[var(--mafia-muted)]" onClick={() => setView('overview')}>
							{t('mafia.hostCancel.back')}
						</Button>
					</div>
				}
			>
				<MafiaHeader title={t('mafia.hostCancel.title')} />
				<p className="text-sm text-[var(--mafia-muted)]">
					{t('mafia.hostCancel.body')}
				</p>
			</MafiaScreen>
		);
	}

	if (view === 'reorder') {
		return <HostReorderScreen onDone={() => setView('overview')} />;
	}

	if (view === 'player' && selectedPlayer) {
		const role = selectedPlayer.roleId ? getRoleById(selectedPlayer.roleId) : null;
		return (
			<MafiaScreen
				footer={
					selectedPlayer.viewStatus === 'VIEWED' ? (
						<Button
							fullWidth
							className={mafiaPrimary}
							onClick={() => {
								allowReplay(selectedPlayer.id);
								setView('overview');
							}}
						>
							{t('mafia.hostOverview.allowReplay')}
						</Button>
					) : undefined
				}
			>
				<MafiaHeader title={selectedPlayer.name} onBack={() => setView('overview')} />
				{role ? (
					<div className="space-y-3">
						<div className={cn('overflow-hidden', mafiaGlass)}>
							<RoleThumbnail
								src={role.image}
								alt={roleName(role.roleId, t)}
								size="lg"
								className="aspect-[2/3] w-full rounded-none"
							/>
						</div>
						<div className="text-center">
							<p className="font-display text-2xl font-bold text-[var(--mafia-gold)]">
								{roleName(role.roleId, t)}
							</p>
							<p className="text-sm text-[var(--mafia-muted)]">{factionName(role.faction, t)}</p>
							<p className="mt-2 text-xs text-[var(--mafia-muted)]">
								{roleDescription(role.roleId, t)}
							</p>
						</div>
					</div>
				) : null}
			</MafiaScreen>
		);
	}

	return (
		<MafiaScreen
			className="pb-28"
			footer={
				<div className="fixed inset-x-0 bottom-0 flex flex-col gap-2 border-t border-[var(--mafia-border)] bg-[var(--mafia-surface-elevated)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
					<Button fullWidth variant="destructive" size="md" onClick={lockHostMode}>
						{t('mafia.hostOverview.hideAll')}
					</Button>
					{!game.distributionCompleted ? (
						<Button fullWidth className={mafiaPrimary} onClick={startHandoff}>
							{viewedCount > 0
								? t('mafia.hostOverview.continuePass')
								: t('mafia.hostOverview.startPass')}
						</Button>
					) : null}
					<Button
						fullWidth
						variant="secondary"
						size="sm"
						className="border-[var(--mafia-border)] bg-[var(--mafia-surface)] text-[var(--mafia-foreground)]"
						onClick={() => setView('reorder')}
					>
						{t('mafia.hostOverview.reorder')}
					</Button>
					<Button
						fullWidth
						variant="tertiary"
						size="sm"
						className="text-[var(--mafia-muted)]"
						onClick={() => setView('redeal')}
					>
						{t('mafia.hostOverview.redeal')}
					</Button>
					<Button
						fullWidth
						variant="ghost"
						size="sm"
						className="text-[var(--mafia-muted)]"
						onClick={() => setView('cancel')}
					>
						{t('mafia.hostOverview.cancelGame')}
					</Button>
				</div>
			}
		>
			<div className="flex items-center justify-between">
				<h1 className="font-display text-xl font-bold text-[var(--mafia-foreground)]">
					{t('mafia.hostOverview.title')}
				</h1>
				<DistributionProgress
					viewed={viewedCount}
					total={game.players.length}
					className="text-[var(--mafia-muted)]"
				/>
			</div>

			<div className="mt-4">
				<HostRoleOverview
					players={game.players}
					onSelectPlayer={(id) => {
						setSelectedPlayerId(id);
						setView('player');
					}}
				/>
			</div>
		</MafiaScreen>
	);
}
