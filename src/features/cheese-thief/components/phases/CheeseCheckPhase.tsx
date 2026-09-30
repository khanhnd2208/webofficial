'use client';

import { useState } from 'react';

import {
	playVoiceClip,
	speakLine,
	startNightTrack,
	unlockTableAudio,
} from '@/features/cheese-thief/lib/narration';
import { useLocale, useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { Button } from '@/features/board-game-shared/components/ui';
import { cn } from '@/features/board-game-shared/lib/cn';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';

interface Props {
	isHost: boolean;
	hourSeconds: number;
	busy: boolean;
	onConfirm: (present: boolean) => void;
}

export default function CheeseCheckPhase({ isHost, hourSeconds, busy, onConfirm }: Props) {
	const t = useT();
	const { locale } = useLocale();
	const [choice, setChoice] = useState<boolean | null>(null);

	if (!isHost) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black px-6 text-center text-white">
				<div className="flex flex-col items-center gap-6">
					<CheeseThiefArt scene="cheese" size={104} />
					<p className="font-display text-4xl leading-tight font-medium">
						{t('cheese.check.look')}
					</p>
				</div>
			</div>
		);
	}

	function confirm() {
		if (choice === null) return;
		if (choice) {
			if (!startNightTrack({ locale, mode: 'two-night', night: 2, hourSeconds }))
				unlockTableAudio();
		} else {
			unlockTableAudio();
			void playVoiceClip(locale, 'cheese-gone').then((played) => {
				if (!played) speakLine(t('cheese.narrator.cheese-gone'), locale);
			});
		}
		onConfirm(choice);
	}

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-[#0c0b09] px-6 text-[#f4efe4]">
			<div className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-6 py-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
				<CheeseThiefArt scene={choice === false ? 'stolen' : 'cheese'} size={104} />
				<p className="text-center font-display text-4xl leading-tight font-medium">
					{t('cheese.check.look')}
				</p>
				<div className="grid w-full max-w-sm grid-cols-2 gap-3">
					<button
						type="button"
						className={cn(
							'min-h-20 rounded-2xl border text-lg',
							choice === true ? 'border-[#e0a045] bg-[#e0a045]/15' : 'border-white/15',
						)}
						aria-pressed={choice === true}
						onClick={() => setChoice(true)}
					>
						<span className="flex flex-col items-center justify-center gap-1.5">
							<CheeseThiefArt scene="cheese" size={36} />
							<span>{t('cheese.check.present')}</span>
						</span>
					</button>
					<button
						type="button"
						className={cn(
							'min-h-20 rounded-2xl border text-lg',
							choice === false ? 'border-[#e0a045] bg-[#e0a045]/15' : 'border-white/15',
						)}
						aria-pressed={choice === false}
						onClick={() => setChoice(false)}
					>
						<span className="flex flex-col items-center justify-center gap-1.5">
							<CheeseThiefArt scene="stolen" size={36} />
							<span>{t('cheese.check.gone')}</span>
						</span>
					</button>
				</div>
				{choice !== null && (
					<div className="flex w-full max-w-sm flex-col gap-3">
						<Button fullWidth disabled={busy} loading={busy} onClick={confirm}>
							{t('cheese.check.confirm')}
						</Button>
						<button
							type="button"
							className="min-h-11 text-sm text-[#f4efe4]/85"
							onClick={() => setChoice(null)}
						>
							{t('cheese.check.change')}
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
