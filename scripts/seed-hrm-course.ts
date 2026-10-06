import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { LearnCourseLevel, Prisma, PublishStatus } from '@prisma/client';
import { config as loadEnv } from 'dotenv';

import { parseCourseMarkdown } from '../src/features/learn/lessonImport';
import { compareLectureText } from '../src/features/learn/textFidelity';

const COURSE_SLUG = 'hrm';
const COURSE_TITLE = 'HRM — Quản trị nguồn nhân lực';
const DIR = resolve(process.cwd(), 'content/learn/hrm');

function lessonFiles() {
	return readdirSync(DIR)
		.filter((name) => /^bai-\d+\.md$/.test(name))
		.sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));
}

async function main() {
	loadEnv({ path: resolve(process.cwd(), '.env.local') });
	const files = lessonFiles();
	if (!files.length) throw new Error('No HRM lesson markdown in content/learn/hrm');

	const prepared = files.map((name) => {
		const stem = name.replace(/\.md$/, '');
		const originalPath = resolve(DIR, `${stem}.original.txt`);
		const markdown = readFileSync(resolve(DIR, name), 'utf8');
		const original = readFileSync(originalPath, 'utf8');
		const fidelity = compareLectureText(original, markdown);
		if (fidelity.hunks.length)
			throw new Error(`${name} changed ${fidelity.hunks.length} word hunks`);
		const parsed = parseCourseMarkdown(markdown);
		if (parsed.warnings.length) throw new Error(`${name}: ${parsed.warnings.join(' | ')}`);
		const lesson = parsed.lessons[0];
		if (!lesson?.sections.length) throw new Error(`${name} has no sections`);
		const extrasPath = resolve(DIR, `${stem}-them.md`);
		let extras: typeof lesson.sections = [];
		try {
			const extraMd = readFileSync(extrasPath, 'utf8');
			const extraParsed = parseCourseMarkdown(extraMd);
			if (extraParsed.warnings.length)
				throw new Error(`${stem}-them.md: ${extraParsed.warnings.join(' | ')}`);
			extras = extraParsed.lessons[0]?.sections ?? [];
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
		}
		return {
			title: lesson.lessonTitle,
			description: lesson.lessonDescription,
			sections: [...lesson.sections, ...extras],
		};
	});

	if (process.argv.includes('--dry-run')) {
		console.log(
			JSON.stringify(
				prepared.map((lesson) => ({
					title: lesson.title,
					sections: lesson.sections.map((section) => section.title),
				})),
				null,
				2,
			),
		);
		return;
	}

	const { prisma } = await import('../src/lib/prisma');
	try {
		const course = await prisma.learnCourse.upsert({
			where: { slug: COURSE_SLUG },
			update: {
				title: COURSE_TITLE,
				subtitle: 'Human Resource Management · Quản trị nhân lực',
				description:
					'Khóa HRM giảng quản trị nguồn nhân lực bằng ví dụ đời thường: định nghĩa, xu hướng, phân tích công việc, hoạch định và tuyển mộ.',
				category: 'HRM',
				level: LearnCourseLevel.BASIC,
			},
			create: {
				slug: COURSE_SLUG,
				title: COURSE_TITLE,
				subtitle: 'Human Resource Management · Quản trị nhân lực',
				description:
					'Khóa HRM giảng quản trị nguồn nhân lực bằng ví dụ đời thường: định nghĩa, xu hướng, phân tích công việc, hoạch định và tuyển mộ.',
				category: 'HRM',
				level: LearnCourseLevel.BASIC,
				status: PublishStatus.PUBLISHED,
				position:
					((await prisma.learnCourse.aggregate({ _max: { position: true } }))._max.position ?? -1) +
					1,
				publishedAt: new Date(),
			},
		});
		const existing = await prisma.learnLesson.findMany({
			where: { courseId: course.id },
			select: { id: true, title: true },
		});
		const have = new Map(existing.map((lesson) => [lesson.title, lesson.id]));
		const savedTitles: string[] = [];
		for (const lesson of prepared) {
			let lessonId = have.get(lesson.title);
			if (!lessonId) {
				const position = (
					await prisma.learnLesson.aggregate({
						where: { courseId: course.id },
						_max: { position: true },
					})
				)._max.position;
				const created = await prisma.learnLesson.create({
					data: {
						courseId: course.id,
						title: lesson.title,
						description: lesson.description,
						position: (position ?? -1) + 1,
					},
				});
				lessonId = created.id;
			}
			await prisma.learnSection.deleteMany({ where: { lessonId } });
			for (const [index, section] of lesson.sections.entries()) {
				await prisma.learnSection.create({
					data: {
						lessonId,
						type: section.type,
						title: section.title.slice(0, 200),
						summary: section.summary,
						markdown: section.markdown,
						durationMinutes: section.durationMinutes,
						keyTakeaways: section.keyTakeaways,
						checkpoint:
							section.checkpoint === null
								? Prisma.DbNull
								: (section.checkpoint as Prisma.InputJsonValue),
						discussion:
							section.discussion === null
								? Prisma.DbNull
								: (section.discussion as Prisma.InputJsonValue),
						position: index,
					},
				});
			}
			savedTitles.push(lesson.title);
		}
		console.log(
			JSON.stringify({
				status: 'ok',
				courseId: course.id,
				slug: course.slug,
				lessons: savedTitles,
			}),
		);
	} finally {
		await prisma.$disconnect();
	}
}

void main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
