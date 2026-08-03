'use client';

import { useEffect, useRef, useState } from 'react';

type AudioPlayerProps = {
	audioUrl: string;
	title: string;
	durationLabel?: string;
};

const SPEEDS = [1, 1.25, 1.5, 1.75, 2] as const;

function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Lazy audio: `src` is attached only after the first user interaction.
 * Never autoplays. preload="none".
 */
export default function AudioPlayer({ audioUrl, title, durationLabel }: AudioPlayerProps) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [srcReady, setSrcReady] = useState(false);
	const [playing, setPlaying] = useState(false);
	const [current, setCurrent] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);

	useEffect(() => {
		const el = audioRef.current;
		if (!el) return;
		el.volume = volume;
	}, [volume]);

	useEffect(() => {
		const el = audioRef.current;
		if (!el) return;
		el.playbackRate = speed;
	}, [speed]);

	async function ensureSrcAndPlay() {
		const el = audioRef.current;
		if (!el) return;
		if (!srcReady) {
			el.src = audioUrl;
			el.preload = 'metadata';
			setSrcReady(true);
			await new Promise<void>((resolve) => {
				const onMeta = () => {
					el.removeEventListener('loadedmetadata', onMeta);
					resolve();
				};
				el.addEventListener('loadedmetadata', onMeta);
				el.load();
			});
		}
		await el.play();
		setPlaying(true);
	}

	async function toggle() {
		const el = audioRef.current;
		if (!el) return;
		if (playing) {
			el.pause();
			setPlaying(false);
			return;
		}
		await ensureSrcAndPlay();
	}

	return (
		<div className="border border-hairline bg-paper p-4" data-testid="audio-player">
			<audio
				ref={audioRef}
				preload="none"
				aria-label={title}
				onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
				onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
				onEnded={() => setPlaying(false)}
				onPause={() => setPlaying(false)}
				onPlay={() => setPlaying(true)}
			/>
			<div className="flex flex-wrap items-center gap-3">
				<button
					type="button"
					onClick={() => void toggle()}
					className="min-h-11 min-w-11 border border-ink bg-ink px-3 text-xs font-semibold uppercase tracking-wider text-paper transition-colors duration-[180ms] hover:bg-accent hover:border-accent"
					aria-pressed={playing}
				>
					{playing ? 'Tạm dừng' : 'Phát'}
				</button>
				<div className="min-w-0 flex-1">
					<input
						type="range"
						min={0}
						max={duration || 100}
						step={0.1}
						value={current}
						aria-label="Tiến độ"
						disabled={!srcReady}
						onChange={(e) => {
							const t = Number(e.target.value);
							if (audioRef.current) audioRef.current.currentTime = t;
							setCurrent(t);
						}}
						className="w-full accent-[var(--accent)]"
					/>
					<p className="mt-1 font-mono text-[10px] tracking-wider text-ink-secondary">
						{formatTime(current)} / {duration ? formatTime(duration) : durationLabel || '—'}
					</p>
				</div>
				<label className="flex items-center gap-2 text-xs text-ink-secondary">
					<span className="sr-only">Âm lượng</span>
					<input
						type="range"
						min={0}
						max={1}
						step={0.05}
						value={volume}
						aria-label="Âm lượng"
						onChange={(e) => setVolume(Number(e.target.value))}
						className="w-20 accent-[var(--accent)]"
					/>
				</label>
				<label className="flex items-center gap-2 text-xs text-ink-secondary">
					<span className="sr-only">Tốc độ</span>
					<select
						value={speed}
						aria-label="Tốc độ phát"
						onChange={(e) => setSpeed(Number(e.target.value) as (typeof SPEEDS)[number])}
						className="border border-hairline bg-paper px-2 py-1"
					>
						{SPEEDS.map((s) => (
							<option key={s} value={s}>
								{s}×
							</option>
						))}
					</select>
				</label>
			</div>
		</div>
	);
}
