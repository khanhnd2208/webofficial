'use client';

import Link from 'next/link';

import LanguageToggle from '@/components/i18n/LanguageToggle';
import DistributionProgress from '@/components/mafia/DistributionProgress';
import { useMafiaGame } from '@/components/mafia/hooks/useMafiaGame';
import MafiaScreen from '@/components/mafia/MafiaScreen';
import { mafiaPrimary } from '@/components/mafia/mafiaStyles';
import { Button } from '@/components/ui';
import { useT } from '@/components/i18n/LocaleProvider';

export default function HomeScreen() {
	const { game, startNewGame, continueGame, viewedCount } = useMafiaGame();
	const t = useT();
	const hasActiveGame =
		game.status !== 'HOME' &&
		game.status !== 'SETUP_PLAYERS' &&
		game.status !== 'CANCELLED' &&
		(game.players.length > 0 || game.hostPinHash !== null);

	const viewed = viewedCount;
	const total = game.players.length;

	return (
		<MafiaScreen center>
			<div className="absolute right-4 top-4 z-10">
				<LanguageToggle className="border-[var(--mafia-border)] bg-[var(--mafia-surface)] text-[var(--mafia-foreground)] hover:bg-white/5" />
			</div>
			<header className="animate-mafia-rise-in text-center">
				<p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--mafia-muted)]">
					{t('mafia.home.eyebrow')}
				</p>
				<p className="mt-3 text-5xl" aria-hidden>
					🐺
				</p>
				<h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-[var(--mafia-foreground)]">
					{t('mafia.home.brand')}
				</h1>
				<p className="mt-2 text-sm text-[var(--mafia-muted)]">{t('mafia.home.tagline')}</p>
			</header>

			<div className="mt-10 w-full space-y-3">
				<Button fullWidth size="lg" className={mafiaPrimary} onClick={startNewGame}>
					{t('mafia.home.newGame')}
				</Button>

				{hasActiveGame ? (
					<div className="space-y-2">
						<Button
							fullWidth
							variant="secondary"
							className="border-[var(--mafia-border)] bg-[var(--mafia-surface)] text-[var(--mafia-foreground)] hover:bg-white/5"
							onClick={continueGame}
						>
							{t('mafia.home.continue')}
						</Button>
						<DistributionProgress
							viewed={viewed}
							total={total}
							className="text-center text-[var(--mafia-muted)]"
						/>
					</div>
				) : null}
			</div>

			<nav className="mt-10 flex flex-col items-center gap-2 text-sm">
				<Link href="/?tab=boardgames" className="text-[var(--mafia-muted)] hover:text-[var(--mafia-foreground)]">
					{t('mafia.home.backToSite')}
				</Link>
				<Link href="/games/mafia/guide" className="text-[var(--mafia-gold)] hover:underline">
					{t('mafia.home.guideLink')}
				</Link>
			</nav>
		</MafiaScreen>
	);
}
