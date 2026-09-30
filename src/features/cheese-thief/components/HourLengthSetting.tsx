'use client';

import { useEffect, useState } from 'react';

import {
	CHEESE_HOUR_SECONDS_MAX,
	CHEESE_HOUR_SECONDS_MIN,
	CHEESE_HOUR_SECONDS_PRESETS,
	CHEESE_HOUR_SECONDS_STEP,
	CHEESE_SLEEP_MAX_MS,
	nightDurationMs,
	nightTiming,
} from '@/features/cheese-thief/config/cheeseThief';
import { playRoundPreview } from '@/features/cheese-thief/lib/narration';
import { prepareRoundPreview } from '@/features/cheese-thief/lib/nightTrack';
import { useLocale, useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { cn } from '@/features/board-game-shared/lib/cn';

interface Props {
	hourSeconds: number;
	isHost: boolean;
	busy: boolean;
	onChange: (seconds: number) => void;
}

/** One round = from calling one hour to calling the next. The host sets it and can hear it before the night. */
export default function HourLengthSetting({ hourSeconds, isHost, busy, onChange }: Props) {
	const t = useT();
	const { locale } = useLocale();
	const [playing, setPlaying] = useState(false);
	const timing = nightTiming(hourSeconds);
	const sleep = Math.min(CHEESE_SLEEP_MAX_MS, Math.floor(timing.hourMs / 2)) / 1000;
	const nightSeconds = Math.round(nightDurationMs(timing) / 1000);
	const total = `${Math.floor(nightSeconds / 60)}:${String(nightSeconds % 60).padStart(2, '0')}`;
	const set = (seconds: number) =>
		onChange(Math.min(CHEESE_HOUR_SECONDS_MAX, Math.max(CHEESE_HOUR_SECONDS_MIN, seconds)));

	// Build the preview ahead of the tap, so iPhone lets it play straight away.
	useEffect(() => {
		if (isHost) void prepareRoundPreview(locale, hourSeconds);
	}, [isHost, locale, hourSeconds]);

	return (
		<div className="rounded-2xl border border-border bg-surface px-4 py-3">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-sm font-medium">{t('cheese.lobby.hour.label')}</p>
					<p className="mt-0.5 text-sm text-muted">{t('cheese.lobby.hour.explain')}</p>
				</div>
				{!isHost && (
					<span className="shrink-0 font-mono text-sm tabular-nums">
						{t('cheese.lobby.hour.value', { seconds: hourSeconds })}
					</span>
				)}
			</div>

			{isHost && (
				<>
					<div className="mt-3 flex items-center justify-between gap-2">
						<button
							type="button"
							aria-label={t('cheese.lobby.hour.less')}
							disabled={busy || hourSeconds <= CHEESE_HOUR_SECONDS_MIN}
							className="h-11 w-11 shrink-0 rounded-full border border-border text-xl disabled:opacity-40"
							onClick={() => set(hourSeconds - CHEESE_HOUR_SECONDS_STEP)}
						>
							−
						</button>
						<span className="font-display text-3xl font-medium tabular-nums">
							{t('cheese.lobby.hour.value', { seconds: hourSeconds })}
						</span>
						<button
							type="button"
							aria-label={t('cheese.lobby.hour.more')}
							disabled={busy || hourSeconds >= CHEESE_HOUR_SECONDS_MAX}
							className="h-11 w-11 shrink-0 rounded-full border border-border text-xl disabled:opacity-40"
							onClick={() => set(hourSeconds + CHEESE_HOUR_SECONDS_STEP)}
						>
							+
						</button>
					</div>
					<div
						className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6"
						role="radiogroup"
						aria-label={t('cheese.lobby.hour.label')}
					>
						{CHEESE_HOUR_SECONDS_PRESETS.map((seconds) => (
							<button
								key={seconds}
								type="button"
								role="radio"
								aria-checked={hourSeconds === seconds}
								disabled={busy}
								className={cn(
									'min-h-11 rounded-xl border text-sm tabular-nums',
									hourSeconds === seconds
										? 'border-foreground bg-foreground text-background'
										: 'border-border',
								)}
								onClick={() => set(seconds)}
							>
								{t('cheese.lobby.hour.preset', { seconds })}
							</button>
						))}
					</div>
				</>
			)}

			<p className="mt-3 text-sm text-muted">
				{t('cheese.lobby.hour.split', { open: hourSeconds - sleep, sleep, total })}
			</p>

			{isHost && (
				<div className="mt-3 space-y-2 border-t border-border pt-3">
					<button
						type="button"
						disabled={playing}
						className="min-h-11 w-full rounded-full border border-border px-4 text-sm font-medium disabled:opacity-60"
						onClick={() => {
							setPlaying(true);
							void playRoundPreview(locale, hourSeconds).finally(() =>
								window.setTimeout(() => setPlaying(false), timing.hourMs),
							);
						}}
					>
						▶ {t('cheese.lobby.voice.test')}
					</button>
					<p className="text-center text-xs text-muted">{t('cheese.lobby.voice.hint')}</p>
				</div>
			)}
		</div>
	);
}
