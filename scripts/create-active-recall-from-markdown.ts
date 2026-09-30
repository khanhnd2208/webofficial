import { readFileSync } from 'node:fs';

import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

import { HRM_COURSE_CODE, HRM_COURSE_NAME } from '../src/features/teaching/domain/courseIdentity';

expand(config({ path: '.env.local' }));

const [sourcePath, slug, title, lessonLabel, description] = process.argv.slice(2);
if (!sourcePath || !slug || !title || !lessonLabel) {
	throw new Error(
		'Usage: create-active-recall-from-markdown.ts <source> <slug> <title> <lesson> [description]',
	);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required.');

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function plainText(value: string) {
	return value
		.replace(/^\*\s+/gm, '• ')
		.replace(/\*\*(.*?)\*\*/g, '$1')
		.replace(/\*(.*?)\*/g, '$1')
		.trim();
}

function parseCards(source: string) {
	const parts = source
		.replace(/\r/g, '')
		.split(/^\*\*(\d+)\. (.+?)\*\*\s*$/m)
		.slice(1);
	const cards: Array<{ question: string; answer: string; position: number }> = [];
	for (let index = 0; index < parts.length; index += 3) {
		const number = Number(parts[index]);
		const question = plainText(parts[index + 1] ?? '');
		const body = parts[index + 2]?.split(/\n---\n\n|\n\nBộ câu hỏi lý thuyết/)[0] ?? '';
		const marker = body.indexOf('**Answer:**');
		const answer = plainText(marker >= 0 ? body.slice(marker + '**Answer:**'.length) : '');
		if (number !== index / 3 + 1 || !question || !answer) {
			throw new Error(`Invalid question/answer block at number ${number || index / 3 + 1}.`);
		}
		cards.push({ question, answer, position: index / 3 });
	}
	if (cards.length !== 60) throw new Error(`Expected 60 cards, found ${cards.length}.`);
	return cards;
}

async function main() {
	const cards = parseCards(readFileSync(sourcePath, 'utf8'));
	const existing = await prisma.activeRecallDeck.findUnique({
		where: { slug },
		select: { id: true },
	});
	if (existing) throw new Error(`Deck ${slug} already exists; refusing to overwrite it.`);
	const course = await prisma.teachingCourse.upsert({
		where: { courseCode: HRM_COURSE_CODE },
		update: {},
		create: { courseCode: HRM_COURSE_CODE, courseName: HRM_COURSE_NAME },
	});

	const deck = await prisma.$transaction(async (tx) => {
		const created = await tx.activeRecallDeck.create({
			data: {
				slug,
				title,
				courseId: course.id,
				subject: course.courseName,
				lessonLabel,
				description: description ?? '',
				status: 'PUBLISHED',
				publishedAt: new Date(),
				cards: { create: cards },
			},
			select: { id: true, title: true, position: true, _count: { select: { cards: true } } },
		});
		const classes = await tx.teachingClass.findMany({
			where: { courseId: course.id },
			select: { id: true },
		});
		if (classes.length) {
			await tx.teachingClassRecallDeck.createMany({
				data: classes.map((teachingClass) => ({
					classId: teachingClass.id,
					deckId: created.id,
					enabled: true,
					displayOrder: created.position,
				})),
				skipDuplicates: true,
			});
		}
		return created;
	});

	console.log(`Created ${deck.title} (${deck.id}) with ${deck._count.cards} cards.`);
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
