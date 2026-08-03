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
		challenge: 'Thiếu tiêu chí ưu tiên chung giữa người sáng lập và đội ngũ.',
		approach: [
			'Buổi làm rõ trọng tâm kinh doanh',
			'Lập danh sách ưu tiên trong 30 ngày',
			'Trao đổi ngắn theo từng nhịp',
		],
		deliverables: ['Bản tóm tắt vấn đề và ưu tiên', 'Danh sách công việc theo thứ tự ưu tiên'],
		outcomes: ['Đội ngũ thống nhất ba ưu tiên', 'Giảm những việc song song không cần thiết'],
		relatedServices: ['co-van-doanh-nghiep'],
		permissionStatus: 'pending',
		status: 'draft',
	},
];

export const testimonials: Testimonial[] = [
	{
		id: 't1',
		quote: 'Nội dung tạm — không hiển thị công khai cho đến khi được cho phép.',
		relatedService: 'mentoring',
		permissionStatus: 'pending',
		visibility: 'anonymous',
	},
];

export function getPublishedCaseStudies(): CaseStudy[] {
	return caseStudies.filter(
		(c) =>
			c.status === 'published' &&
			(c.permissionStatus === 'approved' || c.permissionStatus === 'anonymous'),
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
