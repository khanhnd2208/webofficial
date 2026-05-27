import { describe, expect, it } from 'vitest';
import { mapStartErrorMessage } from '@/lib/puzzle/startErrorMessage';

describe('mapStartErrorMessage', () => {
  it('maps schema outdated to Vietnamese', () => {
    expect(
      mapStartErrorMessage('Database schema outdated. Run migrate'),
    ).toMatch(/cập nhật/i);
  });

  it('maps session errors', () => {
    expect(mapStartErrorMessage('Phiên đăng nhập không hợp lệ', 401)).toMatch(/đăng nhập/i);
  });
});
