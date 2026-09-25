import { describe, expect, it } from 'vitest';

import { reconcileRoleDraft } from '@/features/werewolf/lib/roleDraft';

describe('reconcileRoleDraft', () => {
	it('keeps the host draft while a save is still pending', () => {
		expect(
			reconcileRoleDraft({
				dirty: true,
				holdKey: null,
				seenServer: 'old',
				serverKey: 'old',
			}),
		).toBe('ignore');
	});

	it('ignores a stale poll after the save has been sent', () => {
		expect(
			reconcileRoleDraft({
				dirty: false,
				holdKey: 'saved',
				seenServer: 'old',
				serverKey: 'old',
			}),
		).toBe('ignore');
	});

	it('adopts the server deck only when nothing local is waiting', () => {
		expect(
			reconcileRoleDraft({
				dirty: false,
				holdKey: null,
				seenServer: 'old',
				serverKey: 'server',
			}),
		).toBe('adopt');
	});

	it('clears the hold once the server echoes the saved deck', () => {
		expect(
			reconcileRoleDraft({
				dirty: false,
				holdKey: 'saved',
				seenServer: 'old',
				serverKey: 'saved',
			}),
		).toBe('caught-up');
	});
});
