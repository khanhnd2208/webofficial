import type { CSSProperties } from 'react';

import type { ArenaCharacter as Character } from './arenaCharacters';
import styles from './arenaCharacter.module.css';

/** The same illustrated sprite is used on the floor, in the question card, and in the studio. */
export function ArenaCharacter({
	character,
	size,
	walking = false,
	attacking = false,
	facingLeft = false,
	attackVector = { x: 90, y: -90 },
	decorative = true,
}: {
	character: Character;
	size: number;
	walking?: boolean;
	attacking?: boolean;
	facingLeft?: boolean;
	attackVector?: { x: number; y: number };
	decorative?: boolean;
}) {
	return (
		<span
			className={styles.actor}
			data-character={character.id}
			data-effect={character.effect}
			data-walking={(walking && !attacking) || undefined}
			data-attacking={attacking || undefined}
			data-facing-left={facingLeft || undefined}
			style={
				{
					'--character-size': `${size}px`,
					'--character-art': `url('/arena/characters/${character.id}.webp')`,
					'--character-accent': character.accent,
					'--effect-origin-x': `${character.origin[0]}%`,
					'--effect-origin-y': `${character.origin[1]}%`,
					'--effect-travel-x': `${attackVector.x}px`,
					'--effect-travel-y': `${attackVector.y}px`,
				} as CSSProperties
			}
			aria-hidden={decorative || undefined}
			role={decorative ? undefined : 'img'}
			aria-label={decorative ? undefined : character.name}
		>
			<span className={styles.visual}>
				<span className={styles.sprite} />
			</span>
			<span className={styles.effect} aria-hidden="true" />
		</span>
	);
}
