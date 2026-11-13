'use client';

import { AnimatePresence, m } from 'framer-motion';
import { useEffect } from 'react';

import type { DrawResult } from '../types';
import styles from './fmt2026.module.css';
import { BOOTH } from './boothPalette';

const TIER_LABEL = { common: 'Quà FMT', rare: 'Quà hiếm', epic: 'Siêu phẩm' } as const;

export const LUCK_NOTES = [
	'Thầy cô gửi bạn một trái tim thật to. Hẹn gặp lại ở FMT nhé!',
	'Hôm nay chưa trúng quà, nhưng bạn trúng cả một mùa học vui!',
	'May mắn đang trên đường tới. Chúc bạn một năm học rực rỡ!',
	'Quà lớn nhất là bạn đã ghé FMT. Chúc may mắn lần sau!',
];

async function burst(tier: 'common' | 'rare' | 'epic' | 'luck') {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	const { default: confettiModule } = await import('canvas-confetti');
	// The site CSP blocks blob: workers, so draw on the main thread.
	const confetti = confettiModule.create(undefined, { resize: true, useWorker: false });
	const colors = [BOOTH.gold, BOOTH.red, BOOTH.violet, BOOTH.white];
	if (tier === 'luck') {
		void confetti({
			particleCount: 60,
			spread: 70,
			origin: { y: 0.6 },
			colors: [BOOTH.pink, BOOTH.white],
			shapes: ['circle'],
		});
		return;
	}
	void confetti({
		particleCount: tier === 'common' ? 120 : 160,
		spread: 90,
		origin: { y: 0.55 },
		colors,
	});
	if (tier === 'common') return;
	window.setTimeout(() => {
		void confetti({ particleCount: 90, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors });
		void confetti({ particleCount: 90, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors });
	}, 250);
	if (tier !== 'epic') return;
	const end = Date.now() + 1800;
	const rain = () => {
		void confetti({
			particleCount: 8,
			startVelocity: 25,
			spread: 160,
			origin: { x: Math.random(), y: -0.1 },
			colors: [BOOTH.goldBright, BOOTH.goldPale],
			gravity: 0.8,
		});
		if (Date.now() < end) window.requestAnimationFrame(rain);
	};
	window.setTimeout(rain, 500);
}

export function PrizeReveal({
	result,
	luckNote,
	onClose,
}: {
	result: DrawResult | null;
	luckNote: string;
	onClose: () => void;
}) {
	const tier = result ? (result.prize?.tier ?? 'luck') : null;

	useEffect(() => {
		if (tier) void burst(tier);
	}, [result?.id, tier]);

	return (
		<AnimatePresence>
			{result && (
				<m.div
					key={result.id}
					className={styles.overlay}
					role="dialog"
					aria-modal="true"
					aria-label="Kết quả bốc quà"
					onClick={onClose}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					{tier !== 'luck' && <div className={styles.rays} data-tier={tier} aria-hidden="true" />}
					<m.div
						className={styles.card}
						data-tier={tier}
						data-luck={tier === 'luck'}
						initial={{ scale: 0.2, rotateY: 180, y: 120 }}
						animate={{ scale: 1, rotateY: 0, y: 0 }}
						exit={{ scale: 0.8, opacity: 0 }}
						transition={{ type: 'spring', stiffness: 140, damping: 14 }}
					>
						{result.prize ? (
							<>
								<span className={styles.cardTier}>{TIER_LABEL[result.prize.tier]}</span>
								{result.prize.imagePath && (
									<m.img
										className={styles.cardImage}
										src={result.prize.imagePath}
										alt=""
										initial={{ scale: 0.5, rotate: -12 }}
										animate={{ scale: [0.5, 1.15, 1], rotate: [-12, 6, 0] }}
										transition={{ delay: 0.35, duration: 0.6 }}
									/>
								)}
								<p className={styles.eyebrow} style={{ color: BOOTH.caramel }}>
									Chúc mừng! Bạn nhận được
								</p>
								<h2 className={styles.cardName}>{result.prize.name}</h2>
							</>
						) : (
							<>
								<m.svg
									viewBox="0 0 100 90"
									className={styles.cardImage}
									aria-hidden="true"
									animate={{ scale: [1, 1.12, 1] }}
									transition={{ duration: 0.9, repeat: Infinity }}
								>
									<path
										d="M50 86 C10 58 0 36 12 18 C24 2 44 6 50 22 C56 6 76 2 88 18 C100 36 90 58 50 86 Z"
										fill={BOOTH.heart}
									/>
								</m.svg>
								<h2 className={styles.cardName}>Chúc may mắn!</h2>
								<p className={styles.cardNote}>{luckNote}</p>
							</>
						)}
					</m.div>
					<p className={styles.continue}>Chạm hoặc nhấn phím cách để tiếp tục</p>
				</m.div>
			)}
		</AnimatePresence>
	);
}
