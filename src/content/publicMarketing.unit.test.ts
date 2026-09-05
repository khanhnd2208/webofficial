import { describe, expect, it } from 'vitest';

import { projects } from '@/features/portfolio/data/projects';
import { corePositioning, introPage, projectsPage } from './publicMarketing';
import {
	programDesign,
	serviceOffers,
	servicesClosing,
	servicesFaq,
	servicesPage,
} from './services';

describe('public marketing content', () => {
	it('keeps personal positioning for schema and shared surfaces', () => {
		expect(corePositioning.full).toContain('Nguyễn Duy Khánh');
		expect(corePositioning.promise).toContain('dạy quản trị');
		expect(corePositioning.promise).toContain('AI');
		expect(corePositioning.full).not.toContain('không thay thế tư duy');
	});

	it('keeps the intro cover short and dictionary-like', () => {
		expect(introPage.headline).toBe('Trở thành');
		expect(introPage.partOfSpeech).toBe('[động từ]');
		expect(introPage.cta).toBe('Mở mục lục');
		expect(introPage.lines).toEqual(['Chưa xong.', 'Và có lẽ, đó mới là điều hay.']);
		expect(introPage.year).toBe('2026');
	});

	it('keeps the projects index short and concrete', () => {
		expect(projectsPage.title).toBe('Dự án');
		expect(projectsPage.lead).toBe(
			'Một số lớp học, chương trình và thử nghiệm tôi đã hoặc đang thực hiện.',
		);
	});

	it('structures services as a chooser with three offers and depth behind accordion', () => {
		expect(servicesPage.eyebrow).toBe('Dịch vụ');
		expect(servicesPage.title).toBe(
			'Chúng ta có thể bắt đầu từ một việc bạn muốn làm tốt hơn.',
		);
		expect(servicesPage.trustStrip).toHaveLength(4);
		expect(serviceOffers).toHaveLength(3);
		expect(serviceOffers.map((service) => service.title)).toEqual([
			'Đào tạo quản trị ứng dụng',
			'AI cho công việc và quy trình',
			'Tiếng Anh, tự học và AI cho người học',
		]);
		expect(serviceOffers.map((service) => service.id)).toEqual([
			'management-learning',
			'applied-ai',
			'learning-programs',
		]);

		const [management, ai, learning] = serviceOffers;
		expect(management.topics.length).toBeLessThanOrEqual(5);
		expect(management.details.length).toBeGreaterThan(0);
		expect(management.formats.length).toBeGreaterThan(0);

		expect(ai.topics.length).toBeLessThanOrEqual(5);
		expect(ai.deliverables).toHaveLength(4);
		expect(ai.principleStrip).toHaveLength(3);
		expect(ai.details.length).toBeGreaterThan(0);

		expect(learning.topics).toHaveLength(3);
		expect(learning.formats.some((f) => /lớp|workshop|chuyên đề/i.test(f))).toBe(true);

		expect(programDesign.questions).toHaveLength(3);
		expect(programDesign.output).toMatch(/Nội dung/i);
		expect(servicesFaq).toHaveLength(3);
		expect(servicesClosing.cta).toBe('Gửi lời nhắn');
	});

	it('keeps project pages honest without temporary proof language', () => {
		for (const project of projects) {
			expect(project.template).toMatch(/^(courseDesign|learningLab|inquiry)$/);
			expect(project.status).not.toMatch(/hoàn thiện|tạm thời|sẽ thay|đang chờ/i);
			expect(project.openingQuestion.length).toBeGreaterThan(40);
			expect(project.lessonsLearned.length).toBeGreaterThan(40);
			expect(project.relatedProjects.length).toBeLessThanOrEqual(2);
			for (const media of project.gallery) {
				if (media.proofStatus === 'temporary') {
					expect(media.caption).not.toMatch(/tạm thời|sẽ được thay|đang chờ/i);
				}
			}
		}
		expect(projects.some((project) => project.slug === 'learning-at-moonie-cafe')).toBe(true);
		expect(projects.some((project) => project.slug === 'moonie-cafe-business-development')).toBe(
			false,
		);
	});
});
