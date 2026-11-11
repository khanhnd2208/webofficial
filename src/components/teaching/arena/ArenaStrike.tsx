import type { CSSProperties } from 'react';

import { STRIKE_MS, STRIKE_STYLES, strikeGeometry, type StrikeCue } from './arenaStrikes';
import styles from './arenaStrike.module.css';

const SHARDS = Array.from({ length: 10 }, (_, index) => index);

function vars(values: Record<string, string | number>) {
	return values as CSSProperties;
}

/**
 * One hero attack, drawn over the stage: the charge and the skill call-out at
 * the hero, the shots flying along curved paths, and the burst on the boss.
 * Timing comes from `STRIKE_MS`, so the game logic and the picture agree.
 * `quiet` drops the call-out where the skill is already named (setup).
 * The parent keys it by `cue.id` and removes it after `STRIKE_MS.end`.
 */
export function ArenaStrike({ cue, quiet = false }: { cue: StrikeCue; quiet?: boolean }) {
	const style = STRIKE_STYLES[cue.effect];
	const { distance, angle } = strikeGeometry(cue);
	const scale = cue.power === 3 ? 1.5 : cue.power === 2 ? 1.2 : 1;
	return (
		<div
			className={styles.strike}
			data-effect={cue.effect}
			data-power={cue.power}
			data-align={cue.align}
			data-quiet={quiet || undefined}
			style={vars({
				'--strike-accent': cue.accent,
				'--strike-launch': `${STRIKE_MS.launch}ms`,
				'--strike-flight': `${STRIKE_MS.flight}ms`,
				'--strike-impact': `${STRIKE_MS.impact}ms`,
				'--strike-size': `${Math.round(style.size * scale)}px`,
				'--strike-scale': scale,
			})}
			aria-hidden="true"
		>
			<div className={styles.origin} style={{ left: cue.from.x, top: cue.from.y }}>
				<span className={styles.charge} />
				<span className={styles.chargeCore} />
				<span className={styles.callout}>
					{cue.power === 3 ? 'Đòn kết liễu!' : `${cue.skill}!`}
				</span>
				<div className={styles.aim} style={{ transform: `rotate(${angle}deg)` }}>
					{style.shots.map((shot, index) => (
						<span
							key={index}
							className={styles.travel}
							style={vars({
								'--shot-distance': `${distance}px`,
								'--shot-bend': `${shot.bend}px`,
								'--shot-delay': `${shot.delay}ms`,
							})}
						>
							<span className={styles.bow}>
								<span className={styles.trail} />
								<span className={styles.shape} data-spin={style.spin || undefined} />
							</span>
						</span>
					))}
				</div>
			</div>
			<div className={styles.impact} style={{ left: cue.to.x, top: cue.to.y }}>
				<span className={styles.burst} />
				<span className={styles.ring} />
				<span className={styles.ring} data-late="" />
				<span className={styles.core} />
				{SHARDS.map((index) => (
					<span
						key={index}
						className={styles.shard}
						style={vars({ '--shard-angle': `${index * 36 + 12}deg` })}
					/>
				))}
			</div>
		</div>
	);
}
