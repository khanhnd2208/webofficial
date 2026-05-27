import { describe, expect, it } from 'vitest';
import { deterministicShuffle } from '@/lib/puzzle/seedShuffle';

describe('deterministicShuffle', () => {
  it('is reproducible for same seedKey', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    expect(deterministicShuffle(items, '2026-05-25')).toEqual(
      deterministicShuffle(items, '2026-05-25'),
    );
  });

  it('differs for different seedKey', () => {
    const items = ['0,0', '0,1', '0,2', '1,0', '1,1', '2,2'];
    const a = deterministicShuffle(items, '2026-05-19');
    const b = deterministicShuffle(items, '2026-05-25');
    expect(a).not.toEqual(b);
  });
});
