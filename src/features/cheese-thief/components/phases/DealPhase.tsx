'use client';

import { useState } from 'react';

import HoldToReveal from '@/features/cheese-thief/components/HoldToReveal';
import PutPhoneDown from '@/features/cheese-thief/components/PutPhoneDown';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';
import type { RoomStateDTO } from '@/features/cheese-thief/types';
import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { Button } from '@/features/board-game-shared/components/ui';

interface Props {
	state: RoomStateDTO;
	busy: boolean;
	onRemember: () => void;
	onBeginNight: () => void;
}

export default function DealPhase({ state, busy, onRemember, onBeginNight }: Props) {
	const t = useT();
	const self = state.self;
	const [held, setHeld] = useState(false);
	const ready = state.players.filter((player) => player.hasMemorizedRole).length;
	const allReady = ready === state.players.length && state.players.length > 0;
	const remembered = Boolean(self?.hasMemorizedRole);
	const hour = (self?.wakeHours ?? []).join(' · ');

	if (!self?.role) return null;

	return (
		<div className="space-y-6">
			<h1 className="text-center font-display text-3xl font-medium">{t('cheese.deal.title')}</h1>
			<div>
				<HoldToReveal onFirstReveal={() => setHeld(true)}>
					<CheeseThiefArt
						scene={
							self.role === 'thief' ? 'cheese' : self.role === 'scapegoat' ? 'reveal' : 'mouse'
						}
						size={54}
					/>
					<p className="font-mono text-[0.68rem] tracking-[0.2em] text-[#e0a045] uppercase">
						{t(`cheese.deal.role.${self.role}`)}
					</p>
					<p className="max-w-xs text-sm leading-relaxed text-[#f4efe4]/80">
						{t(`cheese.deal.blurb.${self.role}`)}
					</p>
					<p className="text-xs tracking-wide text-[#f4efe4]/60 uppercase">
						{t('cheese.deal.yourHours')}
					</p>
					<p className="font-display text-4xl text-[#f4efe4]">{hour}</p>
				</HoldToReveal>
			</div>

			{remembered ? (
				<PutPhoneDown />
			) : held ? (
				<Button fullWidth disabled={busy} loading={busy} onClick={onRemember}>
					{t('cheese.deal.remembered')}
				</Button>
			) : (
				<p className="rounded-2xl border border-dashed border-border px-4 py-3 text-center text-sm text-muted">
					{t('cheese.deal.holdFirst')}
				</p>
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
