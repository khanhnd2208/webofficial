/**
 * Puzzle seed runner — dev/staging destructive vs future non-destructive upsert.
 */
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { buildSeedPuzzles, type SeedPuzzle } from './puzzle-seed-data';
import { validatePuzzleForPublish } from '../src/lib/puzzle/puzzleValidation';
import { getPuzzleDateKey } from '../src/lib/puzzle/dateKey';
import { publishMetadataFromValidation } from '../src/lib/puzzle/puzzleRuntimeGuard';
import { PUZZLE_VALIDATOR_VERSION } from '../src/lib/puzzle/puzzlePolicy';

export type PuzzleSeedMode = 'dev' | 'staging' | 'future';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/teaching_platform_vocab';

function createPrisma() {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function maskDatabaseUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}:${u.port || '5432'}${u.pathname}`;
  } catch {
    return '(invalid DATABASE_URL)';
  }
}

function assertDestructiveAllowed(mode: PuzzleSeedMode): void {
  if (process.env.PUZZLE_SEED_CONFIRM !== 'WipeAll') {
    throw new Error(
      `Refusing ${mode} seed: set PUZZLE_SEED_CONFIRM=WipeAll to wipe puzzles, attempts, and leaderboard.`,
    );
  }
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.PUZZLE_SEED_ALLOW_DESTRUCTIVE !== 'yes'
  ) {
    throw new Error(
      'Refusing destructive seed while NODE_ENV=production. ' +
        'Use db:seed:puzzle:future on production, or set PUZZLE_SEED_ALLOW_DESTRUCTIVE=yes on a disposable DB only.',
    );
  }
}

async function wipeAll(prisma: PrismaClient): Promise<void> {
  await prisma.puzzleLeaderboardEntry.deleteMany({});
  await prisma.puzzleAttempt.deleteMany({});
  await prisma.dailyPuzzle.deleteMany({});
}

function seedValidation(p: SeedPuzzle) {
  return validatePuzzleForPublish(p.layout, p.solution, {
    difficulty: p.difficulty,
    puzzleKind: p.puzzleKind ?? 'DAILY',
    solverProfile: 'seed',
    requireOneUpDemonstration: p.dateKey === '2026-05-19',
  });
}

function puzzleRowFromSeed(p: SeedPuzzle, status: 'PUBLISHED' | 'DRAFT' = 'PUBLISHED') {
  const validation = seedValidation(p);
  if (!validation.ok) {
    throw new Error(`Invalid seed ${p.dateKey}: ${validation.errors.join('; ')}`);
  }
  const meta = publishMetadataFromValidation(p.layout, p.solution, true);
  return {
    dateKey: p.dateKey,
    title: p.title,
    size: p.layout.size,
    layoutJson: p.layout as object,
    solutionJson: p.solution as object,
    difficulty: p.difficulty,
    puzzleKind: p.puzzleKind ?? 'DAILY',
    status,
    createdBy: 'seed',
    ...meta,
  };
}

async function insertPuzzle(prisma: PrismaClient, p: SeedPuzzle): Promise<void> {
  await prisma.dailyPuzzle.create({ data: puzzleRowFromSeed(p) });
}

function layoutJsonDiffers(
  existing: { layoutJson: unknown },
  seed: SeedPuzzle,
): boolean {
  const a = existing.layoutJson as { verticalWalls?: boolean[][]; horizontalWalls?: boolean[][] };
  const b = seed.layout;
  if (!a?.verticalWalls || !a?.horizontalWalls) return true;
  const size = b.size;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size; c++) {
      if (Boolean(a.verticalWalls[r]?.[c]) !== Boolean(b.verticalWalls[r][c])) return true;
    }
  }
  for (let r = 0; r <= size; r++) {
    for (let c = 0; c < size; c++) {
      if (Boolean(a.horizontalWalls[r]?.[c]) !== Boolean(b.horizontalWalls[r][c])) return true;
    }
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (Boolean((a as { blocked?: boolean[][] }).blocked?.[r]?.[c]) !== Boolean(b.blocked[r][c])) {
        return true;
      }
    }
  }
  return false;
}

function isStaleVsSeed(
  existing: {
    size: number;
    title: string;
    layoutJson: unknown;
    validatorVersion?: string | null;
  },
  seed: SeedPuzzle,
): boolean {
  return (
    existing.size !== seed.layout.size ||
    existing.title !== seed.title ||
    existing.validatorVersion !== PUZZLE_VALIDATOR_VERSION ||
    layoutJsonDiffers(existing, seed)
  );
}

async function upsertFuturePuzzle(prisma: PrismaClient, p: SeedPuzzle, todayKey: string): Promise<'created' | 'updated' | 'skipped' | 'stale-replaced'> {
  const existing = await prisma.dailyPuzzle.findUnique({
    where: { dateKey: p.dateKey },
    select: {
      id: true,
      size: true,
      title: true,
      status: true,
      layoutJson: true,
      validatorVersion: true,
    },
  });

  if (existing) {
    const attemptCount = await prisma.puzzleAttempt.count({ where: { puzzleId: existing.id } });
    if (attemptCount > 0) {
      console.log(`  ⏭ ${p.dateKey} — skip (${attemptCount} attempts, immutable)`);
      return 'skipped';
    }

    const stale = isStaleVsSeed(existing, p);
    const isToday = p.dateKey === todayKey;
    const isFuture = p.dateKey > todayKey;

    // Past published days: keep unless DB row drifted from current seed catalog (e.g. old 3×3 → 4×4).
    if (p.dateKey < todayKey && existing.status === 'PUBLISHED' && !stale) {
      console.log(`  ⏭ ${p.dateKey} — skip (past day, matches seed)`);
      return 'skipped';
    }

    if (stale) {
      console.log(
        `  ⚠ ${p.dateKey} — replacing stale row (was ${existing.size}×${existing.size}, seed ${p.layout.size}×${p.layout.size})`,
      );
    } else if (isToday) {
      console.log(`  🔄 ${p.dateKey} — refresh today (no attempts)`);
    } else if (isFuture) {
      console.log(`  🔄 ${p.dateKey} — upsert future`);
    }

    const row = puzzleRowFromSeed(p);
    await prisma.dailyPuzzle.update({
      where: { id: existing.id },
      data: {
        title: row.title,
        size: row.size,
        layoutJson: row.layoutJson,
        solutionJson: row.solutionJson,
        difficulty: row.difficulty,
        puzzleKind: row.puzzleKind,
        status: 'PUBLISHED',
        validatorVersion: row.validatorVersion,
        validatedAt: row.validatedAt,
        layoutHash: row.layoutHash,
        solutionHash: row.solutionHash,
        validationStatus: row.validationStatus,
      },
    });
    return stale ? 'stale-replaced' : 'updated';
  }

  await insertPuzzle(prisma, p);
  console.log(`  ✅ ${p.dateKey} — created`);
  return 'created';
}

function validateSeedPuzzle(p: SeedPuzzle): void {
  const v = seedValidation(p);
  if (!v.ok) {
    throw new Error(`Invalid seed ${p.dateKey}: ${v.errors.join('; ')}`);
  }
  for (const w of v.warnings) {
    console.warn(`  ⚠ ${p.dateKey}: ${w}`);
  }
  if (v.difficultyScore != null) {
    console.log(`  📊 ${p.dateKey}: difficulty score ${v.difficultyScore}`);
  }
}

export async function runPuzzleSeed(mode: PuzzleSeedMode): Promise<void> {
  const prisma = createPrisma();
  const todayKey = getPuzzleDateKey();
  const dbHost = maskDatabaseUrl(connectionString);

  console.log(`🧩 Puzzle seed mode: ${mode}`);
  console.log(`   NODE_ENV=${process.env.NODE_ENV ?? '(unset)'}`);
  console.log(`   DATABASE=${dbHost}`);
  console.log(`   todayKey=${todayKey}`);

  try {
    const puzzles = buildSeedPuzzles();
    for (const p of puzzles) {
      validateSeedPuzzle(p);
    }

    if (mode === 'dev' || mode === 'staging') {
      assertDestructiveAllowed(mode);
      console.warn('\n⚠️  DESTRUCTIVE: deleting all leaderboard entries, attempts, and puzzles.\n');
      await wipeAll(prisma);
      for (const p of puzzles) {
        await insertPuzzle(prisma, p);
        console.log(`  ✅ ${p.dateKey} — ${p.title}`);
      }
      console.log(`\n✅ ${mode} seed: inserted ${puzzles.length} puzzles (wiped previous data).`);
      return;
    }

    // future — non-destructive
    if (process.env.NODE_ENV === 'production' && process.env.PUZZLE_SEED_CONFIRM === 'WipeAll') {
      throw new Error(
        'Refusing future seed with PUZZLE_SEED_CONFIRM=WipeAll on production. Unset that variable.',
      );
    }

    let created = 0;
    let updated = 0;
    let replaced = 0;
    let skipped = 0;
    for (const p of puzzles) {
      const result = await upsertFuturePuzzle(prisma, p, todayKey);
      if (result === 'created') created++;
      else if (result === 'updated') updated++;
      else if (result === 'stale-replaced') replaced++;
      else skipped++;
    }
    console.log(
      `\n✅ Future seed done: ${created} created, ${updated} updated, ${replaced} stale-replaced, ${skipped} skipped.`,
    );
    console.log(`   Verify today: GET /api/puzzle/today → size should match seed for ${todayKey}.`);
  } finally {
    await prisma.$disconnect();
  }
}
