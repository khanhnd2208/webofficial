/**
 * Full puzzle DB reset for local/dev: migrate + wipe + seed 8 puzzles (v1.7).
 * Run: npm run db:puzzle:reset
 */
import { execSync } from 'child_process';

console.log('🧩 ThinkGrid puzzle reset\n');

execSync('npx prisma migrate deploy', { stdio: 'inherit' });
execSync('PUZZLE_SEED_CONFIRM=WipeAll npm run db:seed:puzzle:dev', {
  stdio: 'inherit',
  env: { ...process.env, PUZZLE_SEED_CONFIRM: 'WipeAll' },
});
execSync('npm run db:puzzle:check', { stdio: 'inherit' });

console.log('\n✅ Done. Open /puzzle to play.');
