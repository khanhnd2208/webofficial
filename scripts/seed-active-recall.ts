import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

expand(config({ path: '.env.local' }));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required to seed Active Recall');

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const cards = [
	{
		question: 'What is human resource management (HRM)?',
		answer: 'HRM is the policies, practices, and systems that influence employees’ behavior, attitudes, and performance.',
	},
	{
		question: 'Which three employee outcomes are influenced by HRM?',
		answer: 'Behavior, attitudes, and performance.',
	},
	{
		question: 'Why can effective HRM contribute to better organizational performance?',
		answer: 'Because HRM influences the people an organization has and how they work. Effective HRM can therefore contribute to better organizational performance.',
	},
	{
		question: 'Who is responsible for managing human resources in an organization?',
		answer: 'Not only the HR department. HR professionals, supervisors, managers, and top management all have roles in managing human resources.',
	},
	{
		question: 'What is human capital?',
		answer: 'Human capital is an organization’s employees described in terms of the knowledge, experience, abilities, and other qualities that can create value for the organization.',
	},
	{
		question: 'Which six employee characteristics does the textbook use to describe human capital?',
		answer: 'Training, experience, judgment, intelligence, relationships, and insight.',
	},
	{
		question: 'Name any three of the six characteristics used to describe human capital.',
		answer: 'For example: training, experience, and judgment.\nAny three of the six elements are acceptable.',
	},
	{
		question: 'What is the difference between the type and behavior of human capital?',
		answer: 'The type of human capital refers to the qualities employees have. The behavior of human capital refers to how employees apply themselves at work.',
	},
	{
		question: 'Which two aspects of employee behavior does HRM influence?',
		answer: 'Motivation and effort.',
	},
	{
		question: 'How does HRM contribute to organizational performance?',
		answer: 'HRM affects the type of people the organization has and how those people behave, which can contribute to organizational performance.',
	},
] as const;

async function main() {
	const existing = await prisma.activeRecallDeck.findUnique({ where: { slug: 'hrm-lesson-1' }, select: { id: true } });
	if (existing) return;
	await prisma.activeRecallDeck.create({
		data: {
			slug: 'hrm-lesson-1',
			title: 'HRM · Lesson 1 — Introduction to HRM',
			subject: 'Human Resource Management',
			lessonLabel: 'Lesson 1',
			description: 'Active recall cards for the foundations of human resource management.',
			status: 'PUBLISHED',
			publishedAt: new Date(),
			cards: { create: cards.map((card, position) => ({ ...card, position })) },
		},
	});
}

main()
	.finally(async () => {
		await prisma.$disconnect();
		await pool.end();
	});
