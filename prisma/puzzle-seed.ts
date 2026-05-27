/* Destructive dev/staging seed — wipes attempts + leaderboard + puzzles */
import { runPuzzleSeed } from './puzzle-seed-runner';

const mode = process.env.PUZZLE_SEED_MODE === 'staging' ? 'staging' : 'dev';

runPuzzleSeed(mode).catch((e) => {
  console.error(e);
  process.exit(1);
});
