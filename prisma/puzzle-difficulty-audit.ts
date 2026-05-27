import { buildSeedPuzzles } from './puzzle-seed-data';
import { compilePuzzle } from '../src/lib/puzzle/compiler';
import { evaluateDifficulty } from '../src/lib/puzzle/difficultyEvaluator';
import { explainLayoutFeasibility } from '../src/lib/puzzle/segmentFeasibility';

async function main() {
  console.log('\n=== Difficulty trace (logic-only simulation) ===\n');
  for (const p of buildSeedPuzzles()) {
    const compiled = compilePuzzle(p.layout);
    const d = evaluateDifficulty(compiled);
    const badSegs = explainLayoutFeasibility(compiled).filter((r) => !r.feasible);
    console.log(
      `${p.dateKey} ${p.size}×${p.size} ${p.puzzleKind ?? 'DAILY'} — score=${d.score} forced=${d.forcedPlacements} branch=${d.branchPlacements} guess=${d.requiresGuessing}`,
    );
    if (p.dateKey === '2026-05-26') {
      const maxV = Math.max(...compiled.verticalSegments.map((s) => s.length));
      const maxH = Math.max(...compiled.horizontalSegments.map((s) => s.length));
      console.log(`   8×8 max segment: H=${maxH} V=${maxV} (expect ≤4)`);
      if (badSegs.length) console.log('   INFEASIBLE SEGMENTS', badSegs);
    }
  }
}

main();
