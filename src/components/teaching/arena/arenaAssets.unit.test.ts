import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { ARENA_BOSSES } from './arenaBosses';
import { ARENA_CHARACTERS } from './arenaCharacters';
import { STRIKE_STYLES } from './arenaStrikes';

const MAX_BYTES = 300 * 1024;
const ART = path.join(process.cwd(), 'public/arena');

function artFiles(folder: string) {
	const dir = path.join(ART, folder);
	return existsSync(dir) ? readdirSync(dir).filter((file) => !file.startsWith('.')) : [];
}

/** Keeps the catalogues and the art folders in step (see docs/arena-assets.md). */
describe('Arena art catalogue', () => {
	it('has one registered hero per file in public/arena/characters, each under 300 KB', () => {
		const ids = ARENA_CHARACTERS.map((hero) => hero.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(artFiles('characters').sort()).toEqual(ids.map((id) => `${id}.webp`).sort());
		for (const id of ids) {
			expect(statSync(path.join(ART, 'characters', `${id}.webp`)).size).toBeLessThanOrEqual(
				MAX_BYTES,
			);
		}
	});

	it('gives every hero an attack that is drawn', () => {
		for (const hero of ARENA_CHARACTERS) {
			expect(STRIKE_STYLES[hero.effect].shots.length).toBeGreaterThan(0);
			expect(hero.skill).not.toBe('');
		}
	});

	it('has one registered boss per file in public/arena/bosses, each under 300 KB', () => {
		const ids = ARENA_BOSSES.map((boss) => boss.id);
		expect(new Set(ids).size).toBe(ids.length);
		const sheets = ARENA_BOSSES.flatMap((boss) =>
			boss.art.kind === 'sheet' ? [`${boss.art.file}.webp`] : [],
		);
		expect(artFiles('bosses').sort()).toEqual(sheets.sort());
		for (const file of sheets) {
			expect(statSync(path.join(ART, 'bosses', file)).size).toBeLessThanOrEqual(MAX_BYTES);
		}
	});
});
