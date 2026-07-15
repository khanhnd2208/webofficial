'use client';

import { useMemo, useState, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { routes } from '@/config/routes';
import {
	PUBLIC_INQUIRY_TYPE_OPTIONS,
	type InquiryType,
	INQUIRY_TYPES,
} from '@/features/inquiries/constants';
import { trackEvent } from '@/lib/analytics';

function normalizeInquiryType(raw: string | null): InquiryType {
	if (!raw) return 'unsure';
	if ((INQUIRY_TYPES as readonly string[]).includes(raw)) {
		const legacyMap: Partial<Record<InquiryType, InquiryType>> = {
			mentoring: 'people-organization',
			business: 'people-organization',
			ai: 'unsure',
			course: 'other',
		};
		const typed = raw as InquiryType;
		const mapped = legacyMap[typed];
		if (mapped) return mapped;
		if (PUBLIC_INQUIRY_TYPE_OPTIONS.some((o) => o.value === typed)) return typed;
		return typed;
	}
	return 'unsure';
}

const TYPE_OPTIONS = [...PUBLIC_INQUIRY_TYPE_OPTIONS];

type FormState = {
	name: string;
	email: string;
	inquiryType: InquiryType;
	roleOrStage: string;
	organization: string;
	orgSize: string;
	industry: string;
	context: string;
	problem: string;
	consequence: string;
	tried: string;
	desiredOutcome: string;
	preferredFormat: string;
	timeframe: string;
	budgetOptional: string;
	urgency: string;
	sourceCourseSlug: string;
	agreedScope: boolean;
	agreedPrivacy: boolean;
	website: string;
};

function emptyForm(type: InquiryType, courseSlug: string): FormState {
	return {
		name: '',
		email: '',
		inquiryType: type,
		roleOrStage: '',
		organization: '',
		orgSize: '',
		industry: '',
		context: '',
		problem: '',
		consequence: '',
		tried: '',
		desiredOutcome: '',
		preferredFormat: '',
		timeframe: '',
		budgetOptional: '',
		urgency: '',
		sourceCourseSlug: courseSlug,
		agreedScope: false,
		agreedPrivacy: false,
		website: '',
	};
}

type ContactFormProps = {
	formEnabled: boolean;
	disabledReason?: string;
};

export default function ContactForm({ formEnabled, disabledReason }: ContactFormProps) {
	const searchParams = useSearchParams();
	const initialType = normalizeInquiryType(searchParams.get('type'));
	const courseSlug = searchParams.get('course') || searchParams.get('sourceCourseSlug') || '';
	const sourcePage = searchParams.get('sourcePage') || (typeof window !== 'undefined' ? window.location.pathname : routes.contact);

	const [form, setForm] = useState<FormState>(() => emptyForm(initialType, courseSlug));
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [errorSummary, setErrorSummary] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [pending, startTransition] = useTransition();

	useEffect(() => {
		trackEvent('contact_form_start', { type: form.inquiryType, sourcePage: routes.contact });
		// intentionally once on mount
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const type = form.inquiryType;

	const showOrgFields = type === 'people-organization' || type === 'business';
	const showRoleStage =
		type === 'people-organization' ||
		type === 'mentoring' ||
		type === 'business' ||
		type === 'training' ||
		type === 'learning-design' ||
		type === 'ai';
	const showCourse = type === 'course';

	const campaignParams = useMemo(() => {
		const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref'] as const;
		const out: Record<string, string> = {};
		for (const key of keys) {
			const v = searchParams.get(key);
			if (v) out[key] = v;
		}
		return Object.keys(out).length ? out : undefined;
	}, [searchParams]);

	function update<K extends keyof FormState>(key: K, value: FormState[K]) {
		setForm((prev) => ({ ...prev, [key]: value }));
	}

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!formEnabled || pending) return;
		setFieldErrors({});
		setErrorSummary(null);

		startTransition(async () => {
			try {
				trackEvent('contact_form_submit', {
					type: form.inquiryType,
					sourcePage: typeof sourcePage === 'string' ? sourcePage : routes.contact,
				});
				const res = await fetch('/api/inquiries', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						...form,
						sourcePage,
						campaignParams,
						organization: form.organization || undefined,
						orgSize: form.orgSize || undefined,
						industry: form.industry || undefined,
						problem: form.problem || undefined,
						consequence: form.consequence || undefined,
						tried: form.tried || undefined,
						desiredOutcome: form.desiredOutcome || undefined,
						preferredFormat: form.preferredFormat || undefined,
						timeframe: form.timeframe || undefined,
						budgetOptional: form.budgetOptional || undefined,
						urgency: form.urgency || undefined,
						roleOrStage: form.roleOrStage || undefined,
						sourceCourseSlug: form.sourceCourseSlug || undefined,
						agreedScope: form.agreedScope || undefined,
						agreedPrivacy: form.agreedPrivacy || undefined,
					}),
				});
				const json = (await res.json()) as {
					ok: boolean;
					error?: string;
					fields?: Record<string, string>;
					data?: { accepted?: boolean };
				};

				if (!res.ok || !json.ok) {
					setErrorSummary(json.error || 'Không gửi được. Vui lòng thử lại.');
					if (json.fields) setFieldErrors(json.fields);
					return;
				}
				setSuccess(true);
			} catch {
				setErrorSummary('Không kết nối được máy chủ. Vui lòng thử lại.');
			}
		});
	}

	if (success) {
		return (
			<div className="rounded-[4px] border border-hairline bg-paper px-6 py-8" role="status">
				<p className="font-display text-2xl font-medium text-ink">Đã nhận được lời nhắn</p>
				<p className="mt-3 text-sm leading-relaxed text-ink-secondary">
					Cảm ơn bạn. Khánh sẽ phản hồi qua email khi đã xem xét phạm vi phù hợp. Bạn không cần gửi lại trừ khi
					có bổ sung quan trọng.
				</p>
				<Link href={routes.home} className="mt-6 inline-flex text-xs font-semibold uppercase tracking-wider text-vermilion">
					← Về trang chủ
				</Link>
			</div>
		);
	}

	if (!formEnabled) {
		return (
			<div className="rounded-[4px] border border-hairline px-6 py-8">
				<p className="font-display text-xl font-medium text-ink">Form đang tạm đóng</p>
				<p className="mt-3 text-sm text-ink-secondary">
					{disabledReason ||
						'Kênh liên hệ sẽ mở khi email thông báo và chính sách bảo mật đã được cấu hình.'}
				</p>
			</div>
		);
	}

	return (
		<form onSubmit={onSubmit} className="space-y-6" noValidate>
			{errorSummary ? (
				<div role="alert" className="border border-vermilion/40 bg-accent-subtle px-4 py-3 text-sm text-ink">
					{errorSummary}
				</div>
			) : null}

			{/* Honeypot */}
			<div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
				<label>
					Website
					<input
						tabIndex={-1}
						autoComplete="off"
						value={form.website}
						onChange={(e) => update('website', e.target.value)}
					/>
				</label>
			</div>

			<div>
				<label htmlFor="inquiryType" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
					Loại nhu cầu
				</label>
				<select
					id="inquiryType"
					className="mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm text-ink"
					value={form.inquiryType}
					onChange={(e) => update('inquiryType', e.target.value as InquiryType)}
				>
					{TYPE_OPTIONS.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			</div>

			<div className="grid gap-6 sm:grid-cols-2">
				<div>
					<label htmlFor="name" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
						Họ tên
					</label>
					<input
						id="name"
						required
						className="mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm"
						value={form.name}
						onChange={(e) => update('name', e.target.value)}
						aria-invalid={Boolean(fieldErrors.name)}
					/>
				</div>
				<div>
					<label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
						Email
					</label>
					<input
						id="email"
						type="email"
						required
						className="mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm"
						value={form.email}
						onChange={(e) => update('email', e.target.value)}
						aria-invalid={Boolean(fieldErrors.email)}
					/>
				</div>
			</div>

			{showRoleStage && (
				<div>
					<label htmlFor="roleOrStage" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
						{type === 'people-organization' || type === 'mentoring'
							? 'Giai đoạn nghề nghiệp hiện tại'
							: 'Vai trò của bạn'}
					</label>
					<input
						id="roleOrStage"
						className="mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm"
						value={form.roleOrStage}
						onChange={(e) => update('roleOrStage', e.target.value)}
					/>
				</div>
			)}

			{showOrgFields ? (
				<div className="grid gap-6 sm:grid-cols-3">
					<div className="sm:col-span-1">
						<label htmlFor="organization" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
							Tổ chức
						</label>
						<input
							id="organization"
							className="mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm"
							value={form.organization}
							onChange={(e) => update('organization', e.target.value)}
						/>
					</div>
					<div>
						<label htmlFor="orgSize" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
							Quy mô
						</label>
						<input
							id="orgSize"
							className="mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm"
							value={form.orgSize}
							onChange={(e) => update('orgSize', e.target.value)}
							placeholder="vd. 5–20 người"
						/>
					</div>
					<div>
						<label htmlFor="industry" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
							Ngành
						</label>
						<input
							id="industry"
							className="mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm"
							value={form.industry}
							onChange={(e) => update('industry', e.target.value)}
						/>
					</div>
				</div>
			) : null}

			{showCourse ? (
				<div>
					<label htmlFor="sourceCourseSlug" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
						Khóa học quan tâm (slug)
					</label>
					<input
						id="sourceCourseSlug"
						className="mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm"
						value={form.sourceCourseSlug}
						onChange={(e) => update('sourceCourseSlug', e.target.value)}
					/>
				</div>
			) : null}

			<div>
				<label htmlFor="context" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
					Bối cảnh
				</label>
				<textarea
					id="context"
					required
					rows={4}
					className="mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm"
					value={form.context}
					onChange={(e) => update('context', e.target.value)}
					aria-invalid={Boolean(fieldErrors.context)}
				/>
			</div>

			<div>
				<label htmlFor="problem" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
					Vấn đề đang gặp
				</label>
				<textarea
					id="problem"
					rows={3}
					className="mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm"
					value={form.problem}
					onChange={(e) => update('problem', e.target.value)}
				/>
			</div>

			{showOrgFields ? (
				<>
					<div>
						<label htmlFor="consequence" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
							Hệ quả nếu không xử lý
						</label>
						<textarea
							id="consequence"
							rows={2}
							className="mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm"
							value={form.consequence}
							onChange={(e) => update('consequence', e.target.value)}
						/>
					</div>
					<div>
						<label htmlFor="tried" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
							Những việc đã thử
						</label>
						<textarea
							id="tried"
							rows={2}
							className="mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm"
							value={form.tried}
							onChange={(e) => update('tried', e.target.value)}
						/>
					</div>
					<div>
						<label htmlFor="budgetOptional" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
							Ngân sách (tùy chọn)
						</label>
						<input
							id="budgetOptional"
							className="mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm"
							value={form.budgetOptional}
							onChange={(e) => update('budgetOptional', e.target.value)}
						/>
					</div>
					<div>
						<label htmlFor="urgency" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
							Mức độ khẩn cấp
						</label>
						<input
							id="urgency"
							className="mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm"
							value={form.urgency}
							onChange={(e) => update('urgency', e.target.value)}
							placeholder="vd. trong 2 tuần"
						/>
					</div>
				</>
			) : null}

			<div>
				<label htmlFor="desiredOutcome" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
					Kết quả mong muốn
				</label>
				<textarea
					id="desiredOutcome"
					rows={2}
					className="mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm"
					value={form.desiredOutcome}
					onChange={(e) => update('desiredOutcome', e.target.value)}
				/>
			</div>

			<div className="grid gap-6 sm:grid-cols-2">
				<div>
					<label htmlFor="preferredFormat" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
						Format phù hợp
					</label>
					<input
						id="preferredFormat"
						className="mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm"
						value={form.preferredFormat}
						onChange={(e) => update('preferredFormat', e.target.value)}
						placeholder="Online / trực tiếp / linh hoạt"
					/>
				</div>
				<div>
					<label htmlFor="timeframe" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
						Thời gian phù hợp
					</label>
					<input
						id="timeframe"
						className="mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm"
						value={form.timeframe}
						onChange={(e) => update('timeframe', e.target.value)}
					/>
				</div>
			</div>

			<div className="space-y-3 border-t border-hairline pt-6">
				<label className="flex items-start gap-3 text-sm text-ink-secondary">
					<input
						type="checkbox"
						className="mt-1"
						checked={form.agreedScope}
						onChange={(e) => update('agreedScope', e.target.checked)}
					/>
					<span>
						Tôi hiểu phạm vi dịch vụ (không trị liệu, pháp lý, tài chính; chi phí chỉ đề xuất sau khi làm rõ nhu
						cầu).
					</span>
				</label>
				<label className="flex items-start gap-3 text-sm text-ink-secondary">
					<input
						type="checkbox"
						className="mt-1"
						checked={form.agreedPrivacy}
						onChange={(e) => update('agreedPrivacy', e.target.checked)}
					/>
					<span>
						Tôi đồng ý với{' '}
						<Link href={routes.policyPrivacy} className="text-vermilion underline">
							chính sách bảo mật
						</Link>
						.
					</span>
				</label>
			</div>

			<button
				type="submit"
				disabled={pending}
				className="inline-flex min-h-11 items-center rounded-[4px] bg-ink px-5 text-xs font-semibold uppercase tracking-wider text-paper disabled:opacity-60"
			>
				{pending ? 'Đang gửi…' : 'Gửi trao đổi'}
			</button>
		</form>
	);
}
