/**
 * Audit: every published puzzle passes v1.7 gates and solver can complete from givens.
 * Run: npx tsx prisma/puzzle-play-audit.ts
 */
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { parseLayoutJson } from '../src/lib/puzzle/serializer';
import { compilePuzzle } from '../src/lib/puzzle/compiler';
import { validateStoredPuzzle, isPuzzleRuntimeSafe } from '../src/lib/puzzle/puzzleRuntimeGuard';
import { getSegmentFeasibilityErrors } from '../src/lib/puzzle/segmentFeasibility';
import { countSolutions, findFirstSolution } from '../src/lib/puzzle/solver';
import { isSolved, composeStateWithGivens } from '../src/lib/puzzle/validator';
import { solverBudgetForProfile } from '../src/lib/puzzle/puzzlePolicy';
import type { PuzzleSolution } from '../src/types/puzzle';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/teaching_platform_vocab';

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString })) });
  const budget = solverBudgetForProfile('publish');
  let failed = 0;

  const rows = await prisma.dailyPuzzle.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { dateKey: 'asc' },
  });

  console.log(`\n=== ThinkGrid play audit (${rows.length} published) ===\n`);

  for (const row of rows) {
    const layout = parseLayoutJson(row.layoutJson);
    const solution = row.solutionJson as PuzzleSolution;
    const compiled = compilePuzzle(layout);
    const guard = validateStoredPuzzle(row);
    const feas = getSegmentFeasibilityErrors(compiled);
    const solCount = feas.length === 0 ? countSolutions(compiled, undefined, 2, budget) : 0;
    const fromGivens = findFirstSolution(compiled, budget);
    const givensOnly: PuzzleSolution = {};
    for (const k of compiled.playableKeys) {
      if (layout.givens[k] !== undefined) givensOnly[k] = layout.givens[k];
    }
    const composed = composeStateWithGivens(fromGivens ?? {}, compiled);
    const solvedFromGivens = fromGivens ? isSolved(composed, compiled) : false;

    const wallsV = layout.verticalWalls.flat().filter(Boolean).length - layout.size * 2;
    const wallsH = layout.horizontalWalls.flat().filter(Boolean).length - layout.size * 2;

    const ok =
      guard.safe &&
      feas.length === 0 &&
      solCount === 1 &&
      fromGivens !== null &&
      solvedFromGivens &&
      isPuzzleRuntimeSafe(row);

    const mark = ok ? '✅' : '❌';
    console.log(`${mark} ${row.dateKey} ${row.size}×${row.size} ${row.puzzleKind} ${row.difficulty}`);
    console.log(
      `   gates: publish=${guard.safe} feas=${feas.length === 0} unique=${solCount} playable=${compiled.playableKeys.length} givens=${Object.keys(layout.givens).length}`,
    );
    console.log(`   walls: internal V≈${wallsV} H≈${wallsH} blocked=${layout.blocked.flat().filter(Boolean).length}`);
    console.log(`   play: solverCompletes=${solvedFromGivens} runtimeSafe=${isPuzzleRuntimeSafe(row)}`);

    if (!ok) {
      failed++;
      if (!guard.safe) console.log(`   errors: ${guard.result.errors.slice(0, 3).join('; ')}`);
      if (feas.length) console.log(`   feas: ${feas[0]}`);
      if (solCount !== 1) console.log(`   solutionCount: ${solCount}`);
      if (!solvedFromGivens) console.log(`   solver did not complete grid from givens`);
    }
    console.log('');
  }

  await prisma.$disconnect();
  if (failed > 0) {
    console.log(`❌ ${failed} puzzle(s) failed audit`);
    process.exit(1);
  }
  console.log('✅ All puzzles: rules OK, unique solution, solver can finish from givens.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
