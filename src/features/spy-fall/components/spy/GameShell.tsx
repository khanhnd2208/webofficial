'use client';

import type { GamePhase } from '@/features/spy-fall/types/spyGame';

import PrefsToggleGroup from '@/features/spy-fall/components/i18n/PrefsToggleGroup';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { cn } from '@/features/spy-fall/lib/cn';

import PhaseTracker from './PhaseTracker';

interface Props {
	phase: GamePhase;
	roomName: string;
	code: string;
	round?: number;
	children: React.ReactNode;
	className?: string;
	onLeave?: () => void;
	leaveBusy?: boolean;
	onOpenGuide?: () => void;
}

const iconButton =
	'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-base text-foreground transition hover:bg-surface-hover disabled:opacity-40';

export default function GameShell({
	phase,
	roomName,
	code,
	round,
	children,
	className,
	onLeave,
	leaveBusy,
	onOpenGuide,
}: Props) {
	const t = useT();
	const inGame = phase !== 'lobby' && phase !== 'result';

	return (
		<div className={cn('relative min-h-dvh bg-background', className)}>
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
								<span aria-hidden>←</span>
							</button>
						) : null}
						<div className="min-w-0 flex-1">
							<h1 className="font-display truncate text-base font-bold leading-tight text-ink">
								{roomName}
							</h1>
							<p className="font-mono text-[11px] tracking-widest text-muted">
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
								<span aria-hidden className="font-bold">
									?
								</span>
							</button>
						) : null}
						<PrefsToggleGroup />
					</div>
					{inGame ? <PhaseTracker current={phase} className="mt-2" /> : null}
				</header>
				<main className="flex flex-1 flex-col">{children}</main>
			</div>
		</div>
	);
}
