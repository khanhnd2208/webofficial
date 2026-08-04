import { describe, expect, it } from 'vitest';

import { projects } from '@/features/portfolio/data/projects';
import {
	closingMessage,
	corePositioning,
	homeClassroomCards,
	serviceOffers,
	serviceTeasers,
	servicesPage,
} from './publicMarketing';

describe('public marketing content', () => {
	it('locks the human-first hero positioning', () => {
		expect(corePositioning.eyebrow).toBe('Educator · Explorer');
		expect(corePositioning.manifesto).toBe('Tôi làm giáo dục để tiếp tục học.');
		expect(corePositioning.thesis).toContain('sự chăm chút của một tác phẩm');
		expect(corePositioning.full).toContain('Nguyễn Duy Khánh');
		expect(corePositioning.overlay).toBe('Hà Nội · Lớp học · Những thử nghiệm');
	});

	it('uses a personal positioning promise across the public journey', () => {
		expect(corePositioning.promise).toContain('dạy quản trị');
		expect(corePositioning.promise).toContain('AI');
		expect(corePositioning.full).toContain('khám phá cách AI có thể giúp');
		expect(corePositioning.full).not.toContain('không thay thế tư duy');
	});

	it('keeps homepage classroom cards short and linked to real projects', () => {
		expect(homeClassroomCards).toHaveLength(3);
		for (const card of homeClassroomCards) {
			expect(projects.some((project) => project.slug === card.slug)).toBe(true);
			expect(card.description.trim().split(/\s+/).length).toBeLessThanOrEqual(25);
		}
		expect(homeClassroomCards.some((card) => card.slug === 'learning-at-moonie-cafe')).toBe(true);
	});

	it('keeps service teasers short for the homepage', () => {
		expect(serviceTeasers).toHaveLength(3);
		for (const teaser of serviceTeasers) {
			expect(serviceOffers.some((service) => service.id === teaser.id)).toBe(true);
			expect(teaser.description.trim().split(/\s+/).length).toBeLessThanOrEqual(30);
		}
		expect(closingMessage.cta).toBe('Gửi tôi một lời nhắn');
	});

	it('structures services around situations, activities and a shared fit block', () => {
		expect(servicesPage.fitCriteria.length).toBeGreaterThanOrEqual(3);
		expect(servicesPage.boundary).toContain('không nhận làm bài');
		for (const service of serviceOffers) {
			expect(service.whenUseful.length).toBeGreaterThan(40);
			expect(service.activities.length).toBeGreaterThanOrEqual(3);
			expect(service.process).toEqual(['Hiểu bối cảnh', 'Thiết kế cách làm', 'Thử và điều chỉnh']);
			expect(service.cta).toMatch(/Trao đổi/i);
			expect(projects.some((project) => project.slug === service.project)).toBe(true);
			expect('notFit' in service).toBe(false);
			expect('deliverables' in service).toBe(false);
		}
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
