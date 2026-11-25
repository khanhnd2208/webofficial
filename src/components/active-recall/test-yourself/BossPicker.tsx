'use client';

import { useId } from 'react';

import { ArenaMonster } from '@/components/teaching/arena/ArenaFigures';

import { RANDOM_BOSS, TEST_BOSSES } from './bossChoice';
import styles from './bossPicker.module.css';

/**
 * The bosses as a grid of radio cards. Native radios give arrow-key moves and
 * one tab stop; the card is the label, so the whole picture is the target.
 */
export default function BossPicker({
	value,
	onChange,
	label,
	withRandom = false,
}: {
	value: string;
	onChange: (choice: string) => void;
	label: string;
	/** Offer "a different boss each run" as the first card. */
	withRandom?: boolean;
}) {
	const name = useId();
	return (
		<div className={styles.grid} role="radiogroup" aria-label={label}>
			{withRandom ? (
				<label className={styles.card} data-checked={value === RANDOM_BOSS || undefined}>
					<input
						type="radio"
						name={name}
						className={styles.input}
						checked={value === RANDOM_BOSS}
						onChange={() => onChange(RANDOM_BOSS)}
					/>
					<span className={styles.random} aria-hidden="true">
						?
					</span>
					<span className={styles.name}>Ngẫu nhiên</span>
				</label>
			) : null}
			{TEST_BOSSES.map((boss) => (
				<label key={boss.id} className={styles.card} data-checked={value === boss.id || undefined}>
					<input
						type="radio"
						name={name}
						className={styles.input}
						checked={value === boss.id}
						onChange={() => onChange(boss.id)}
					/>
					<span className={styles.art}>
						<ArenaMonster boss={boss} mood="idle" size={64} decorative />
					</span>
					<span className={styles.name}>{boss.name}</span>
				</label>
			))}
		</div>
	);
}
