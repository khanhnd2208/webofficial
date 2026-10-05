'use client';

import { useEffect, useState } from 'react';

import {
	CHEESE_HOUR_LEVELS,
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

function nightTotal(hourSeconds: number): string {
	const nightSeconds = Math.round(nightDurationMs(nightTiming(hourSeconds)) / 1000);
	return `${Math.floor(nightSeconds / 60)}:${String(nightSeconds % 60).padStart(2, '0')}`;
}

/** Three lengths, plus a one-round preview so the host can hear the pace before the night. */
export default function HourLengthSetting({ hourSeconds, isHost, busy, onChange }: Props) {
	const t = useT();
	const { locale } = useLocale();
	const [playing, setPlaying] = useState(false);
	const timing = nightTiming(hourSeconds);
	const selected = CHEESE_HOUR_LEVELS.find((level) => level.seconds === hourSeconds);

	useEffect(() => {
		if (isHost) void prepareRoundPreview(locale, hourSeconds);
	}, [isHost, locale, hourSeconds]);

	return (
		<div className="px-4 py-3">
			<p className="text-sm font-medium">{t('cheese.lobby.hour.label')}</p>
			{isHost && (
				<div
					className="mt-3 grid grid-cols-3 gap-2"
					role="radiogroup"
					aria-label={t('cheese.lobby.hour.label')}
				>
					{CHEESE_HOUR_LEVELS.map((level) => {
						const on = selected?.id === level.id;
						return (
							<button
								key={level.id}
								type="button"
								role="radio"
								aria-checked={on}
								disabled={busy}
								className={cn(
									'min-h-16 rounded-2xl border px-2 py-2 text-sm font-medium',
									on
										? 'border-foreground bg-foreground text-background'
										: 'border-border bg-surface',
								)}
								onClick={() => onChange(level.seconds)}
							>
								<span className="block">{t(`cheese.lobby.hour.${level.id}`)}</span>
								<span className="mt-0.5 block font-mono text-xs tabular-nums opacity-80">
									{t('cheese.lobby.hour.preset', { seconds: level.seconds })}
								</span>
							</button>
						);
					})}
				</div>
			)}
			<p className="mt-3 text-sm text-muted">
				{t('cheese.lobby.hour.summary', { seconds: hourSeconds, total: nightTotal(hourSeconds) })}
			</p>
			{isHost && (
				<button
					type="button"
					disabled={playing}
					className="mt-3 min-h-11 w-full rounded-full border border-border px-4 text-sm font-medium disabled:opacity-60"
					onClick={() => {
						setPlaying(true);
						void playRoundPreview(locale, hourSeconds).finally(() =>
							window.setTimeout(
								() => setPlaying(false),
								timing.hourMs + Math.min(CHEESE_SLEEP_MAX_MS, Math.floor(timing.hourMs / 2)),
							),
						);
					}}
				>
					▶ {t('cheese.lobby.voice.test')}
				</button>
			)}
		</div>
	);
}
