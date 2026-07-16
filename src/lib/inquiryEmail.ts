import 'server-only';

import { routes } from '@/config/routes';
import { absoluteUrl, SITE_NAME } from '@/config/site';
import { INQUIRY_TYPE_LABELS, type InquiryEmailStatus } from '@/features/inquiries/constants';
import type { IInquiry } from '@/models/Inquiry';

export const INQUIRY_EMAIL_TIMEOUT_MS = 10_000;

export interface InquiryEmailConfig {
	apiKey: string;
	fromEmail: string;
	notifyEmail: string;
}

export interface InquiryEmailDeliveryResult {
	status: InquiryEmailStatus;
	error?: string;
}

export interface SendInquiryEmailsResult {
	adminEmailStatus: InquiryEmailStatus;
	adminEmailError?: string;
	senderEmailStatus: InquiryEmailStatus;
	senderEmailError?: string;
	/** Legacy compatibility alias: always mirrors the admin notification. */
	emailStatus: InquiryEmailStatus;
	emailError?: string;
	/** Kept for callers that previously checked a single aggregate result. */
	ok: boolean;
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

/** Store only a short, printable diagnostic; never persist an API response body or key. */
export function sanitizeInquiryEmailError(error: unknown): string {
	let message = error instanceof Error ? error.message : 'Không thể gửi email';
	const apiKey = process.env.RESEND_API_KEY?.trim();
	if (apiKey) message = message.replaceAll(apiKey, '[redacted]');
	message = message
		.replace(/\bre_[A-Za-z0-9_-]{8,}\b/g, '[redacted]')
		.replace(/[\u0000-\u001F\u007F]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	if (!message) return 'Không thể gửi email';
	return message.slice(0, 300);
}

async function sendResendEmail(input: {
	apiKey: string;
	from: string;
	to: string[];
	replyTo?: string;
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
			...(input.replyTo ? { reply_to: input.replyTo } : {}),
			subject: input.subject,
			html: input.html,
		}),
		signal: AbortSignal.timeout(INQUIRY_EMAIL_TIMEOUT_MS),
	});

	if (!res.ok) {
		// Deliberately do not persist or surface Resend's response body: it may
		// contain request details. Status is sufficient for operational triage.
		throw new Error(`Resend API error (${res.status})`);
	}
}

function pendingConfigurationResult(): InquiryEmailDeliveryResult {
	return { status: 'pending', error: 'Email delivery not configured' };
}

function failedDelivery(error: unknown, logLabel: string): InquiryEmailDeliveryResult {
	const message = sanitizeInquiryEmailError(error);
	console.error(`[inquiryEmail:${logLabel}]`, message);
	return { status: 'failed', error: message };
}

export async function sendInquirySenderConfirmation(
	inquiry: IInquiry & { _id: unknown },
	config = getInquiryEmailConfig(),
): Promise<InquiryEmailDeliveryResult> {
	if (!config) return pendingConfigurationResult();

	const typeLabel = INQUIRY_TYPE_LABELS[inquiry.inquiryType];
	try {
		await sendResendEmail({
			apiKey: config.apiKey,
			from: config.fromEmail,
			to: [inquiry.email],
			subject: `${SITE_NAME} — Đã nhận lời nhắn`,
			html: `
				<p>Xin chào ${escapeHtml(inquiry.name)},</p>
				<p>Cảm ơn bạn đã viết về chủ đề <strong>${escapeHtml(typeLabel)}</strong>. Khánh đã nhận được lời nhắn và sẽ phản hồi qua email sớm nhất có thể.</p>
				<p>Bạn không cần gửi lại nội dung này.</p>
				<p>Trân trọng,<br/>${escapeHtml(SITE_NAME)}</p>
			`.trim(),
		});
		return { status: 'sent' };
	} catch (error) {
		return failedDelivery(error, 'sender');
	}
}

export async function sendInquiryAdminNotification(
	inquiry: IInquiry & { _id: unknown },
	config = getInquiryEmailConfig(),
): Promise<InquiryEmailDeliveryResult> {
	if (!config) return pendingConfigurationResult();

	const id = String(inquiry._id);
	const typeLabel = INQUIRY_TYPE_LABELS[inquiry.inquiryType];
	const summary = escapeHtml(buildSummary(inquiry));
	try {
		await sendResendEmail({
			apiKey: config.apiKey,
			from: config.fromEmail,
			to: [config.notifyEmail],
			replyTo: inquiry.email,
			subject: `[Lời nhắn] ${typeLabel} — ${inquiry.name}`,
			html: `
				<h2>Yêu cầu liên hệ mới</h2>
				<ul>
					<li><strong>Loại:</strong> ${escapeHtml(typeLabel)}</li>
					<li><strong>Tên:</strong> ${escapeHtml(inquiry.name)}</li>
					<li><strong>Email:</strong> ${escapeHtml(inquiry.email)}</li>
				</ul>
				<p><strong>Tóm tắt:</strong> ${summary}</p>
				<p><a href="${adminInquiryUrl(id)}">Xem trong khu quản trị</a></p>
			`.trim(),
		});
		return { status: 'sent' };
	} catch (error) {
		return failedDelivery(error, 'admin');
	}
}

/** Sends both deliveries independently so one failure never suppresses the other. */
export async function sendInquiryEmails(
	inquiry: IInquiry & { _id: unknown },
): Promise<SendInquiryEmailsResult> {
	const config = getInquiryEmailConfig();
	const [admin, sender] = await Promise.all([
		sendInquiryAdminNotification(inquiry, config),
		sendInquirySenderConfirmation(inquiry, config),
	]);

	return {
		adminEmailStatus: admin.status,
		adminEmailError: admin.error,
		senderEmailStatus: sender.status,
		senderEmailError: sender.error,
		emailStatus: admin.status,
		emailError: admin.error,
		ok: admin.status === 'sent' && sender.status === 'sent',
	};
}

export { buildSummary, INQUIRY_TYPE_LABELS };
