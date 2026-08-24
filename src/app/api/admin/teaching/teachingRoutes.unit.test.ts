import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApiUser } from '@/lib/apiAuth';
import { createAdminUser, createApiUser } from '@/test/factories/user';
import { invokeRoute, parseJson } from '@/test/helpers/apiRoute';
import { GET as getClassesRoute, POST as postClassesRoute } from './classes/route';
import { GET as getGradebookRoute } from './classes/[classId]/gradebook/route';
import { GET as getAttendanceBoardRoute } from './classes/[classId]/attendance-board/route';
import { POST as setupClassRoute } from './classes/setup/route';
import { PATCH as shareClassRoute } from './classes/[classId]/share/route';
import { PUT as saveParticipationRoute } from './sessions/[sessionId]/participation/route';
import { PUT as saveAttendanceRoute } from './sessions/[sessionId]/attendance/route';
import { POST as startAttendanceRoute } from './sessions/[sessionId]/attendance/start/route';
import { PATCH as lockAttendanceRoute } from './sessions/[sessionId]/attendance/lock/route';
import { PATCH as lockParticipationRoute } from './sessions/[sessionId]/participation/lock/route';
import { PATCH as giftRoute } from './enrollments/[enrollmentId]/gift/route';

const mocks = vi.hoisted(() => ({
	user: null as ApiUser | null,
	listTeachingClasses: vi.fn(),
	createTeachingClass: vi.fn(),
	getGradebook: vi.fn(),
	getAttendanceBoardConfig: vi.fn(),
	setupTeachingClass: vi.fn(),
	shareTeachingClass: vi.fn(),
	saveParticipation: vi.fn(),
	saveAttendance: vi.fn(),
	startAttendance: vi.fn(),
	setAttendanceLifecycle: vi.fn(),
	setParticipationLifecycle: vi.fn(),
	updateGift: vi.fn(),
}));

vi.mock('@/lib/apiAuth', () => ({
	getApiUser: vi.fn(async () => mocks.user),
}));

vi.mock('@/features/teaching', () => ({
	listTeachingClasses: mocks.listTeachingClasses,
	createTeachingClass: mocks.createTeachingClass,
	createTeachingClassSchema: { safeParse: (data: unknown) => ({ success: true, data }) },
	parseWithAppError: (_schema: unknown, data: unknown) => data,
	getGradebook: mocks.getGradebook,
	getAttendanceBoardConfig: mocks.getAttendanceBoardConfig,
	setupTeachingClass: mocks.setupTeachingClass,
	shareTeachingClass: mocks.shareTeachingClass,
	saveParticipation: mocks.saveParticipation,
	saveAttendance: mocks.saveAttendance,
	startAttendance: mocks.startAttendance,
	setAttendanceLifecycle: mocks.setAttendanceLifecycle,
	setParticipationLifecycle: mocks.setParticipationLifecycle,
	updateGift: mocks.updateGift,
	attendanceLockSchema: {},
	participationLockSchema: {},
	giftDeltaSchema: {},
	batchAttendanceSchema: {},
	batchParticipationSchema: {},
	parseJsonWithAppError: async (_schema: unknown, request: Request) => request.json(),
	resolveSessionLifecycleAction: (input: { action?: string; open?: boolean; finalize?: boolean }) =>
		input.action ?? (input.open ? 'open' : input.finalize ? 'finalize' : 'park'),
	teachingClassSetupSchema: { safeParse: (data: unknown) => ({ success: true, data }) },
	shareTeachingClassSchema: { safeParse: (data: unknown) => ({ success: true, data }) },
}));

describe('Teaching admin route contracts', () => {
	beforeEach(() => {
		mocks.user = null;
		mocks.listTeachingClasses.mockReset();
		mocks.createTeachingClass.mockReset();
		mocks.getGradebook.mockReset();
		mocks.getAttendanceBoardConfig.mockReset();
		mocks.setupTeachingClass.mockReset();
		mocks.shareTeachingClass.mockReset();
		mocks.saveParticipation.mockReset();
		mocks.saveAttendance.mockReset();
		mocks.startAttendance.mockReset();
		mocks.setAttendanceLifecycle.mockReset();
		mocks.setParticipationLifecycle.mockReset();
		mocks.updateGift.mockReset();
	});

	it('returns 401 for guests and 403 for signed-in students', async () => {
		const guest = await invokeRoute(getClassesRoute, {
			url: 'http://localhost/api/admin/teaching/classes',
		});
		expect(guest.status).toBe(401);

		mocks.user = createApiUser();
		const student = await invokeRoute(getClassesRoute, {
			url: 'http://localhost/api/admin/teaching/classes',
		});
		expect(student.status).toBe(403);
		expect(mocks.listTeachingClasses).not.toHaveBeenCalled();
	});

	it('lists classes for an admin', async () => {
		mocks.user = createAdminUser();
		mocks.listTeachingClasses.mockResolvedValue([{ id: 'c1', courseCode: '61MGT3HRM' }]);
		const response = await invokeRoute(getClassesRoute, {
			url: 'http://localhost/api/admin/teaching/classes',
		});
		expect(response.status).toBe(200);
		expect(await parseJson(response)).toMatchObject({
			ok: true,
			data: [{ id: 'c1', courseCode: '61MGT3HRM' }],
		});
	});

	it('creates a class for an admin', async () => {
		mocks.user = createAdminUser();
		mocks.createTeachingClass.mockResolvedValue({ id: 'c1', courseCode: '61MGT3HRM' });
		const response = await invokeRoute(postClassesRoute, {
			method: 'POST',
			url: 'http://localhost/api/admin/teaching/classes',
			body: { courseCode: '61MGT3HRM', courseName: 'HRM', groupNo: '39', term: 'HK1 2026-2027' },
		});
		expect(response.status).toBe(201);
		expect(mocks.createTeachingClass).toHaveBeenCalled();
	});

	it('returns a gradebook only for an admin', async () => {
		mocks.user = createAdminUser();
		mocks.getGradebook.mockResolvedValue({ class: { id: 'c1' }, students: [] });
		const response = await invokeRoute(getGradebookRoute, {
			url: 'http://localhost/api/admin/teaching/classes/c1/gradebook',
			params: { classId: 'c1' },
		});
		expect(response.status).toBe(200);
		expect(mocks.getGradebook).toHaveBeenCalledWith('c1');
		expect(await parseJson(response)).toMatchObject({ ok: true, data: { class: { id: 'c1' } } });
	});

	it('returns an attendance board config only for an admin', async () => {
		mocks.user = null;
		const guest = await invokeRoute(getAttendanceBoardRoute, {
			url: 'http://localhost/api/admin/teaching/classes/c1/attendance-board',
			params: { classId: 'c1' },
		});
		expect(guest.status).toBe(401);

		mocks.user = createApiUser();
		const student = await invokeRoute(getAttendanceBoardRoute, {
			url: 'http://localhost/api/admin/teaching/classes/c1/attendance-board',
			params: { classId: 'c1' },
		});
		expect(student.status).toBe(403);

		mocks.user = createAdminUser();
		mocks.getAttendanceBoardConfig.mockResolvedValue({
			class: { id: 'c1' },
			attendanceVisible: false,
		});
		const response = await invokeRoute(getAttendanceBoardRoute, {
			url: 'http://localhost/api/admin/teaching/classes/c1/attendance-board',
			params: { classId: 'c1' },
		});
		expect(response.status).toBe(200);
		expect(mocks.getAttendanceBoardConfig).toHaveBeenCalledWith('c1');
	});

	it('creates a class setup only for an admin', async () => {
		mocks.user = createAdminUser();
		mocks.setupTeachingClass.mockResolvedValue({
			gradebook: { class: { id: 'c1' } },
			createdStudentCount: 1,
		});
		const response = await invokeRoute(setupClassRoute, {
			method: 'POST',
			url: 'http://localhost/api/admin/teaching/classes/setup',
			body: {
				class: { courseCode: 'HRM', courseName: 'HRM', groupNo: '1', term: 'HK1' },
				students: [],
			},
		});
		expect(response.status).toBe(201);
		expect(mocks.setupTeachingClass).toHaveBeenCalled();
	});

	it('shares a class through the unified share endpoint for an admin', async () => {
		mocks.user = createAdminUser();
		mocks.shareTeachingClass.mockResolvedValue({ class: { id: 'c1' }, attendanceVisible: true });
		const response = await invokeRoute(shareClassRoute, {
			method: 'PATCH',
			url: 'http://localhost/api/admin/teaching/classes/c1/share',
			params: { classId: 'c1' },
			body: { shared: true, classRules: 'Mang thẻ sinh viên' },
		});
		expect(response.status).toBe(200);
		expect(mocks.shareTeachingClass).toHaveBeenCalledWith('c1', {
			shared: true,
			classRules: 'Mang thẻ sinh viên',
		});
	});

	it('saves CP through the admin-only participation endpoint', async () => {
		mocks.user = createAdminUser();
		mocks.saveParticipation.mockResolvedValue({ session: { id: 's1' }, students: [], stats: {} });
		const response = await invokeRoute(saveParticipationRoute, {
			method: 'PUT',
			url: 'http://localhost/api/admin/teaching/sessions/s1/participation',
			params: { sessionId: 's1' },
			body: { marks: [{ enrollmentId: 'e1', points: 0.5 }] },
		});
		expect(response.status).toBe(200);
		expect(mocks.saveParticipation).toHaveBeenCalledWith(
			's1',
			{ marks: [{ enrollmentId: 'e1', points: 0.5 }] },
			expect.any(String),
		);
	});

	it('starts attendance only through the admin endpoint', async () => {
		mocks.user = createAdminUser();
		mocks.startAttendance.mockResolvedValue({ session: { id: 's1' }, students: [], stats: {} });
		const response = await invokeRoute(startAttendanceRoute, {
			method: 'POST',
			url: 'http://localhost/api/admin/teaching/sessions/s1/attendance/start',
			params: { sessionId: 's1' },
		});
		expect(response.status).toBe(200);
		expect(mocks.startAttendance).toHaveBeenCalledWith('s1', expect.any(String));
	});

	it('saves attendance only through the admin endpoint', async () => {
		mocks.user = createAdminUser();
		mocks.saveAttendance.mockResolvedValue({
			session: { id: 's1' },
			students: [],
			stats: {},
		});
		const response = await invokeRoute(saveAttendanceRoute, {
			method: 'PUT',
			url: 'http://localhost/api/admin/teaching/sessions/s1/attendance',
			params: { sessionId: 's1' },
			body: { marks: [{ enrollmentId: 'e1', status: 'PRESENT' }] },
		});
		expect(response.status).toBe(200);
		expect(mocks.saveAttendance).toHaveBeenCalledWith(
			's1',
			{ marks: [{ enrollmentId: 'e1', status: 'PRESENT' }] },
			expect.any(String),
		);
	});

	it('opens or locks attendance only through the admin endpoint', async () => {
		mocks.user = createAdminUser();
		mocks.setAttendanceLifecycle.mockResolvedValue({
			session: { id: 's1', attendanceTakenAt: null },
			students: [],
			stats: {},
		});
		const response = await invokeRoute(lockAttendanceRoute, {
			method: 'PATCH',
			url: 'http://localhost/api/admin/teaching/sessions/s1/attendance/lock',
			params: { sessionId: 's1' },
			body: { open: false },
		});
		expect(response.status).toBe(200);
		expect(mocks.setAttendanceLifecycle).toHaveBeenCalledWith(
			's1',
			'park',
			expect.any(String),
			undefined,
		);
	});

	it('opens or locks CP only through the admin endpoint', async () => {
		mocks.user = createAdminUser();
		mocks.setParticipationLifecycle.mockResolvedValue({
			session: { id: 's1', participationTakenAt: null },
			students: [],
			stats: {},
		});
		const response = await invokeRoute(lockParticipationRoute, {
			method: 'PATCH',
			url: 'http://localhost/api/admin/teaching/sessions/s1/participation/lock',
			params: { sessionId: 's1' },
			body: { open: false },
		});
		expect(response.status).toBe(200);
		expect(mocks.setParticipationLifecycle).toHaveBeenCalledWith('s1', 'park', expect.any(String));
	});

	it('updates Gift through the admin endpoint', async () => {
		mocks.user = createAdminUser();
		mocks.updateGift.mockResolvedValue({ student: { enrollmentId: 'e1' }, stats: {} });
		const response = await invokeRoute(giftRoute, {
			method: 'PATCH',
			url: 'http://localhost/api/admin/teaching/enrollments/e1/gift',
			params: { enrollmentId: 'e1' },
			body: { delta: 1 },
		});
		expect(response.status).toBe(200);
		expect(mocks.updateGift).toHaveBeenCalledWith('e1', 1);
	});
});
