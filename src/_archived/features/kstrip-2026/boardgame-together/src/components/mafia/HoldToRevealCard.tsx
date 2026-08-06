'use client';

import { useCallback, useRef, useState } from 'react';

import { useT } from '@/components/i18n/LocaleProvider';
import { Button } from '@/components/ui';
import { HOLD_REVEAL_MS } from '@/config/mafiaGame';
import RoleCardFace from '@/components/mafia/RoleCardFace';
import { mafiaPrimary } from '@/components/mafia/mafiaStyles';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import { cn } from '@/lib/cn';
import type { Player } from '@/types/mafiaGame';

interface HoldToRevealCardProps {
	player: Player;
	onConfirm: () => void;
}

export default function HoldToRevealCard({ player, onConfirm }: HoldToRevealCardProps) {
	const t = useT();
	const [revealed, setRevealed] = useState(false);
	const [progress, setProgress] = useState(0);
	const [holding, setHolding] = useState(false);
	const [earlyRelease, setEarlyRelease] = useState(false);
	const [justRevealed, setJustRevealed] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const startTimeRef = useRef(0);
	const hapticTicksRef = useRef(new Set<number>());

	const clearTimers = useCallback(() => {
		if (timerRef.current) clearTimeout(timerRef.current);
		if (intervalRef.current) clearInterval(intervalRef.current);
		timerRef.current = null;
		intervalRef.current = null;
	}, []);

	const handlePointerDown = useCallback(() => {
		if (revealed) return;
		setEarlyRelease(false);
		setHolding(true);
		hapticTicksRef.current.clear();
		startTimeRef.current = Date.now();
		intervalRef.current = setInterval(() => {
			const elapsed = Date.now() - startTimeRef.current;
			const p = Math.min(1, elapsed / HOLD_REVEAL_MS);
			setProgress(p);
			for (const threshold of [0.25, 0.5, 0.75]) {
				if (p >= threshold && !hapticTicksRef.current.has(threshold)) {
					hapticTicksRef.current.add(threshold);
					hapticLight();
				}
			}
		}, 16);
		timerRef.current = setTimeout(() => {
			hapticMedium();
			setRevealed(true);
			setJustRevealed(true);
			setProgress(1);
			setHolding(false);
			clearTimers();
			setTimeout(() => setJustRevealed(false), 600);
		}, HOLD_REVEAL_MS);
	}, [revealed, clearTimers]);

	const handlePointerUp = useCallback(() => {
		if (revealed) return;
		const wasHolding = holding && progress > 0 && progress < 1;
		clearTimers();
		setHolding(false);
		setProgress(0);
		if (wasHolding) {
			setEarlyRelease(true);
			setTimeout(() => setEarlyRelease(false), 2000);
		}
	}, [revealed, holding, progress, clearTimers]);

	const percent = Math.round(progress * 100);

	return (
		<div className="flex w-full flex-col items-center gap-4 px-2">
			<p className="text-center text-sm text-[var(--mafia-muted)]">
				{t('mafia.reveal.privacy')}
			</p>

			<div
				className={cn(
					'relative w-full max-w-[380px] touch-none select-none transition-transform duration-150',
					holding && !revealed && 'scale-[1.03]',
					revealed ? '' : 'cursor-pointer',
				)}
				onPointerDown={revealed ? undefined : handlePointerDown}
				onPointerUp={revealed ? undefined : handlePointerUp}
				onPointerLeave={revealed ? undefined : handlePointerUp}
				onPointerCancel={revealed ? undefined : handlePointerUp}
				onContextMenu={(e) => e.preventDefault()}
			>
				{holding && !revealed ? (
					<div
						className="pointer-events-none absolute inset-0 -m-3 rounded-3xl animate-mafia-hold-pulse"
						style={{
							boxShadow: `0 0 ${12 + percent * 0.4}px ${4 + percent * 0.15}px var(--mafia-gold-glow)`,
						}}
						aria-hidden
					/>
				) : null}

				{holding && !revealed ? (
					<svg
						className="pointer-events-none absolute inset-0 -m-4 h-[calc(100%+2rem)] w-[calc(100%+2rem)]"
						viewBox="0 0 100 100"
						aria-hidden
					>
						<circle
							cx="50"
							cy="50"
							r="46"
							fill="none"
							stroke="rgba(201,162,39,0.2)"
							strokeWidth="3"
						/>
						<circle
							cx="50"
							cy="50"
							r="46"
							fill="none"
							stroke="var(--mafia-gold)"
							strokeWidth="4"
							strokeLinecap="round"
							strokeDasharray={`${progress * 289} 289`}
							transform="rotate(-90 50 50)"
						/>
					</svg>
				) : null}

				{holding && !revealed ? (
					<div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
						<span className="rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-[var(--mafia-gold)] backdrop-blur-sm">
							{t('mafia.reveal.opening', { percent })}
						</span>
					</div>
				) : null}

				{justRevealed ? (
					<div
						className="pointer-events-none absolute inset-0 -m-6 rounded-full bg-[var(--mafia-gold-glow)] animate-mafia-glow-burst"
						aria-hidden
					/>
				) : null}

				<div className={justRevealed ? 'animate-mafia-card-flip' : ''}>
					<RoleCardFace player={player} revealed={revealed} />
				</div>
			</div>

			{revealed ? (
				<>
					<p className="text-center text-sm text-[var(--mafia-muted)]">
						{t('mafia.reveal.rememberHint')}
					</p>
					<Button
						fullWidth
						size="lg"
						className={cn('max-w-[380px]', mafiaPrimary)}
						onClick={onConfirm}
					>
						{t('mafia.reveal.understood')}
					</Button>
				</>
			) : (
				<p
					className={cn(
						'text-center text-xs',
						earlyRelease ? 'text-[var(--mafia-gold)]' : 'text-[var(--mafia-muted)] animate-mafia-press-hint',
					)}
				>
					{earlyRelease
						? t('mafia.reveal.holdLonger')
						: t('mafia.reveal.holdHint')}
				</p>
			)}
		</div>
	);
}
