/* Non-destructive seed — upsert puzzles; skip rows with player attempts */
import { runPuzzleSeed } from './puzzle-seed-runner';

runPuzzleSeed('future').catch((e) => {
  console.error(e);
  process.exit(1);
});
