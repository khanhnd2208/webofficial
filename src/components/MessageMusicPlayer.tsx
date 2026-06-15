'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { resolveMusicUrl } from '@/constants/message';

interface MessageMusicPlayerProps {
	trackId?: string;
	trackLabel?: string;
}

function formatTime(s: number): string {
	if (!Number.isFinite(s) || s < 0) return '0:00';
	const m = Math.floor(s / 60);
	const sec = Math.floor(s % 60);
	return `${m}:${sec.toString().padStart(2, '0')}`;
}

interface InnerProps {
	url: string;
	trackLabel?: string;
}

function MessageMusicPlayerInner({ url, trackLabel }: InnerProps) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const seekRef = useRef<HTMLDivElement>(null);
	const wasPlayingRef = useRef(false);
	const seekingRef = useRef(false);

	const [playing, setPlaying] = useState(false);
	const [needsTap, setNeedsTap] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [seeking, setSeeking] = useState(false);
	const [visible, setVisible] = useState(true);
	const [loadError, setLoadError] = useState('');

	useEffect(() => {
		seekingRef.current = seeking;
	}, [seeking]);

	const tryPlay = useCallback(async () => {
		const audio = audioRef.current;
		if (!audio) return false;
		try {
			await audio.play();
			setPlaying(true);
			setNeedsTap(false);
			setLoadError('');
			return true;
		} catch {
			setPlaying(false);
			setNeedsTap(true);
			return false;
		}
	}, []);

	const restartLoop = useCallback(() => {
		const audio = audioRef.current;
		if (!audio) return;
		audio.currentTime = 0;
		void tryPlay();
	}, [tryPlay]);

	const seekToClientX = useCallback((clientX: number) => {
		const bar = seekRef.current;
		const audio = audioRef.current;
		if (!bar || !audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
		const rect = bar.getBoundingClientRect();
		const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		const newTime = ratio * audio.duration;
		audio.currentTime = newTime;
		setCurrentTime(newTime);
	}, []);

	const togglePlay = useCallback(async () => {
		const audio = audioRef.current;
		if (!audio) return;
		if (playing) {
			audio.pause();
			return;
		}
		await tryPlay();
	}, [playing, tryPlay]);

	// Audio event wiring + autoplay
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		audio.volume = 0.35;
		audio.loop = true;

		const onCanPlay = () => { void tryPlay(); };
		const onTime = () => {
			if (!seekingRef.current) setCurrentTime(audio.currentTime);
		};
		const onDuration = () => {
			if (Number.isFinite(audio.duration)) setDuration(audio.duration);
		};
		const onEnded = () => {
			if (audio.loop) restartLoop();
		};
		const onPlay = () => setPlaying(true);
		const onPause = () => setPlaying(false);
		const onError = () => {
			setLoadError('Không tải được file nhạc');
			setPlaying(false);
		};
		const onStalled = () => {
			if (!audio.paused && audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
				audio.load();
				void tryPlay();
			}
		};

		audio.addEventListener('canplay', onCanPlay);
		audio.addEventListener('timeupdate', onTime);
		audio.addEventListener('durationchange', onDuration);
		audio.addEventListener('loadedmetadata', onDuration);
		audio.addEventListener('ended', onEnded);
		audio.addEventListener('play', onPlay);
		audio.addEventListener('pause', onPause);
		audio.addEventListener('error', onError);
		audio.addEventListener('stalled', onStalled);
		audio.load();

		return () => {
			audio.removeEventListener('canplay', onCanPlay);
			audio.removeEventListener('timeupdate', onTime);
			audio.removeEventListener('durationchange', onDuration);
			audio.removeEventListener('loadedmetadata', onDuration);
			audio.removeEventListener('ended', onEnded);
			audio.removeEventListener('play', onPlay);
			audio.removeEventListener('pause', onPause);
			audio.removeEventListener('error', onError);
			audio.removeEventListener('stalled', onStalled);
			audio.pause();
		};
	}, [restartLoop, tryPlay]);

	// Resume after tab becomes visible (iOS / Safari background pause)
	useEffect(() => {
		const onVisibility = () => {
			const audio = audioRef.current;
			if (!audio) return;
			if (document.hidden) {
				wasPlayingRef.current = !audio.paused;
			} else if (wasPlayingRef.current && audio.paused) {
				void tryPlay();
			}
		};
		document.addEventListener('visibilitychange', onVisibility);
		return () => document.removeEventListener('visibilitychange', onVisibility);
	}, [tryPlay]);

	// Global pointer tracking while seeking
	useEffect(() => {
		if (!seeking) return;

		const onMove = (e: MouseEvent | TouchEvent) => {
			const x = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
			if (x != null) seekToClientX(x);
		};
		const onUp = () => setSeeking(false);

		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onUp);
		document.addEventListener('touchmove', onMove, { passive: true });
		document.addEventListener('touchend', onUp);

		return () => {
			document.removeEventListener('mousemove', onMove);
			document.removeEventListener('mouseup', onUp);
			document.removeEventListener('touchmove', onMove);
			document.removeEventListener('touchend', onUp);
		};
	}, [seeking, seekToClientX]);

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

	return (
		<>
			<audio ref={audioRef} src={url} preload="auto" loop playsInline />

			{needsTap && !playing && !loadError && (
				<button
					type="button"
					onClick={() => void togglePlay()}
					className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm"
					aria-label="Chạm để bật nhạc"
				>
					<div className="flex flex-col items-center gap-3 rounded-2xl bg-surface/95 px-8 py-6 shadow-2xl backdrop-blur">
						<div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-white shadow-lg">
							♪
						</div>
						<p className="text-sm font-medium text-foreground">Chạm để bật nhạc</p>
					</div>
				</button>
			)}

			{visible && (
				<div className="fixed inset-x-0 bottom-0 z-50 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
					<div className="mx-auto max-w-lg px-3">
						<div className="rounded-2xl border border-white/10 bg-surface/90 shadow-2xl backdrop-blur-xl">
							<div
								ref={seekRef}
								className="relative mx-4 mt-3 h-1.5 cursor-pointer touch-none select-none rounded-full bg-border/60"
								onMouseDown={(e) => { setSeeking(true); seekToClientX(e.clientX); }}
								onTouchStart={(e) => { setSeeking(true); seekToClientX(e.touches[0].clientX); }}
								role="slider"
								aria-label="Tiến trình bài nhạc"
								aria-valuenow={Math.round(currentTime)}
								aria-valuemin={0}
								aria-valuemax={Math.round(duration)}
							>
								<div
									className="absolute inset-y-0 left-0 rounded-full bg-accent"
									style={{ width: `${progress}%` }}
								/>
								<div
									className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow-md ring-2 ring-accent"
									style={{ left: `calc(${progress}% - 7px)` }}
								/>
							</div>

							<div className="flex items-center gap-3 px-4 py-2.5">
								<div className="min-w-0 flex-1">
									<p className="truncate text-[11px] font-medium text-foreground">
										{trackLabel ?? 'Nhạc nền'}
									</p>
									<p className="mt-0.5 tabular-nums text-[10px] text-muted">
										{loadError ? (
											<span className="text-error">{loadError}</span>
										) : (
											<>
												{formatTime(currentTime)}
												<span className="mx-1 opacity-40">/</span>
												{formatTime(duration)}
											</>
										)}
									</p>
								</div>

								<div title="Lặp lại tự động" className="text-[10px] text-muted opacity-60">
									↺
								</div>

								<button
									type="button"
									onClick={() => void togglePlay()}
									disabled={!!loadError}
									className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-md transition active:scale-95 disabled:opacity-40"
									aria-label={playing ? 'Tạm dừng' : 'Phát nhạc'}
								>
									{playing ? (
										<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
											<rect x="6" y="4" width="4" height="16" rx="1.5" />
											<rect x="14" y="4" width="4" height="16" rx="1.5" />
										</svg>
									) : (
										<svg className="h-4 w-4 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
											<path d="M8 5.14v14l11-7-11-7z" />
										</svg>
									)}
								</button>

								<button
									type="button"
									onClick={() => setVisible(false)}
									className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition hover:text-foreground"
									aria-label="Ẩn thanh nhạc"
									title="Ẩn"
								>
									<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
									</svg>
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{!visible && (
				<button
					type="button"
					onClick={() => setVisible(true)}
					className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/90 shadow-lg backdrop-blur transition active:scale-95"
					aria-label="Hiện thanh nhạc"
				>
					<svg className="h-4.5 w-4.5 text-accent" viewBox="0 0 24 24" fill="currentColor">
						<path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
					</svg>
				</button>
			)}
		</>
	);
}

export default function MessageMusicPlayer({ trackId, trackLabel }: MessageMusicPlayerProps) {
	const url = resolveMusicUrl(trackId);
	if (!url) return null;
	return <MessageMusicPlayerInner key={url} url={url} trackLabel={trackLabel} />;
}
