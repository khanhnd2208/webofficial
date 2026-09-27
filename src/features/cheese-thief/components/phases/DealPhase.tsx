'use client';

import { useState } from 'react';

import HoldToReveal from '@/features/cheese-thief/components/HoldToReveal';
import PutPhoneDown from '@/features/cheese-thief/components/PutPhoneDown';
import type { RoomStateDTO } from '@/features/cheese-thief/types';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button } from '@/features/spy-fall/components/ui';
import { cn } from '@/features/spy-fall/lib/cn';

interface Props {
	state: RoomStateDTO;
	busy: boolean;
	onRemember: (chosenHour?: number) => void;
	onBeginNight: () => void;
}

export default function DealPhase({ state, busy, onRemember, onBeginNight }: Props) {
	const t = useT();
	const self = state.self;
	const dice = self?.dice ?? [];
	const [hour, setHour] = useState<number | undefined>(undefined);
	const [held, setHeld] = useState(false);
	const ready = state.players.filter((player) => player.hasMemorizedRole).length;
	const allReady = ready === state.players.length && state.players.length > 0;
	const twoDice = dice.length === 2;
	const remembered = Boolean(self?.hasMemorizedRole);

	if (!self?.role) return null;

	return (
		<div className="space-y-6">
			<h1 className="text-center font-display text-3xl font-medium">{t('cheese.deal.title')}</h1>
			<div onPointerDown={() => setHeld(true)}>
				<HoldToReveal>
					<p className="font-mono text-[0.68rem] tracking-[0.2em] text-[#e0a045] uppercase">
						{t(`cheese.deal.role.${self.role}`)}
					</p>
					<p className="max-w-xs text-sm leading-relaxed text-[#f4efe4]/80">{t(`cheese.deal.blurb.${self.role}`)}</p>
					<p className="font-display text-4xl text-[#f4efe4]">
						{self.role === 'thief' && twoDice ? dice.join(' · ') : twoDice ? (hour ? String(hour) : '—') : (self.wakeHours ?? []).join(' · ')}
					</p>
					<p className="text-xs tracking-wide text-[#f4efe4]/60 uppercase">
						{self.role === 'thief' && twoDice ? t('cheese.deal.bothHours') : t('cheese.deal.yourHours')}
					</p>
				</HoldToReveal>
			</div>

			{twoDice && !remembered && (
				<div className="space-y-3">
					<p className="text-center text-sm text-muted">{t('cheese.deal.pickHour')}</p>
					<div className="grid grid-cols-2 gap-3">
						{dice.map((die, index) => (
							<button
								key={`${die}-${index}`}
								type="button"
								className={cn(
									'min-h-16 rounded-2xl border text-2xl font-medium',
									hour === die ? 'border-foreground bg-foreground text-background' : 'border-border bg-surface',
								)}
								onClick={() => setHour(die)}
							>
								{die}
							</button>
						))}
					</div>
				</div>
			)}

			{remembered ? (
				<PutPhoneDown />
			) : (
				<Button fullWidth disabled={busy || !held || (twoDice && hour === undefined)} loading={busy} onClick={() => onRemember(hour)}>
					{held ? t('cheese.deal.remembered') : t('cheese.deal.holdFirst')}
				</Button>
			)}

			<p className="text-center font-mono text-xs tracking-[0.14em] text-muted uppercase">
				{t('cheese.deal.ready', { done: ready, total: state.players.length })}
			</p>

			{state.isHost && allReady && (
				<Button fullWidth disabled={busy} loading={busy} onClick={onBeginNight}>
					{t('cheese.deal.beginNight')}
				</Button>
			)}
		</div>
	);
}
