import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeRoute } from '@/test/helpers/apiRoute';
import { POST as claimRoute } from './classes/[slug]/groups/claim/route';
import { POST as moveRoute } from './classes/[slug]/groups/move/route';
import { POST as loginLearningExperienceRoute } from './classes/[slug]/learning-experience/route';
import { PUT as saveLearningExperienceRoute } from './classes/[slug]/learning-experience/route';

const mocks = vi.hoisted(() => ({
	getGroupViewer: vi.fn(),
	getClassIdBySlug: vi.fn(),
	getGroupBoard: vi.fn(),
	moveGroupAssignment: vi.fn(),
	claimGroupViewer: vi.fn(),
	getLearningExperienceViewerEnrollmentId: vi.fn(),
	loginToLearningExperience: vi.fn(),
	saveLearningExperienceChoice: vi.fn(),
	assertScopedRateLimit: vi.fn(),
}));

vi.mock('@/lib/apiAuth', () => ({
	getApiUser: vi.fn(async () => null),
}));

vi.mock('@/lib/inquiryRateLimit', () => ({
	assertScopedRateLimit: mocks.assertScopedRateLimit,
}));

vi.mock('@/features/teaching', () => ({
	getGroupViewer: mocks.getGroupViewer,
	getClassIdBySlug: mocks.getClassIdBySlug,
	getGroupBoard: mocks.getGroupBoard,
	moveGroupAssignment: mocks.moveGroupAssignment,
	claimGroupViewer: mocks.claimGroupViewer,
	getLearningExperienceViewerEnrollmentId: mocks.getLearningExperienceViewerEnrollmentId,
	loginToLearningExperience: mocks.loginToLearningExperience,
	saveLearningExperienceChoice: mocks.saveLearningExperienceChoice,
	groupAssignmentSchema: { pick: () => ({}) },
	groupClaimSchema: {},
	learningExperienceChoiceSchema: {},
	learningExperienceLoginSchema: {},
	parseWithAppError: (_schema: unknown, data: unknown) => data,
}));

describe('Teaching public group routes', () => {
	beforeEach(() => {
		vi.stubEnv('TEACHING_GROUP_BOARD_ENABLED', 'true');
		mocks.getGroupViewer.mockReset();
		mocks.getClassIdBySlug.mockReset();
		mocks.getGroupBoard.mockReset();
		mocks.moveGroupAssignment.mockReset();
		mocks.claimGroupViewer.mockReset();
		mocks.getLearningExperienceViewerEnrollmentId.mockReset();
		mocks.loginToLearningExperience.mockReset();
		mocks.saveLearningExperienceChoice.mockReset();
		mocks.assertScopedRateLimit.mockReset();
		mocks.assertScopedRateLimit.mockResolvedValue(undefined);
	});

	it('allows an open Learning Experience login without a password', async () => {
		mocks.loginToLearningExperience.mockResolvedValue({
			authenticated: true,
			accessMode: 'OPEN',
		});

		const response = await invokeRoute(loginLearningExperienceRoute, {
			method: 'POST',
			url: 'http://localhost/api/teaching/classes/hrm/learning-experience',
			params: { slug: 'hrm' },
			body: { enrollmentId: 'enrollment-open' },
		});

		expect(response.status).toBe(200);
		expect(mocks.assertScopedRateLimit).toHaveBeenCalledWith(
			expect.anything(),
			'teaching-learning-experience-login:hrm:enrollment-open',
			10,
			5 * 60 * 1000,
		);
		expect(mocks.loginToLearningExperience).toHaveBeenCalledWith('hrm', {
			enrollmentId: 'enrollment-open',
		});
	});

	it('scopes Learning Experience choice limits to the signed enrollment identity', async () => {
		mocks.getLearningExperienceViewerEnrollmentId.mockResolvedValue('enrollment-42');
		mocks.saveLearningExperienceChoice.mockResolvedValue({
			authenticated: true,
			choice: 'CHALLENGE',
		});

		const response = await invokeRoute(saveLearningExperienceRoute, {
			method: 'PUT',
			url: 'http://localhost/api/teaching/classes/hrm/learning-experience',
			params: { slug: 'hrm' },
			body: { choice: 'CHALLENGE' },
		});

		expect(response.status).toBe(200);
		expect(mocks.assertScopedRateLimit).toHaveBeenCalledWith(
			expect.anything(),
			'teaching-learning-experience-choice:hrm:enrollment-42',
			10,
			5 * 60 * 1000,
		);
		expect(mocks.saveLearningExperienceChoice).toHaveBeenCalledWith('hrm', {
			choice: 'CHALLENGE',
		});
	});

	it('rejects student group moves', async () => {
		mocks.getGroupViewer.mockResolvedValue(null);
		const response = await invokeRoute(moveRoute, {
			method: 'POST',
			url: 'http://localhost/api/teaching/classes/hrm/groups/move',
			params: { slug: 'hrm' },
			body: { groupId: 'g1', slotIndex: 0 },
		});
		expect(response.status).toBe(403);
		expect(mocks.moveGroupAssignment).not.toHaveBeenCalled();
	});

	it('rejects student claims through the public endpoint', async () => {
		mocks.claimGroupViewer.mockResolvedValue({ slug: 'hrm', viewerEnrollmentId: 'e1' });
		const response = await invokeRoute(claimRoute, {
			method: 'POST',
			url: 'http://localhost/api/teaching/classes/hrm/groups/claim',
			params: { slug: 'hrm' },
			body: { enrollmentId: 'e1' },
		});
		expect(response.status).toBe(403);
		expect(mocks.claimGroupViewer).not.toHaveBeenCalled();
	});

	it('hides every public group operation when the feature is disabled', async () => {
		vi.stubEnv('TEACHING_GROUP_BOARD_ENABLED', 'false');
		const response = await invokeRoute(claimRoute, {
			method: 'POST',
			url: 'http://localhost/api/teaching/classes/hrm/groups/claim',
			params: { slug: 'hrm' },
			body: { enrollmentId: 'e1' },
		});
		expect(response.status).toBe(404);
		expect(mocks.claimGroupViewer).not.toHaveBeenCalled();
		expect(mocks.assertScopedRateLimit).not.toHaveBeenCalled();
	});
});
