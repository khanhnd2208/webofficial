import { getPuzzleDateKey } from '@/lib/puzzle/dateKey';

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Staging/dev smoke: load a specific puzzle day via ?date=YYYY-MM-DD.
 * Disabled unless THINKGRID_ALLOW_DATE_OVERRIDE=true (never enable on public production).
 */
export function isPuzzleDateOverrideAllowed(): boolean {
  return process.env.THINKGRID_ALLOW_DATE_OVERRIDE === 'true';
}

export function parsePuzzleDateOverrideParam(
  raw: string | null | undefined,
): string | null {
  if (!raw || !DATE_KEY_RE.test(raw)) return null;
  return raw;
}

/**
 * Effective puzzle date for player APIs.
 * Ignores ?date when override is not allowed (production default).
 */
export function resolvePuzzleDateKey(
  rawDate: string | null | undefined,
  now: Date = new Date(),
): string {
  const today = getPuzzleDateKey(now);
  const override = parsePuzzleDateOverrideParam(rawDate);
  if (!override || !isPuzzleDateOverrideAllowed()) return today;
  return override;
}
