'use client';

import { useState } from 'react';

import HoldToReveal from '@/features/cheese-thief/components/HoldToReveal';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';
import type { RoomStateDTO } from '@/features/cheese-thief/types';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button } from '@/features/spy-fall/components/ui';
import { cn } from '@/features/spy-fall/lib/cn';

interface Props {
	state: RoomStateDTO;
	busy: boolean;
	onSubmit: (picks: string[]) => void;
}

export default function SecretPhase({ state, busy, onSubmit }: Props) {
	const t = useT();
	const count = state.choiceCount ?? 1;
	const [picks, setPicks] = useState<string[]>([]);
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

	function toggle(id: string) {
		setPicks((current) => {
			if (current.includes(id)) return current.filter((item) => item !== id);
			if (current.length >= count) return [...current.slice(1), id];
			return [...current, id];
		});
	}

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
								disabled={busy}
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
						{t('cheese.secret.selected', { done: picks.length, total: count })}
					</p>
					<Button
						fullWidth
						disabled={busy || picks.length !== count}
						loading={busy}
						onClick={() => onSubmit(picks)}
					>
						{t('cheese.secret.done')}
					</Button>
				</div>
			</div>
		</div>
	);
}
