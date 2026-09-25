import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { LearnCourseLevel, Prisma, PublishStatus } from '@prisma/client';
import { config as loadEnv } from 'dotenv';

import { parseCourseMarkdown } from '../src/features/learn/lessonImport';
import { compareLectureText } from '../src/features/learn/textFidelity';

const COURSE_SLUG = 'itm';
const COURSE_TITLE = 'ITM — Nhập môn quản trị';
const LESSON_TITLE = 'Bài 1 — Nhà quản trị và bạn ở nơi làm việc';

const sectionTitles = [
	'Mở đầu: Vì sao một tổ chức có thể sụp đổ dù không ai phá nó?',
	'Phần 1. Nhà quản trị là ai, và họ làm việc ở đâu?',
	'Phần 2. Vì sao tổ chức cần nhà quản trị?',
	'Phần 3. Quản trị là gì, và nhà quản trị thực sự làm gì?',
	'Phần 4. Điều gì đang thay đổi công việc của nhà quản trị?',
	'Phần 5. Nghề quản trị và những kỹ năng cần có',
	'Phần 6. Không định làm sếp, có cần học quản trị không?',
	'Góc đọc thêm',
	'Tổng kết bài 1',
];

async function main() {
	loadEnv({ path: resolve(process.cwd(), '.env.local') });
	const original = readFileSync(resolve(process.cwd(), 'content/learn/itm/bai-1.original.txt'), 'utf8');
	const markdown = readFileSync(resolve(process.cwd(), 'content/learn/itm/bai-1.md'), 'utf8');
	const extrasMarkdown = readFileSync(resolve(process.cwd(), 'content/learn/itm/bai-1-them.md'), 'utf8');
	const parsed = parseCourseMarkdown(markdown);
	if (parsed.lessons.length !== 1 || parsed.lessons[0]?.lessonTitle !== LESSON_TITLE) {
		throw new Error('ITM lesson normalization produced an unexpected lesson shape');
	}
	const lesson = parsed.lessons[0];
	if (!lesson || lesson.sections.length !== sectionTitles.length) {
		throw new Error(`Expected ${sectionTitles.length} sections, got ${lesson?.sections.length ?? 0}`);
	}
	if (lesson.sections.some((section, index) => section.title !== sectionTitles[index])) {
		throw new Error('ITM section titles no longer match the published lesson');
	}
	if (parsed.warnings.length) {
		throw new Error(`ITM lesson import warnings: ${parsed.warnings.join(' | ')}`);
	}
	const fidelity = compareLectureText(original, markdown);
	if (fidelity.hunks.length) {
		throw new Error(`ITM formatting changed ${fidelity.hunks.length} word hunks`);
	}
	const extras = parseCourseMarkdown(extrasMarkdown).lessons[0]?.sections ?? [];
	if (extras.map((section) => section.type).join(',') !== 'QUIZ,READING,DISCUSSION') {
		throw new Error(`Expected quiz, guide, and discussion sections, got ${extras.map((section) => section.type).join(',')}`);
	}
	if (extras[0]?.quiz?.questions.length !== 3) throw new Error('ITM quiz must have 3 questions');
	if (extras[2]?.discussion?.questions.length !== 16) throw new Error('ITM discussion must have 16 questions');
	const sections = [...lesson.sections, ...extras];
	if (process.argv.includes('--dry-run')) {
		console.log(JSON.stringify({ status: 'valid', lessonTitle: lesson.lessonTitle, sectionCount: sections.length, quizQuestions: extras[0]?.quiz?.questions.length, discussionQuestions: extras[2]?.discussion?.questions.length, matchPercent: fidelity.matchPercent }));
		return;
	}

	const { prisma } = await import('../src/lib/prisma');
	try {
		const existing = await prisma.learnCourse.findUnique({
			where: { slug: COURSE_SLUG },
			include: { lessons: { include: { sections: true } } },
		});
		if (existing) {
			const alreadySeeded = existing.lessons.some(
				(item) => item.title === LESSON_TITLE && item.sections.some((section) => section.markdown.includes('Nhà quản trị')),
			);
			if (alreadySeeded) {
				const target = existing.lessons.find((item) => item.title === LESSON_TITLE);
				const have = new Set(target?.sections.map((section) => section.title) ?? []);
				const missing = extras.filter((section) => !have.has(section.title));
				if (!target || !missing.length) {
					console.log(JSON.stringify({ status: 'skipped', courseId: existing.id, slug: existing.slug }));
					return;
				}
				const start = target.sections.length;
				await prisma.$transaction(
					missing.map((section, index) =>
						prisma.learnSection.create({
							data: {
								lessonId: target.id,
								type: section.type,
								title: section.title,
								durationMinutes: section.durationMinutes,
								summary: section.summary,
								keyTakeaways: section.keyTakeaways,
								markdown: section.markdown,
								checkpoint: section.checkpoint === null ? Prisma.DbNull : (section.checkpoint as Prisma.InputJsonValue),
								quiz: section.quiz === null ? Prisma.DbNull : (section.quiz as Prisma.InputJsonValue),
								discussion: section.discussion === null ? Prisma.DbNull : (section.discussion as Prisma.InputJsonValue),
								position: start + index,
							},
						}),
					),
				);
				console.log(JSON.stringify({ status: 'appended', courseId: existing.id, added: missing.map((section) => section.title) }));
				return;
			}
			const placeholderOnly =
				existing.lessons.length === 1 &&
				existing.lessons[0]?.title === 'Bài 1' &&
				existing.lessons[0].sections.length === 1 &&
				!existing.lessons[0].sections[0]?.markdown.trim();
			if (!placeholderOnly) {
				throw new Error('Course slug itm already exists with content; refusing to overwrite it');
			}
		}

		const result = await prisma.$transaction(async (tx) => {
			const current = await tx.learnCourse.findUnique({
				where: { slug: COURSE_SLUG },
				select: { id: true },
			});
			const course = current
				? await tx.learnCourse.update({
						where: { id: current.id },
						data: {
							title: COURSE_TITLE,
							subtitle: 'Introduction to Management · Nhập môn quản trị',
							description: 'Khóa ITM giúp bạn hiểu nhà quản trị, tổ chức, các chức năng quản trị và những kỹ năng cần thiết để làm việc hiệu quả trong bối cảnh mới.',
							category: 'ITM',
							level: LearnCourseLevel.BASIC,
							status: PublishStatus.PUBLISHED,
							publishedAt: new Date(),
						},
					})
				: await tx.learnCourse.create({
						data: {
							slug: COURSE_SLUG,
							title: COURSE_TITLE,
							subtitle: 'Introduction to Management · Nhập môn quản trị',
							description: 'Khóa ITM giúp bạn hiểu nhà quản trị, tổ chức, các chức năng quản trị và những kỹ năng cần thiết để làm việc hiệu quả trong bối cảnh mới.',
							category: 'ITM',
							level: LearnCourseLevel.BASIC,
							status: PublishStatus.PUBLISHED,
							position: ((await tx.learnCourse.aggregate({ _max: { position: true } }))._max.position ?? -1) + 1,
							publishedAt: new Date(),
						},
					});

			if (current) {
				await tx.learnLesson.deleteMany({ where: { courseId: course.id } });
			}
			const savedLesson = await tx.learnLesson.create({
				data: {
					courseId: course.id,
					title: lesson.lessonTitle,
					description: lesson.lessonDescription,
					position: 0,
				},
			});
			for (const [position, section] of sections.entries()) {
				await tx.learnSection.create({
					data: {
						lessonId: savedLesson.id,
						type: section.type,
						title: section.title,
						durationMinutes: section.durationMinutes,
						summary: section.summary,
						keyTakeaways: section.keyTakeaways,
						markdown: section.markdown,
						checkpoint: section.checkpoint === null ? Prisma.DbNull : (section.checkpoint as Prisma.InputJsonValue),
						quiz: section.quiz === null ? Prisma.DbNull : (section.quiz as Prisma.InputJsonValue),
						discussion: section.discussion === null ? Prisma.DbNull : (section.discussion as Prisma.InputJsonValue),
						position,
					},
				});
			}
			return { courseId: course.id, lessonId: savedLesson.id, sectionCount: sections.length };
		});
		console.log(JSON.stringify({ status: 'created', ...result }));
	} finally {
		await prisma.$disconnect();
	}
}

void main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
