import { describe, expect, it } from 'vitest';

import {
	clearGroupBoardSchema,
	configureGroupBoardSchema,
	groupClaimSchema,
	randomizeGroupBoardSchema,
	resolveSessionLifecycleAction,
} from '../schemas';

describe('groupClaimSchema', () => {
	it('only requires a roster enrollment selection', () => {
		expect(groupClaimSchema.safeParse({ enrollmentId: 'enrollment-1' }).success).toBe(true);
	});

	it('rejects a missing enrollment id and extra identity fields', () => {
		expect(groupClaimSchema.safeParse({}).success).toBe(false);
		expect(
			groupClaimSchema.safeParse({ enrollmentId: 'enrollment-1', passcode: '29052006' }).success,
		).toBe(false);
		expect(
			groupClaimSchema.safeParse({ enrollmentId: 'enrollment-1', studentCode: 'SV01' }).success,
		).toBe(false);
	});
});

describe('configureGroupBoardSchema', () => {
	it('requires tutorial scope and default capacity', () => {
		expect(
			configureGroupBoardSchema.safeParse({
				tutorialClassId: 'tut-1',
				groupCount: 2,
				defaultGroupSize: 4,
			}).success,
		).toBe(true);
	});

	it('rejects the removed group rename payload', () => {
		expect(
			configureGroupBoardSchema.safeParse({
				tutorialClassId: 'tut-1',
				groupCount: 2,
				defaultGroupSize: 4,
				names: { 'group-1': 'Alpha' },
			}).success,
		).toBe(false);
	});
});

describe('randomize and clear group board schemas', () => {
	it('accepts a preview request and a commit payload', () => {
		expect(randomizeGroupBoardSchema.safeParse({ expectedVersion: 3 }).success).toBe(true);
		expect(
			randomizeGroupBoardSchema.safeParse({
				expectedVersion: 3,
				seed: 12,
				placements: [{ enrollmentId: 'e1', groupId: 'g1', slotIndex: 0 }],
			}).success,
		).toBe(true);
		expect(randomizeGroupBoardSchema.safeParse({ placements: 'nope' }).success).toBe(false);
	});

	it('accepts an optional expected version when clearing', () => {
		expect(clearGroupBoardSchema.safeParse({}).success).toBe(true);
		expect(clearGroupBoardSchema.safeParse({ expectedVersion: 2 }).success).toBe(true);
		expect(clearGroupBoardSchema.safeParse({ expectedVersion: -1 }).success).toBe(false);
	});
});

describe('resolveSessionLifecycleAction', () => {
	it('prefers an explicit action and maps legacy open flags', () => {
		expect(resolveSessionLifecycleAction({ action: 'finalize' })).toBe('finalize');
		expect(resolveSessionLifecycleAction({ open: true })).toBe('open');
		expect(resolveSessionLifecycleAction({ open: false, finalize: true })).toBe('finalize');
		expect(resolveSessionLifecycleAction({ open: false })).toBe('park');
	});
});
