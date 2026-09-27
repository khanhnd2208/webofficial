'use client';

import { useState } from 'react';

import { speakLine, unlockTableAudio } from '@/features/cheese-thief/lib/narration';
import { useLocale, useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button } from '@/features/spy-fall/components/ui';
import { cn } from '@/features/spy-fall/lib/cn';

interface Props {
	isHost: boolean;
	busy: boolean;
	onConfirm: (present: boolean) => void;
}

export default function CheeseCheckPhase({ isHost, busy, onConfirm }: Props) {
	const t = useT();
	const { locale } = useLocale();
	const [choice, setChoice] = useState<boolean | null>(null);

	if (!isHost) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black px-6 text-center text-white">
				<p className="font-display text-4xl leading-tight font-medium">{t('cheese.check.look')}</p>
			</div>
		);
	}

	function confirm() {
		if (choice === null) return;
		unlockTableAudio();
		if (!choice) speakLine(t('cheese.narrator.cheese-gone'), locale);
		onConfirm(choice);
	}

	return (
		<div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#0c0b09] px-6 text-[#f4efe4]">
			<p className="text-center font-display text-4xl leading-tight font-medium">{t('cheese.check.look')}</p>
			<div className="grid w-full max-w-sm grid-cols-2 gap-3">
				<button
					type="button"
					className={cn(
						'min-h-20 rounded-2xl border text-lg',
						choice === true ? 'border-[#e0a045] bg-[#e0a045]/15' : 'border-white/15',
					)}
					onClick={() => setChoice(true)}
				>
					🧀 {t('cheese.check.present')}
				</button>
				<button
					type="button"
					className={cn(
						'min-h-20 rounded-2xl border text-lg',
						choice === false ? 'border-[#e0a045] bg-[#e0a045]/15' : 'border-white/15',
					)}
					onClick={() => setChoice(false)}
				>
					❌ {t('cheese.check.gone')}
				</button>
			</div>
			{choice !== null && (
				<div className="flex w-full max-w-sm flex-col gap-3">
					<Button fullWidth disabled={busy} loading={busy} onClick={confirm}>
						{t('cheese.check.confirm')}
					</Button>
					<button type="button" className="text-sm text-[#f4efe4]/60" onClick={() => setChoice(null)}>
						{t('cheese.check.change')}
					</button>
				</div>
			)}
		</div>
	);
}
