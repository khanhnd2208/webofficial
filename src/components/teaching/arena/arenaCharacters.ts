/**
 * The Arena's hero catalogue. Adding a hero is two steps (see
 * `docs/arena-assets.md`): drop `<id>.webp` into `public/arena/characters/`
 * and add one line here. The art is a 3×3 grid: idle, wind-up, strike, then
 * six walk frames.
 */

/** How a hero's attack flies. Each effect has its own shape in `arenaStrike.module.css`. */
export type ArenaEffect =
	| 'slash'
	| 'shield'
	| 'moon'
	| 'arrow'
	| 'star'
	| 'dumpling'
	| 'ink'
	| 'wind'
	| 'crystal'
	| 'smoke'
	| 'music';

export interface ArenaCharacter {
	/** File name in `public/arena/characters/`, without `.webp`. */
	id: string;
	name: string;
	/** Called out on screen when the hero attacks. */
	skill: string;
	/** Colour of the hero's attack and glow. */
	accent: string;
	effect: ArenaEffect;
	/** Where the attack leaves the strike frame, in percent of the frame (x, y). */
	origin: readonly [number, number];
	/** Show a glowing hero name above the sprite in the arena. */
	nameplate?: boolean;
}

export const ARENA_CHARACTERS: readonly ArenaCharacter[] = [
	{
		id: 'lua-lem',
		name: 'Lửa Lém',
		skill: 'Song Kiếm Lửa',
		accent: '#ff8a36',
		effect: 'slash',
		origin: [72, 43],
	},
	{
		id: 'khien-bong',
		name: 'Khiên Bông',
		skill: 'Khiên Bông Xoáy',
		accent: '#b4ec83',
		effect: 'shield',
		origin: [76, 49],
	},
	{
		id: 'ba-nguyet',
		name: 'Bà Nguyệt',
		skill: 'Trăng Khuyết',
		accent: '#d7b8ff',
		effect: 'moon',
		origin: [84, 35],
	},
	{
		id: 'phi-tien',
		name: 'Phi Tiễn',
		skill: 'Mưa Tên Băng',
		accent: '#68e5ff',
		effect: 'arrow',
		origin: [81, 42],
	},
	{
		id: 'ro-ti',
		name: 'Rô Tí',
		skill: 'Sao Điện Tử',
		accent: '#ffe367',
		effect: 'star',
		origin: [77, 47],
	},
	{
		id: 'ong-noi',
		name: 'Ông Nồi',
		skill: 'Bánh Bao Thần Tốc',
		accent: '#ffc16e',
		effect: 'dumpling',
		origin: [78, 40],
	},
	{
		id: 'muc-lam',
		name: 'Mực Lam',
		skill: 'Nhát Mực Lam',
		accent: '#64c9ff',
		effect: 'ink',
		origin: [78, 65],
	},
	{
		id: 'co-may',
		name: 'Cô Mây',
		skill: 'Lốc Mây Hồng',
		accent: '#ffc0eb',
		effect: 'wind',
		origin: [79, 43],
	},
	{
		id: 'dau-da',
		name: 'Đáu Đá',
		skill: 'Pha Lê Xanh',
		accent: '#b4f86a',
		effect: 'crystal',
		origin: [78, 73],
	},
	{
		id: 'cao-khoi',
		name: 'Cáo Khói',
		skill: 'Khói Hồ Ly',
		accent: '#d5fa6a',
		effect: 'smoke',
		origin: [78, 42],
	},
	{
		id: 'hle-zeus',
		name: 'Zeus',
		skill: 'Trảm Kích Lôi Cam',
		accent: '#ff9a37',
		effect: 'slash',
		origin: [92, 49],
		nameplate: true,
	},
	{
		id: 'hle-kanavi',
		name: 'Kanavi',
		skill: 'Lôi Kích Tốc Hành',
		accent: '#ffb545',
		effect: 'star',
		origin: [89, 46],
		nameplate: true,
	},
	{
		id: 'hle-zeka',
		name: 'Zeka',
		skill: 'Nhất Kiếm Tử Quang',
		accent: '#bd8dff',
		effect: 'slash',
		origin: [94, 48],
		nameplate: true,
	},
	{
		id: 'hle-gumayusi',
		name: 'Gumayusi',
		skill: 'Song Tiễn Hoàng Kim',
		accent: '#ffaf42',
		effect: 'arrow',
		origin: [89, 47],
		nameplate: true,
	},
	{
		id: 'hle-delight',
		name: 'Delight',
		skill: 'Khiên Sao Hộ Vệ',
		accent: '#ffc25a',
		effect: 'shield',
		origin: [83, 43],
		nameplate: true,
	},
	{
		id: 'j9x',
		name: 'J9x',
		skill: 'Thanh Âm Bùng Nổ',
		accent: '#e779ff',
		effect: 'music',
		origin: [76, 47],
		nameplate: true,
	},
];

export function arenaCharacterArt(id: string) {
	return `/arena/characters/${id}.webp`;
}

/** The heroes in play: the lecturer's selection, or everyone when it is empty or stale. */
export function arenaCast(heroIds: readonly string[] = []): readonly ArenaCharacter[] {
	if (heroIds.length === 0) return ARENA_CHARACTERS;
	const cast = ARENA_CHARACTERS.filter((character) => heroIds.includes(character.id));
	return cast.length ? cast : ARENA_CHARACTERS;
}

/** A random-looking, stable assignment: refreshing the lesson never changes a student's hero. */
export function arenaCharacterFor(
	studentCode: string,
	heroIds: readonly string[] = [],
): ArenaCharacter {
	const cast = arenaCast(heroIds);
	let hash = 2166136261;
	for (let index = 0; index < studentCode.length; index += 1) {
		hash ^= studentCode.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return cast[(hash >>> 0) % cast.length]!;
}
