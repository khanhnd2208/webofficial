/** Penalty weight per mistake for rank score (30 seconds equivalent). */
export const MISTAKE_RANK_PENALTY_MS = 30_000;

export const MIN_SUBMIT_DURATION_MS = 3_000;

export function calcDurationMs(startedAt: Date, submittedAt: Date): number {
  return Math.max(0, submittedAt.getTime() - startedAt.getTime());
}

export function calcRankScore(durationMs: number, mistakes: number): number {
  return durationMs + mistakes * MISTAKE_RANK_PENALTY_MS;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function buildShareText(params: {
  puzzleNumber: number;
  durationMs: number;
  mistakes: number;
  streak: number;
}): string {
  const time = formatDuration(params.durationMs);
  return [
    `ThinkGrid #${params.puzzleNumber}`,
    `Solved in ${time}`,
    `Mistakes: ${params.mistakes}`,
    `Streak: ${params.streak}`,
    'toiladuykhanh.com/puzzle',
  ].join('\n');
}
