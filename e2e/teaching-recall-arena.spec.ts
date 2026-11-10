import { expect, test, type APIResponse } from '@playwright/test';

import { addAdminSession } from './helpers/adminSession';
import { cleanupTeachingClass } from './helpers/teachingCleanup';

async function data<T>(response: APIResponse): Promise<T> {
	expect(response.ok(), await response.text()).toBeTruthy();
	return (await response.json()).data as T;
}

type Gradebook = {
	sessions: Array<{ id: string; weekNumber: number; tutorialClassId: string }>;
	students: Array<{
		enrollmentId: string;
		givenName: string;
		participation: Record<string, { points: number }>;
	}>;
};

test.describe('Recall arena (Kiểm tra bài cũ)', () => {
	test('calls only students in the room and saves a correct answer as CP', async ({
		page,
		context,
	}) => {
		page.setDefaultTimeout(20_000);
		await addAdminSession(context);
		const suffix = `${Date.now()}${test.info().workerIndex}`;
		const klass = await data<{ id: string }>(
			await page.request.post('/api/admin/teaching/classes', {
				data: {
					courseCode: `RA${suffix.slice(-8)}`,
					courseName: 'Recall arena fixture',
					groupNo: '01',
					term: suffix,
					totalWeeks: 2,
				},
			}),
		);
		const base = `/api/admin/teaching/classes/${klass.id}`;
		try {
			const [tutorial] = await data<Array<{ id: string }>>(
				await page.request.get(`${base}/tutorials`),
			);
			for (const [index, givenName] of ['An', 'Bình', 'Chi'].entries()) {
				await data(
					await page.request.post(`${base}/enrollments`, {
						data: {
							studentCode: `${suffix.slice(-8)}${index}9`,
							familyName: 'Kiểm thử',
							givenName,
							tutorialClassId: tutorial!.id,
						},
					}),
				);
			}
			const before = await data<Gradebook>(await page.request.get(`${base}/gradebook`));
			const week1 = before.sessions.find(
				(session) => session.weekNumber === 1 && session.tutorialClassId === tutorial!.id,
			)!;
			const byName = new Map(before.students.map((student) => [student.givenName, student]));
			await data(
				await page.request.patch(`/api/admin/teaching/sessions/${week1.id}/attendance/lock`, {
					data: { action: 'open' },
				}),
			);
			await data(
				await page.request.put(`/api/admin/teaching/sessions/${week1.id}/attendance`, {
					data: {
						marks: [
							{ enrollmentId: byName.get('An')!.enrollmentId, status: 'PRESENT' },
							{ enrollmentId: byName.get('Bình')!.enrollmentId, status: 'LATE' },
							{ enrollmentId: byName.get('Chi')!.enrollmentId, status: 'ABSENT_UNEXCUSED' },
						],
					},
				}),
			);

			await page.goto(`/my-space/teaching/${klass.id}`);
			const entry = page.getByRole('link', { name: 'Kiểm tra bài cũ' });
			await expect(entry).toHaveAttribute('href', `/my-space/teaching/${klass.id}/arena`);
			await expect(entry).toHaveAttribute('target', '_blank');

			await page.goto(`/my-space/teaching/${klass.id}/arena`);
			const setup = page.getByRole('dialog', { name: 'Thiết lập kiểm tra bài cũ' });
			await expect(setup.getByText('2 bạn có mặt')).toBeVisible();
			await setup.getByRole('button', { name: 'Mở chấm CP tuần 1' }).click();
			await expect(setup.getByText(/CP tuần 1 đang mở/)).toBeVisible();
			await setup.getByRole('button', { name: 'Vào trận' }).click();

			const players = page.getByTestId('arena-player');
			await expect(players).toHaveCount(2);
			await expect(players.filter({ hasText: 'Chi' })).toHaveCount(0);

			await page.keyboard.press('Space');
			const caught = page.getByRole('dialog', { name: /Kiểm thử (An|Bình)/ });
			await expect(caught).toBeVisible();
			const caughtName = (await caught.getByRole('heading').textContent())!.replace(
				'Kiểm thử ',
				'',
			);
			await caught.getByRole('button', { name: /Đạt \+1/ }).click();
			await expect(page.getByRole('status')).toContainText(`${caughtName}: CP 0 → 1`);
			await expect(page.getByLabel('Máu quái vật 9/10')).toBeVisible();

			const after = await data<Gradebook>(await page.request.get(`${base}/gradebook`));
			const graded = after.students.find((student) => student.givenName === caughtName)!;
			expect(graded.participation[week1.id]?.points).toBe(1);
		} finally {
			await cleanupTeachingClass(page.request, klass.id);
		}
	});
});
