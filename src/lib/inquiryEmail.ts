import 'server-only';

import { routes } from '@/config/routes';
import { absoluteUrl, SITE_NAME } from '@/config/site';
import type { IInquiry, InquiryType } from '@/models/Inquiry';

const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
	training: 'Giảng dạy & workshop',
	'learning-design': 'Thiết kế chương trình học',
	'people-organization': 'Tư vấn phát triển con người & tổ chức',
	unsure: 'Chưa chắc',
	other: 'Khác',
	mentoring: 'Mentoring cá nhân',
	business: 'Cố vấn doanh nghiệp',
	ai: 'AI ứng dụng',
	course: 'Khóa học',
};

export interface InquiryEmailConfig {
	apiKey: string;
	fromEmail: string;
	notifyEmail: string;
}

export function getInquiryEmailConfig(): InquiryEmailConfig | null {
	const apiKey = process.env.RESEND_API_KEY?.trim();
	const fromEmail = process.env.INQUIRY_FROM_EMAIL?.trim();
	const notifyEmail = process.env.INQUIRY_NOTIFY_EMAIL?.trim();
	if (!apiKey || !fromEmail || !notifyEmail) return null;
	return { apiKey, fromEmail, notifyEmail };
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function buildSummary(inquiry: Pick<IInquiry, 'context' | 'problem' | 'desiredOutcome'>): string {
	const parts = [inquiry.context.trim()];
	if (inquiry.problem?.trim()) parts.push(`Vấn đề: ${inquiry.problem.trim()}`);
	if (inquiry.desiredOutcome?.trim()) parts.push(`Mong muốn: ${inquiry.desiredOutcome.trim()}`);
	const combined = parts.join(' · ');
	return combined.length > 400 ? `${combined.slice(0, 397)}…` : combined;
}

function adminInquiryUrl(id: string): string {
	return absoluteUrl(`${routes.admin.inquiries}/${id}`);
}

async function sendResendEmail(input: {
	apiKey: string;
	from: string;
	to: string[];
	subject: string;
	html: string;
}): Promise<void> {
	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${input.apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			from: input.from,
			to: input.to,
			subject: input.subject,
			html: input.html,
		}),
	});

	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(body || `Resend API error (${res.status})`);
	}
}

export type SendInquiryEmailsResult =
	| { ok: true; emailStatus: 'sent' }
	| { ok: false; emailStatus: 'pending' | 'failed'; emailError: string };

/**
 * Sends customer confirmation (no sensitive body) and owner notification.
 * Skips when Resend env is incomplete — inquiry is still saved.
 */
export async function sendInquiryEmails(
	inquiry: IInquiry & { _id: unknown },
): Promise<SendInquiryEmailsResult> {
	const config = getInquiryEmailConfig();
	if (!config) {
		return {
			ok: false,
			emailStatus: 'pending',
			emailError: 'Email delivery not configured',
		};
	}

	const id = String(inquiry._id);
	const typeLabel = INQUIRY_TYPE_LABELS[inquiry.inquiryType];
	const summary = escapeHtml(buildSummary(inquiry));

	try {
		await sendResendEmail({
			apiKey: config.apiKey,
			from: config.fromEmail,
			to: [inquiry.email],
			subject: `${SITE_NAME} — Đã nhận yêu cầu liên hệ`,
			html: `
				<p>Xin chào ${escapeHtml(inquiry.name)},</p>
				<p>Cảm ơn bạn đã gửi yêu cầu <strong>${escapeHtml(typeLabel)}</strong>. Khánh đã nhận được và sẽ phản hồi qua email trong thời gian sớm nhất có thể.</p>
				<p>Bạn không cần gửi lại nội dung chi tiết — chúng tôi đã lưu an toàn trên hệ thống.</p>
				<p>Trân trọng,<br/>${escapeHtml(SITE_NAME)}</p>
			`.trim(),
		});

		await sendResendEmail({
			apiKey: config.apiKey,
			from: config.fromEmail,
			to: [config.notifyEmail],
			subject: `[Inquiry] ${typeLabel} — ${inquiry.name}`,
			html: `
				<h2>Yêu cầu liên hệ mới</h2>
				<ul>
					<li><strong>Loại:</strong> ${escapeHtml(typeLabel)}</li>
					<li><strong>Tên:</strong> ${escapeHtml(inquiry.name)}</li>
					<li><strong>Email:</strong> ${escapeHtml(inquiry.email)}</li>
				</ul>
				<p><strong>Tóm tắt:</strong> ${summary}</p>
				<p><a href="${adminInquiryUrl(id)}">Xem trong admin</a></p>
			`.trim(),
		});

		return { ok: true, emailStatus: 'sent' };
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Email send failed';
		console.error('[inquiryEmail]', message);
		return { ok: false, emailStatus: 'failed', emailError: message };
	}
}

export { buildSummary, INQUIRY_TYPE_LABELS };
