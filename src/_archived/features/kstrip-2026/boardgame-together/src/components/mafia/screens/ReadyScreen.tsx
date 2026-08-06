'use client';

import { useT } from '@/components/i18n/LocaleProvider';
import MafiaScreen from '@/components/mafia/MafiaScreen';
import { mafiaPrimary } from '@/components/mafia/mafiaStyles';
import { useMafiaGame } from '@/components/mafia/hooks/useMafiaGame';
import { Button } from '@/components/ui';

export default function ReadyScreen() {
	const { game, startHandoff, requestHostMode } = useMafiaGame();
	const t = useT();

	return (
		<MafiaScreen center>
			<div className="animate-mafia-rise-in w-full text-center">
				<p className="text-4xl" aria-hidden>
					📱
				</p>
				<p className="mt-4 text-lg text-[var(--mafia-foreground)]">
					{t('mafia.ready.playerCount', { count: game.players.length })}
				</p>
				<p className="mt-1 text-lg text-[var(--mafia-foreground)]">
					{t('mafia.ready.rolesDealt', { count: game.players.length })}
				</p>
				<p className="mt-4 text-sm text-[var(--mafia-muted)]">{t('mafia.ready.secret')}</p>

				<div className="mt-10 w-full space-y-3">
					<Button fullWidth size="lg" className={mafiaPrimary} onClick={startHandoff}>
						{t('mafia.ready.startPass')}
					</Button>
					<Button
						fullWidth
						variant="secondary"
						className="border-[var(--mafia-border)] bg-[var(--mafia-surface)] text-[var(--mafia-foreground)]"
						onClick={requestHostMode}
					>
						{t('mafia.header.hostCta')}
					</Button>
				</div>
			</div>
		</MafiaScreen>
	);
}
