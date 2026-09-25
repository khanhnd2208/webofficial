'use client';

import { useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Badge, Button, Card } from '@/features/spy-fall/components/ui';
import { cn } from '@/features/spy-fall/lib/cn';
import { getRoleLabel } from '@/features/spy-fall/lib/spy/i18n';
import { playConfirm } from '@/features/spy-fall/lib/sounds';
import type {
	GameResultDTO,
	PlayerPublicDTO,
	RoomStateDTO,
} from '@/features/spy-fall/types/spyGame';
import type { TranslateFn } from '@/features/spy-fall/lib/spy/i18n';

import ActionBar, { ActionBarNote } from '../ActionBar';
import PassportAvatar from '../PassportAvatar';
import StepGuide from '../StepGuide';

interface Props {
	state: RoomStateDTO;
	busy?: boolean;
	onPlayAgain?: () => void;
}

function roleBadgeVariant(role: PlayerPublicDTO['role']): 'success' | 'danger' | 'default' {
	if (role === 'civilian') return 'success';
	if (role === 'spy') return 'danger';
	return 'default';
}

/** One line on how the game ended: who was voted out, or why nobody was. */
function endReasonText(
	t: TranslateFn,
	result: GameResultDTO,
	spyCount: number,
	names: Map<string, string>,
): string | null {
	const last = result.eliminationLog.at(-1);
	switch (result.endReason) {
		case 'all-spies-caught':
			return t(spyCount === 2 ? 'spy.result.reason.caughtTwo' : 'spy.result.reason.caughtOne');
		case 'wrong-vote':
			return t('spy.result.reason.wrongVote', {
				name: (last?.token && names.get(last.token)) || '?',
			});
		case 'no-elimination':
			return last?.tally.some((row) => row.votes > 0)
				? t('spy.result.reason.tie')
				: t('spy.result.reason.noVotes');
		case 'spies-gone':
			return t('spy.result.reason.spiesGone');
		case 'outnumbered':
			return t('spy.result.reason.outnumbered');
		default:
			return null;
	}
}

export default function ResultPhase({ state, busy, onPlayAgain }: Props) {
	const t = useT();
	const result = state.result!;
	const names = useMemo(
		() => new Map(state.players.map((p) => [p.token, p.name])),
		[state.players],
	);
	const civiliansWon = result.winningSide === 'civilian';
	const spies = state.players.filter((p) => p.role === 'spy');
	const spyNames = spies.map((p) => p.name).join(', ');
	const twoSpies = state.spyCount === 2;
	const reason = endReasonText(t, result, state.spyCount, names);
	const finalRound = result.eliminationLog.at(-1);
	const finalTally = (finalRound?.tally ?? [])
		.filter((row) => row.votes > 0)
		.sort((a, b) => b.votes - a.votes);
	const selfRole = state.self?.role;
	const selfWon =
		selfRole != null && (selfRole === 'civilian') === civiliansWon;

	useEffect(() => {
		if (!selfWon) return;
		confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
	}, [selfWon]);

	const duration = `${Math.floor(result.durationSeconds / 60)}:${(result.durationSeconds % 60)
		.toString()
		.padStart(2, '0')}`;

	return (
		<>
			<div className="space-y-6 animate-fade-in">
				<div className="text-center">
					<h2
						className={cn(
							'font-display text-4xl font-bold',
							civiliansWon ? 'text-success' : 'text-danger',
						)}
					>
						{civiliansWon
							? t('spy.result.officersWin')
							: t(twoSpies ? 'spy.result.spiesWin' : 'spy.result.spyWin')}
					</h2>
					{reason ? <p className="mt-2 text-sm text-foreground-secondary">{reason}</p> : null}
					{selfRole ? (
						<p className="mt-2 text-base font-semibold text-ink">
							{selfWon ? t('spy.result.youWon') : t('spy.result.youLost')}
						</p>
					) : null}
					<p className="mt-1 text-sm text-muted-foreground">
						{t('spy.result.duration', { time: duration })}
					</p>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<Card elevated className="p-4 text-center">
						<p className="text-xs text-muted">{t('spy.result.civilianWord')}</p>
						<p className="mt-1 break-words font-display text-2xl font-bold text-ink">
							{result.civilianWord}
						</p>
					</Card>
					<Card elevated className="border-danger/40 p-4 text-center">
						<p className="text-xs text-muted">{t('spy.result.spyWord')}</p>
						<p className="mt-1 break-words font-display text-2xl font-bold text-danger">
							{result.spyWord}
						</p>
					</Card>
				</div>
				<div className="space-y-1 text-center text-sm">
					{spyNames ? (
						<p>
							{t(spies.length > 1 ? 'spy.result.spiesWere' : 'spy.result.spyWas', {
								name: spyNames,
							})}
						</p>
					) : null}
				</div>

				{finalTally.length > 0 ? (
					<section>
						<h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
							{t('spy.result.finalTally')}
						</h3>
						<ul className="space-y-1.5">
							{finalTally.map((row) => (
								<li
									key={row.token}
									className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
								>
									<span className="truncate">{names.get(row.token) ?? '?'}</span>
									<span className="shrink-0 font-semibold tabular-nums">
										{t('spy.reveal.votes', { count: row.votes })}
									</span>
								</li>
							))}
						</ul>
					</section>
				) : null}

				{result.eliminationLog.length > 0 ? (
					<section>
						<h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
							{t('spy.result.timeline')}
						</h3>
						<ol className="space-y-1.5 text-sm">
							{result.eliminationLog.map((entry, index) => {
								const who = entry.token ? (names.get(entry.token) ?? '?') : t('spy.result.nobody');
								return (
									<li
										key={`${entry.round}-${index}`}
										className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
									>
										<span className="min-w-0 truncate">
											<span className="text-muted">{t('spy.discussion.title', { round: entry.round })}</span>{' '}
											· {who}
										</span>
										{entry.role ? (
											<Badge variant={roleBadgeVariant(entry.role)}>{getRoleLabel(t, entry.role)}</Badge>
										) : null}
									</li>
								);
							})}
						</ol>
					</section>
				) : null}

				<section>
					<h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
						{t('spy.result.roster')}
					</h3>
					<ul className="space-y-2">
						{state.players.map((p) => (
							<li
								key={p.token}
								className={cn(
									'flex items-center justify-between gap-3 rounded-xl border px-4 py-3',
									p.role === 'civilian' ? 'border-border bg-surface' : 'border-danger/30 bg-danger-subtle',
								)}
							>
								<div className="flex min-w-0 items-center gap-3">
									<PassportAvatar name={p.name} avatarSeed={p.avatarSeed} size="sm" />
									<span className={cn('truncate font-medium', p.isEliminated && 'line-through opacity-70')}>
										{p.name}
									</span>
									{p.token === state.self?.token ? (
										<Badge variant="accent">{t('spy.player.you')}</Badge>
									) : null}
								</div>
								<Badge variant={roleBadgeVariant(p.role)}>
									{p.role ? getRoleLabel(t, p.role) : '?'}
								</Badge>
							</li>
						))}
					</ul>
				</section>

				<StepGuide stepsKey="spy.steps.result" />
			</div>

			<ActionBar>
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
				) : (
					<ActionBarNote>{t('spy.result.waitPlayAgain')}</ActionBarNote>
				)}
			</ActionBar>
		</>
	);
}
