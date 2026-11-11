import type { CSSProperties } from 'react';

import { arenaCharacterArt, type ArenaCharacter as Character } from './arenaCharacters';
import styles from './arenaCharacter.module.css';

/** The same illustrated sprite is used on the floor, in the question card, and in setup. */
export function ArenaCharacter({
	character,
	size,
	walking = false,
	attacking = false,
	facingLeft = false,
	decorative = true,
}: {
	character: Character;
	size: number;
	walking?: boolean;
	attacking?: boolean;
	facingLeft?: boolean;
	decorative?: boolean;
}) {
	return (
		<span
			className={styles.actor}
			data-character={character.id}
			data-walking={(walking && !attacking) || undefined}
			data-attacking={attacking || undefined}
			data-facing-left={facingLeft || undefined}
			style={
				{
					'--character-size': `${size}px`,
					'--character-art': `url('${arenaCharacterArt(character.id)}')`,
					'--character-accent': character.accent,
				} as CSSProperties
			}
			aria-hidden={decorative || undefined}
			role={decorative ? undefined : 'img'}
			aria-label={decorative ? undefined : character.name}
		>
			<span className={styles.visual}>
				<span className={styles.sprite} />
			</span>
		</span>
	);
}
