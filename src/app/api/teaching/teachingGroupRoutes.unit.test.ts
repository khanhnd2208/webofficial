import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { invokeRoute } from '@/test/helpers/apiRoute';

import { GET as adminGet, PATCH as adminPatch } from '../admin/teaching/classes/[classId]/groups/route';
import { PUT as adminAssignmentPut, DELETE as adminAssignmentDelete } from '../admin/teaching/classes/[classId]/groups/assignments/route';
import { POST as adminClear } from '../admin/teaching/classes/[classId]/groups/clear/route';
import { POST as adminRandomize } from '../admin/teaching/classes/[classId]/groups/randomize/route';
import { GET as publicGet } from './classes/[slug]/groups/route';
import { POST as publicClaim } from './classes/[slug]/groups/claim/route';
import { POST as publicMove } from './classes/[slug]/groups/move/route';
import { POST as publicForget } from './classes/[slug]/groups/forget/route';
import { POST as publicUndo } from './classes/[slug]/groups/undo/route';
import { GET as publicEvents } from './classes/[slug]/groups/events/route';

const mocks = vi.hoisted(() => ({
	groupAssignmentSchema: { pick: vi.fn(() => ({})) },
	groupBoardOpenSchema: {},
	configureGroupBoardSchema: {},
	randomizeGroupBoardSchema: {},
	clearGroupBoardSchema: {},
	groupClaimSchema: {},
	getGroupBoard: vi.fn(),
	configureGroupBoard: vi.fn(),
	setGroupBoardOpen: vi.fn(),
	moveGroupAssignment: vi.fn(),
	clearGroupAssignments: vi.fn(),
	randomizeGroupAssignments: vi.fn(),
	claimGroupViewer: vi.fn(),
	getClassIdBySlug: vi.fn(),
	getGroupViewer: vi.fn(),
	forgetGroupViewer: vi.fn(),
	undoLatestGroupMove: vi.fn(),
	getPublicClassIdBySlug: vi.fn(),
	getGroupBoardVersion: vi.fn(),
	parseWithAppError: vi.fn(),
	parseJsonWithAppError: vi.fn(),
	assertScopedRateLimit: vi.fn(),
}));

vi.mock('@/lib/apiAuth', () => ({
	getApiUser: vi.fn(),
}));

vi.mock('@/lib/inquiryRateLimit', () => ({
	assertScopedRateLimit: mocks.assertScopedRateLimit,
}));

vi.mock('@/features/teaching', () => ({
	...mocks,
}));

describe('Teaching group routes while hidden', () => {
	beforeEach(() => {
		vi.stubEnv('TEACHING_GROUP_BOARD_ENABLED', 'false');
		for (const mock of Object.values(mocks)) {
			if (typeof mock === 'function') (mock as unknown as { mockReset: () => void }).mockReset();
		}
	});

	it.each([
		['admin GET', () => invokeRoute(adminGet, { url: 'http://localhost/api/admin/teaching/classes/c1/groups', params: { classId: 'c1' } })],
		['admin PATCH', () => invokeRoute(adminPatch, { method: 'PATCH', url: 'http://localhost/api/admin/teaching/classes/c1/groups', params: { classId: 'c1' }, body: { open: true } })],
		['admin assignment PUT', () => invokeRoute(adminAssignmentPut, { method: 'PUT', url: 'http://localhost/api/admin/teaching/classes/c1/groups/assignments', params: { classId: 'c1' }, body: {} })],
		['admin assignment DELETE', () => invokeRoute(adminAssignmentDelete, { method: 'DELETE', url: 'http://localhost/api/admin/teaching/classes/c1/groups/assignments', params: { classId: 'c1' }, body: {} })],
		['admin clear', () => invokeRoute(adminClear, { method: 'POST', url: 'http://localhost/api/admin/teaching/classes/c1/groups/clear', params: { classId: 'c1' }, body: {} })],
		['admin randomize', () => invokeRoute(adminRandomize, { method: 'POST', url: 'http://localhost/api/admin/teaching/classes/c1/groups/randomize', params: { classId: 'c1' }, body: {} })],
		['public GET', () => invokeRoute(publicGet, { url: 'http://localhost/api/teaching/classes/c1/groups', params: { slug: 'c1' } })],
		['public claim', () => invokeRoute(publicClaim, { method: 'POST', url: 'http://localhost/api/teaching/classes/c1/groups/claim', params: { slug: 'c1' }, body: {} })],
		['public move', () => invokeRoute(publicMove, { method: 'POST', url: 'http://localhost/api/teaching/classes/c1/groups/move', params: { slug: 'c1' }, body: {} })],
		['public forget', () => invokeRoute(publicForget, { method: 'POST', url: 'http://localhost/api/teaching/classes/c1/groups/forget', params: { slug: 'c1' } })],
		['public undo', () => invokeRoute(publicUndo, { method: 'POST', url: 'http://localhost/api/teaching/classes/c1/groups/undo', params: { slug: 'c1' } })],
		['public events', () => publicEvents(new NextRequest('http://localhost/api/teaching/classes/c1/groups/events'), { params: Promise.resolve({ slug: 'c1' }) })],
	] as const)('%s returns 404 before any group work', async (_name, invoke) => {
		const response = await invoke();

		expect(response.status).toBe(404);
		expect(mocks.assertScopedRateLimit).not.toHaveBeenCalled();
		expect(mocks.getGroupBoard).not.toHaveBeenCalled();
		expect(mocks.configureGroupBoard).not.toHaveBeenCalled();
		expect(mocks.setGroupBoardOpen).not.toHaveBeenCalled();
		expect(mocks.moveGroupAssignment).not.toHaveBeenCalled();
		expect(mocks.clearGroupAssignments).not.toHaveBeenCalled();
		expect(mocks.randomizeGroupAssignments).not.toHaveBeenCalled();
		expect(mocks.claimGroupViewer).not.toHaveBeenCalled();
		expect(mocks.getGroupViewer).not.toHaveBeenCalled();
		expect(mocks.forgetGroupViewer).not.toHaveBeenCalled();
		expect(mocks.undoLatestGroupMove).not.toHaveBeenCalled();
		expect(mocks.getPublicClassIdBySlug).not.toHaveBeenCalled();
		expect(mocks.getGroupBoardVersion).not.toHaveBeenCalled();
	});
});
