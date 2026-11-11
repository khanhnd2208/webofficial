# Arena art: heroes and bosses

The "Kiểm tra bài cũ" game (`src/components/teaching/arena/`) draws its
heroes and bosses from two catalogues. Adding art is always the same two
steps: put the file in the right folder, add one entry to the catalogue. The
setup screen (step 4, "Nhân vật") lists whatever the catalogues contain, and
`arenaAssets.unit.test.ts` fails if a file and its entry do not match.

| What   | Folder                     | Catalogue                                         |
| ------ | -------------------------- | ------------------------------------------------- |
| Heroes | `public/arena/characters/` | `src/components/teaching/arena/arenaCharacters.ts` |
| Bosses | `public/arena/bosses/`     | `src/components/teaching/arena/arenaBosses.ts`     |

File rules for both: WebP, transparent background, square sheet (960×960 works
well), at most 300 KB, file name in lowercase kebab-case without accents
(`lua-lem.webp`). The file name without `.webp` is the id.

## Hero sheet

One image, a 3×3 grid of equal cells. The hero faces right, stands on the same
ground line and stays the same size in every cell.

| Row | Cell 1         | Cell 2          | Cell 3         |
| --- | -------------- | --------------- | -------------- |
| 1   | Idle           | Wind-up         | Strike         |
| 2   | Walk frame 1   | Walk frame 2    | Walk frame 3   |
| 3   | Walk frame 4   | Walk frame 5    | Walk frame 6   |

Catalogue entry:

```ts
{
	id: 'lua-lem',            // file name
	name: 'Lửa Lém',          // shown in setup
	skill: 'Song Kiếm Lửa',   // shouted on screen when the hero attacks
	accent: '#ff8a36',        // colour of the attack and glow
	effect: 'slash',          // shape of the attack, see below
	origin: [72, 43],         // where the attack leaves the Strike cell, in % (x, y)
}
```

`effect` is one of `slash`, `shield`, `moon`, `arrow`, `star`, `dumpling`,
`ink`, `wind`, `crystal`, `smoke`. How many shots fly and how they curve is in
`arenaStrikes.ts`; what a shot looks like is in `arenaStrike.module.css`. A new
effect needs a name in `ArenaEffect`, a line in `STRIKE_STYLES` and a shape in
the CSS.

`origin` is the tip of the weapon or hand in the Strike cell. Check it in
setup step 4: the charge ring should close on the weapon.

## Boss sheet

One image, a 3×3 grid, one cell per mood in this order (the last two cells
stay empty). The boss faces the viewer and stays centred in every cell.

| Row | Cell 1                       | Cell 2               | Cell 3               |
| --- | ---------------------------- | -------------------- | -------------------- |
| 1   | Idle                         | Roar (mouth open)    | Inhale (sucking in)  |
| 2   | Chomp (mouth shut, cheeks full) | Hurt              | Laugh                |
| 3   | Defeated                     | (empty)              | (empty)              |

Catalogue entry:

```ts
{ id: 'rong-lua', name: 'Rồng Lửa', art: { kind: 'sheet', file: 'rong-lua' } }
```

The built-in purple monster is `art: { kind: 'builtin', hue }`: the same
drawing with its colours rotated by `hue` degrees. Shakes, squashes and the
fall on defeat are applied to every boss by the game, so the art only needs
the seven still poses.

## Prompt outline for generating a sheet

> Chibi game character sprite sheet, 3×3 grid of equal square cells,
> transparent background, thick dark outline, flat cel shading, same character
> and same size in every cell, feet on the same ground line, facing right.
> Row 1: idle stance, wind-up, attack at full extension. Rows 2–3: six-frame
> run cycle. No text, no borders, no ground shadow.

After generating: remove the background, check the grid lines up (each cell
exactly one third of the width and height), export as WebP under 300 KB.
Only use original characters; do not add art of characters from existing
games, comics or films.
