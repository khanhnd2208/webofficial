'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { routes } from '@/config/routes';
import {
	INQUIRY_TYPES,
	PUBLIC_INQUIRY_TYPE_OPTIONS,
	type InquiryType,
} from '@/features/inquiries/constants';
import { trackEvent } from '@/lib/analytics';

function normalizeInquiryType(raw: string | null): InquiryType {
	if (!raw) return 'unsure';
	if (!(INQUIRY_TYPES as readonly string[]).includes(raw)) return 'unsure';

	const legacyMap: Partial<Record<InquiryType, InquiryType>> = {
		mentoring: 'people-organization',
		business: 'people-organization',
		ai: 'other',
		course: 'other',
	};
	const typed = raw as InquiryType;
	return legacyMap[typed] ?? typed;
}

type FormState = {
	name: string;
	email: string;
	inquiryType: InquiryType;
	context: string;
	timeframe: string;
	sourceCourseSlug: string;
	agreedPrivacy: boolean;
	website: string;
};

function emptyForm(type: InquiryType, courseSlug: string): FormState {
	return {
		name: '',
		email: '',
		inquiryType: type,
		context: '',
		timeframe: '',
		sourceCourseSlug: courseSlug,
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
	const sourcePage =
		searchParams.get('sourcePage') ||
		(typeof window !== 'undefined' ? window.location.pathname : routes.contact);

	const [form, setForm] = useState<FormState>(() => emptyForm(initialType, courseSlug));
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [errorSummary, setErrorSummary] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [pending, startTransition] = useTransition();

	useEffect(() => {
		trackEvent('contact_form_start', { type: initialType, sourcePage: routes.contact });
	}, [initialType]);

	const campaignParams = useMemo(() => {
		const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref'] as const;
		const values: Record<string, string> = {};
		for (const key of keys) {
			const value = searchParams.get(key);
			if (value) values[key] = value;
		}
		return Object.keys(values).length > 0 ? values : undefined;
	}, [searchParams]);

	function update<K extends keyof FormState>(key: K, value: FormState[K]) {
		setForm((current) => ({ ...current, [key]: value }));
	}

	function onSubmit(event: React.FormEvent) {
		event.preventDefault();
		if (!formEnabled || pending) return;

		setFieldErrors({});
		setErrorSummary(null);

		startTransition(async () => {
			try {
				trackEvent('contact_form_submit', { type: form.inquiryType, sourcePage });
				const response = await fetch('/api/inquiries', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: form.name,
						email: form.email,
						inquiryType: form.inquiryType,
						context: form.context,
						timeframe: form.timeframe || undefined,
						sourcePage,
						sourceCourseSlug: form.sourceCourseSlug || undefined,
						campaignParams,
						agreedPrivacy: form.agreedPrivacy,
						website: form.website,
					}),
				});
				const json = (await response.json()) as {
					ok: boolean;
					error?: string;
					fields?: Record<string, string>;
				};

				if (!response.ok || !json.ok) {
					setErrorSummary(json.error || 'Chưa gửi được lời nhắn. Vui lòng thử lại.');
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
			<div className="border-t border-hairline py-8" role="status">
				<p className="font-display text-2xl font-medium text-ink">Khánh đã nhận được lời nhắn</p>
				<p className="mt-3 text-sm leading-relaxed text-ink-secondary">
					Cảm ơn bạn đã viết. Tôi sẽ đọc và phản hồi qua email sớm nhất có thể.
				</p>
				<Link href={routes.home} className="mt-6 inline-flex text-sm font-medium text-accent hover:underline">
					← Về trang chủ
				</Link>
			</div>
		);
	}

	if (!formEnabled) {
		return (
			<div className="border-t border-hairline py-8">
				<p className="font-display text-xl font-medium text-ink">Kênh nhắn tin đang tạm đóng</p>
				<p className="mt-3 text-sm text-ink-secondary">
					{disabledReason || 'Khánh sẽ mở lại kênh liên hệ sau khi hoàn tất cấu hình.'}
				</p>
			</div>
		);
	}

	const inputClass =
		'mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm text-ink outline-none transition-colors focus:border-accent';
	const labelClass = 'text-sm font-medium text-ink';

	return (
		<form onSubmit={onSubmit} className="space-y-7" noValidate>
			{errorSummary ? (
				<div role="alert" className="border border-vermilion/40 bg-accent-subtle px-4 py-3 text-sm text-ink">
					{errorSummary}
				</div>
			) : null}

			<div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
				<label>
					Website
					<input
						tabIndex={-1}
						autoComplete="off"
						value={form.website}
						onChange={(event) => update('website', event.target.value)}
					/>
				</label>
			</div>

			<div className="grid gap-6 sm:grid-cols-2">
				<div>
					<label htmlFor="name" className={labelClass}>Họ tên</label>
					<input
						id="name"
						required
						autoComplete="name"
						className={inputClass}
						value={form.name}
						onChange={(event) => update('name', event.target.value)}
						aria-invalid={Boolean(fieldErrors.name)}
					/>
					{fieldErrors.name ? <p className="mt-1 text-xs text-error">{fieldErrors.name}</p> : null}
				</div>
				<div>
					<label htmlFor="email" className={labelClass}>Email</label>
					<input
						id="email"
						type="email"
						required
						autoComplete="email"
						className={inputClass}
						value={form.email}
						onChange={(event) => update('email', event.target.value)}
						aria-invalid={Boolean(fieldErrors.email)}
					/>
					{fieldErrors.email ? <p className="mt-1 text-xs text-error">{fieldErrors.email}</p> : null}
				</div>
			</div>

			<div>
				<label htmlFor="inquiryType" className={labelClass}>Chủ đề bạn muốn trao đổi</label>
				<select
					id="inquiryType"
					className={inputClass}
					value={form.inquiryType}
					onChange={(event) => update('inquiryType', event.target.value as InquiryType)}
				>
					{PUBLIC_INQUIRY_TYPE_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>{option.label}</option>
					))}
				</select>
			</div>

			<div>
				<label htmlFor="context" className={labelClass}>Đôi nét về điều bạn muốn chia sẻ</label>
				<p className="mt-1 text-sm text-ink-secondary">Một vài dòng là đủ để Khánh hiểu câu chuyện của bạn.</p>
				<textarea
					id="context"
					required
					rows={6}
					className={inputClass}
					value={form.context}
					onChange={(event) => update('context', event.target.value)}
					aria-invalid={Boolean(fieldErrors.context)}
				/>
				{fieldErrors.context ? <p className="mt-1 text-xs text-error">{fieldErrors.context}</p> : null}
			</div>

			<div>
				<label htmlFor="timeframe" className={labelClass}>Thời gian phù hợp, nếu cần</label>
				<input
					id="timeframe"
					className={inputClass}
					value={form.timeframe}
					onChange={(event) => update('timeframe', event.target.value)}
					placeholder="Ví dụ: trong tháng này, hoặc chưa vội"
				/>
			</div>

			<label className="flex items-start gap-3 border-t border-hairline pt-6 text-sm leading-relaxed text-ink-secondary">
				<input
					type="checkbox"
					required
					className="mt-1"
					checked={form.agreedPrivacy}
					onChange={(event) => update('agreedPrivacy', event.target.checked)}
					aria-invalid={Boolean(fieldErrors.agreedPrivacy)}
				/>
				<span>
					Tôi đồng ý với{' '}
					<Link href={routes.policyPrivacy} className="text-accent underline underline-offset-2">
						chính sách bảo mật
					</Link>
					.
				</span>
			</label>

			<button
				type="submit"
				disabled={pending}
				className="inline-flex min-h-11 items-center border-y border-hairline px-5 text-sm font-semibold text-accent transition-colors hover:border-accent disabled:opacity-60"
			>
				{pending ? 'Đang gửi…' : 'Gửi lời nhắn'}
			</button>
		</form>
	);
}
