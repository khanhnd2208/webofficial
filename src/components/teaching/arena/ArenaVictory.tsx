import { m } from 'framer-motion';

import styles from './arena.module.css';

export function ArenaVictory({
	round,
	bossName,
	onNewBoss,
	onSummary,
}: {
	round: number;
	bossName: string;
	onNewBoss: () => void;
	onSummary: () => void;
}) {
	return (
		<m.div
			className={styles.victory}
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0 }}
		>
			<span className={styles.victoryRays} aria-hidden="true" />
			<m.span
				className={styles.victoryKo}
				aria-hidden="true"
				initial={{ scale: 4, opacity: 0, rotate: -12 }}
				animate={{ scale: 1, opacity: 1, rotate: -6 }}
				transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.15 }}
			>
				K.O.!
			</m.span>
			<h2>Cả lớp đã hạ gục Boss {round}!</h2>
			<p className={styles.victorySub}>{bossName} đã bị đánh bại</p>
			<span className={styles.victoryActions}>
				<button type="button" className={styles.startButton} onClick={onNewBoss}>
					Gọi Boss mới <kbd>Space</kbd>
				</button>
				<button type="button" className={styles.textButton} onClick={onSummary}>
					Xem tổng kết
				</button>
			</span>
		</m.div>
	);
}
