'use client';

import { AnimatePresence, m } from 'framer-motion';

import type { PublicPrize } from '../types';
import styles from './fmt2026.module.css';

export function StockBar({ prizes, luckLeft }: { prizes: PublicPrize[]; luckLeft: number }) {
	return (
		<ul className={styles.stock} aria-label="Kho quà còn lại">
			{prizes.map((prize) => (
				<li key={prize.id} className={styles.stockItem} data-empty={prize.remaining === 0}>
					{prize.imagePath && <img src={prize.imagePath} alt="" />}
					<span>{prize.name}</span>
					<AnimatePresence mode="popLayout" initial={false}>
						<m.span
							key={prize.remaining}
							className={styles.stockCount}
							initial={{ y: -16, opacity: 0, scale: 1.6 }}
							animate={{ y: 0, opacity: 1, scale: 1 }}
							exit={{ y: 16, opacity: 0 }}
						>
							{prize.remaining}
						</m.span>
					</AnimatePresence>
				</li>
			))}
			<li className={styles.stockItem} data-empty={luckLeft === 0} style={{ paddingLeft: 14 }}>
				<span>Chúc may mắn</span>
				<span className={styles.stockCount}>{luckLeft}</span>
			</li>
		</ul>
	);
}
