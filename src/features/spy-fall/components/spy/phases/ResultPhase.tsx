'use client';

import { useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Badge, Button, Card, Stamp } from '@/features/spy-fall/components/ui';
import { cn } from '@/features/spy-fall/lib/cn';
import { getRoleLabel } from '@/features/spy-fall/lib/spy/i18n';
import { playConfirm } from '@/features/spy-fall/lib/sounds';
import type { PlayerPublicDTO, RoomStateDTO } from '@/features/spy-fall/types/spyGame';

import PassportAvatar from '../PassportAvatar';

interface Props {
	state: RoomStateDTO;
	busy?: boolean;
	onRevealWords?: () => void;
	onPlayAgain?: () => void;
}

function roleBadgeVariant(role: PlayerPublicDTO['role']): 'success' | 'danger' | 'default' {
	if (role === 'civilian') return 'success';
	if (role === 'spy' || role === 'mrwhite') return 'danger';
	return 'default';
}

export default function ResultPhase({ state, busy, onRevealWords, onPlayAgain }: Props) {
	const t = useT();
	const result = state.result!;

	useEffect(() => {
		confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
	}, []);

	const winnerLabel =
		result.winningSide === 'civilian' ? t('spy.result.officersWin') : t('spy.result.spyWin');

	const duration = `${Math.floor(result.durationSeconds / 60)}:${(result.durationSeconds % 60)
		.toString()
		.padStart(2, '0')}`;

	const rankedPlayers = useMemo(
		() =>
			[...state.players].sort(
				(a, b) => (b.votesReceived ?? 0) - (a.votesReceived ?? 0),
			),
		[state.players],
	);

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="text-center">
				<Stamp label="Declassified" variant="declassified" animate className="mb-4" />
				<h2
					className={cn(
						'font-display text-4xl font-bold',
						result.winningSide === 'civilian' ? 'text-success' : 'text-danger',
					)}
				>
					{winnerLabel}
				</h2>
				<p className="mt-2 text-base text-muted-foreground">
					{t('spy.result.duration', { time: duration })}
				</p>
			</div>

			<Card elevated className="space-y-3 text-center">
				<p className="font-mono text-[10px] uppercase tracking-widest text-muted">
					{t('spy.result.debrief')}
				</p>
				{result.wordsRevealed ? (
					<>
						<p>
							{t('spy.result.officerWord')}{' '}
							<strong className="font-display text-xl text-ink">{result.civilianWord}</strong>
						</p>
						<p>
							{t('spy.result.spyWord')}{' '}
							<strong className="font-display text-xl text-ink">{result.spyWord}</strong>
						</p>
					</>
				) : (
					<p className="text-sm text-muted-foreground">{t('spy.result.wordsHidden')}</p>
				)}
				{result.mrWhiteGuessResult !== 'skipped' &&
				result.mrWhiteGuessResult !== 'pending' &&
				!state.hideRoles ? (
					<p className="text-sm text-muted-foreground">
						{result.mrWhiteGuessResult === 'correct'
							? t('spy.result.mwCorrect')
							: t('spy.result.mwWrong')}
					</p>
				) : null}
				{onRevealWords ? (
					<Button fullWidth loading={busy} onClick={onRevealWords}>
						{t('spy.result.reveal')}
					</Button>
				) : !result.wordsRevealed ? (
					<p className="text-sm text-muted">{t('spy.result.waitReveal')}</p>
				) : null}
			</Card>

			<div>
				<h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-muted">
					{t('spy.result.roster')}
				</h3>
				<ul className="space-y-2">
					{rankedPlayers.map((p) => {
						const eliminated = result.eliminatedTokens.includes(p.token);
						const votes = p.votesReceived ?? 0;
						return (
							<li
								key={p.token}
								className={cn(
									'flex items-center justify-between gap-3 rounded-xl border px-4 py-3',
									eliminated
										? 'border-danger/30 bg-danger-subtle'
										: 'border-border bg-surface',
								)}
							>
								<div className="flex min-w-0 items-center gap-3">
									<PassportAvatar name={p.name} avatarSeed={p.avatarSeed} size="sm" />
									<span className="truncate font-medium">{p.name}</span>
									{eliminated ? (
										<Stamp label={t('spy.result.elim')} variant="suspect" className="text-[8px]" />
									) : null}
								</div>
								<div className="flex shrink-0 items-center gap-2">
									<Badge variant={votes > 0 ? 'warning' : 'muted'}>
										{t('spy.result.votes', { count: votes })}
									</Badge>
									<Badge variant={roleBadgeVariant(p.role)}>
										{p.role ? getRoleLabel(t, p.role) : '?'}
									</Badge>
								</div>
							</li>
						);
					})}
				</ul>
			</div>

			{state.debug && state.debug.length > 0 ? (
				<details className="text-xs text-muted">
					<summary>{t('spy.result.debug')}</summary>
					<pre className="mt-2 overflow-auto">{JSON.stringify(state.debug, null, 2)}</pre>
				</details>
			) : null}

			{onPlayAgain ? (
				<Button
					fullWidth
					variant="success"
					loading={busy}
					onClick={() => {
						playConfirm();
						onPlayAgain();
					}}
				>
					{t('spy.result.playAgain')}
				</Button>
			) : !state.isHost ? (
				<p className="text-center text-sm text-muted">{t('spy.result.waitPlayAgain')}</p>
			) : null}
		</div>
	);
}
