/* ════════════════════════════════════════════════════════════════════════
   prisma/seed.ts — Seed database with test data
   Run: npx tsx prisma/seed.ts
   ════════════════════════════════════════════════════════════════════════ */
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/teaching_platform_vocab';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ADMIN_MONGO_ID = 'seed-admin-000000000001';
const USER_MONGO_ID  = 'seed-user-000000000001';

const SETS = [
	{
		title: 'IELTS Essential Vocabulary',
		description: 'High-frequency words for IELTS Academic band 7.0+',
		words: [
			{ term: 'abundant', definition: 'present in large quantities', partOfSpeech: 'adjective', example: 'The region has abundant natural resources.' },
			{ term: 'accumulate', definition: 'gather together or acquire an increasing number of', partOfSpeech: 'verb', example: 'She accumulated a vast collection of books.' },
			{ term: 'adequate', definition: 'satisfactory or acceptable in quality or quantity', partOfSpeech: 'adjective', example: 'The salary is adequate for a fresh graduate.' },
			{ term: 'ambiguous', definition: 'open to more than one interpretation', partOfSpeech: 'adjective', example: 'The question was ambiguous and confused many students.' },
			{ term: 'analyse', definition: 'examine in detail', partOfSpeech: 'verb', example: 'Scientists analyse the data carefully.' },
			{ term: 'approach', definition: 'a way of dealing with something', partOfSpeech: 'noun', example: 'We need a new approach to this problem.' },
			{ term: 'assess', definition: 'evaluate or estimate the nature or quality of', partOfSpeech: 'verb', example: 'The teacher will assess the students\'s progress.' },
{ term: 'assume', definition: 'suppose to be the case without proof', partOfSpeech: 'verb', example: 'Never assume you know the answer.' },
{ term: 'benefit', definition: 'an advantage or profit gained from something', partOfSpeech: 'noun', example: 'Exercise has many benefits for health.' },
{ term: 'category', definition: 'a class or division of things', partOfSpeech: 'noun', example: 'Books are sorted into different categories.' },
],
},
{
title: 'Business English Essentials',
description: 'Key vocabulary for professional communication',
words: [
{ term: 'agenda', definition: 'a list of items to be discussed at a meeting', partOfSpeech: 'noun', example: 'Please review the meeting agenda beforehand.' },
{ term: 'allocate', definition: 'distribute resources or duties for a particular purpose', partOfSpeech: 'verb', example: 'The manager allocated tasks to each team member.' },
{ term: 'benchmark', definition: 'a standard or point of reference against which things may be compared', partOfSpeech: 'noun', example: 'The company set a new benchmark for customer service.' },
{ term: 'collaborate', definition: 'work jointly on an activity or project', partOfSpeech: 'verb', example: 'The teams collaborated to deliver the project on time.' },
{ term: 'deadline', definition: 'the latest time by which something should be completed', partOfSpeech: 'noun', example: 'We must meet the project deadline.' },
{ term: 'delegate', definition: 'entrust a task or responsibility to another person', partOfSpeech: 'verb', example: 'A good manager knows how to delegate effectively.' },
{ term: 'efficient', definition: 'achieving maximum productivity with minimum wasted effort', partOfSpeech: 'adjective', example: 'The new process is far more efficient.' },
{ term: 'facilitate', definition: 'make an action or process easier', partOfSpeech: 'verb', example: 'Technology facilitates remote collaboration.' },
{ term: 'implement', definition: 'put a decision, plan, or agreement into effect', partOfSpeech: 'verb', example: 'We need to implement the new policy immediately.' },
{ term: 'leverage', definition: 'use something to maximum advantage', partOfSpeech: 'verb', example: 'We can leverage social media to reach more customers.' },
],
},
{
title: 'TOEIC Vocabulary: Parts 5 & 6',
description: 'Grammar-focused vocabulary for TOEIC Reading',
words: [
{ term: 'adjacent', definition: 'next to or adjoining something else', partOfSpeech: 'adjective', example: 'The conference room is adjacent to the lobby.' },
{ term: 'approximately', definition: 'used to show that something is almost, but not completely, accurate', partOfSpeech: 'adverb', example: 'The project will take approximately three months.' },
{ term: 'authorize', definition: 'give official permission for or approval to', partOfSpeech: 'verb', example: 'Only the director can authorize such expenditures.' },
{ term: 'available', definition: 'able to be used or obtained', partOfSpeech: 'adjective', example: 'Is the conference room available on Friday?' },
{ term: 'circulate', definition: 'move or cause to move continuously through a closed system', partOfSpeech: 'verb', example: 'Please circulate the memo to all staff.' },
{ term: 'clarify', definition: 'make a statement or situation less confused and more comprehensible', partOfSpeech: 'verb', example: 'Could you clarify your position on this issue?' },
{ term: 'comply', definition: 'act in accordance with a wish or command', partOfSpeech: 'verb', example: 'All employees must comply with the safety regulations.' },
{ term: 'comprehensive', definition: 'including or dealing with all or nearly all aspects of something', partOfSpeech: 'adjective', example: 'She wrote a comprehensive report on the market.' },
{ term: 'consecutive', definition: 'following continuously', partOfSpeech: 'adjective', example: 'Sales grew for five consecutive quarters.' },
{ term: 'coordinate', definition: 'bring the different elements of a complex activity into a harmonious relationship', partOfSpeech: 'verb', example: 'She will coordinate all logistics for the event.' },
],
},
];

async function main() {
	console.log('🌱 Seeding vocab database...');

	// Clean existing seed data
	await prisma.userWordStat.deleteMany({ where: { userId: { in: [ADMIN_MONGO_ID, USER_MONGO_ID] } } });
	await prisma.userVocabSet.deleteMany({ where: { userId: { in: [ADMIN_MONGO_ID, USER_MONGO_ID] } } });
	await prisma.vocabSet.deleteMany({ where: { ownerId: ADMIN_MONGO_ID } });

	// Create VocabSets (admin-owned)
	const createdSets = [];
	for (const setData of SETS) {
		const set = await prisma.vocabSet.create({
data: {
title: setData.title,
description: setData.description,
ownerId: ADMIN_MONGO_ID,
ownerName: 'Admin (Seed)',
words: { create: setData.words },
},
include: { words: true },
});
		createdSets.push(set);
		console.log(`  ✅ Created set: "${set.title}" (${set.words.length} words)`);
	}

	// Create UserVocabSet entries for test user (first 2 sets)
	for (const set of createdSets.slice(0, 2)) {
		await prisma.userVocabSet.create({
data: { userId: USER_MONGO_ID, vocabSetId: set.id, status: 'active' },
});
		console.log(`  📚 Added "${set.title}" to test user library`);
	}

	// Create some UserWordStat entries for test user (first set, first 5 words)
	const firstSet = createdSets[0];
	for (const word of firstSet.words.slice(0, 5)) {
		await prisma.userWordStat.create({
data: {
userId: USER_MONGO_ID,
wordId: word.id,
correctCount: Math.floor(Math.random() * 10),
				wrongCount: Math.floor(Math.random() * 5),
				streak: Math.floor(Math.random() * 7),
			},
		});
	}
	console.log(`  📊 Created word stats for test user`);

	console.log('\n✅ Seed complete!');
	console.log(`   Admin MongoDB ID : ${ADMIN_MONGO_ID}`);
	console.log(`   User  MongoDB ID : ${USER_MONGO_ID}`);
	console.log(`   Sets created     : ${createdSets.length}`);
}

main()
	.catch((e) => { console.error(e); process.exit(1); })
	.finally(() => prisma.$disconnect());
