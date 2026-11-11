/**
 * The Arena's boss catalogue. A boss is either the built-in drawing in a new
 * colour, or illustrated art dropped into `public/arena/bosses/` (see
 * `docs/arena-assets.md`): a 3×3 grid with one frame per mood, in the order
 * of `ARENA_BOSS_SHEET`.
 */

export type MonsterMood = 'idle' | 'roar' | 'inhale' | 'chomp' | 'hurt' | 'laugh' | 'defeated';

/** Frame order of an illustrated boss sheet, left to right, top to bottom. */
export const ARENA_BOSS_SHEET: readonly MonsterMood[] = [
	'idle',
	'roar',
	'inhale',
	'chomp',
	'hurt',
	'laugh',
	'defeated',
];

export type ArenaBossArt =
	/** The built-in drawing, recoloured by rotating its hue (degrees). */
	| { kind: 'builtin'; hue: number }
	/** File name in `public/arena/bosses/`, without `.webp`. */
	| { kind: 'sheet'; file: string };

export interface ArenaBoss {
	id: string;
	name: string;
	art: ArenaBossArt;
}

export const ARENA_BOSSES: readonly ArenaBoss[] = [
	{ id: 'quen-bai', name: 'Chúa Tể Quên Bài', art: { kind: 'builtin', hue: 0 } },
	{ id: 'luoi-on-tap', name: 'Quỷ Lười Ôn Tập', art: { kind: 'builtin', hue: 67 } },
	{ id: 'ngu-gat', name: 'Rồng Ngủ Gật', art: { kind: 'builtin', hue: 134 } },
	{ id: 'deadline', name: 'Ma Vương Deadline', art: { kind: 'builtin', hue: 201 } },
	{ id: 'hoc-tu', name: 'Bóng Ma Học Tủ', art: { kind: 'builtin', hue: 268 } },
	{ id: 'nuoc-den-chan', name: 'Vua Nước Đến Chân', art: { kind: 'builtin', hue: 335 } },
];

export function arenaBossArt(file: string) {
	return `/arena/bosses/${file}.webp`;
}

/**
 * The boss of a round. With no choice (or a stale one) the bosses take turns,
 * cycling when the class beats them all; a chosen boss comes back every round.
 */
export function arenaBossFor(round: number, bossId: string | null = null): ArenaBoss {
	const chosen = bossId ? ARENA_BOSSES.find((boss) => boss.id === bossId) : null;
	return chosen ?? ARENA_BOSSES[(Math.max(1, round) - 1) % ARENA_BOSSES.length]!;
}

/** Background position of a mood's frame on a 3×3 boss sheet. */
export function bossFramePosition(mood: MonsterMood) {
	const index = Math.max(0, ARENA_BOSS_SHEET.indexOf(mood));
	return `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`;
}
