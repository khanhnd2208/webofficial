import { describe, expect, it } from 'vitest';

import { projects } from '@/features/portfolio/data/projects';
import { corePositioning, needStates, serviceOffers } from './publicMarketing';

describe('public marketing content', () => {
	it('uses one concrete positioning promise across the public journey', () => {
		expect(corePositioning.promise).toContain('người học và tổ chức');
		expect(corePositioning.promise).toContain('có thể áp dụng');
	});

	it('gives each priority need a service, proof and inquiry route', () => {
		expect(needStates).toHaveLength(3);
		for (const need of needStates) {
			expect(serviceOffers.some((service) => service.id === need.serviceId)).toBe(true);
			expect(projects.some((project) => project.slug === need.project)).toBe(true);
			expect(need.inquiryType).toBeTruthy();
		}
	});

	it('productizes every service with fit, outcomes, formats, deliverables and qualification', () => {
		for (const service of serviceOffers) {
			expect(service.fit.length).toBeGreaterThan(40);
			expect(service.outcomes.length).toBeGreaterThanOrEqual(3);
			expect(service.formats.length).toBeGreaterThanOrEqual(3);
			expect(service.deliverables.length).toBeGreaterThanOrEqual(4);
			expect(service.notFit.length).toBeGreaterThan(30);
			expect(service.cta).not.toMatch(/^Trao đổi nhu cầu$/i);
			for (const item of [...service.formats, ...service.deliverables]) {
				expect(item).not.toMatch(
					/^(Lesson plan|Slide deck|Case pack|Course map|Corporate training|Diagnostic session)$/i,
				);
			}
		}
	});

	it('keeps scope facts separate from verified impact', () => {
		for (const project of projects) {
			expect(project.projectFacts.length).toBeGreaterThan(0);
			expect('impact' in project).toBe(false);
			if (project.verifiedImpact) {
				expect(project.verifiedImpact.length).toBeGreaterThan(0);
			}
		}
	});
});
