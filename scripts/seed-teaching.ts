/**
 * Seed a Teaching attendance sample class: HRM101, two tutorials, 20 students each,
 * with weeks 1-5 already marked. Run: npm run db:seed:teaching
 */
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type TeachingAttendanceStatus } from '@prisma/client';

expand(config({ path: '.env.local' }));

const connectionString =
	process.env.DATABASE_URL ??
	'postgresql://postgres:postgres@127.0.0.1:5433/teaching_platform_vocab';
const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const COURSE_CODE = 'HRM101';
const GROUP_NO = '01';
const TERM = 'Fall 2026';
const TOTAL_WEEKS = 10;
const TAKEN_WEEKS = 5;
const PARTICIPATION = [0, 0.5, 1, 1.5, 2] as const;

type NameSpec = { familyName: string; givenName: string };

const T01_NAMES: NameSpec[] = [
	{ familyName: 'Nguyễn Trần', givenName: 'An' },
	{ familyName: 'Lê Hoàng', givenName: 'Bảo' },
	{ familyName: 'Phạm Phương', givenName: 'Chi' },
	{ familyName: 'Vũ Đình', givenName: 'Dũng' },
	{ familyName: 'Trần Mỹ', givenName: 'Duyên' },
	{ familyName: 'Hoàng Minh', givenName: 'Đức' },
	{ familyName: 'Đặng Thu', givenName: 'Hà' },
	{ familyName: 'Bùi Quốc', givenName: 'Hải' },
	{ familyName: 'Ngô Thanh', givenName: 'Hằng' },
	{ familyName: 'Đỗ Gia', givenName: 'Huy' },
	{ familyName: 'Lưu Khánh', givenName: 'Linh' },
	{ familyName: 'Phan Anh', givenName: 'Minh' },
	{ familyName: 'Trịnh Ngọc', givenName: 'Nam' },
	{ familyName: 'Cao Thị', givenName: 'Oanh' },
	{ familyName: 'Lý Quang', givenName: 'Phúc' },
	{ familyName: 'Mai Thu', givenName: 'Quỳnh' },
	{ familyName: 'Tạ Đức', givenName: 'Sơn' },
	{ familyName: 'Võ Thị', givenName: 'Tâm' },
	{ familyName: 'Chu Văn', givenName: 'Thành' },
	{ familyName: 'Dương Hải', givenName: 'Yến' },
];

const T02_NAMES: NameSpec[] = [
	{ familyName: 'Nguyễn Ngọc', givenName: 'Anh' },
	{ familyName: 'Lê Minh', givenName: 'Châu' },
	{ familyName: 'Phạm Gia', givenName: 'Đạt' },
	{ familyName: 'Vũ Thị', givenName: 'Hương' },
	{ familyName: 'Trần Quốc', givenName: 'Khánh' },
	{ familyName: 'Hoàng Bảo', givenName: 'Long' },
	{ familyName: 'Đặng Mỹ', givenName: 'Linh' },
	{ familyName: 'Bùi Thanh', givenName: 'Mai' },
	{ familyName: 'Ngô Đức', givenName: 'Nam' },
	{ familyName: 'Đỗ Thị', givenName: 'Oanh' },
	{ familyName: 'Lưu Hoàng', givenName: 'Phát' },
	{ familyName: 'Phan Khánh', givenName: 'Quân' },
	{ familyName: 'Trịnh Thị', givenName: 'Sen' },
	{ familyName: 'Cao Minh', givenName: 'Tâm' },
	{ familyName: 'Lý Ngọc', givenName: 'Trâm' },
	{ familyName: 'Mai Văn', givenName: 'Tú' },
	{ familyName: 'Tạ Thị', givenName: 'Uyên' },
	{ familyName: 'Võ Quốc', givenName: 'Việt' },
	{ familyName: 'Chu Minh', givenName: 'Xuân' },
	{ familyName: 'Dương Thị', givenName: 'Yến' },
];

function mulberry32(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function addDays(date: Date, days: number) {
	const next = new Date(date);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

function pickStatus(rng: () => number): TeachingAttendanceStatus {
	const roll = rng();
	if (roll < 0.72) return 'PRESENT';
	if (roll < 0.8) return 'LATE';
	if (roll < 0.88) return 'ABSENT_UNEXCUSED';
	if (roll < 0.94) return 'ABSENT_EXCUSED';
	return 'MAKEUP';
}

function forcedStatuses(index: number): TeachingAttendanceStatus[] | null {
	if (index <= 1) {
		return ['ABSENT_UNEXCUSED', 'ABSENT_UNEXCUSED', 'ABSENT_UNEXCUSED', 'PRESENT', 'PRESENT'];
	}
	if (index <= 3) {
		return ['ABSENT_UNEXCUSED', 'ABSENT_UNEXCUSED', 'PRESENT', 'PRESENT', 'PRESENT'];
	}
	return null;
}

function noteFor(index: number, statuses: TeachingAttendanceStatus[]) {
	if (index <= 1) return 'Absent 3 times — exam bar.';
	if (index <= 3) return 'At the 20% absence threshold.';
	if (statuses.includes('MAKEUP')) return 'Attended a make-up session.';
	if (statuses.filter((status) => status === 'PRESENT').length === TAKEN_WEEKS) {
		return 'Strong seminar contributions.';
	}
	return '';
}

async function seedTutorial(params: {
	classId: string;
	code: string;
	name: string;
	displayOrder: number;
	names: NameSpec[];
	codeOffset: number;
	heldOnStart: Date;
	rngSeed: number;
}) {
	const tutorial = await prisma.teachingTutorialClass.create({
		data: {
			classId: params.classId,
			code: params.code,
			name: params.name,
			room: params.code === 'T01' ? 'A301' : 'A302',
			scheduleNote: params.code === 'T01' ? 'Monday 07:30' : 'Tuesday 07:30',
			displayOrder: params.displayOrder,
		},
	});

	const sessions = Array.from({ length: TOTAL_WEEKS }, (_, index) => {
		const weekNumber = index + 1;
		const heldOn = addDays(params.heldOnStart, index * 7);
		const taken = weekNumber <= TAKEN_WEEKS;
		return {
			classId: params.classId,
			tutorialClassId: tutorial.id,
			weekNumber,
			heldOn: taken ? heldOn : null,
			topic: taken ? `Week ${weekNumber}` : '',
			attendanceTakenAt: taken ? new Date(heldOn.getTime() + 10 * 60 * 60 * 1000) : null,
			attendanceOpen: taken,
			participationTakenAt: taken ? new Date(heldOn.getTime() + 11 * 60 * 60 * 1000) : null,
			participationOpen: taken,
		};
	});
	await prisma.teachingSession.createMany({ data: sessions });
	const createdSessions = await prisma.teachingSession.findMany({
		where: { tutorialClassId: tutorial.id },
		orderBy: { weekNumber: 'asc' },
	});

	const rng = mulberry32(params.rngSeed);
	const marks: Array<{
		sessionId: string;
		enrollmentId: string;
		status: TeachingAttendanceStatus;
		note: string;
	}> = [];
	const participationMarks: Array<{
		sessionId: string;
		enrollmentId: string;
		points: number;
	}> = [];

	for (const [index, name] of params.names.entries()) {
		const studentCode = String(2408010001 + params.codeOffset + index);
		const student = await prisma.teachingStudent.upsert({
			where: { studentCode },
			create: {
				studentCode,
				familyName: name.familyName,
				givenName: name.givenName,
				dateOfBirth: new Date(Date.UTC(2005, (index * 3) % 12, 4 + (index % 24))),
				homeClassCode: params.code === 'T01' ? '2D-24' : '2D-25',
				majorName: 'Quản trị Kinh doanh',
			},
			update: {
				familyName: name.familyName,
				givenName: name.givenName,
			},
		});
		const forced = forcedStatuses(index);
		const weekStatuses = forced ?? Array.from({ length: TAKEN_WEEKS }, () => pickStatus(rng));
		const enrollment = await prisma.teachingEnrollment.create({
			data: {
				classId: params.classId,
				tutorialClassId: tutorial.id,
				studentId: student.id,
				orderNo: index + 1,
				note: noteFor(index, weekStatuses),
			},
		});
		for (let week = 0; week < TAKEN_WEEKS; week += 1) {
			const status = weekStatuses[week]!;
			const participationPoints =
				status === 'PRESENT' || status === 'MAKEUP'
					? PARTICIPATION[Math.floor(rng() * PARTICIPATION.length)]!
					: 0;
			marks.push({
				sessionId: createdSessions[week]!.id,
				enrollmentId: enrollment.id,
				status,
				note: status === 'LATE' ? 'Late' : status === 'MAKEUP' ? 'Make-up' : '',
			});
			if (participationPoints > 0) {
				participationMarks.push({
					sessionId: createdSessions[week]!.id,
					enrollmentId: enrollment.id,
					points: participationPoints,
				});
			}
		}
	}

	await prisma.teachingAttendance.createMany({ data: marks });
	await prisma.teachingParticipation.createMany({ data: participationMarks });
	return { id: tutorial.id, code: tutorial.code, students: params.names.length };
}

async function main() {
	await prisma.teachingClass.deleteMany({
		where: { courseCode: COURSE_CODE, groupNo: GROUP_NO, term: TERM },
	});

	const teachingClass = await prisma.teachingClass.create({
		data: {
			courseCode: COURSE_CODE,
			courseName: 'Human Resource Management',
			groupNo: GROUP_NO,
			term: TERM,
			credits: 3,
			lecturerName: 'Nguyễn Duy Khánh',
			lecturerCode: 'TLK',
			totalWeeks: TOTAL_WEEKS,
			publicSlug: 'hrm-fall-2026',
			publicTitle: 'Human Resource Management',
			publicSummary:
				'Trang thông tin chung của lớp Human Resource Management: lịch tutorial, chủ đề từng tuần và các tài nguyên được giảng viên chia sẻ.',
			publicDescription:
				'Lớp học giới thiệu những nền tảng quan trọng của quản trị nguồn nhân lực và cách các quyết định về con người tạo ra tác động trong tổ chức.\n\nTrang này là bảng lớp được chia sẻ cho sinh viên, gồm lịch học, điểm danh, CP và nội quy khi giảng viên bật chia sẻ.',
			publicAnnouncement: 'Năm tuần đầu tiên đã được cập nhật trên lịch lớp.',
			attendanceVisible: true,
		},
	});

	const t01 = await seedTutorial({
		classId: teachingClass.id,
		code: 'T01',
		name: 'Tutorial 1',
		displayOrder: 0,
		names: T01_NAMES,
		codeOffset: 0,
		heldOnStart: new Date(Date.UTC(2026, 8, 7)),
		rngSeed: 101,
	});
	const t02 = await seedTutorial({
		classId: teachingClass.id,
		code: 'T02',
		name: 'Tutorial 2',
		displayOrder: 1,
		names: T02_NAMES,
		codeOffset: 20,
		heldOnStart: new Date(Date.UTC(2026, 8, 8)),
		rngSeed: 202,
	});
	await prisma.teachingClassPublicLink.create({
		data: {
			classId: teachingClass.id,
			label: 'Website giảng viên',
			url: 'https://toiladuykhanh.com',
			description: 'Thông tin giảng dạy và các tài nguyên học tập khác.',
			displayOrder: 0,
		},
	});

	console.log(
		JSON.stringify(
			{
				class: {
					id: teachingClass.id,
					courseCode: teachingClass.courseCode,
					groupNo: teachingClass.groupNo,
					term: teachingClass.term,
				},
				tutorials: [t01, t02],
				urls: {
					gradebook: `/my-space/teaching/${teachingClass.id}?tab=attendance`,
					publicPage: `/lop/${teachingClass.publicSlug}`,
					import: '/my-space/teaching/import',
				},
			},
			null,
			2,
		),
	);
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
		await pool.end();
	});
