'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
			onSubmit(picks);
		} finally {
			setSettling(false);
		}
	}

	const nameOf = (id: string | undefined) => others.find((player) => player.id === id)?.name;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-[#0c0b09] text-[#f4efe4]">
			<div className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-32">
				<div className="flex items-center justify-between">
					<p className="font-mono text-[0.68rem] tracking-[0.22em] text-[#e0a045] uppercase">
						{t('cheese.secret.onlyYou')}
					</p>
					<CheeseThiefArt scene="secret" size={38} />
				</div>
				<h1 className="mt-3 font-display text-4xl font-medium">{t('cheese.secret.title')}</h1>
				<p className="mt-3 text-sm leading-relaxed text-[#f4efe4]/85">{t('cheese.secret.order')}</p>
				{jobText && (
					<HoldToReveal className="mt-4" compact cover={t('cheese.secret.job.label')}>
						<p className="text-base leading-relaxed text-[#f4efe4]">{jobText}</p>
						{job && (
							<ol className="mt-3 w-full space-y-1 text-left text-sm text-[#f4efe4]/85">
								{Array.from({ length: count }, (_, index) => (
									<li key={index} className="flex gap-2">
										<span className="font-mono text-[#e0a045]">{index + 1}.</span>
										<span className="min-w-0 break-words">
											{t(`cheese.secret.slot.${slotRoleAt(index, job)}`)}:{' '}
											<strong className="font-medium text-[#f4efe4]">
												{nameOf(picks[index]) ?? '—'}
											</strong>
										</span>
									</li>
								))}
							</ol>
						)}
					</HoldToReveal>
				)}
				<div className="mt-6 grid gap-2">
					{others.map((player) => {
						const order = picks.indexOf(player.id);
						const selected = order >= 0;
						return (
							<button
								key={player.id}
								type="button"
								className={cn(
									'flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-4 py-2 text-left text-lg',
									selected ? 'border-[#e0a045] bg-[#e0a045]/15' : 'border-white/10 bg-white/5',
								)}
								aria-pressed={selected}
								disabled={locked}
								onClick={() => toggle(player.id)}
							>
								<span className="min-w-0 break-words">{player.name}</span>
								{selected && (
									<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e0a045] font-mono text-sm font-semibold text-[#1a140c]">
										{order + 1}
									</span>
								)}
							</button>
						);
					})}
				</div>
				{state.self?.hasChosenSecret && (
					<p className="mt-4 text-center text-sm text-[#e0a045]">{t('cheese.secret.chosen')}</p>
				)}
			</div>
			<div className="fixed inset-x-0 bottom-0 z-10 border-t border-white/10 bg-[#0c0b09]/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
				<div className="mx-auto max-w-md">
					<p
						className="mb-2 text-center font-mono text-xs tracking-[0.12em] text-[#f4efe4]/80"
						aria-live="polite"
					>
						{full
							? t('cheese.secret.full', { total: count })
							: t('cheese.secret.selected', { done: picks.length, total: count })}
					</p>
					<Button
						fullWidth
						disabled={locked || picks.length !== count}
						loading={locked}
						onClick={() => void submit()}
					>
						{t('cheese.secret.done')}
					</Button>
				</div>
			</div>
		</div>
	);
}
