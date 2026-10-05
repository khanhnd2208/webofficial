'use client';

import type { SpyCount } from '@/features/spy-fall/config/spyGame';
import type { GamePhase } from '@/features/spy-fall/types/spyGame';

import SiteAuthChip from '@/components/site/SiteAuthChip';
import PrefsToggleGroup from '@/features/board-game-shared/components/i18n/PrefsToggleGroup';
import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { cn } from '@/features/board-game-shared/lib/cn';
import GameIcon from '@/features/board-game-shared/components/ui/GameIcon';

import PhaseTracker from './PhaseTracker';

interface Props {
	phase: GamePhase;
	roomName: string;
	code: string;
	round?: number;
	spyCount?: SpyCount;
	children: React.ReactNode;
	className?: string;
	onLeave?: () => void;
	leaveBusy?: boolean;
	onOpenGuide?: () => void;
}

const iconButton = 'game-theme-icon-button shrink-0 disabled:opacity-40';

export default function GameShell({
	phase,
	roomName,
	code,
	round,
	spyCount = 1,
	children,
	className,
	onLeave,
	leaveBusy,
	onOpenGuide,
}: Props) {
	const t = useT();
	const inGame = phase !== 'lobby' && phase !== 'result';

	return (
		<div className={cn('game-theme game-theme-spy', className)}>
			<div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,rgba(196,75,40,0.06),transparent_70%)]" />
			<div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-4 lg:max-w-3xl">
				<header className="sticky top-0 z-30 -mx-4 mb-4 border-b border-border bg-background/95 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur supports-[backdrop-filter]:bg-background/80">
					<div className="flex items-center gap-2">
						{onLeave ? (
							<button
								type="button"
								onClick={onLeave}
								disabled={leaveBusy}
								className={iconButton}
								aria-label={t('spy.shell.leave')}
								title={t('spy.shell.leave')}
							>
								<GameIcon name="arrow-left" size={18} />
							</button>
						) : null}
						<span className="game-theme-mark h-9 w-9 rounded-lg shadow-none">
							<GameIcon name="spy" size={17} />
						</span>
						<div className="min-w-0 flex-1">
							<h1 className="font-display truncate text-base font-bold leading-tight text-ink">
								{roomName}
							</h1>
							<p className="font-mono text-xs tracking-widest text-muted">
								{code}
								{inGame && round ? ` · ${t('spy.discussion.title', { round })}` : ''}
							</p>
						</div>
						{onOpenGuide ? (
							<button
								type="button"
								onClick={onOpenGuide}
								className={iconButton}
								aria-label={t('spy.guide.title')}
								title={t('spy.guide.title')}
							>
								<GameIcon name="help" size={18} />
							</button>
						) : null}
						<PrefsToggleGroup />
						<SiteAuthChip variant="badge" showSignIn={false} />
					</div>
					{inGame ? (
						<PhaseTracker current={phase} showReveal={spyCount > 1} className="mt-2" />
					) : null}
				</header>
				<main className="flex flex-1 flex-col">{children}</main>
			</div>
		</div>
	);
}
