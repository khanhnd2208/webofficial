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
	| 'music'
	| 'book';

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
	/** Short label for the game floor; the picker still shows the full name. */
	shortName?: string;
}

export const ARENA_CHARACTERS: readonly ArenaCharacter[] = [
	{
		id: 'lua-lem',
		name: 'Lửa Lém',
		skill: 'Twin Flame Blades',
		accent: '#ff8a36',
		effect: 'slash',
		origin: [72, 43],
	},
	{
		id: 'khien-bong',
		name: 'Khiên Bông',
		skill: 'Spinning Cotton Shield',
		accent: '#b4ec83',
		effect: 'shield',
		origin: [76, 49],
	},
	{
		id: 'ba-nguyet',
		name: 'Bà Nguyệt',
		skill: 'Crescent Moon',
		accent: '#d7b8ff',
		effect: 'moon',
		origin: [84, 35],
	},
	{
		id: 'phi-tien',
		name: 'Phi Tiễn',
		skill: 'Ice Arrow Rain',
		accent: '#68e5ff',
		effect: 'arrow',
		origin: [81, 42],
	},
	{
		id: 'ro-ti',
		name: 'Rô Tí',
		skill: 'Electro Star',
		accent: '#ffe367',
		effect: 'star',
		origin: [77, 47],
	},
	{
		id: 'ong-noi',
		name: 'Ông Nồi',
		skill: 'Lightning Dumpling',
		accent: '#ffc16e',
		effect: 'dumpling',
		origin: [78, 40],
	},
	{
		id: 'muc-lam',
		name: 'Mực Lam',
		skill: 'Indigo Ink Slash',
		accent: '#64c9ff',
		effect: 'ink',
		origin: [78, 65],
	},
	{
		id: 'co-may',
		name: 'Cô Mây',
		skill: 'Pink Cloud Cyclone',
		accent: '#ffc0eb',
		effect: 'wind',
		origin: [79, 43],
	},
	{
		id: 'dau-da',
		name: 'Đáu Đá',
		skill: 'Blue Crystal',
		accent: '#b4f86a',
		effect: 'crystal',
		origin: [78, 73],
	},
	{
		id: 'cao-khoi',
		name: 'Cáo Khói',
		skill: 'Fox Smoke',
		accent: '#d5fa6a',
		effect: 'smoke',
		origin: [78, 42],
	},
	{
		id: 'hle-zeus',
		name: 'Zeus',
		skill: 'Orange Thunder Cleave',
		accent: '#ff9a37',
		effect: 'slash',
		origin: [92, 49],
		nameplate: true,
	},
	{
		id: 'hle-kanavi',
		name: 'Kanavi',
		skill: 'Thunder Rush',
		accent: '#ffb545',
		effect: 'star',
		origin: [89, 46],
		nameplate: true,
	},
	{
		id: 'hle-zeka',
		name: 'Zeka',
		skill: 'Violet Light Slash',
		accent: '#bd8dff',
		effect: 'slash',
		origin: [94, 48],
		nameplate: true,
	},
	{
		id: 'hle-gumayusi',
		name: 'Gumayusi',
		skill: 'Golden Twin Arrows',
		accent: '#ffaf42',
		effect: 'arrow',
		origin: [89, 47],
		nameplate: true,
	},
	{
		id: 'hle-delight',
		name: 'Delight',
		skill: 'Guardian Star Shield',
		accent: '#ffc25a',
		effect: 'shield',
		origin: [83, 43],
		nameplate: true,
	},
	{
		id: 't1-doran',
		name: 'Doran',
		skill: 'Mountain Quake',
		accent: '#ff5264',
		effect: 'crystal',
		origin: [91, 53],
		nameplate: true,
	},
	{
		id: 't1-oner',
		name: 'Oner',
		skill: 'Twin Ring Combo',
		accent: '#ff3e68',
		effect: 'wind',
		origin: [88, 43],
		nameplate: true,
	},
	{
		id: 't1-faker',
		name: 'Faker',
		skill: 'Checkmate Rook',
		accent: '#f84b66',
		effect: 'star',
		origin: [89, 51],
		nameplate: true,
	},
	{
		id: 't1-peyz',
		name: 'Peyz',
		skill: 'Piercing Prism',
		accent: '#ff6675',
		effect: 'arrow',
		origin: [89, 48],
		nameplate: true,
	},
	{
		id: 't1-keria',
		name: 'Keria',
		skill: 'Blossom Ward',
		accent: '#ff7185',
		effect: 'shield',
		origin: [87, 46],
		nameplate: true,
	},
	{
		id: 'j9x',
		name: 'J9x',
		skill: 'Sonic Burst',
		accent: '#e779ff',
		effect: 'music',
		origin: [76, 47],
		nameplate: true,
	},
	{
		id: 'ndk',
		name: 'NDK',
		skill: 'Knowledge Unlocked',
		accent: '#ff7658',
		effect: 'book',
		origin: [66, 39],
		nameplate: true,
	},
	{
		id: 'fmt-le-manh-duc',
		name: 'Lê Mạnh Đức',
		shortName: 'Thầy Đức',
		skill: 'Golden Chalk Guard',
		accent: '#ffd47a',
		effect: 'shield',
		origin: [91, 23],
		nameplate: true,
	},
	{
		id: 'fmt-phan-hoang-quan',
		name: 'Phan Hoàng Quân',
		shortName: 'Thầy Quân',
		skill: 'Triangle Theorem',
		accent: '#52e4d5',
		effect: 'crystal',
		origin: [92, 40],
		nameplate: true,
	},
	{
		id: 'fmt-hoang-gia-thu',
		name: 'Hoàng Gia Thư',
		shortName: 'Thầy Thư',
		skill: 'Guardian Prism',
		accent: '#7899ff',
		effect: 'crystal',
		origin: [92, 31],
		nameplate: true,
	},
	{
		id: 'fmt-nguyen-thu-trang',
		name: 'Nguyễn Thu Trang',
		shortName: 'Cô Trang',
		skill: 'Starry Ink Ribbon',
		accent: '#f2a5df',
		effect: 'ink',
		origin: [85, 28],
		nameplate: true,
	},
	{
		id: 'fmt-ngo-thi-thuy-linh',
		name: 'Ngô Thị Thùy Linh',
		shortName: 'Cô Thùy Linh',
		skill: 'Fan of Knowledge',
		accent: '#74cfff',
		effect: 'wind',
		origin: [83, 37],
		nameplate: true,
	},
	{
		id: 'fmt-nguyen-thi-men',
		name: 'Nguyễn Thị Mến',
		shortName: 'Cô Mến',
		skill: 'Silk Page Ribbon',
		accent: '#ff8c91',
		effect: 'wind',
		origin: [91, 39],
		nameplate: true,
	},
	{
		id: 'fmt-le-hai-anh',
		name: 'Lê Hải Anh',
		shortName: 'Cô Hải Anh',
		skill: 'Leaf of Enlightenment',
		accent: '#8be377',
		effect: 'arrow',
		origin: [90, 43],
		nameplate: true,
	},
	{
		id: 'fmt-nguyen-phuc-linh',
		name: 'Nguyễn Phúc Linh',
		shortName: 'Thầy Phúc Linh',
		skill: 'Lecture Echo',
		accent: '#67d9f7',
		effect: 'moon',
		origin: [85, 31],
		nameplate: true,
	},
	{
		id: 'fmt-duong-ha-phuong',
		name: 'Đường Hà Phương',
		shortName: 'Cô Hà Phương',
		skill: 'Sands of Time',
		accent: '#ffb754',
		effect: 'star',
		origin: [86, 32],
		nameplate: true,
	},
	{
		id: 'fmt-tran-thao-phuong',
		name: 'Trần Thảo Phương',
		shortName: 'Cô Thảo Phương',
		skill: 'Lantern Bloom',
		accent: '#fba6c0',
		effect: 'moon',
		origin: [79, 42],
		nameplate: true,
	},
	{
		id: 'ms-thu-bco-spring-2025',
		name: 'Ms Thu - BCO - Spring 2025',
		shortName: 'Ms Thu',
		skill: 'Red Diploma Path',
		accent: '#f05aa6',
		effect: 'book',
		origin: [72, 37],
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
