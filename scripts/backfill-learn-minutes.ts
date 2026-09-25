import { resolve } from 'node:path';

import { config as loadEnv } from 'dotenv';

import { readDiscussion, readQuiz, sectionMinutes } from '../src/features/learn/content';

async function main() {
	loadEnv({ path: resolve(process.cwd(), '.env.local') });
	const { prisma } = await import('../src/lib/prisma');
	try {
		const sections = await prisma.learnSection.findMany({
			select: {
				id: true,
				type: true,
				durationMinutes: true,
				markdown: true,
				quiz: true,
				discussion: true,
				estimatedMinutes: true,
				lesson: { select: { course: { select: { slug: true } } } },
			},
		});
		const before = new Map<string, number>();
		let changed = 0;
		for (const section of sections) {
			const slug = section.lesson.course.slug;
			const minutes = sectionMinutes({
				type: section.type,
				durationMinutes: section.durationMinutes,
				markdown: section.markdown,
				quiz: readQuiz(section.quiz),
				discussion: readDiscussion(section.discussion),
			});
			before.set(slug, (before.get(slug) ?? 0) + minutes);
			if (section.estimatedMinutes === minutes) continue;
			await prisma.learnSection.update({ where: { id: section.id }, data: { estimatedMinutes: minutes } });
			changed += 1;
		}
		const afterRows = await prisma.learnSection.findMany({
			select: { estimatedMinutes: true, lesson: { select: { course: { select: { slug: true } } } } },
		});
		const after = new Map<string, number>();
		for (const row of afterRows) {
			const slug = row.lesson.course.slug;
			after.set(slug, (after.get(slug) ?? 0) + row.estimatedMinutes);
		}
		console.log(JSON.stringify({ changed, courses: [...before.keys()].map((slug) => ({ slug, before: before.get(slug), after: after.get(slug) })) }));
	} finally {
		await prisma.$disconnect();
	}
}

void main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
