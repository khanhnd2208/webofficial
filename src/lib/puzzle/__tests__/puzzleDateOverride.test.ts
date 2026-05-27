import { describe, expect, it, afterEach } from 'vitest';
import {
  isPuzzleDateOverrideAllowed,
  parsePuzzleDateOverrideParam,
  resolvePuzzleDateKey,
} from '@/lib/puzzle/puzzleDateOverride';

describe('puzzleDateOverride', () => {
  const prev = process.env.THINKGRID_ALLOW_DATE_OVERRIDE;

  afterEach(() => {
    if (prev === undefined) delete process.env.THINKGRID_ALLOW_DATE_OVERRIDE;
    else process.env.THINKGRID_ALLOW_DATE_OVERRIDE = prev;
  });

  it('ignores date param when override disabled', () => {
    delete process.env.THINKGRID_ALLOW_DATE_OVERRIDE;
    expect(resolvePuzzleDateKey('2026-05-19', new Date('2026-05-25T12:00:00+07:00'))).not.toBe(
      '2026-05-19',
    );
  });

  it('uses date param when override enabled', () => {
    process.env.THINKGRID_ALLOW_DATE_OVERRIDE = 'true';
    expect(resolvePuzzleDateKey('2026-05-19', new Date('2026-05-25T12:00:00+07:00'))).toBe(
      '2026-05-19',
    );
  });

  it('rejects invalid date format', () => {
    process.env.THINKGRID_ALLOW_DATE_OVERRIDE = 'true';
    expect(parsePuzzleDateOverrideParam('05-19-2026')).toBeNull();
    expect(resolvePuzzleDateKey('bad', new Date('2026-05-25T12:00:00+07:00'))).toBe('2026-05-25');
  });

  it('isPuzzleDateOverrideAllowed requires explicit env', () => {
    delete process.env.THINKGRID_ALLOW_DATE_OVERRIDE;
    expect(isPuzzleDateOverrideAllowed()).toBe(false);
    process.env.THINKGRID_ALLOW_DATE_OVERRIDE = 'true';
    expect(isPuzzleDateOverrideAllowed()).toBe(true);
  });
});
