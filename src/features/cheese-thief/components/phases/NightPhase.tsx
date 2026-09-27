'use client';

import NightNarrator from '@/features/cheese-thief/components/NightNarrator';
import type { RoomStateDTO } from '@/features/cheese-thief/types';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';

interface Props {
	state: RoomStateDTO;
	fetchedAt: number;
}

export default function NightPhase({ state, fetchedAt }: Props) {
	const t = useT();

	if (!state.isHost || !state.nightStartedAt) {
		return (
			<div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black text-white">
				<p className="font-display text-7xl" aria-hidden>
					{t('cheese.night.asleep')}
				</p>
				<p className="font-mono text-xs tracking-[0.22em] uppercase">{t('cheese.night.caption')}</p>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 z-50 bg-[#0c0b09]">
			<NightNarrator
				nightStartedAt={state.nightStartedAt}
				serverNow={state.serverNow}
				fetchedAt={fetchedAt}
				mode={state.mode}
				hourSeconds={state.hourSeconds}
				night={state.nightNumber ?? 1}
			/>
		</div>
	);
}
