'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import ActionBar from '@/features/cheese-thief/components/ActionBar';
import HoldToReveal from '@/features/cheese-thief/components/HoldToReveal';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';
import type { RoomStateDTO } from '@/features/cheese-thief/types';
import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { Button } from '@/features/board-game-shared/components/ui';
import { cn } from '@/features/board-game-shared/lib/cn';

interface Props {
	state: RoomStateDTO;
	busy: boolean;
	onSubmit: (picks: string[]) => void;
	/** Saves an unfinished selection. Failures are ignored; the next tap or Done tries again. */
	onDraft: (picks: string[]) => Promise<unknown>;
}

type SlotRole = 'follower' | 'peek' | 'hunch' | 'filler';

/** Same order the server reads picks in (`slotsOf`): followers, then the peek, then the hunch. */
function slotRoleAt(index: number, job: { followers: number; peek: boolean }): SlotRole {
	if (index < job.followers) return 'follower';
	const peekAt = job.peek ? job.followers : -1;
	if (index === peekAt) return 'peek';
	// Only non-Thieves have a hunch worth recording; the Thief's spare slots just match the screens.
	if (job.followers === 0 && index === (job.peek ? 1 : 0)) return 'hunch';
	return 'filler';
}

/** Sends drafts one at a time, latest wins, so a slow request never lands after a newer one. */
function useDraftSender(send: (picks: string[]) => Promise<unknown>) {
	const inFlight = useRef<Promise<void> | null>(null);
	const queued = useRef<string[] | null>(null);
	const sendRef = useRef(send);
	useEffect(() => {
		sendRef.current = send;
	}, [send]);

	const pump = useCallback((): Promise<void> => {
		if (inFlight.current) return inFlight.current;
		const run = async () => {
			while (queued.current) {
				const next = queued.current;
				queued.current = null;
				try {
					await sendRef.current(next);
				} catch {
					// A draft is best effort.
				}
			}
			inFlight.current = null;
		};
		inFlight.current = run();
		return inFlight.current;
	}, []);

	const queue = useCallback(
		(picks: string[]) => {
			queued.current = picks;
			void pump();
		},
		[pump],
	);

	/** Resolves once every queued draft has landed, so Done is never overwritten by an older draft. */
	const settle = useCallback(async () => {
		while (inFlight.current) await inFlight.current;
	}, []);

	return { queue, settle };
}

export default function SecretPhase({ state, busy, onSubmit, onDraft }: Props) {
	const t = useT();
	const count = state.choiceCount ?? 1;
	const [picks, setPicks] = useState<string[]>([]);
	const [sentPicks, setSentPicks] = useState<string[] | null>(null);
	const [full, setFull] = useState(false);
	const [settling, setSettling] = useState(false);
	const locked = busy || settling;
	const drafts = useDraftSender(onDraft);
	const others = state.players.filter((player) => player.id !== state.self?.id);
	const job = state.self?.secretJob;
	const jobText = !job
		? ''
		: job.followers > 0 && job.peek
			? t('cheese.secret.job.followersPeek')
			: job.followers > 0
				? t(
						job.followers >= count
							? 'cheese.secret.job.followers'
							: 'cheese.secret.job.followersCamo',
						{ count: job.followers },
					)
				: job.peek
					? t(count > 1 ? 'cheese.secret.job.peek' : 'cheese.secret.job.peekOnly')
					: t(count > 1 ? 'cheese.secret.job.hunch' : 'cheese.secret.job.hunchOnly');

	const sent =
		Boolean(state.self?.hasChosenSecret) &&
		sentPicks !== null &&
		sentPicks.length === picks.length &&
		sentPicks.every((id, index) => picks[index] === id);
	const resending = sentPicks !== null && !sent;

	// Tapping past the last slot used to drop slot ① silently — often the player to peek at.
	function toggle(id: string) {
		if (locked) return;
		let next: string[];
		if (picks.includes(id)) next = picks.filter((item) => item !== id);
		else if (picks.length >= count) {
			setFull(true);
			return;
		} else next = [...picks, id];
		setFull(false);
		setPicks(next);
		drafts.queue(next);
	}

	// Freeze the list while older drafts land, so Done confirms exactly what the screen shows.
	async function submit() {
		setSettling(true);
		try {
			await drafts.settle();
			setSentPicks(picks);
			onSubmit(picks);
		} finally {
			setSettling(false);
		}
	}

	const nameOf = (id: string | undefined) => others.find((player) => player.id === id)?.name;

	return (
		<div className="dark fixed inset-0 z-50 overflow-y-auto bg-background text-foreground">
			<div className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-56">
				<div className="flex items-center justify-between gap-3">
					<p className="font-mono text-xs leading-snug tracking-[0.18em] text-accent uppercase">
						{t('cheese.secret.onlyYou')}
					</p>
					<CheeseThiefArt scene="secret" size={38} />
				</div>
				<h1 className="mt-3 font-display text-4xl font-medium">{t('cheese.secret.title')}</h1>

				<p className="mt-2 text-sm leading-relaxed text-foreground/70">
					{t('cheese.secret.noRush')}
				</p>
				<ol className="mt-4 space-y-2" aria-label={t('cheese.secret.stepsLabel')}>
					{(['step1', 'step2', 'step3'] as const).map((key, index) => (
						<li key={key} className="flex gap-3 text-sm leading-snug text-foreground/85">
							<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/60! font-mono text-xs text-accent">
								{index + 1}
							</span>
							<span className="pt-0.5">{t(`cheese.secret.${key}`)}</span>
						</li>
					))}
				</ol>

				{jobText && (
					<HoldToReveal
						className="mt-5"
						compact
						cover={t('cheese.secret.job.label')}
						hint={t('cheese.secret.holdHint')}
					>
						<p className="text-base leading-relaxed text-foreground">{jobText}</p>
						{job && (
							<ol className="mt-2 w-full space-y-1.5 text-left text-sm">
								{Array.from({ length: count }, (_, index) => (
									<li
										key={index}
										className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2"
									>
										<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-xs font-semibold text-accent-foreground">
											{index + 1}
										</span>
										<span className="min-w-0 flex-1 break-words text-foreground/80">
											{t(`cheese.secret.slot.${slotRoleAt(index, job)}`)}
										</span>
										<strong className="min-w-0 break-words text-right font-medium text-foreground">
											{nameOf(picks[index]) ?? '—'}
										</strong>
									</li>
								))}
							</ol>
						)}
					</HoldToReveal>
				)}

				<p className="mt-6 mb-2 font-mono text-xs tracking-[0.18em] text-foreground/60 uppercase">
					{t('cheese.secret.namesLabel')}
				</p>
				<div className="grid gap-2">
					{others.map((player) => {
						const order = picks.indexOf(player.id);
						const selected = order >= 0;
						return (
							<button
								key={player.id}
								type="button"
								className={cn(
									'flex min-h-14 items-center gap-3 rounded-2xl border px-3 py-2 text-left text-lg transition-colors',
									selected
										? 'border-accent! bg-accent/15'
										: 'border-white/10! bg-white/5 active:bg-white/10',
									!selected && picks.length >= count && 'opacity-55',
								)}
								aria-pressed={selected}
								disabled={locked}
								onClick={() => toggle(player.id)}
							>
								<span
									className={cn(
										'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold',
										selected
											? 'bg-accent text-accent-foreground'
											: 'border-2 border-dashed border-white/25!',
									)}
									aria-hidden
								>
									{selected ? order + 1 : ''}
								</span>
								<span className="min-w-0 flex-1 break-words">{player.name}</span>
							</button>
						);
					})}
				</div>
			</div>

			<ActionBar dark>
				<ol className="flex gap-2">
					{Array.from({ length: count }, (_, index) => {
						const name = nameOf(picks[index]);
						return (
							<li key={index} className="min-w-0 flex-1">
								{name ? (
									<button
										type="button"
										disabled={locked}
										className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-accent/70! bg-accent/15 px-2.5 text-left text-sm"
										aria-label={t('cheese.secret.unpick', { name, n: index + 1 })}
										onClick={() => toggle(picks[index]!)}
									>
										<span className="font-mono text-xs text-accent">{index + 1}</span>
										<span className="min-w-0 flex-1 truncate">{name}</span>
										<span aria-hidden className="text-base leading-none text-foreground/60">
											×
										</span>
									</button>
								) : (
									<p className="flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-white/20! px-2.5 text-sm text-foreground/50">
										<span className="font-mono text-xs">{index + 1}</span>
										<span className="truncate">{t('cheese.secret.slotEmpty')}</span>
									</p>
								)}
							</li>
						);
					})}
				</ol>
				<p
					className={cn(
						'text-center text-xs leading-snug',
						full ? 'text-danger' : sent ? 'text-accent' : 'text-foreground/75',
					)}
					aria-live="polite"
				>
					{full
						? t('cheese.secret.full', { total: count })
						: sent
							? t('cheese.secret.chosen')
							: t('cheese.secret.selected', { done: picks.length, total: count })}
				</p>
				<Button
					fullWidth
					disabled={locked || sent || picks.length !== count}
					loading={locked}
					onClick={() => void submit()}
				>
					{sent
						? t('cheese.secret.sent')
						: resending
							? t('cheese.secret.saveAgain')
							: t('cheese.secret.done')}
				</Button>
			</ActionBar>
		</div>
	);
}
