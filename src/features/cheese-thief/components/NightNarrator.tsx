'use client';

import { useEffect, useRef, useState } from 'react';

import {
	CHEESE_HOUR_MS,
	CHEESE_INTRO_MS,
	CHEESE_OUTRO_MS,
} from '@/features/cheese-thief/config/cheeseThief';
import {
	narrationSuspended,
	playClockTick,
	playHourChime,
	speakLine,
	unlockTableAudio,
} from '@/features/cheese-thief/lib/narration';
import { narrationKey, segmentAt } from '@/features/cheese-thief/lib/nightSchedule';
import type { CheeseMode, NightNumber } from '@/features/cheese-thief/config/cheeseThief';
import { useLocale, useT } from '@/features/spy-fall/components/i18n/LocaleProvider';

const TIMING = { introMs: CHEESE_INTRO_MS, hourMs: CHEESE_HOUR_MS, outroMs: CHEESE_OUTRO_MS };

interface Props {
	nightStartedAt: string;
	serverNow: string;
	fetchedAt: number;
	mode: CheeseMode;
	night: NightNumber;
}

export default function NightNarrator({ nightStartedAt, serverNow, fetchedAt, mode, night }: Props) {
	const t = useT();
	const { locale } = useLocale();
	const lastCue = useRef<string | null>(null);
	const [line, setLine] = useState('');
	const [needsTap, setNeedsTap] = useState(false);

	useEffect(() => {
		lastCue.current = null;
	}, [nightStartedAt]);

	useEffect(() => {
		const started = new Date(nightStartedAt).getTime();
		const skew = new Date(serverNow).getTime() - fetchedAt;
		let timer = 0;
		let lastTick = 0;

		const tick = () => {
			const now = Date.now() + skew;
			const segment = segmentAt(started, now, TIMING);
			if (segment.kind === 'done') {
				setLine('');
				return;
			}
			const spokenKey = narrationKey(segment, mode, night);
			const cueKey = segment.kind === 'hour-wake' || segment.kind === 'hour-sleep' ? `${spokenKey}-${segment.hour}` : spokenKey;
			const hour = 'hour' in segment ? segment.hour : '';
			const text = t(`cheese.narrator.${spokenKey}`, { hour });
			setLine(text);
			if (cueKey !== lastCue.current) {
				lastCue.current = cueKey;
				playHourChime();
				const spoken = speakLine(text, locale);
				if (!spoken) setNeedsTap(narrationSuspended());
			}
			if (now - lastTick >= 1000) {
				lastTick = now;
				playClockTick();
			}
			timer = window.setTimeout(tick, 200);
		};

		tick();
		const onVoices = () => {
			lastCue.current = null;
		};
		window.speechSynthesis?.addEventListener('voiceschanged', onVoices);
		return () => {
			window.clearTimeout(timer);
			window.speechSynthesis?.removeEventListener('voiceschanged', onVoices);
		};
	}, [nightStartedAt, serverNow, fetchedAt, locale, t, mode, night]);

	return (
		<div className="flex min-h-[70svh] flex-col items-center justify-center gap-8 px-6 text-center text-[#f4efe4]">
			<p className="font-mono text-[0.68rem] tracking-[0.22em] text-[#e0a045] uppercase">{t('cheese.night.hostHint')}</p>
			<p className="max-w-md font-display text-4xl leading-tight font-medium sm:text-5xl">{line}</p>
			{needsTap && (
				<button
					type="button"
					className="min-h-12 rounded-full border border-[#e0a045] px-5 text-sm text-[#e0a045]"
					onClick={() => {
						unlockTableAudio();
						setNeedsTap(false);
						lastCue.current = null;
					}}
				>
					{t('cheese.night.tapForSound')}
				</button>
			)}
		</div>
	);
}
