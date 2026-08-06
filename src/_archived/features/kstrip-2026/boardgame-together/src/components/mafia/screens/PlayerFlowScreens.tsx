'use client';

import { useT } from '@/components/i18n/LocaleProvider';
import HostGuardButton from '@/components/mafia/HostGuardButton';
import HoldToRevealCard from '@/components/mafia/HoldToRevealCard';
import MafiaScreen from '@/components/mafia/MafiaScreen';
import { mafiaPrimary } from '@/components/mafia/mafiaStyles';
import { useCurrentPlayer, useMafiaGame } from '@/components/mafia/hooks/useMafiaGame';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';

export function HandoffScreen() {
	const { game, confirmIdentity, requestHostMode, updateGame } = useMafiaGame();
	const t = useT();
	const player = useCurrentPlayer();
	if (!player) return null;

	const isFirst = game.players.every((p) => p.viewStatus === 'PENDING');

	return (
		<MafiaScreen center guardTop>
			<HostGuardButton onPress={requestHostMode} />

			<div className="animate-mafia-rise-in w-full text-center">
				{isFirst ? (
					<>
						<p className="text-sm text-[var(--mafia-muted)]">{t('mafia.handoff.firstLabel')}</p>
						<p className="mt-2 text-4xl" aria-hidden>
							📱
						</p>
						<h1 className="font-display mt-2 text-4xl font-bold text-[var(--mafia-gold)]">
							{player.name}
						</h1>
						<p className="mt-4 text-[var(--mafia-muted)]">
							{t('mafia.handoff.giveTo', { name: player.name })}
						</p>
						<Button
							className={cn('mt-8', mafiaPrimary)}
							fullWidth
							onClick={() => updateGame({ status: 'PLAYER_CONFIRM' })}
						>
							{t('mafia.handoff.continue')}
						</Button>
					</>
				) : (
					<>
						<p className="text-4xl" aria-hidden>
							📱
						</p>
						<p className="mt-4 text-[var(--mafia-muted)]">{t('mafia.handoff.passTo')}</p>
						<h1 className="font-display mt-2 text-4xl font-bold text-[var(--mafia-gold)]">
							{player.name}
						</h1>
						<p className="mt-4 text-xs text-[var(--mafia-muted)]">
							{t('mafia.handoff.noPeek')}
						</p>
						<Button className={cn('mt-8', mafiaPrimary)} fullWidth onClick={confirmIdentity}>
							{t('mafia.handoff.iAm', { name: player.name })}
						</Button>
					</>
				)}
			</div>
		</MafiaScreen>
	);
}

export function PlayerIdentityConfirm() {
	const { confirmIdentity, denyIdentity, requestHostMode } = useMafiaGame();
	const t = useT();
	const player = useCurrentPlayer();
	if (!player) return null;

	return (
		<MafiaScreen center guardTop>
			<HostGuardButton onPress={requestHostMode} />
			<div className="animate-mafia-rise-in w-full text-center">
				<p className="text-[var(--mafia-muted)]">{t('mafia.confirm.for')}</p>
				<h1 className="font-display mt-2 text-4xl font-bold text-[var(--mafia-gold)]">{player.name}</h1>
				<p className="mt-6 text-[var(--mafia-muted)]">
					{t('mafia.confirm.ask', { name: player.name })}
				</p>
				<div className="mt-8 w-full space-y-3">
					<Button fullWidth className={mafiaPrimary} onClick={confirmIdentity}>
						{t('mafia.confirm.yes', { name: player.name })}
					</Button>
					<Button
						fullWidth
						variant="secondary"
						className="border-[var(--mafia-border)] bg-[var(--mafia-surface)] text-[var(--mafia-foreground)]"
						onClick={denyIdentity}
					>
						{t('mafia.confirm.no')}
					</Button>
				</div>
				<p className="mt-4 text-xs text-[var(--mafia-muted)]">
					{t('mafia.confirm.returnHint')}
				</p>
			</div>
		</MafiaScreen>
	);
}

export function PlayerRevealScreen() {
	const { confirmRemembered, requestHostMode } = useMafiaGame();
	const player = useCurrentPlayer();
	if (!player) return null;

	return (
		<MafiaScreen guardTop className="justify-center">
			<HostGuardButton onPress={requestHostMode} />
			<HoldToRevealCard player={player} onConfirm={confirmRemembered} />
		</MafiaScreen>
	);
}

export function HiddenRoleScreen() {
	const { confirmRemembered, requestReplay, requestHostMode } = useMafiaGame();
	const t = useT();

	return (
		<MafiaScreen center guardTop>
			<HostGuardButton onPress={requestHostMode} />
			<div className="animate-mafia-rise-in w-full text-center">
				<p className="text-lg text-[var(--mafia-foreground)]">{t('mafia.hidden.title')}</p>
				<p className="mt-4 text-[var(--mafia-muted)]">{t('mafia.hidden.ask')}</p>
				<div className="mt-8 w-full space-y-3">
					<Button fullWidth className={mafiaPrimary} onClick={confirmRemembered}>
						{t('mafia.hidden.remembered')}
					</Button>
					<Button
						fullWidth
						variant="secondary"
						className="border-[var(--mafia-border)] bg-[var(--mafia-surface)] text-[var(--mafia-foreground)]"
						onClick={requestReplay}
					>
						{t('mafia.hidden.replay')}
					</Button>
				</div>
			</div>
		</MafiaScreen>
	);
}

export function DistributionCompleteScreen() {
	const { requestHostMode } = useMafiaGame();
	const t = useT();

	return (
		<MafiaScreen center>
			<div className="animate-mafia-rise-in w-full text-center">
				<p className="text-4xl" aria-hidden>
					✨
				</p>
				<p className="mt-4 text-lg text-[var(--mafia-foreground)]">{t('mafia.complete.allViewed')}</p>
				<h1 className="font-display mt-4 text-3xl font-bold text-[var(--mafia-gold)]">
					{t('mafia.complete.ready')}
				</h1>
				<p className="mt-4 text-[var(--mafia-muted)]">{t('mafia.complete.returnPhone')}</p>
				<Button className={cn('mt-8', mafiaPrimary)} fullWidth onClick={requestHostMode}>
					{t('mafia.header.hostCta')}
				</Button>
			</div>
		</MafiaScreen>
	);
}
