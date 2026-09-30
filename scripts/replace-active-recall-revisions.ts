import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

import { HRM_COURSE_CODE, HRM_COURSE_NAME } from '../src/features/teaching/domain/courseIdentity';

expand(config({ path: '.env.local' }));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required.');

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

type Card = { question: string; answer: string; position: number };

const chapterTwoCaseCards = [
	[
		'Why did Mayo Clinic redesign work even though it was already providing high-quality care?',
		'Healthcare costs were rising while payers were limiting payments, so Mayo needed to maintain quality while improving efficiency.',
	],
	[
		'What responsibilities were added to the jobs of doctors and nurses?',
		'Nurses took over some services and received more control over care. Doctors also became responsible for reducing wasted time and costs.',
	],
	[
		"Do the changes to nurses' jobs show job enlargement, job enrichment, or both? Why?",
		'Both. Nurses performed a broader range of tasks and also received more decision-making authority.',
	],
	[
		"How might the changes to doctors' and nurses' jobs affect motivation?",
		'They may increase skill variety, autonomy, and responsibility, but they may also increase workload and pressure.',
	],
	[
		'Heart surgery teams reduced the time needed to prepare operating rooms between surgeries. Which job-design approach does this mainly show?',
		'Designing for efficiency because the teams reduced wasted time in the work process.',
	],
	[
		'What are possible consequences of information overload for doctors in an ICU?',
		'Slower decisions, missed information, mistakes, and greater mental strain.',
	],
	[
		"How did Mayo Clinic redesign the information system to reduce doctors' mental demands?",
		'It selected the most important data, highlighted relevant information, and used alarms for critical conditions.',
	],
	[
		'Which approach to job design is most clearly shown by the new ICU information system? Why?',
		'Design for mental capacity because it reduces unnecessary information processing and helps doctors focus on important information.',
	],
] as const;

function plainText(value: string) {
	return value
		.replace(/^\*\s+/gm, '• ')
		.replace(/\*\*(.*?)\*\*/g, '$1')
		.replace(/\*(.*?)\*/g, '$1')
		.trim();
}

function parseMarkdown(source: string, expectedCount: number, exampleMarker: string): Card[] {
	const parts = source
		.replace(/\r/g, '')
		.split(/^### (\d+)\. (.+?)\s*$/m)
		.slice(1);
	const cards: Card[] = [];
	for (let index = 0; index < parts.length; index += 3) {
		const number = Number(parts[index]);
		const question = plainText(parts[index + 1] ?? '');
		const body = parts[index + 2]?.split(/\n---\n\n|\n\n(?:Bộ câu hỏi|Tôi nghĩ format)/)[0] ?? '';
		const answerMarker = body.indexOf('**Answer:**');
		if (answerMarker < 0) throw new Error(`Missing answer marker for question ${number}.`);
		const answerAndExample = body.slice(answerMarker + '**Answer:**'.length);
		const exampleIndex = answerAndExample.indexOf(exampleMarker);
		const answer = plainText(
			exampleIndex >= 0 ? answerAndExample.slice(0, exampleIndex) : answerAndExample,
		);
		const example =
			exampleIndex >= 0
				? plainText(
						answerAndExample.slice(exampleIndex + exampleMarker.length).split(/\n\n/)[0] ?? '',
					)
				: '';
		if (number !== index / 3 + 1 || !question || !answer)
			throw new Error(`Invalid block at question ${number || index / 3 + 1}.`);
		cards.push({
			question,
			answer: example ? `${answer}\n\nExample: ${example}` : answer,
			position: index / 3,
		});
	}
	if (cards.length !== expectedCount)
		throw new Error(`Expected ${expectedCount} cards, found ${cards.length}.`);
	return cards;
}

function cardsMatch(actual: Card[], expected: Card[]) {
	return (
		actual.length === expected.length &&
		actual.every(
			(card, index) =>
				card.question === expected[index].question &&
				card.answer === expected[index].answer &&
				card.position === expected[index].position,
		)
	);
}

async function ensureHrmCourse(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
	const existing =
		(await tx.teachingCourse.findUnique({ where: { courseCode: HRM_COURSE_CODE } })) ??
		(await tx.teachingCourse.findUnique({ where: { courseCode: 'HRM101' } }));
	if (existing) return existing;
	return tx.teachingCourse.create({
		data: { courseCode: HRM_COURSE_CODE, courseName: HRM_COURSE_NAME },
	});
}

async function enableDeckForCourseClasses(
	tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
	courseId: string,
	deckId: string,
	displayOrder: number,
) {
	const classes = await tx.teachingClass.findMany({
		where: { courseId },
		select: { id: true },
	});
	if (!classes.length) return;
	await tx.teachingClassRecallDeck.createMany({
		data: classes.map((teachingClass) => ({
			classId: teachingClass.id,
			deckId,
			enabled: true,
			displayOrder,
		})),
		skipDuplicates: true,
	});
}

async function syncDeck(
	tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
	deck: { slug: string; title: string; lessonLabel: string; description: string; cards: Card[] },
	course: { id: string; courseName: string },
) {
	const existing = await tx.activeRecallDeck.findUnique({
		where: { slug: deck.slug },
		include: { cards: { orderBy: { position: 'asc' } } },
	});
	if (!existing) {
		const created = await tx.activeRecallDeck.create({
			data: {
				...deck,
				courseId: course.id,
				subject: course.courseName,
				status: 'PUBLISHED',
				publishedAt: new Date(),
				cards: { create: deck.cards },
			},
		});
		await enableDeckForCourseClasses(tx, course.id, created.id, 0);
		return { slug: deck.slug, action: 'created', cards: deck.cards.length };
	}
	if (
		cardsMatch(existing.cards, deck.cards) &&
		existing.courseId === course.id &&
		existing.status === 'PUBLISHED'
	) {
		await enableDeckForCourseClasses(tx, course.id, existing.id, existing.position);
		return { slug: deck.slug, action: 'unchanged', cards: deck.cards.length };
	}
	await tx.activeRecallCard.deleteMany({ where: { deckId: existing.id } });
	await tx.activeRecallCard.createMany({
		data: deck.cards.map((card) => ({ ...card, deckId: existing.id })),
	});
	if (existing.courseId !== course.id) {
		await tx.teachingClassRecallDeck.deleteMany({ where: { deckId: existing.id } });
	}
	await tx.activeRecallDeck.update({
		where: { id: existing.id },
		data: {
			title: deck.title,
			courseId: course.id,
			subject: course.courseName,
			lessonLabel: deck.lessonLabel,
			description: deck.description,
			status: 'PUBLISHED',
			publishedAt: existing.publishedAt ?? new Date(),
		},
	});
	await enableDeckForCourseClasses(tx, course.id, existing.id, existing.position);
	return {
		slug: deck.slug,
		action: 'replaced',
		oldCards: existing.cards.length,
		cards: deck.cards.length,
	};
}

async function main() {
	const chapterOne = parseMarkdown(
		readFileSync(resolve('content/active-recall/hrm-lesson-1.md'), 'utf8'),
		28,
		'**Example:**',
	);
	const chapterTwo = [
		...parseMarkdown(
			readFileSync(resolve('content/active-recall/hrm-lesson-2.md'), 'utf8'),
			41,
			'**Short example:**',
		),
		...chapterTwoCaseCards.map(([question, answer], index) => ({
			question,
			answer,
			position: 41 + index,
		})),
	];
	if (chapterTwo.length !== 49)
		throw new Error(`Expected 49 Chapter 2 cards, found ${chapterTwo.length}.`);
	const result = await prisma.$transaction(async (tx) => {
		const course = await ensureHrmCourse(tx);
		const decks = [
			await syncDeck(
				tx,
				{
					slug: 'hrm-lesson-1',
					title: 'HRM · Lesson 1 — Introduction to HRM',
					lessonLabel: 'Lesson 1',
					description: 'Active recall cards for the foundations of human resource management.',
					cards: chapterOne,
				},
				course,
			),
			await syncDeck(
				tx,
				{
					slug: 'hrm-lesson-2',
					title: 'HRM · Lesson 2 — Work Analysis and Job Design',
					lessonLabel: 'Lesson 2',
					description: 'Active recall cards for work analysis and job design.',
					cards: chapterTwo,
				},
				course,
			),
		];
		return decks;
	});
	console.log(JSON.stringify(result));
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
		await pool.end();
	});
