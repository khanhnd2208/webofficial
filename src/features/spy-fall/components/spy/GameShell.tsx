'use client';

import type { GamePhase } from '@/features/spy-fall/types/spyGame';

import PrefsToggleGroup from '@/features/spy-fall/components/i18n/PrefsToggleGroup';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button } from '@/features/spy-fall/components/ui';
import { cn } from '@/features/spy-fall/lib/cn';

import PhaseTracker from './PhaseTracker';

interface Props {
	phase: GamePhase;
	roomName: string;
	code: string;
	children: React.ReactNode;
	className?: string;
	onLeave?: () => void;
	leaveBusy?: boolean;
}

export default function GameShell({
	phase,
	roomName,
	code,
	children,
	className,
	onLeave,
	leaveBusy,
}: Props) {
	const t = useT();

	return (
		<div
			className={cn(
				'relative min-h-screen bg-background pb-[max(6rem,calc(env(safe-area-inset-bottom)+5rem))]',
				className,
			)}
		>
			<div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,rgba(196,75,40,0.06),transparent_70%)]" />
			<div className="relative mx-auto max-w-md px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top))] lg:max-w-3xl">
				<div className="mb-4 flex items-start justify-between gap-3">
					<header className="min-w-0 flex-1 text-center">
						<p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
							{t(`spy.phases.${phase}`)}
						</p>
						<h1 className="font-display truncate text-xl font-bold text-ink">{roomName}</h1>
						<p className="font-mono text-xs text-muted">{code}</p>
					</header>
					<div className="flex shrink-0 flex-col items-end gap-2">
						<PrefsToggleGroup />
						{onLeave ? (
							<Button
								variant="ghost"
								size="sm"
								onClick={onLeave}
								loading={leaveBusy}
								className="text-xs text-muted"
							>
								{t('spy.shell.leave')}
							</Button>
						) : null}
					</div>
				</div>
				{phase !== 'lobby' && phase !== 'result' ? (
					<PhaseTracker current={phase} className="mb-6" />
				) : null}
				{children}
			</div>
		</div>
	);
}
