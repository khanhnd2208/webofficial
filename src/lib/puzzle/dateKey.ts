/** Timezone for daily puzzle reset */
export const PUZZLE_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Returns YYYY-MM-DD for the given instant in Asia/Ho_Chi_Minh.
 */
export function getPuzzleDateKey(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: PUZZLE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Previous calendar day in puzzle timezone (for streak).
 */
export function getPreviousDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() - 1);
  return utc.toISOString().slice(0, 10);
}
