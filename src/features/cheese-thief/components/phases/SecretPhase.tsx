'use client';

import { useState } from 'react';

import HoldToReveal from '@/features/cheese-thief/components/HoldToReveal';
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
				? t(job.followers >= count ? 'cheese.secret.job.followers' : 'cheese.secret.job.followersCamo', { count: job.followers })
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
		<div className="fixed inset-0 z-50 flex flex-col items-center bg-[#0c0b09] px-5 pt-10 pb-8 text-[#f4efe4]">
			<div className="flex w-full max-w-md flex-1 flex-col">
				<p className="font-mono text-[0.68rem] tracking-[0.22em] text-[#e0a045] uppercase">{t('cheese.secret.onlyYou')}</p>
				<h1 className="mt-3 font-display text-4xl font-medium">{t('cheese.secret.title')}</h1>
				<p className="mt-3 text-sm leading-relaxed text-[#f4efe4]/70">{t('cheese.secret.order')}</p>
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
									'flex min-h-14 items-center justify-between rounded-2xl border px-4 text-left text-lg',
									selected ? 'border-[#e0a045] bg-[#e0a045]/15' : 'border-white/10 bg-white/5',
								)}
								onClick={() => toggle(player.id)}
							>
								<span>{player.name}</span>
								{selected && <span className="font-mono text-sm text-[#e0a045]">{order + 1}</span>}
							</button>
						);
					})}
				</div>
				<Button
					fullWidth
					className="mt-auto"
					disabled={busy || picks.length !== count}
					loading={busy}
					onClick={() => onSubmit(picks)}
				>
					{t('cheese.secret.done')}
				</Button>
			</div>
		</div>
	);
}
