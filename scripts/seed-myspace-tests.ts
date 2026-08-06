/**
 * One-off seed for My Space Tests sample data.
 * Run: npx tsx scripts/seed-myspace-tests.ts
 */
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type McqCorrectOption } from '@prisma/client';
import { slugify } from '../src/utils/slugify';

expand(config({ path: '.env.local' }));

const connectionString =
	process.env.DATABASE_URL ??
	'postgresql://postgres:postgres@127.0.0.1:5433/teaching_platform_vocab';
const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

type Q = {
	topic: string;
	stem: string;
	optionA: string;
	optionB: string;
	optionC: string;
	optionD: string;
	correctOption: McqCorrectOption;
	difficulty: number;
	aacsb: string;
	learningObjective: string;
	classification: string;
};

const SUBJECT_NAME = 'Principles of Management';
const CHAPTER1 = 'Chapter 1 Managers and You in the Workplace';

const questions: Q[] = [
	{
		topic: CHAPTER1,
		stem: "In today's workplace, ________.",
		optionA: 'women are more likely than men to be promoted into management',
		optionB:
			'many employees perform work that in the past was considered managerial activities',
		optionC: 'women tend to be more effective supervisors than men',
		optionD: 'most organizations have eliminated the title of manager',
		correctOption: 'B',
		difficulty: 2,
		aacsb: 'Reflective thinking',
		learningObjective: 'LO 1.1: Describe who managers are and where they work.',
		classification: 'Concept',
	},
	{
		topic: CHAPTER1,
		stem: 'A manager is someone who ________.',
		optionA: 'works independently without coordinating others',
		optionB:
			'coordinates and oversees the work of other people so organizational goals can be accomplished',
		optionC: 'only works in for-profit organizations',
		optionD: 'avoids planning and controlling activities',
		correctOption: 'B',
		difficulty: 1,
		aacsb: 'Reflective thinking',
		learningObjective: 'LO 1.1: Describe who managers are and where they work.',
		classification: 'Concept',
	},
	{
		topic: CHAPTER1,
		stem: 'First-line managers are responsible for ________.',
		optionA: 'making organization-wide decisions',
		optionB: 'managing the work of nonmanagerial employees',
		optionC: 'translating goals set by top managers into plans',
		optionD: 'setting the overall direction of the company',
		correctOption: 'B',
		difficulty: 1,
		aacsb: 'Reflective thinking',
		learningObjective: 'LO 1.1: Describe who managers are and where they work.',
		classification: 'Concept',
	},
	{
		topic: CHAPTER1,
		stem: 'Efficiency is concerned with ________.',
		optionA: 'doing the right things',
		optionB: 'goal attainment',
		optionC: 'reducing resource costs',
		optionD: 'employee satisfaction only',
		correctOption: 'C',
		difficulty: 2,
		aacsb: 'Reflective thinking',
		learningObjective: 'LO 1.2: Explain why managers are important to organizations.',
		classification: 'Concept',
	},
	{
		topic: CHAPTER1,
		stem: 'Effectiveness is concerned with ________.',
		optionA: 'minimizing resource waste',
		optionB: 'doing the right things and goal attainment',
		optionC: 'cutting costs only',
		optionD: 'avoiding decisions',
		correctOption: 'B',
		difficulty: 2,
		aacsb: 'Reflective thinking',
		learningObjective: 'LO 1.2: Explain why managers are important to organizations.',
		classification: 'Concept',
	},
	{
		topic: 'Chapter 2 Making Decisions',
		stem: 'A decision is ________.',
		optionA: 'a choice among two or more alternatives',
		optionB: 'always made by top management',
		optionC: 'never involving risk',
		optionD: 'the same as a goal',
		correctOption: 'A',
		difficulty: 1,
		aacsb: 'Reflective thinking',
		learningObjective: 'LO 2.1: Describe the decision-making process.',
		classification: 'Concept',
	},
	{
		topic: 'Chapter 2 Making Decisions',
		stem: 'Programmed decisions are ________.',
		optionA: 'repetitive and routine',
		optionB: 'unique and nonrecurring',
		optionC: 'made only under crisis',
		optionD: 'avoided by managers',
		correctOption: 'A',
		difficulty: 2,
		aacsb: 'Reflective thinking',
		learningObjective: 'LO 2.3: Describe types of decisions and decision-making conditions.',
		classification: 'Concept',
	},
	{
		topic: 'Chapter 2 Making Decisions',
		stem: 'Nonprogrammed decisions typically involve ________.',
		optionA: 'routine procedures only',
		optionB: 'unique and nonrecurring situations',
		optionC: 'one-time mergers only',
		optionD: 'avoiding all risk',
		correctOption: 'B',
		difficulty: 1,
		aacsb: 'Reflective thinking',
		learningObjective: 'LO 2.3: Describe types of decisions and decision-making conditions.',
		classification: 'Concept',
	},
	{
		topic: 'Chapter 3 Managing the External Environment and Organizational Culture',
		stem: 'The external environment includes ________.',
		optionA: 'only the board of directors',
		optionB: 'factors and forces outside the organization that affect its performance',
		optionC: 'employee handbooks exclusively',
		optionD: 'internal accounting policies only',
		correctOption: 'B',
		difficulty: 1,
		aacsb: 'Reflective thinking',
		learningObjective:
			'LO 3.1: Contrast the actions of managers according to the omnipotent and symbolic views.',
		classification: 'Concept',
	},
	{
		topic: 'Chapter 3 Managing the External Environment and Organizational Culture',
		stem: 'Organizational culture is best described as ________.',
		optionA:
			'the shared values, principles, and ways of doing things that influence employee behavior',
		optionB: 'the legal charter of incorporation',
		optionC: 'a temporary marketing campaign',
		optionD: 'the physical layout of offices only',
		correctOption: 'A',
		difficulty: 2,
		aacsb: 'Reflective thinking',
		learningObjective: 'LO 3.3: Define organizational culture and explain its impact on managers.',
		classification: 'Concept',
	},
	{
		topic: 'Chapter 3 Managing the External Environment and Organizational Culture',
		stem: 'Environmental uncertainty is high when ________.',
		optionA: 'change is minimal and components are simple',
		optionB: 'components change frequently and are complex',
		optionC: 'managers ignore the environment',
		optionD: 'the organization has no competitors',
		correctOption: 'B',
		difficulty: 3,
		aacsb: 'Reflective thinking',
		learningObjective:
			'LO 3.2: Describe the constraints and challenges facing managers in today’s external environment.',
		classification: 'Concept',
	},
	{
		topic: 'Chapter 3 Managing the External Environment and Organizational Culture',
		stem: 'Stakeholders are ________.',
		optionA: 'only shareholders who own stock',
		optionB: 'any constituencies that are affected by the organization’s decisions and actions',
		optionC: 'competitors exclusively',
		optionD: 'government agencies only',
		correctOption: 'B',
		difficulty: 2,
		aacsb: 'Reflective thinking',
		learningObjective:
			'LO 3.2: Describe the constraints and challenges facing managers in today’s external environment.',
		classification: 'Concept',
	},
];

async function main() {
	const deletedSessions = await prisma.spaceTestSession.deleteMany({});
	const deletedTests = await prisma.spaceTest.deleteMany({
		where: { slug: { in: ['principles-of-management-sample', 'pom-chapter-1-warmup'] } },
	});

	const subject =
		(await prisma.subject.findUnique({ where: { name: SUBJECT_NAME } })) ??
		(await prisma.subject.create({
			data: {
				name: SUBJECT_NAME,
				slug: slugify(SUBJECT_NAME) || 'principles-of-management',
			},
		}));

	const deletedQuestions = await prisma.mcqQuestion.deleteMany({
		where: { subjectId: subject.id },
	});

	const test = await prisma.spaceTest.create({
		data: {
			slug: 'principles-of-management-sample',
			title: 'Principles of Management — Sample Quiz',
			description:
				'Bài mẫu 8 câu từ Chapters 1–3. Mỗi lần làm, hệ thống chọn ngẫu nhiên và phân bổ đều theo topic / độ khó.',
			subjectId: subject.id,
			topics: [],
			difficulties: [],
			classifications: [],
			questionCount: 8,
			status: 'PUBLISHED',
			publishedAt: new Date(),
		},
	});

	const chapter1 = await prisma.spaceTest.create({
		data: {
			slug: 'pom-chapter-1-warmup',
			title: 'Chapter 1 Warm-up',
			description: '5 câu chỉ trong Chapter 1 — Managers and You in the Workplace.',
			subjectId: subject.id,
			topics: [],
			difficulties: [],
			classifications: [],
			questionCount: 5,
			status: 'PUBLISHED',
			publishedAt: new Date(),
		},
	});

	const chapter1Qs = questions.filter((q) => q.topic === CHAPTER1);

	await prisma.mcqQuestion.createMany({
		data: questions.map((q) => ({
			...q,
			subjectId: subject.id,
			spaceTestId: test.id,
		})),
	});

	await prisma.mcqQuestion.createMany({
		data: chapter1Qs.map((q) => ({
			...q,
			subjectId: subject.id,
			spaceTestId: chapter1.id,
		})),
	});

	console.log(
		JSON.stringify(
			{
				cleared: {
					sessions: deletedSessions.count,
					tests: deletedTests.count,
					questions: deletedQuestions.count,
				},
				subject: { id: subject.id, name: subject.name },
				tests: [
					{ slug: test.slug, questionCount: test.questionCount },
					{ slug: chapter1.slug, questionCount: chapter1.questionCount },
				],
			},
			null,
			2,
		),
	);
}

main()
	.catch((err) => {
		console.error(err);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
		await pool.end();
	});
