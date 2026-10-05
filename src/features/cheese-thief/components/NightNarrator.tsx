'use client';
import { useTestRoom } from '@/features/board-game-test/context';

import { useEffect, useMemo, useRef, useState } from 'react';

import { nightTiming } from '@/features/cheese-thief/config/cheeseThief';
import {
	narrationSuspended,
	playClockTick,
	playHourChime,
	playNightTrack,
	speakLine,
	stopTableAudio,
	syncNightTrack,
	unlockTableAudio,
} from '@/features/cheese-thief/lib/narration';
import { narrationKey, segmentAt } from '@/features/cheese-thief/lib/nightSchedule';
import { prepareNightTrack, type NightTrackSpec } from '@/features/cheese-thief/lib/nightTrack';
import type { CheeseMode, NightNumber } from '@/features/cheese-thief/config/cheeseThief';
import { useLocale, useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';

interface Props {
	nightStartedAt: string;
	serverNow: string;
	fetchedAt: number;
	mode: CheeseMode;
	hourSeconds: number;
	night: NightNumber;
}

/**
 * `track`: the recorded night is playing. `pending`: it is still being built.
 * `blocked`: the browser wants a tap before it plays. `speech`: no track, speak each line instead.
 */
type Voice = 'pending' | 'track' | 'blocked' | 'speech';

export default function NightNarrator({
	nightStartedAt,
	serverNow,
	fetchedAt,
	mode,
	hourSeconds,
	night,
}: Props) {
	const testRoom = useTestRoom();
	const paused = testRoom ? !testRoom.running : false;
	const t = useT();
	const { locale } = useLocale();
	const lastCue = useRef<string | null>(null);
	const trackUrl = useRef<string | null>(null);
	const skewRef = useRef(0);
	const [line, setLine] = useState('');
	const [needsTap, setNeedsTap] = useState(false);
	const [voice, setVoice] = useState<Voice>('pending');
	const voiceRef = useRef<Voice>('pending');
	const spec = useMemo<NightTrackSpec>(
		() => ({ locale, mode, night, hourSeconds }),
		[locale, mode, night, hourSeconds],
	);
	const started = new Date(nightStartedAt).getTime();

	function changeVoice(next: Voice) {
		voiceRef.current = next;
		setVoice(next);
	}

	const elapsedSec = () => (Date.now() + skewRef.current - started) / 1000;

	useEffect(() => {
		lastCue.current = null;
	}, [nightStartedAt]);

	useEffect(() => stopTableAudio, []);

	useEffect(() => {
		if (paused) {
			stopTableAudio();
			return;
		}
		let cancelled = false;
		voiceRef.current = 'pending';
		void prepareNightTrack(spec).then(async (url) => {
			if (cancelled) return;
			if (!url) {
				changeVoice('speech');
				return;
			}
			trackUrl.current = url;
			const expected = (Date.now() + skewRef.current - started) / 1000;
			if (syncNightTrack(url, spec, expected)) {
				changeVoice('track');
				return;
			}
			const playing = await playNightTrack(url, expected);
			if (!cancelled) changeVoice(playing ? 'track' : 'blocked');
		});
		return () => {
			cancelled = true;
		};
	}, [spec, started, paused]);

	useEffect(() => {
		skewRef.current = new Date(serverNow).getTime() - fetchedAt;
		const timing = nightTiming(hourSeconds);
		let timer = 0;
		let lastTick = 0;

		const tick = () => {
			const now = paused ? new Date(serverNow).getTime() : Date.now() + skewRef.current;
			const segment = segmentAt(started, now, timing);
			if (segment.kind === 'done') {
				setLine('');
				return;
			}
			const spokenKey = narrationKey(segment, mode, night);
			const cueKey =
				segment.kind === 'hour-wake' || segment.kind === 'hour-sleep'
					? `${spokenKey}-${segment.hour}`
					: spokenKey;
			const hour = 'hour' in segment ? segment.hour : '';
			const text = t(`cheese.narrator.${spokenKey}`, { hour });
			setLine(text);

			if (paused) return;
			if (voiceRef.current === 'track' && trackUrl.current) {
				if (!syncNightTrack(trackUrl.current, spec, (now - started) / 1000)) changeVoice('blocked');
			} else if (voiceRef.current === 'speech') {
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
	}, [started, serverNow, fetchedAt, locale, t, mode, hourSeconds, night, spec, paused]);

	const showTap = !paused && (voice === 'blocked' || (voice === 'speech' && needsTap));

	return (
		<div className="flex min-h-[70svh] flex-col items-center justify-center gap-8 px-6 text-center text-game-ink">
			<p className="font-mono text-xs tracking-[0.22em] text-game-bronze uppercase">
				{t('cheese.night.hostHint')}
			</p>
			<CheeseThiefArt
				scene={mode === 'two-night' && night === 2 ? 'two-moons' : 'moon'}
				size={112}
			/>
			<p className="max-w-md font-display text-4xl leading-tight font-medium sm:text-5xl">{line}</p>
			{showTap && (
				<button
					type="button"
					className="min-h-12 rounded-full border border-game-bronze px-5 text-sm text-game-bronze"
					onClick={() => {
						if (voice === 'blocked' && trackUrl.current) {
							void playNightTrack(trackUrl.current, elapsedSec()).then((ok) =>
								changeVoice(ok ? 'track' : 'blocked'),
							);
							return;
						}
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
