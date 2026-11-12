import { expect, test, type APIResponse } from '@playwright/test';

import { addAdminSession } from './helpers/adminSession';
import { cleanupTeachingClass } from './helpers/teachingCleanup';

async function data<T>(response: APIResponse): Promise<T> {
	expect(response.ok(), await response.text()).toBeTruthy();
	return (await response.json()).data as T;
}

type Gradebook = {
	class: { courseId: string };
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

			const courseArena = `/my-space/teaching/courses/${before.class.courseId}/arena`;
			await page.goto(`/my-space/teaching/courses/${before.class.courseId}`);
			const courseEntry = page.getByRole('link', { name: 'Kiểm tra bài cũ' });
			await expect(courseEntry).toHaveAttribute('href', courseArena);
			await expect(courseEntry).toHaveAttribute('target', '_blank');

			await page.goto(`/my-space/teaching/${klass.id}`);
			const entry = page.getByRole('link', { name: 'Kiểm tra bài cũ' });
			await expect(entry).toHaveAttribute('href', `${courseArena}?class=${klass.id}`);

			// Old per-class links land on the course arena with that class ticked.
			await page.goto(`/my-space/teaching/${klass.id}/arena`);
			await expect(page).toHaveURL(new RegExp(`${courseArena}\\?class=${klass.id}$`));
			const setup = page.getByRole('dialog', { name: 'Thiết lập kiểm tra bài cũ' });
			await expect(setup.getByRole('checkbox', { name: /^Lớp 01/ })).toBeChecked();
			await expect(setup.getByText('2 bạn có mặt')).toBeVisible();
			await setup.getByRole('button', { name: 'Mở chấm CP tuần 1' }).click();
			await expect(setup.getByText(/CP tuần 1 đang mở/)).toBeVisible();
			await setup.getByRole('button', { name: 'Tiếp' }).click();
			await expect(setup.getByText('2 bạn trong trận')).toBeVisible();
			await setup.getByRole('button', { name: 'Tiếp' }).click();
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

	test('adds a make-up student from another class and mixes several lessons', async ({
		page,
		context,
	}) => {
		page.setDefaultTimeout(20_000);
		await addAdminSession(context);
		const suffix = `${Date.now()}${test.info().workerIndex}`;
		const courseCode = `RB${suffix.slice(-8)}`;
		const classIds: string[] = [];
		const createClass = async (groupNo: string) => {
			const created = await data<{ id: string }>(
				await page.request.post('/api/admin/teaching/classes', {
					data: {
						courseCode,
						courseName: 'Recall arena course',
						groupNo,
						term: suffix,
						totalWeeks: 2,
					},
				}),
			);
			classIds.push(created.id);
			return created.id;
		};
		let courseId = '';
		const deckIds: string[] = [];
		try {
			const host = await createClass('01');
			const home = await createClass('02');
			const enroll = async (classId: string, givenName: string, code: string) => {
				const [tutorial] = await data<Array<{ id: string }>>(
					await page.request.get(`/api/admin/teaching/classes/${classId}/tutorials`),
				);
				await data(
					await page.request.post(`/api/admin/teaching/classes/${classId}/enrollments`, {
						data: {
							studentCode: `${suffix.slice(-8)}${code}`,
							familyName: 'Học bù',
							givenName,
							tutorialClassId: tutorial!.id,
						},
					}),
				);
			};
			await enroll(host, 'An', '11');
			await enroll(home, 'Giang', '21');
			const hostBook = await data<Gradebook>(
				await page.request.get(`/api/admin/teaching/classes/${host}/gradebook`),
			);
			const homeBook = await data<Gradebook>(
				await page.request.get(`/api/admin/teaching/classes/${home}/gradebook`),
			);
			courseId = hostBook.class.courseId;
			expect(homeBook.class.courseId).toBe(courseId);
			const hostWeek1 = hostBook.sessions.find((session) => session.weekNumber === 1)!;
			const homeWeek1 = homeBook.sessions.find((session) => session.weekNumber === 1)!;
			await data(
				await page.request.patch(`/api/admin/teaching/sessions/${hostWeek1.id}/attendance/lock`, {
					data: { action: 'open' },
				}),
			);
			await data(
				await page.request.put(`/api/admin/teaching/sessions/${hostWeek1.id}/attendance`, {
					data: {
						marks: [{ enrollmentId: hostBook.students[0]!.enrollmentId, status: 'PRESENT' }],
					},
				}),
			);
			for (const [lesson, question] of [
				['Bài 1', 'Câu bài một'],
				['Bài 2', 'Câu bài hai'],
			]) {
				const deck = await data<{ id: string }>(
					await page.request.post(`/api/admin/teaching/courses/${courseId}/recall`, {
						data: {
							title: `${lesson} deck`,
							lessonLabel: lesson,
							cards: [{ question: `<p>${question}</p>`, answer: '<p>Đáp án</p>' }],
						},
					}),
				);
				deckIds.push(deck.id);
			}

			await page.goto(`/my-space/teaching/courses/${courseId}/arena?class=${host}`);
			const setup = page.getByRole('dialog', { name: 'Thiết lập kiểm tra bài cũ' });
			await expect(setup.getByRole('checkbox', { name: /^Lớp 01/ })).toBeChecked();
			await expect(setup.getByRole('checkbox', { name: /^Lớp 02/ })).not.toBeChecked();
			await setup.getByRole('button', { name: 'Mở chấm CP tuần 1' }).click();
			await expect(setup.getByText(/CP tuần 1 đang mở/)).toBeVisible();
			await setup.getByRole('button', { name: 'Tiếp' }).click();

			await setup.getByRole('searchbox').fill('giang');
			await setup.getByRole('button', { name: /Học bù Giang/ }).click();
			await expect(setup.getByText(/Học bù · CP ghi vào lớp 02, tuần 1/)).toBeVisible();
			await setup.getByRole('button', { name: 'Mở chấm CP tuần 1' }).click();
			await setup.getByRole('checkbox', { name: /Học bù An/ }).uncheck();
			await expect(setup.getByText('1 bạn trong trận')).toBeVisible();
			await setup.getByRole('button', { name: 'Tiếp' }).click();

			await setup.getByRole('button', { name: 'Chọn tất cả' }).click();
			await expect(setup.getByText('Hỏi trộn 2 bài · 2 câu')).toBeVisible();
			await setup.getByRole('button', { name: 'Tiếp' }).click();

			// The cast step: every catalogue hero has art, and a chosen boss takes the stage.
			await expect(setup.getByText(/Nhân vật của sinh viên · (\d+)\/\1$/)).toBeVisible();
			await setup.getByRole('tab', { name: /^Boss/ }).click();
			await setup.getByRole('button', { name: 'Rồng Ngủ Gật' }).click();
			await setup.getByRole('button', { name: 'Vào trận' }).click();
			await expect(page.getByText('Boss 1 · Rồng Ngủ Gật')).toBeVisible();

			await expect(page.getByTestId('arena-player')).toHaveCount(1);
			await page.keyboard.press('Space');
			const caught = page.getByRole('dialog', { name: 'Học bù Giang' });
			await expect(caught).toBeVisible();
			await expect(caught.getByText(/Câu bài (một|hai)/)).toBeVisible();
			await caught.getByRole('button', { name: /Đạt \+1/ }).click();
			await expect(page.getByRole('status')).toContainText('Giang: CP 0 → 1');

			const after = await data<Gradebook>(
				await page.request.get(`/api/admin/teaching/classes/${home}/gradebook`),
			);
			expect(after.students[0]!.participation[homeWeek1.id]?.points).toBe(1);
		} finally {
			for (const deckId of deckIds) {
				await page.request.delete(`/api/admin/teaching/courses/${courseId}/recall/${deckId}`);
			}
			for (const classId of classIds) await cleanupTeachingClass(page.request, classId);
		}
	});
});
