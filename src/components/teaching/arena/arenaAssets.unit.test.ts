import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';
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

	it('keeps illustrated boss cells transparent outside the character', async () => {
		for (const boss of ARENA_BOSSES) {
			if (boss.art.kind !== 'sheet') continue;
			const file = path.join(ART, 'bosses', `${boss.art.file}.webp`);
			const { data, info } = await sharp(file)
				.ensureAlpha()
				.raw()
				.toBuffer({ resolveWithObject: true });
			expect(info.width).toBe(info.height);
			expect(info.width % 3).toBe(0);

			const cell = info.width / 3;
			for (let frame = 0; frame < 9; frame += 1) {
				let transparent = 0;
				for (let y = Math.floor(frame / 3) * cell; y < (Math.floor(frame / 3) + 1) * cell; y += 1) {
					for (let x = (frame % 3) * cell; x < ((frame % 3) + 1) * cell; x += 1) {
						if (data[(y * info.width + x) * info.channels + 3]! <= 32) transparent += 1;
					}
				}
				const clearShare = transparent / (cell * cell);
				expect(clearShare, `${boss.id} frame ${frame + 1}`).toBeGreaterThan(frame < 7 ? 0.3 : 0.99);
			}
		}
	});
});
