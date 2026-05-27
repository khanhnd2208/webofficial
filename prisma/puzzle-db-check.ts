/**
 * Inspect puzzles in the DB the app is connected to.
 * Run: npm run db:puzzle:check
 * Exit 1 if any PUBLISHED puzzle fails current validator (v1.7).
 */
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { buildSeedPuzzles } from './puzzle-seed-data';
import { getPuzzleDateKey } from '../src/lib/puzzle/dateKey';
import { PUZZLE_SEED_8X8_DATE_KEYS, PUZZLE_SEED_PUBLISHED_COUNT } from '../src/lib/puzzle/seedCatalogMeta';
import { PUZZLE_VALIDATOR_VERSION } from '../src/lib/puzzle/puzzlePolicy';
import { validateStoredPuzzle } from '../src/lib/puzzle/puzzleRuntimeGuard';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/teaching_platform_vocab';

async function main() {
  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const todayKey = getPuzzleDateKey();
  const seedByDate = new Map(buildSeedPuzzles().map((p) => [p.dateKey, p]));
  let exitCode = 0;

  try {
    const u = new URL(connectionString);
    console.log(`DATABASE: ${u.protocol}//${u.hostname}${u.pathname}`);
    console.log(`todayKey (VN): ${todayKey}`);
    console.log(`validator: ${PUZZLE_VALIDATOR_VERSION}\n`);

    const rows = await prisma.dailyPuzzle.findMany({
      orderBy: { dateKey: 'asc' },
      select: {
        id: true,
        dateKey: true,
        size: true,
        difficulty: true,
        status: true,
        title: true,
        layoutJson: true,
        solutionJson: true,
        puzzleKind: true,
        validatorVersion: true,
        validationStatus: true,
        layoutHash: true,
        solutionHash: true,
        _count: { select: { attempts: true } },
      },
    });

    if (rows.length === 0) {
      console.log('No DailyPuzzle rows. Run: npm run db:seed:puzzle:future');
      process.exit(1);
      return;
    }

    console.log('dateKey       | size | status    | attempts | validator | note');
    console.log('--------------|------|-----------|----------|-----------|-----');

    for (const row of rows) {
      const seed = seedByDate.get(row.dateKey);
      const expected = seed ? `${seed.layout.size}×${seed.layout.size}` : '—';
      const match = seed ? row.size === seed.layout.size : null;
      let note =
        row.dateKey === todayKey
          ? match === false
            ? 'TODAY MISMATCH'
            : match
              ? 'today OK'
              : 'today'
          : match === false
            ? 'stale vs seed'
            : '';

      if (row.status === 'PUBLISHED') {
        if (row.validatorVersion !== PUZZLE_VALIDATOR_VERSION) {
          note = note ? `${note}; old validator` : 'old validator';
        }
        const guard = validateStoredPuzzle(row);
        if (!guard.safe) {
          note = note ? `${note}; FAIL v${PUZZLE_VALIDATOR_VERSION}` : `FAIL v${PUZZLE_VALIDATOR_VERSION}`;
          exitCode = 1;
          console.error(`\n❌ ${row.dateKey} fails current publish gate:`);
          for (const e of guard.result.errors) console.error(`   - ${e}`);
        }
      }

      console.log(
        `${row.dateKey} | ${String(row.size).padStart(4)} | ${row.status.padEnd(9)} | ${String(row._count.attempts).padStart(8)} | ${(row.validatorVersion ?? '—').padEnd(9)} | ${note}`,
      );
    }

    const published8 = rows.filter((r) => r.status === 'PUBLISHED' && r.size === 8);
    if (PUZZLE_SEED_8X8_DATE_KEYS.length > 0 && published8.length === 0) {
      console.log(
        `\n⚠ No 8×8 puzzle in DB. Seed expects: ${PUZZLE_SEED_8X8_DATE_KEYS.join(', ')}. Run: npm run db:seed:puzzle:future`,
      );
      exitCode = 1;
    }

    const publishedCount = rows.filter((r) => r.status === 'PUBLISHED').length;
    if (publishedCount < PUZZLE_SEED_PUBLISHED_COUNT) {
      console.log(
        `\n⚠ Only ${publishedCount}/${PUZZLE_SEED_PUBLISHED_COUNT} published puzzles.`,
      );
      exitCode = 1;
    }

    if (exitCode === 0) {
      console.log('\n✅ All published puzzles pass current validator.');
    } else {
      console.log('\n❌ Fix puzzles above (wipe+seed or admin re-publish).');
    }

    process.exit(exitCode);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
