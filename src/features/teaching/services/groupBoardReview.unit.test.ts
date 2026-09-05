import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
	teachingTutorialClass: { findFirst: vi.fn() },
	teachingGroupBoard: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
	teachingEnrollment: { findMany: vi.fn() },
	teachingGroupAssignment: { findMany: vi.fn() },
	teachingGroup: { deleteMany: vi.fn() },
	teachingGroupAudit: { create: vi.fn() },
	$transaction: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ prisma: db }));

import { configureGroupBoard, getGroupBoard } from './groupBoardService';

const student = { studentCode: '2304050031', familyName: 'Test', givenName: 'Student' };
const group = { id: 'g1', displayOrder: 0, maxSize: null };
const assignment = {
	enrollmentId: 'e1',
	groupId: 'g1',
	slotIndex: 4,
	group,
	enrollment: { learningExperience: 'SUPPORT', student },
};
const board = {
	id: 'b1',
	classId: 'c1',
	tutorialClassId: 't1',
	groupCount: 1,
	groupSize: 5,
	version: 1,
	groups: [group],
	assignments: [assignment],
};

beforeEach(() => {
	vi.resetAllMocks();
	vi.stubEnv('TEACHING_GROUP_BOARD_ENABLED', 'true');
	db.teachingTutorialClass.findFirst.mockResolvedValue({
		id: 't1',
		code: '01',
		name: 'Tutorial 1',
	});
	db.teachingGroupBoard.findUnique.mockResolvedValue(board);
	db.teachingGroupBoard.upsert.mockResolvedValue(board);
	db.teachingEnrollment.findMany.mockResolvedValue([
		{ id: 'e1', learningExperience: 'SUPPORT', student },
	]);
	db.teachingGroupAssignment.findMany.mockResolvedValue([assignment]);
	db.$transaction.mockImplementation((callback: (tx: typeof db) => unknown) => callback(db));
});

describe('Group board review regressions', () => {
	it('masks assigned student codes in public responses', async () => {
		const result = await getGroupBoard('c1', 't1', 'public-class');
		expect(result.groups[0].assignments[0].studentCode).toBe('********31');
	});
	it('keeps full codes for the admin response', async () => {
		const result = await getGroupBoard('c1', 't1');
		expect(result.groups[0].assignments[0].studentCode).toBe(student.studentCode);
	});
	it('allows capacity 2 with one remaining member whose old order is 4', async () => {
		await expect(
			configureGroupBoard('c1', {
				tutorialClassId: 't1',
				groupCount: 1,
				defaultGroupSize: 2,
				expectedVersion: 1,
			}),
		).resolves.toBeDefined();
	});
});
