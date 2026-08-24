import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	updateMany: vi.fn(),
	transaction: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
	prisma: {
		teachingStudent: { updateMany: mocks.updateMany },
		$transaction: mocks.transaction,
	},
}));

import { backfillStudentMissingFields } from './teachingRepository';

const dob = new Date('2006-05-29T00:00:00.000Z');

describe('backfillStudentMissingFields', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.updateMany.mockImplementation(async () => ({ count: 1 }));
		mocks.transaction.mockImplementation(async (operations: Array<Promise<{ count: number }>>) =>
			Promise.all(operations),
		);
	});

	it('fills only missing fields and never stages empty incoming values', async () => {
		await expect(
			backfillStudentMissingFields(
				{
					id: 'student-1',
					familyName: 'Tên tốt',
					givenName: 'An',
					dateOfBirth: null,
					homeClassCode: 'K66A',
					majorName: 'Ngành tốt',
					phone: null,
					email: null,
				},
				{
					familyName: '',
					givenName: 'Tên mới không được ghi đè',
					dateOfBirth: dob,
					homeClassCode: '',
					majorName: '',
					phone: '0901234567',
					email: '',
				},
			),
		).resolves.toBe(true);

		expect(mocks.updateMany).toHaveBeenCalledTimes(2);
		expect(mocks.updateMany).toHaveBeenCalledWith({
			where: { id: 'student-1', dateOfBirth: null },
			data: { dateOfBirth: dob },
		});
		expect(mocks.updateMany).toHaveBeenCalledWith({
			where: { id: 'student-1', phone: null },
			data: { phone: '0901234567' },
		});
	});

	it('reports no update when a concurrent compare-and-set loses the race', async () => {
		mocks.updateMany.mockResolvedValue({ count: 0 });

		await expect(
			backfillStudentMissingFields(
				{
					id: 'student-1',
					familyName: 'Nguyễn',
					givenName: 'An',
					dateOfBirth: null,
					homeClassCode: 'K66A',
					majorName: 'HRM',
					phone: '0900000000',
					email: 'student@example.edu',
				},
				{
					familyName: 'Nguyễn',
					givenName: 'An',
					dateOfBirth: dob,
					homeClassCode: 'K66A',
					majorName: 'HRM',
					phone: '0900000000',
					email: 'student@example.edu',
				},
			),
		).resolves.toBe(false);
	});
});
