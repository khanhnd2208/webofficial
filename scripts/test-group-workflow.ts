/** Integration checks against an explicitly supplied disposable PostgreSQL database. */
import assert from 'node:assert/strict';
import { migrateLegacyGroupBoards } from './lib/groupBoardMigration';

async function main() {
	const url = process.env.TEST_DATABASE_URL;
	if (!url || !/^\/(codex_groups_|teaching_groups_test)/.test(new URL(url).pathname)) {
		throw new Error(
			'TEST_DATABASE_URL must name a disposable codex_groups_* or teaching_groups_test* database',
		);
	}
	process.env.DATABASE_URL = url;
	process.env.TEACHING_GROUP_BOARD_ENABLED = 'true';
	const { prisma: db } = await import('../src/lib/prisma');
	const service = await import('../src/features/teaching/services/groupBoardService');
	const repo = await import('../src/features/teaching/repositories/teachingRepository');
	const prefix = `group-check-${Date.now()}`;
	const classes: string[] = [];
	const students: string[] = [];
	let checks = 0;
	function passed(label: string) {
		checks++;
		console.log(`PASS ${label}`);
	}
	async function fixture(suffix: string) {
		const course = await db.teachingCourse.create({
			data: {
				courseCode: prefix + suffix,
				courseName: 'Group checks',
			},
		});
		const klass = await db.teachingClass.create({
			data: {
				courseId: course.id,
				courseCode: prefix + suffix,
				courseName: 'Group checks',
				groupNo: '01',
				term: prefix,
			},
		});
		classes.push(klass.id);
		const tutorials = await Promise.all(
			['01', '02'].map((code) =>
				db.teachingTutorialClass.create({
					data: { classId: klass.id, code, name: `Tutorial ${code}` },
				}),
			),
		);
		const enrollments = [];
		for (let i = 0; i < 4; i++) {
			const code = `${prefix}-${suffix}-${i}`;
			const student = await db.teachingStudent.create({
				data: {
					studentCode: code,
					studentCodeNormalized: code,
					familyName: 'Fixture',
					givenName: String(i),
				},
			});
			students.push(student.id);
			enrollments.push(
				await db.teachingEnrollment.create({
					data: {
						classId: klass.id,
						tutorialClassId: tutorials[i === 3 ? 1 : 0].id,
						studentId: student.id,
						orderNo: i + 1,
					},
					include: { student: true },
				}),
			);
		}
		return { klass, tutorials, enrollments };
	}
	try {
		const legacy = await fixture('legacy');
		const oldId = `${prefix}-board`;
		// Reproduce the transitional schema in THIS disposable database only.
		await db.$executeRawUnsafe(
			'ALTER TABLE "TeachingGroupBoard" ALTER COLUMN "tutorialClassId" DROP NOT NULL',
		);
		await db.$executeRawUnsafe(
			'ALTER TABLE "TeachingGroupBoard" DROP CONSTRAINT "TeachingGroupBoard_tutorial_required"',
		);
		await db.$executeRaw`INSERT INTO "TeachingGroupBoard" (id, "classId", "groupCount", "groupSize", version, "updatedAt") VALUES (${oldId}, ${legacy.klass.id}, 8, 5, 1, NOW())`;
		await db.$executeRawUnsafe(
			'ALTER TABLE "TeachingGroupBoard" ADD CONSTRAINT "TeachingGroupBoard_tutorial_required" CHECK ("tutorialClassId" IS NOT NULL) NOT VALID',
		);
		const oldGroup = await db.teachingGroup.create({ data: { boardId: oldId, displayOrder: 7 } });
		for (const [slotIndex, enrollment] of legacy.enrollments.entries()) {
			await db.teachingGroupAssignment.create({
				data: { boardId: oldId, groupId: oldGroup.id, enrollmentId: enrollment.id, slotIndex },
			});
		}
		await db.teachingGroupAudit.create({
			data: { boardId: oldId, actor: 'ADMIN', action: 'MOVE', actorUserId: 'original-teacher' },
		});
		const oldAssignments = await db.teachingGroupAssignment.findMany({
			where: { boardId: oldId },
			orderBy: { id: 'asc' },
		});
		const dry = await migrateLegacyGroupBoards(db);
		assert.equal(dry.applied, false);
		assert.equal(dry.issues.length, 0);
		assert.equal(await db.teachingGroupAssignment.count({ where: { boardId: oldId } }), 4);
		passed('migration dry-run does not write');
		await db.teachingEnrollment.update({
			where: { id: legacy.enrollments[0].id },
			data: { tutorialClassId: null },
		});
		const blocked = await migrateLegacyGroupBoards(db, true);
		assert.equal(blocked.applied, false);
		assert.ok(blocked.issues.length);
		assert.equal(await db.teachingGroupBoardArchive.count({ where: { legacyBoardId: oldId } }), 0);
		await db.teachingEnrollment.update({
			where: { id: legacy.enrollments[0].id },
			data: { tutorialClassId: legacy.tutorials[0].id },
		});
		passed('unresolved tutorial blocks migration without data loss');
		const conflict = await db.teachingGroupBoard.create({
			data: { classId: legacy.klass.id, tutorialClassId: legacy.tutorials[0].id },
		});
		assert.equal((await migrateLegacyGroupBoards(db, true)).applied, false);
		await db.teachingGroupBoard.delete({ where: { id: conflict.id } });
		passed('existing destination is not silently overwritten');
		await db.$executeRawUnsafe(
			`CREATE FUNCTION group_test_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected migration failure'; END $$`,
		);
		await db.$executeRawUnsafe(
			'CREATE TRIGGER group_test_fail BEFORE UPDATE ON "TeachingGroupAssignment" FOR EACH ROW EXECUTE FUNCTION group_test_fail()',
		);
		await assert.rejects(migrateLegacyGroupBoards(db, true));
		assert.equal(await db.teachingGroupAssignment.count({ where: { boardId: oldId } }), 4);
		assert.equal(await db.teachingGroupBoardArchive.count({ where: { legacyBoardId: oldId } }), 0);
		await db.$executeRawUnsafe('DROP TRIGGER group_test_fail ON "TeachingGroupAssignment"');
		await db.$executeRawUnsafe('DROP FUNCTION group_test_fail()');
		passed('failed data migration rolls back archive and member changes');
		assert.equal((await migrateLegacyGroupBoards(db, true)).applied, true);
		const migrated = await db.teachingGroupAssignment.findMany({
			where: { enrollmentId: { in: legacy.enrollments.map((e) => e.id) } },
			include: { group: true, board: true },
			orderBy: { id: 'asc' },
		});
		assert.deepEqual(
			migrated.map((a) => a.id),
			oldAssignments.map((a) => a.id),
		);
		assert.ok(migrated.every((a) => a.group.displayOrder === 0));
		assert.equal(new Set(migrated.map((a) => a.board.tutorialClassId)).size, 2);
		const archive = await db.teachingGroupBoardArchive.findUniqueOrThrow({
			where: { legacyBoardId: oldId },
		});
		assert.ok(JSON.stringify(archive.snapshot).includes('original-teacher'));
		passed(
			'migration retains assignment IDs and audit archive, separates tutorials and renumbers groups',
		);
		assert.equal((await migrateLegacyGroupBoards(db, true)).boards.length, 0);
		assert.equal(await db.teachingGroupBoardArchive.count({ where: { legacyBoardId: oldId } }), 1);
		passed('migration is rerunnable');
		await assert.rejects(
			db.teachingGroupBoard.create({
				data: { classId: legacy.klass.id, tutorialClassId: legacy.tutorials[0].id },
			}),
		);
		passed('one board per tutorial is enforced by PostgreSQL');

		const { klass, tutorials, enrollments } = await fixture('workflow');
		const tutorialClassId = tutorials[0].id;
		let board = await service.configureGroupBoard(klass.id, {
			tutorialClassId,
			groupCount: 2,
			defaultGroupSize: 2,
			actorUserId: 'teacher-test',
		});
		const [g1, g2] = board.groups;
		const codes = enrollments.map((e) => e.student.studentCode);
		await assert.rejects(
			service.addGroupMembers(klass.id, {
				tutorialClassId,
				groupId: g1.id,
				studentCodes: [codes[0], codes[0]],
			}),
		);
		await assert.rejects(
			service.addGroupMembers(klass.id, {
				tutorialClassId,
				groupId: g1.id,
				studentCodes: [codes[0], codes[3]],
			}),
		);
		assert.equal((await service.getGroupBoard(klass.id, tutorialClassId)).assignedCount, 0);
		passed('duplicates and wrong-tutorial batches leave no partial assignments');
		board = await service.addGroupMembers(klass.id, {
			tutorialClassId,
			groupId: g1.id,
			studentCodes: codes.slice(0, 2),
			expectedVersion: board.version,
			actorUserId: 'teacher-test',
		});
		const publicBoard = await service.getGroupBoard(klass.id, tutorialClassId, 'fixture-public');
		assert.ok(publicBoard.groups[0].assignments.every((a) => a.studentCode.startsWith('*')));
		assert.ok(publicBoard.unassigned.every((a) => a.studentCode.startsWith('*')));
		passed('public API payload masks assigned and unassigned codes');
		await service.addGroupMembers(klass.id, {
			tutorialClassId,
			groupId: g2.id,
			studentCodes: [codes[2]],
			actorUserId: 'teacher-test',
		});
		await assert.rejects(
			service.moveGroupMember(klass.id, {
				tutorialClassId,
				enrollmentId: enrollments[2].id,
				targetGroupId: g1.id,
			}),
		);
		assert.equal(
			(
				await db.teachingGroupAssignment.findUniqueOrThrow({
					where: { enrollmentId: enrollments[2].id },
				})
			).groupId,
			g2.id,
		);
		passed('full target group preserves original membership');
		await service.moveGroupMember(klass.id, {
			tutorialClassId,
			enrollmentId: enrollments[0].id,
			targetGroupId: null,
		});
		await service.configureGroupBoard(klass.id, {
			tutorialClassId,
			groupCount: 2,
			defaultGroupSize: 1,
		});
		passed('capacity uses headcount after member removal');
		await service.setGroupCapacity(klass.id, g1.id, { tutorialClassId, maxSize: 3 });
		await service.configureGroupBoard(klass.id, {
			tutorialClassId,
			groupCount: 2,
			defaultGroupSize: 2,
		});
		assert.equal(
			(await service.getGroupBoard(klass.id, tutorialClassId)).groups[0].effectiveMaxSize,
			3,
		);
		passed('custom group capacity survives a default change');
		board = await service.getGroupBoard(klass.id, tutorialClassId);
		const concurrent = await Promise.allSettled(
			[2, 3].map((size) =>
				service.configureGroupBoard(klass.id, {
					tutorialClassId,
					groupCount: 2,
					defaultGroupSize: size,
					expectedVersion: board.version,
				}),
			),
		);
		assert.equal(concurrent.filter((r) => r.status === 'fulfilled').length, 1);
		passed('concurrent writers cannot both commit the same version');
		process.env.TEACHING_GROUP_BOARD_ENABLED = 'false';
		await repo.updateEnrollment(enrollments[1].id, { tutorialClassId: tutorials[1].id });
		assert.equal(
			await db.teachingGroupAssignment.findUnique({ where: { enrollmentId: enrollments[1].id } }),
			null,
		);
		passed('tutorial transfer removes membership even when feature flag is off');
		await db.$executeRawUnsafe(
			`CREATE FUNCTION group_test_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected lifecycle failure'; END $$`,
		);
		await db.$executeRawUnsafe(
			'CREATE TRIGGER group_test_fail BEFORE DELETE ON "TeachingGroupAssignment" FOR EACH ROW EXECUTE FUNCTION group_test_fail()',
		);
		await assert.rejects(repo.updateEnrollment(enrollments[2].id, { status: 'WITHDRAWN' }));
		assert.equal(
			(await db.teachingEnrollment.findUniqueOrThrow({ where: { id: enrollments[2].id } })).status,
			'ACTIVE',
		);
		await db.$executeRawUnsafe('DROP TRIGGER group_test_fail ON "TeachingGroupAssignment"');
		await db.$executeRawUnsafe('DROP FUNCTION group_test_fail()');
		await repo.updateEnrollment(enrollments[2].id, { status: 'WITHDRAWN' });
		assert.equal(
			await db.teachingGroupAssignment.findUnique({ where: { enrollmentId: enrollments[2].id } }),
			null,
		);
		passed('withdrawal and group cleanup are atomic');
		assert.ok(await db.teachingGroupAudit.count({ where: { actorUserId: 'teacher-test' } }));
		passed('teacher identity is retained in audit history');
		console.log(`${checks} PostgreSQL checks passed`);
	} finally {
		await db.$executeRawUnsafe(
			'DROP TRIGGER IF EXISTS group_test_fail ON "TeachingGroupAssignment"',
		);
		await db.$executeRawUnsafe('DROP FUNCTION IF EXISTS group_test_fail()');
		await db.teachingClass.deleteMany({ where: { id: { in: classes } } });
		await db.teachingStudent.deleteMany({ where: { id: { in: students } } });
		await db.$disconnect();
	}
}
main().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
