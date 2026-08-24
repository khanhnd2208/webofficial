import { readFileSync } from 'node:fs';

import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

expand(config({ path: '.env.local' }));

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error('Pass the Markdown source path as the first argument.');
if (process.env.ACTIVE_RECALL_REPLACE_CONFIRMED !== '1') {
	throw new Error('Set ACTIVE_RECALL_REPLACE_CONFIRMED=1 to confirm replacing the existing deck.');
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
	const parts = source.replace(/\r/g, '').split(/^### (\d+)\. /m).slice(1);
	const cards: Array<{ question: string; answer: string; position: number }> = [];
	for (let index = 0; index < parts.length; index += 2) {
		const number = Number(parts[index]);
		const body = parts[index + 1]?.split(/\n---\n\n/)[0] ?? '';
		const lines = body.split('\n');
		const question = plainText(lines.shift() ?? '');
		const answerMarker = lines.findIndex((line) => line.trim() === '**Answer:**');
		const answer = plainText(lines.slice(answerMarker + 1).join('\n'));
		if (number !== index / 2 + 1 || !question || answerMarker < 0 || !answer) {
			throw new Error(`Invalid question/answer block at number ${number || index / 2 + 1}.`);
		}
		cards.push({ question, answer, position: index / 2 });
	}
	if (cards.length !== 50) throw new Error(`Expected 50 cards, found ${cards.length}.`);
	return cards;
}

async function main() {
	const cards = parseCards(readFileSync(sourcePath, 'utf8'));
	const deck = await prisma.activeRecallDeck.findUnique({ where: { slug: 'hrm-lesson-1' }, select: { id: true, title: true, status: true, _count: { select: { cards: true } } } });
	if (!deck) throw new Error('Deck hrm-lesson-1 was not found.');

	await prisma.$transaction(async (tx) => {
		await tx.activeRecallCard.deleteMany({ where: { deckId: deck.id } });
		await tx.activeRecallCard.createMany({ data: cards.map((card) => ({ ...card, deckId: deck.id })) });
		await tx.activeRecallDeck.update({ where: { id: deck.id }, data: { updatedAt: new Date() } });
	});

	console.log(`Replaced ${deck._count.cards} cards in ${deck.title} with ${cards.length} cards.`);
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
