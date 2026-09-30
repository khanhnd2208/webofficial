import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApiUser } from '@/lib/apiAuth';
import { createAdminUser, createApiUser } from '@/test/factories/user';
import { invokeRoute, parseJson } from '@/test/helpers/apiRoute';
import { GET as getAuthoringCourseRoute } from './courses/[courseSlug]/route';
import { GET as getPublicCourseRoute } from '@/app/api/my-class/courses/[courseSlug]/route';

const mocks = vi.hoisted(() => ({
	user: null as ApiUser | null,
	getAuthoringCourse: vi.fn(),
	getCourse: vi.fn(),
}));

vi.mock('@/lib/apiAuth', () => ({
	getApiUser: vi.fn(async () => mocks.user),
}));

vi.mock('@/features/my-class', () => ({
	getAuthoringCourse: mocks.getAuthoringCourse,
	getCourse: mocks.getCourse,
}));

describe('My Class authoring route contracts', () => {
	beforeEach(() => {
		mocks.user = null;
		mocks.getAuthoringCourse.mockReset();
		mocks.getCourse.mockReset();
	});

	it('returns 401 for guests and 403 for signed-in students', async () => {
		const guest = await invokeRoute(getAuthoringCourseRoute, {
			url: 'http://localhost/api/admin/my-class/authoring/courses/course-1',
			params: { courseSlug: 'course-1' },
		});
		expect(guest.status).toBe(401);

		mocks.user = createApiUser();
		const student = await invokeRoute(getAuthoringCourseRoute, {
			url: 'http://localhost/api/admin/my-class/authoring/courses/course-1',
			params: { courseSlug: 'course-1' },
		});
		expect(student.status).toBe(403);
		expect(mocks.getAuthoringCourse).not.toHaveBeenCalled();
	});

	it('returns authoring data only for an admin', async () => {
		mocks.user = createAdminUser();
		mocks.getAuthoringCourse.mockResolvedValue({
			slug: 'course-1',
			authoring: { status: 'DRAFT' },
		});

		const response = await invokeRoute(getAuthoringCourseRoute, {
			url: 'http://localhost/api/admin/my-class/authoring/courses/course-1',
			params: { courseSlug: 'course-1' },
		});

		expect(response.status).toBe(200);
		expect(mocks.getAuthoringCourse).toHaveBeenCalledWith('course-1', 'admin');
		expect(await parseJson(response)).toMatchObject({
			ok: true,
			data: { slug: 'course-1', authoring: { status: 'DRAFT' } },
		});
	});

	it('ignores preview and edit query flags on the public course route', async () => {
		mocks.getCourse.mockResolvedValue({ slug: 'course-1', title: 'Published title' });

		const response = await invokeRoute(getPublicCourseRoute, {
			url: 'http://localhost/api/my-class/courses/course-1?preview=1&edit=1',
			params: { courseSlug: 'course-1' },
		});

		expect(response.status).toBe(200);
		expect(mocks.getCourse).toHaveBeenCalledWith('course-1');
		expect(mocks.getAuthoringCourse).not.toHaveBeenCalled();
		expect(await parseJson(response)).toMatchObject({
			ok: true,
			data: { title: 'Published title' },
		});
	});
});
