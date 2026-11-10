'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react';

import { McIcon } from '@/components/myclass/ui';

import { ARENA_MAX_HP, bossName } from './arenaGame';
import { isArenaMuted, setArenaMuted, subscribeArenaMuted } from './arenaSound';
import styles from './arena.module.css';

/** Title, the boss health bar and the lecturer's controls. */
export function ArenaTopBar({
	classLabel,
	classHref,
	hp,
	round,
	low,
	hpRef,
	settingsLabel,
	settingsDisabled,
	onSettings,
	calledCount,
	historyOpen,
	onToggleHistory,
}: {
	classLabel: string;
	classHref: string;
	hp: number;
	round: number;
	/** Few hit points left: the bar pulses. */
	low: boolean;
	hpRef: RefObject<HTMLDivElement | null>;
	settingsLabel: string;
	settingsDisabled: boolean;
	onSettings: () => void;
	calledCount: number;
	historyOpen: boolean;
	onToggleHistory: () => void;
}) {
	const [fullscreen, setFullscreen] = useState(false);
	const muted = useSyncExternalStore(subscribeArenaMuted, isArenaMuted, () => false);
	const hpPercent = (hp / ARENA_MAX_HP) * 100;

	useEffect(() => {
		const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
		document.addEventListener('fullscreenchange', onChange);
		return () => document.removeEventListener('fullscreenchange', onChange);
	}, []);

	function toggleFullscreen() {
		if (document.fullscreenElement) void document.exitFullscreen?.();
		else void document.documentElement.requestFullscreen?.().catch(() => undefined);
	}

	return (
		<header className={styles.topBar}>
			<div className={styles.titleBlock}>
				<h1 className={styles.title}>Kiểm tra bài cũ</h1>
				<p className={styles.eyebrow}>{classLabel}</p>
			</div>
			<div
				ref={hpRef}
				className={styles.hp}
				data-low={low || undefined}
				aria-label={`Máu quái vật ${hp}/${ARENA_MAX_HP}`}
			>
				<span className={styles.hpLabel}>
					Boss {round} · {bossName(round)}
				</span>
				<span className={styles.hpValue}>
					{hp}/{ARENA_MAX_HP}
				</span>
				<span className={styles.hpTrack}>
					<span className={styles.hpGhost} style={{ width: `${hpPercent}%` }} />
					<span className={styles.hpFill} style={{ width: `${hpPercent}%` }} />
					<span className={styles.hpPips} />
				</span>
			</div>
			<nav className={styles.toolbar} aria-label="Điều khiển">
				<button
					type="button"
					className={styles.settingsChip}
					onClick={onSettings}
					disabled={settingsDisabled}
					title="Thiết lập"
				>
					<McIcon name="settings" size={16} />
					<span>{settingsLabel}</span>
				</button>
				<button
					type="button"
					className={styles.chipButton}
					aria-pressed={historyOpen}
					onClick={onToggleHistory}
				>
					Đã gọi {calledCount}
				</button>
				<button
					type="button"
					className={styles.iconButton}
					onClick={() => setArenaMuted(!muted)}
					aria-pressed={!muted}
					aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
					title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
				>
					<svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
						<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" fill="currentColor" />
						<path
							d={
								muted
									? 'M15.5 9.5l5 5m0-5l-5 5'
									: 'M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11'
							}
							stroke="currentColor"
							strokeWidth="1.8"
							strokeLinecap="round"
						/>
					</svg>
				</button>
				<button
					type="button"
					className={styles.iconButton}
					onClick={toggleFullscreen}
					aria-label={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
					title={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
				>
					<McIcon name={fullscreen ? 'fullscreen_exit' : 'fullscreen'} size={20} />
				</button>
				<Link
					href={classHref}
					className={styles.iconButton}
					aria-label="Về trang lớp"
					title="Về trang lớp"
				>
					<McIcon name="close" size={20} />
				</Link>
			</nav>
		</header>
	);
}
