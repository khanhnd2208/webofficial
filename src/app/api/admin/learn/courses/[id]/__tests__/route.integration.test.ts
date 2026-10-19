import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { listPublishedCoursePreviews } from '@/features/learn/publicCatalog';
import { prisma } from '@/lib/prisma';
import { invokeRoute, parseJson } from '@/test/helpers/apiRoute';

const session = vi.hoisted(() => ({
	current: null as null | {
		user: { id: string; email: string; name: string; role: string };
	},
}));

vi.mock('@/lib/auth', () => ({
	auth: vi.fn(async () => session.current),
}));

import { PATCH } from '../route';

describe('PATCH /api/admin/learn/courses/[id] thumbnail', () => {
	const ids: string[] = [];

	afterEach(async () => {
		session.current = null;
		await prisma.learnCourse.deleteMany({ where: { id: { in: ids.splice(0) } } });
	});

	function asUser(role: 'admin' | 'student') {
		session.current = {
			user: { id: `${role}-1`, email: `${role}@example.com`, name: role, role },
		};
	}

	async function createCourse() {
		const row = await prisma.learnCourse.create({
			data: { slug: `thumb-${randomUUID()}`, title: 'Ảnh bìa', status: 'DRAFT' },
		});
		ids.push(row.id);
		return row;
	}

	function patch(id: string, body: unknown) {
		return invokeRoute(PATCH, {
			method: 'PATCH',
			url: `http://localhost/api/admin/learn/courses/${id}`,
			body,
			params: { id },
		});
	}

	it('rejects anyone who is not an admin', async () => {
		const course = await createCourse();
		const anonymous = await patch(course.id, { thumbnailUrl: '/uploads/cover.webp' });
		expect(anonymous.status).toBe(401);

		asUser('student');
		const student = await patch(course.id, { thumbnailUrl: '/uploads/cover.webp' });
		expect(student.status).toBe(403);
		expect(
			(await prisma.learnCourse.findUnique({ where: { id: course.id } }))?.thumbnailUrl,
		).toBeNull();
	});

	it('saves a same-site cover, keeps it when omitted, and clears it with null', async () => {
		asUser('admin');
		const course = await createCourse();
		const saved = await patch(course.id, {
			thumbnailUrl: 'https://www.toiladuykhanh.com/uploads/cover.webp',
		});
		expect(saved.status).toBe(200);
		const savedJson = await parseJson<{ ok: boolean; data: { thumbnailUrl: string | null } }>(
			saved,
		);
		expect(savedJson.data.thumbnailUrl).toBe('/uploads/cover.webp');

		const kept = await patch(course.id, { title: 'Ảnh bìa đã sửa' });
		expect(kept.status).toBe(200);
		expect((await prisma.learnCourse.findUnique({ where: { id: course.id } }))?.thumbnailUrl).toBe(
			'/uploads/cover.webp',
		);

		const rejected = await patch(course.id, { thumbnailUrl: 'https://evil.test/a.png' });
		expect(rejected.status).toBe(400);
		expect((await prisma.learnCourse.findUnique({ where: { id: course.id } }))?.thumbnailUrl).toBe(
			'/uploads/cover.webp',
		);

		const cleared = await patch(course.id, { thumbnailUrl: null });
		expect(cleared.status).toBe(200);
		expect(
			(await prisma.learnCourse.findUnique({ where: { id: course.id } }))?.thumbnailUrl,
		).toBeNull();
	});

	it('returns the saved cover only for published courses', async () => {
		asUser('admin');
		const course = await createCourse();
		await patch(course.id, { thumbnailUrl: '/uploads/cover.webp' });
		expect((await listPublishedCoursePreviews()).some((item) => item.slug === course.slug)).toBe(
			false,
		);

		await patch(course.id, { status: 'PUBLISHED' });
		const published = (await listPublishedCoursePreviews()).find(
			(item) => item.slug === course.slug,
		);
		expect(published).toMatchObject({ thumbnailUrl: '/uploads/cover.webp', title: 'Ảnh bìa' });
		expect(published).not.toHaveProperty('lessons');
	});
});
