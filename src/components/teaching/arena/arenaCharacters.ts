/** Original Arena cast. The art grid is idle, wind-up, strike, then six walk frames. */
export const ARENA_CHARACTERS = [
	{ id: 'lua-lem', name: 'Lửa Lém', accent: '#ff8a36', effect: 'slash', origin: [72, 43] },
	{ id: 'khien-bong', name: 'Khiên Bông', accent: '#b4ec83', effect: 'shield', origin: [76, 49] },
	{ id: 'ba-nguyet', name: 'Bà Nguyệt', accent: '#d7b8ff', effect: 'moon', origin: [84, 35] },
	{ id: 'phi-tien', name: 'Phi Tiễn', accent: '#68e5ff', effect: 'arrow', origin: [81, 42] },
	{ id: 'ro-ti', name: 'Rô Tí', accent: '#ffe367', effect: 'star', origin: [77, 47] },
	{ id: 'ong-noi', name: 'Ông Nồi', accent: '#ffc16e', effect: 'dumpling', origin: [78, 40] },
	{ id: 'muc-lam', name: 'Mực Lam', accent: '#64c9ff', effect: 'ink', origin: [78, 65] },
	{ id: 'co-may', name: 'Cô Mây', accent: '#ffc0eb', effect: 'wind', origin: [79, 43] },
	{ id: 'dau-da', name: 'Đáu Đá', accent: '#b4f86a', effect: 'crystal', origin: [78, 73] },
	{ id: 'cao-khoi', name: 'Cáo Khói', accent: '#d5fa6a', effect: 'smoke', origin: [78, 42] },
] as const;

export type ArenaCharacter = (typeof ARENA_CHARACTERS)[number];

/** A random-looking, stable assignment: refreshing the lesson never changes a student's hero. */
export function arenaCharacterFor(studentCode: string): ArenaCharacter {
	let hash = 2166136261;
	for (let index = 0; index < studentCode.length; index += 1) {
		hash ^= studentCode.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return ARENA_CHARACTERS[(hash >>> 0) % ARENA_CHARACTERS.length]!;
}
