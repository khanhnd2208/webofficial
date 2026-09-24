import { gunzipSync } from 'node:zlib';

import { LearnCourseLevel, Prisma, PublishStatus } from '@prisma/client';

import { prisma } from '../src/lib/prisma';
import { parseCourseMarkdown } from '../src/features/learn/lessonImport';
import { compareLectureText } from '../src/features/learn/textFidelity';

const SOURCE_GZIP_BASE64 = [
	'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',
	'hjbBPTvOe2Z9ybX/Ac4H5LmurgAA'
].join('');

const COURSE_SLUG = 'itm';
const COURSE_TITLE = 'ITM — Nhập môn quản trị';
const LESSON_TITLE = 'Bài 1 — Nhà quản trị và bạn ở nơi làm việc';

const sectionTitles = new Set([
	'Mở đầu: Vì sao một tổ chức có thể sụp đổ dù không ai phá nó?',
	'Phần 1. Nhà quản trị là ai, và họ làm việc ở đâu?',
	'Phần 2. Vì sao tổ chức cần nhà quản trị?',
	'Phần 3. Quản trị là gì, và nhà quản trị thực sự làm gì?',
	'Phần 4. Điều gì đang thay đổi công việc của nhà quản trị?',
	'Phần 5. Nghề quản trị và những kỹ năng cần có',
	'Phần 6. Không định làm sếp, có cần học quản trị không?',
	'Góc đọc thêm',
	'Tổng kết bài 1',
]);

const internalHeadings = new Set([
	'Một hiểu lầm cần bỏ ngay từ đầu',
	'Về cách tôi viết bài giảng này',
	'Bản đồ bài học: cái gì cần nắm chắc?',
	'Định nghĩa: không phải ai có chức danh "trưởng" mới là nhà quản trị',
	'Ba cấp quản trị trong tổ chức truyền thống',
	'Khi không còn "sếp": mô hình tự quản (đọc thêm)',
	'Nhà quản trị làm việc ở đâu? Trong các tổ chức',
	'Định nghĩa quản trị',
	'Hiệu suất và hiệu quả: làm đúng cách và làm đúng việc',
	'Bốn chức năng quản trị',
	'Các vai trò của nhà quản trị (Mintzberg)',
	'Vậy nên dùng cách nhìn nào?',
	'Nghề quản trị có tương lai không?',
	'Cái bẫy thăng chức: giỏi chuyên môn chưa chắc giỏi quản lý',
	'Ba nhóm kỹ năng của nhà quản trị (Katz)',
	'Góc đọc thêm',
	'Học từ thất bại',
	'Chính trị công sở',
	'Ghi nhớ trong 6 dòng',
	'Từ khóa của bài',
	'Câu hỏi tự kiểm tra',
	'Bài tập thực hành trong tuần',
]);

const tableRanges = [
	['Tầng', 'Không bắt buộc, đọc khi bạn muốn đi xa hơn'],
	['Cấp', 'Trực tiếp quản lý những người làm ra sản phẩm hoặc phục vụ khách hàng'],
	['Hiệu suất (Efficiency)', 'Ghi nhớ sở thích của khách quen để lần sau phục vụ đúng ý, khiến khách quay lại'],
	['Nhóm vai trò', 'Quyết định ra món mới; xử lý khi máy pha hỏng; chia ngân sách; thương lượng giá cà phê hạt'],
	['Nhóm', 'Đàm phán giá với nhà cung cấp, thỏa thuận lương'],
	['Cấp quản trị', 'Rất cần'],
	['Thuật ngữ', 'Đánh giá tích cực về cuộc sống và cảm thấy ổn, gồm cả sức khỏe thể chất lẫn tinh thần'],
];

const flowcharts = [
	['flowchart TD', 'Cấp'],
	['flowchart LR', '1. Hoạch định (Planning) — Đặt mục tiêu, chọn chiến lược để đạt mục tiêu, và lập kế hoạch để phối hợp các hoạt động. Nếu bạn không định đi đâu thì đường nào cũng được. Nhưng khi đã có đích đến, bạn phải tính đường đi tốt nhất. Tổ chức nào cũng tồn tại vì một mục đích, và nhà quản trị là người xác định mục đích đó cùng con đường đi tới.'],
	['flowchart TD', 'Điều đó không có nghĩa là ở đâu quản trị cũng giống hệt nhau. Một trưởng nhóm kiểm thử phần mềm và tổng giám đốc của chính công ty đó đều hoạch định, tổ chức, lãnh đạo và kiểm soát. Khác biệt chỉ nằm ở mức độ và trọng tâm, không phải ở bản chất công việc.'],
];

function normalizeLecture(raw: string): string {
	const lines = raw.replace(/\r\n?/g, '\n').trim().split('\n');
	const result: string[] = [];
	let codeEndExclusive: string | null = null;
	let tableEndInclusive: string | null = null;
	let takeawayMode = false;
	let takeawayCount = 0;
	let nextFlowchartIndex = 0;

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		const text = line.trim();

		if (codeEndExclusive && text === codeEndExclusive) {
			result.push('```');
			codeEndExclusive = null;
		}

		if (tableEndInclusive && text === tableEndInclusive) {
			result.push(line);
			result.push('```');
			tableEndInclusive = null;
			continue;
		}
		if (tableEndInclusive) {
			result.push(line);
			continue;
		}
		if (codeEndExclusive) {
			result.push(line);
			continue;
		}

		if (index === 0) {
			result.push(`# ${line}`);
			continue;
		}
		if (index === 1) {
			result.push(`> ${line}`);
			continue;
		}

		if (sectionTitles.has(text)) {
			result.push('', `=== SECTION: ${text} ===`, '');
			continue;
		}

		if (text === 'Ghi nhớ trong 6 dòng') {
			result.push('', `## ${text}`, '', '> [!TAKEAWAYS]');
			takeawayMode = true;
			takeawayCount = 0;
			continue;
		}
		if (takeawayMode && /^\\d+\\.\\s/.test(text)) {
			result.push(`> - ${line}`);
			takeawayCount += 1;
			if (takeawayCount === 6) {
				takeawayMode = false;
				result.push('');
			}
			continue;
		}

		const tableStart = tableRanges.find(([start]) => start === text);
		if (tableStart) {
			result.push('', '```text', line);
			tableEndInclusive = tableStart[1];
			continue;
		}

		const flowchart = flowcharts[nextFlowchartIndex]?.[0] === text ? flowcharts[nextFlowchartIndex++] : undefined;
		if (flowchart) {
			result.push('', '```text', line);
			codeEndExclusive = flowchart[1];
			continue;
		}

		if (internalHeadings.has(text)) {
			result.push('', `## ${text}`, '');
			continue;
		}

		if (text === 'Nhà quản trị là người điều phối và giám sát công việc của người khác để tổ chức đạt được mục tiêu.' || text === 'Quản trị là quá trình điều phối và giám sát công việc của người khác để công việc đó được hoàn thành một cách hiệu suất và hiệu quả.') {
			result.push('> [!DEFINITION]', `> ${line}`);
			continue;
		}

		if (text.startsWith('Câu hỏi nhanh cho bạn:')) {
			result.push('> [!REFLECT]', `> ${line}`);
			continue;
		}

		if (line.startsWith('• ')) {
			result.push(`- ${line.slice(2)}`);
			continue;
		}

		result.push(line);
	}

	if (codeEndExclusive) result.push('```');
	if (tableEndInclusive) result.push('```');
	return result.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

async function main() {
	const raw = gunzipSync(Buffer.from(SOURCE_GZIP_BASE64, 'base64')).toString('utf8');
	const markdown = normalizeLecture(raw);
	const parsed = parseCourseMarkdown(markdown);
	if (parsed.lessons.length !== 1 || parsed.lessons[0]?.lessonTitle !== LESSON_TITLE) {
		throw new Error('ITM lesson normalization produced an unexpected lesson shape');
	}
	const lesson = parsed.lessons[0];
	if (!lesson || lesson.sections.length !== sectionTitles.size) {
		throw new Error(`Expected ${sectionTitles.size} sections, got ${lesson?.sections.length ?? 0}`);
	}
	if (parsed.warnings.length) {
		throw new Error(`ITM lesson import warnings: ${parsed.warnings.join(' | ')}`);
	}
	const fidelity = compareLectureText(raw, markdown);
	if (fidelity.hunks.length) {
		throw new Error(`ITM formatting changed ${fidelity.hunks.length} word hunks`);
	}
	if (process.argv.includes('--dry-run')) {
		console.log(JSON.stringify({ status: 'valid', lessonTitle: lesson.lessonTitle, sectionCount: lesson.sections.length, matchPercent: fidelity.matchPercent }));
		return;
	}

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
				console.log(JSON.stringify({ status: 'skipped', courseId: existing.id, slug: existing.slug }));
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
			for (const [position, section] of lesson.sections.entries()) {
				await tx.learnSection.create({
					data: {
						lessonId: savedLesson.id,
						type: section.type,
						title: section.title,
						durationMinutes: section.durationMinutes,
						summary: section.summary,
						keyTakeaways: section.keyTakeaways,
						markdown: section.markdown,
						checkpoint: section.checkpoint === null ? Prisma.DbNull : section.checkpoint as Prisma.InputJsonValue,
						quiz: section.quiz === null ? Prisma.DbNull : section.quiz as Prisma.InputJsonValue,
						position,
					},
				});
			}
			return { courseId: course.id, lessonId: savedLesson.id, sectionCount: lesson.sections.length };
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
