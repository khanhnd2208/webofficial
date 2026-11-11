import { describe, expect, it } from 'vitest';

import { arenaBossFor, ARENA_BOSSES, bossFramePosition } from './arenaBosses';
import { ARENA_CHARACTERS, arenaCast, arenaCharacterFor } from './arenaCharacters';

const codes = Array.from({ length: 100 }, (_, index) => `SV${22000000 + index}`);

describe('Arena character assignment', () => {
	it('keeps each student in the same role across reloads and uses the whole catalogue', () => {
		const first = codes.map((code) => arenaCharacterFor(code).id);
		expect(codes.map((code) => arenaCharacterFor(code).id)).toEqual(first);
		expect(new Set(first).size).toBe(ARENA_CHARACTERS.length);
	});

	it('hands out only the heroes the lecturer ticked', () => {
		const cast = ['lua-lem', 'ro-ti'];
		expect(new Set(codes.map((code) => arenaCharacterFor(code, cast).id))).toEqual(new Set(cast));
	});

	it('falls back to everyone when the choice is empty or no longer exists', () => {
		expect(arenaCast([])).toBe(ARENA_CHARACTERS);
		expect(arenaCast(['retired-hero'])).toBe(ARENA_CHARACTERS);
	});
});

describe('Arena bosses', () => {
	it('take turns by round and start over after the last one', () => {
		expect(arenaBossFor(1).name).toBe('Chúa Tể Quên Bài');
		expect(arenaBossFor(2).id).not.toBe(arenaBossFor(1).id);
		expect(arenaBossFor(ARENA_BOSSES.length + 1).id).toBe(arenaBossFor(1).id);
	});

	it('keep a chosen boss every round, ignoring a stale choice', () => {
		expect(arenaBossFor(3, 'deadline').id).toBe('deadline');
		expect(arenaBossFor(3, 'retired-boss').id).toBe(arenaBossFor(3).id);
	});

	it('map each mood to its frame on a 3×3 sheet', () => {
		expect(bossFramePosition('idle')).toBe('0% 0%');
		expect(bossFramePosition('inhale')).toBe('100% 0%');
		expect(bossFramePosition('hurt')).toBe('50% 50%');
		expect(bossFramePosition('defeated')).toBe('0% 100%');
	});
});
