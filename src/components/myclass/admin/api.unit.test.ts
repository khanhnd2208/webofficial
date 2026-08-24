import { describe, expect, it } from 'vitest';

import { unwrapList } from './api';

describe('unwrapList', () => {
	it('accepts both legacy arrays and paginated envelopes', () => {
		expect(unwrapList([{ id: '1' }])).toEqual([{ id: '1' }]);
		expect(unwrapList({ items: [{ id: '2' }] })).toEqual([{ id: '2' }]);
		expect(unwrapList(null)).toEqual([]);
		expect(unwrapList({ items: undefined as unknown as never[] })).toEqual([]);
	});
});
