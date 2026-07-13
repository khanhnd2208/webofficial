import type { CaseStudy, Testimonial } from './types';

/**
 * Case studies and testimonials stay draft until permission is approved.
 * Do not invent public social proof.
 */
export const caseStudies: CaseStudy[] = [
	{
		slug: 'clarity-sprint-anon',
		title: 'Làm rõ ưu tiên vận hành cho đội ngũ sớm',
		isAnonymous: true,
		context: 'Đội ngũ nhỏ đang chạy nhiều sáng kiến song song.',
		challenge: 'Thiếu tiêu chí ưu tiên chung giữa founder và team.',
		approach: ['Business Clarity Session', 'Lập backlog 30 ngày', 'Nhịp check-in ngắn'],
		deliverables: ['Clarity brief', 'Backlog ưu tiên'],
		outcomes: ['Team thống nhất 3 ưu tiên', 'Giảm việc làm song song không cần thiết'],
		relatedServices: ['co-van-doanh-nghiep'],
		permissionStatus: 'pending',
		status: 'draft',
	},
];

export const testimonials: Testimonial[] = [
	{
		id: 't1',
		quote: 'Placeholder — không hiển thị công khai cho đến khi có permission.',
		relatedService: 'mentoring',
		permissionStatus: 'pending',
		visibility: 'anonymous',
	},
];

export function getPublishedCaseStudies(): CaseStudy[] {
	return caseStudies.filter(
		(c) => c.status === 'published' && (c.permissionStatus === 'approved' || c.permissionStatus === 'anonymous'),
	);
}

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
	return getPublishedCaseStudies().find((c) => c.slug === slug);
}

export function getApprovedTestimonials(serviceSlug?: string): Testimonial[] {
	return testimonials.filter((t) => {
		if (t.permissionStatus !== 'approved') return false;
		if (serviceSlug && t.relatedService !== serviceSlug) return false;
		return true;
	});
}
