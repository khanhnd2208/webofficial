import { readFileSync } from 'node:fs';

import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

expand(config({ path: '.env.local' }));

const [chapterOnePath, chapterTwoPath] = process.argv.slice(2);
if (!chapterOnePath || !chapterTwoPath) throw new Error('Pass the Chapter 1 and Chapter 2 source paths.');
if (process.env.ACTIVE_RECALL_REPLACE_CONFIRMED !== '1') {
	throw new Error('Set ACTIVE_RECALL_REPLACE_CONFIRMED=1 to confirm replacing both existing decks.');
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required.');

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const chapterTwoCaseCards = [
	['Why did Mayo Clinic redesign work even though it was already providing high-quality care?', 'Healthcare costs were rising while payers were limiting payments, so Mayo needed to maintain quality while improving efficiency.'],
	['What responsibilities were added to the jobs of doctors and nurses?', 'Nurses took over some services and received more control over care. Doctors also became responsible for reducing wasted time and costs.'],
	["Do the changes to nurses' jobs show job enlargement, job enrichment, or both? Why?", 'Both. Nurses performed a broader range of tasks and also received more decision-making authority.'],
	["How might the changes to doctors' and nurses' jobs affect motivation?", 'They may increase skill variety, autonomy, and responsibility, but they may also increase workload and pressure.'],
	['Heart surgery teams reduced the time needed to prepare operating rooms between surgeries. Which job-design approach does this mainly show?', 'Designing for efficiency because the teams reduced wasted time in the work process.'],
	['What are possible consequences of information overload for doctors in an ICU?', 'Slower decisions, missed information, mistakes, and greater mental strain.'],
	['How did Mayo Clinic redesign the information system to reduce doctors\' mental demands?', 'It selected the most important data, highlighted relevant information, and used alarms for critical conditions.'],
	['Which approach to job design is most clearly shown by the new ICU information system? Why?', 'Design for mental capacity because it reduces unnecessary information processing and helps doctors focus on important information.'],
] as const;

function plainText(value: string) {
	return value
		.replace(/^\*\s+/gm, '• ')
		.replace(/\*\*(.*?)\*\*/g, '$1')
		.replace(/\*(.*?)\*/g, '$1')
		.trim();
}

function parseMarkdown(source: string, expectedCount: number, exampleMarker: string) {
	const parts = source.replace(/\r/g, '').split(/^### (\d+)\. (.+?)\s*$/m).slice(1);
	const cards: Array<{ question: string; answer: string; position: number }> = [];
	for (let index = 0; index < parts.length; index += 3) {
		const number = Number(parts[index]);
		const question = plainText(parts[index + 1] ?? '');
		const body = parts[index + 2]?.split(/\n---\n\n|\n\n(?:Bộ câu hỏi|Tôi nghĩ format)/)[0] ?? '';
		const answerMarker = body.indexOf('**Answer:**');
		if (answerMarker < 0) throw new Error(`Missing answer marker for question ${number}.`);
		const answerAndExample = body.slice(answerMarker + '**Answer:**'.length);
		const exampleIndex = answerAndExample.indexOf(exampleMarker);
		const answer = plainText(exampleIndex >= 0 ? answerAndExample.slice(0, exampleIndex) : answerAndExample);
		const example = exampleIndex >= 0 ? plainText(answerAndExample.slice(exampleIndex + exampleMarker.length).split(/\n\n/)[0] ?? '') : '';
		if (number !== index / 3 + 1 || !question || !answer) throw new Error(`Invalid block at question ${number || index / 3 + 1}.`);
		cards.push({ question, answer: example ? `${answer}\n\nExample: ${example}` : answer, position: index / 3 });
	}
	if (cards.length !== expectedCount) throw new Error(`Expected ${expectedCount} cards, found ${cards.length}.`);
	return cards;
}

async function replaceDeck(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], slug: string, cards: Array<{ question: string; answer: string; position: number }>) {
	const deck = await tx.activeRecallDeck.findUnique({ where: { slug }, select: { id: true, title: true, _count: { select: { cards: true } } } });
	if (!deck) throw new Error(`Deck ${slug} was not found.`);
	await tx.activeRecallCard.deleteMany({ where: { deckId: deck.id } });
	await tx.activeRecallCard.createMany({ data: cards.map((card) => ({ ...card, deckId: deck.id })) });
	await tx.activeRecallDeck.update({ where: { id: deck.id }, data: { updatedAt: new Date() } });
	return { title: deck.title, oldCount: deck._count.cards, newCount: cards.length };
}

async function main() {
	const chapterOne = parseMarkdown(readFileSync(chapterOnePath, 'utf8'), 28, '**Example:**');
	const chapterTwo = [...parseMarkdown(readFileSync(chapterTwoPath, 'utf8'), 41, '**Short example:**'), ...chapterTwoCaseCards.map(([question, answer], index) => ({ question, answer, position: 41 + index }))];
	if (chapterTwo.length !== 49) throw new Error(`Expected 49 Chapter 2 cards, found ${chapterTwo.length}.`);
	const result = await prisma.$transaction(async (tx) => ({
		chapterOne: await replaceDeck(tx, 'hrm-lesson-1', chapterOne),
		chapterTwo: await replaceDeck(tx, 'hrm-lesson-2', chapterTwo),
	}));
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
