import { describe, expect, it } from 'vitest';

import { ARENA_CHARACTERS, arenaCharacterFor } from './arenaCharacters';

describe('Arena character assignment', () => {
	it('offers ten distinct heroes and keeps each student in the same role across reloads', () => {
		expect(new Set(ARENA_CHARACTERS.map((character) => character.id)).size).toBe(10);
		const codes = Array.from({ length: 100 }, (_, index) => `SV${22000000 + index}`);
		const first = codes.map((code) => arenaCharacterFor(code).id);
		expect(codes.map((code) => arenaCharacterFor(code).id)).toEqual(first);
		expect(new Set(first).size).toBe(10);
	});
});
