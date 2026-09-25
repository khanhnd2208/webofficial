import { resolve } from 'node:path';

import { config as loadEnv } from 'dotenv';

async function main() {
	loadEnv({ path: resolve(process.cwd(), '.env.local') });
	const { prisma } = await import('../src/lib/prisma');
	const courses = await prisma.learnCourse.findMany({
		select: {
			slug: true,
			title: true,
			lessons: { orderBy: { position: 'asc' }, select: { title: true, sections: { select: { title: true, type: true } } } },
		},
	});
	console.log(JSON.stringify(courses, null, 2));
	await prisma.$disconnect();
}

void main();
