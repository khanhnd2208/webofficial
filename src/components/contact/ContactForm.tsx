'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { routes } from '@/config/routes';
import { PUBLIC_INQUIRY_TYPE_OPTIONS, type InquiryType } from '@/features/inquiries/constants';
import { trackEvent } from '@/lib/analytics';
import {
	contactContextFromSearchParams,
	mergeContactContext,
	normalizeInquiryType,
	type ContactContext,
	type ContactContextInput,
} from './ContactContext';

type FormState = {
	name: string;
	email: string;
	organization: string;
	inquiryType: InquiryType;
	context: string;
	timeframe: string;
	agreedPrivacy: boolean;
	website: string;
};

const DEFAULT_CONTACT_CONTEXT: ContactContext = {
	inquiryType: 'training',
	sourcePage: routes.contact,
};

function emptyForm(type: InquiryType): FormState {
	return {
		name: '',
		email: '',
		organization: '',
		inquiryType: type,
		context: '',
		timeframe: '',
		agreedPrivacy: false,
		website: '',
	};
}

function isValidEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type ContactFormProps = {
	formEnabled: boolean;
	disabledReason?: string;
	contactContext?: ContactContextInput;
	resetKey?: number;
	onDirtyChange?: (dirty: boolean) => void;
	onSuccess?: () => void;
	showHomeLink?: boolean;
};

export default function ContactForm({
	formEnabled,
	disabledReason,
	contactContext,
	resetKey = 0,
	onDirtyChange,
	onSuccess,
	showHomeLink = true,
}: ContactFormProps) {
	const { data: session, status: sessionStatus } = useSession();
	const resolvedContext = useMemo(
		() => mergeContactContext(DEFAULT_CONTACT_CONTEXT, contactContext),
		[contactContext],
	);
	const initialType = normalizeInquiryType(resolvedContext.inquiryType);
	const idPrefix = useId();
	const ids = {
		name: `${idPrefix}-name`,
		email: `${idPrefix}-email`,
		emailHelp: `${idPrefix}-email-help`,
		organization: `${idPrefix}-organization`,
		inquiryType: `${idPrefix}-inquiry-type`,
		context: `${idPrefix}-context`,
		timeframe: `${idPrefix}-timeframe`,
		errorSummary: `${idPrefix}-error-summary`,
		privacyError: `${idPrefix}-privacy-error`,
	};

	const [form, setForm] = useState<FormState>(() => emptyForm(initialType));
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [errorSummary, setErrorSummary] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [pending, setPending] = useState(false);
	const previousAccountEmail = useRef('');
	const startedRef = useRef(false);
	const formRef = useRef<HTMLFormElement>(null);

	const isAccount = sessionStatus === 'authenticated';
	const accountEmail = session?.user?.email?.trim() || '';
	const accountName = session?.user?.name?.trim() || '';

	useEffect(() => {
		setForm(emptyForm(initialType));
		setFieldErrors({});
		setErrorSummary(null);
		setSuccess(false);
		setPending(false);
		startedRef.current = false;
		onDirtyChange?.(false);
	}, [resetKey, initialType, onDirtyChange]);

	useEffect(() => {
		if (isAccount) {
			previousAccountEmail.current = accountEmail;
			setForm((current) => ({
				...current,
				name: current.name || accountName,
				email: accountEmail,
			}));
			return;
		}

		if (sessionStatus === 'unauthenticated' && previousAccountEmail.current) {
			const staleEmail = previousAccountEmail.current;
			previousAccountEmail.current = '';
			setForm((current) => ({
				...current,
				email: current.email === staleEmail ? '' : current.email,
			}));
		}
	}, [accountEmail, accountName, isAccount, resetKey, sessionStatus]);

	function update<K extends keyof FormState>(key: K, value: FormState[K]) {
		setForm((current) => ({ ...current, [key]: value }));
		setFieldErrors((current) => {
			if (!current[key]) return current;
			const next = { ...current };
			delete next[key];
			return next;
		});
		setErrorSummary(null);
		onDirtyChange?.(true);
	}

	function validate(): Record<string, string> {
		const errors: Record<string, string> = {};
		if (!form.name.trim()) errors.name = 'Vui lòng cho biết họ tên của bạn.';

		if (isAccount && !accountEmail) {
			errors.email = 'Tài khoản của bạn chưa có email để nhận phản hồi.';
		} else if (!form.email.trim()) {
			errors.email = 'Vui lòng nhập email để tôi có thể phản hồi.';
		} else if (!isValidEmail(form.email.trim())) {
			errors.email = 'Vui lòng nhập email hợp lệ để tôi có thể phản hồi.';
		}

		if (!form.context.trim()) {
			errors.context = 'Vui lòng chia sẻ vài dòng về điều bạn muốn trao đổi.';
		}
		if (!form.agreedPrivacy) {
			errors.agreedPrivacy = 'Vui lòng đồng ý với chính sách bảo mật trước khi gửi.';
		}
		return errors;
	}

	async function onSubmit(event: React.FormEvent) {
		event.preventDefault();
		if (!formEnabled || pending || sessionStatus === 'loading') return;

		setFieldErrors({});
		setErrorSummary(null);
		const validationErrors = validate();
		if (Object.keys(validationErrors).length > 0) {
			setFieldErrors(validationErrors);
			setErrorSummary('Vui lòng kiểm tra lại những thông tin được đánh dấu.');
			trackEvent('contact_form_error', {
				type: form.inquiryType,
				sourcePage: resolvedContext.sourcePage,
			});
			requestAnimationFrame(() =>
				formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
			);
			return;
		}

		setPending(true);
		try {
			trackEvent('contact_form_submit', {
				type: form.inquiryType,
				sourcePage: resolvedContext.sourcePage,
			});
			const response = await fetch('/api/inquiries', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: form.name.trim(),
					email: isAccount ? accountEmail : form.email.trim(),
					inquiryType: form.inquiryType,
					organization: form.organization.trim() || undefined,
					context: form.context.trim(),
					timeframe: form.timeframe.trim() || undefined,
					sourcePage: resolvedContext.sourcePage,
					sourceCourseSlug: resolvedContext.sourceCourseSlug,
					campaignParams: resolvedContext.campaignParams,
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
				setErrorSummary(
					response.status >= 500
						? 'Lời nhắn chưa được gửi. Vui lòng thử lại hoặc liên hệ trực tiếp qua email.'
						: json.error ||
								'Lời nhắn chưa được gửi. Vui lòng thử lại hoặc liên hệ trực tiếp qua email.',
				);
				if (json.fields) setFieldErrors(json.fields);
				return;
			}

			setSuccess(true);
			trackEvent('contact_form_success', {
				type: form.inquiryType,
				sourcePage: resolvedContext.sourcePage,
			});
			onSuccess?.();
		} catch {
			setErrorSummary('Lời nhắn chưa được gửi. Vui lòng thử lại hoặc liên hệ trực tiếp qua email.');
		} finally {
			setPending(false);
		}
	}

	if (success) {
		return (
			<div className="border border-success/35 bg-success-subtle p-6 sm:p-8" role="status">
				<p className="editorial-label !text-success">Lời nhắn đã được gửi</p>
				<p className="type-h3 mt-4">Cảm ơn bạn đã chia sẻ.</p>
				<p className="mt-3 text-base leading-relaxed text-ink-secondary">
					Tôi sẽ đọc bối cảnh, xem xét mức độ phù hợp và phản hồi qua email. Nếu cần thêm thông tin,
					tôi sẽ hỏi lại trước khi đề xuất bước tiếp theo.
				</p>
				{showHomeLink ? (
					<Link
						href={routes.home}
						className="mt-6 inline-flex text-base font-medium text-accent hover:underline"
					>
						← Về trang chủ
					</Link>
				) : null}
			</div>
		);
	}

	if (!formEnabled) {
		return (
			<div className="border-t border-hairline py-8">
				<p className="font-display text-xl font-medium text-ink">Kênh nhắn tin đang tạm đóng</p>
				<p className="mt-3 text-base text-ink-secondary">
					{disabledReason || 'Khánh sẽ mở lại kênh liên hệ sau khi hoàn tất cấu hình.'}
				</p>
			</div>
		);
	}

	const inputClass =
		'premium-field mt-2 placeholder:text-ink-secondary/55 read-only:cursor-not-allowed read-only:bg-paper read-only:text-ink-secondary';
	const labelClass = 'block text-sm font-semibold tracking-[0.02em] text-ink';

	return (
		<form
			ref={formRef}
			onSubmit={onSubmit}
			className="space-y-9"
			noValidate
			aria-busy={pending}
			aria-describedby={errorSummary ? ids.errorSummary : undefined}
			onFocusCapture={() => {
				if (startedRef.current) return;
				startedRef.current = true;
				trackEvent('contact_form_start', {
					type: form.inquiryType,
					sourcePage: resolvedContext.sourcePage,
				});
			}}
		>
			{errorSummary ? (
				<div
					id={ids.errorSummary}
					role="alert"
					className="border border-error/40 bg-error-subtle px-4 py-3 text-sm leading-[1.6] text-ink"
				>
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

			<fieldset className="grid gap-6 border-t border-hairline pt-7 sm:grid-cols-2 sm:gap-7">
				<legend className="editorial-label pr-4">Thông tin phản hồi</legend>
				<div>
					<label htmlFor={ids.name} className={labelClass}>
						Họ và tên
					</label>
					<input
						id={ids.name}
						required
						autoComplete="name"
						className={inputClass}
						value={form.name}
						onChange={(event) => update('name', event.target.value)}
						aria-invalid={Boolean(fieldErrors.name)}
						aria-describedby={fieldErrors.name ? `${ids.name}-error` : undefined}
					/>
					{fieldErrors.name ? (
						<p id={`${ids.name}-error`} className="mt-2 text-xs text-error">
							{fieldErrors.name}
						</p>
					) : null}
				</div>
				<div>
					<label htmlFor={ids.email} className={labelClass}>
						Email nhận phản hồi
					</label>
					<input
						id={ids.email}
						type="email"
						required
						readOnly={isAccount}
						autoComplete="email"
						className={inputClass}
						value={form.email}
						onChange={(event) => update('email', event.target.value)}
						aria-describedby={[ids.emailHelp, fieldErrors.email ? `${ids.email}-error` : '']
							.filter(Boolean)
							.join(' ')}
						aria-invalid={Boolean(fieldErrors.email)}
					/>
					<p id={ids.emailHelp} className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
						{isAccount
							? 'Tôi sẽ phản hồi vào email của tài khoản này.'
							: 'Vui lòng nhập email bạn thường dùng để tôi có thể liên lạc.'}
					</p>
					{fieldErrors.email ? (
						<p id={`${ids.email}-error`} className="mt-2 text-xs text-error">
							{fieldErrors.email}
						</p>
					) : null}
				</div>
			</fieldset>

			<fieldset className="grid gap-6 border-t border-hairline pt-7 sm:grid-cols-2 sm:gap-7">
				<legend className="editorial-label pr-4">Bối cảnh trao đổi</legend>
				<div>
					<label htmlFor={ids.organization} className={labelClass}>
						Tổ chức{' '}
						<span className="normal-case tracking-normal text-ink-secondary/70">
							(không bắt buộc)
						</span>
					</label>
					<input
						id={ids.organization}
						autoComplete="organization"
						className={inputClass}
						value={form.organization}
						onChange={(event) => update('organization', event.target.value)}
					/>
				</div>
				<div>
					<label htmlFor={ids.inquiryType} className={labelClass}>
						Bạn đang liên hệ về
					</label>
					<select
						id={ids.inquiryType}
						className={inputClass}
						value={form.inquiryType}
						onChange={(event) => update('inquiryType', event.target.value as InquiryType)}
					>
						{PUBLIC_INQUIRY_TYPE_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>
				<div className="sm:col-span-2">
					<label htmlFor={ids.timeframe} className={labelClass}>
						Thời gian dự kiến{' '}
						<span className="normal-case tracking-normal text-ink-secondary/70">
							(không bắt buộc)
						</span>
					</label>
					<select
						id={ids.timeframe}
						className={inputClass}
						value={form.timeframe}
						onChange={(event) => update('timeframe', event.target.value)}
					>
						<option value="">Chọn mốc gần nhất</option>
						<option value="2-4-weeks">Trong 2–4 tuần tới</option>
						<option value="1-3-months">Trong 1–3 tháng tới</option>
						<option value="after-3-months">Sau 3 tháng</option>
						<option value="unsure">Chưa có mốc cụ thể</option>
					</select>
				</div>
			</fieldset>

			<div className="border-t border-hairline pt-7">
				<label htmlFor={ids.context} className={labelClass}>
					Bạn đang muốn giải quyết điều gì?
				</label>
				<p className="mt-1 text-sm text-ink-secondary">
					Ví dụ: đối tượng là ai, điều gì đang chưa hiệu quả và kết quả nào sẽ hữu ích với bạn?
				</p>
				<textarea
					id={ids.context}
					required
					rows={6}
					className={`${inputClass} min-h-40 resize-y`}
					placeholder="Cho tôi biết bối cảnh, người liên quan và điều bạn muốn thay đổi."
					value={form.context}
					onChange={(event) => update('context', event.target.value)}
					aria-invalid={Boolean(fieldErrors.context)}
					aria-describedby={fieldErrors.context ? `${ids.context}-error` : undefined}
				/>
				{fieldErrors.context ? (
					<p id={`${ids.context}-error`} className="mt-2 text-xs text-error">
						{fieldErrors.context}
					</p>
				) : null}
			</div>

			<div>
				<label className="flex min-h-11 items-start gap-3 border-t border-hairline pt-6 text-sm leading-relaxed text-ink-secondary">
					<input
						type="checkbox"
						required
						className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]"
						checked={form.agreedPrivacy}
						onChange={(event) => update('agreedPrivacy', event.target.checked)}
						aria-invalid={Boolean(fieldErrors.agreedPrivacy)}
						aria-describedby={fieldErrors.agreedPrivacy ? ids.privacyError : undefined}
					/>
					<span>
						Tôi đồng ý với{' '}
						<Link href={routes.policyPrivacy} className="text-accent underline underline-offset-2">
							chính sách bảo mật
						</Link>
						.
					</span>
				</label>
				{fieldErrors.agreedPrivacy ? (
					<p id={ids.privacyError} className="mt-2 text-xs text-error">
						{fieldErrors.agreedPrivacy}
					</p>
				) : null}
			</div>

			<button
				type="submit"
				disabled={pending || sessionStatus === 'loading'}
				className="group inline-flex min-h-13 w-full items-center justify-center border border-ink bg-ink px-6 text-sm font-semibold tracking-[0.01em] text-paper transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
			>
				{pending ? 'Đang gửi…' : 'Gửi lời nhắn'}
				{!pending && sessionStatus !== 'loading' ? (
					<span className="ml-3 transition-transform group-hover:translate-x-1" aria-hidden>
						→
					</span>
				) : null}
			</button>
		</form>
	);
}

export function ContactFormFromUrl(props: Omit<ContactFormProps, 'contactContext'>) {
	const searchParams = useSearchParams();
	const contactContext = useMemo(
		() => contactContextFromSearchParams(searchParams, routes.contact),
		[searchParams],
	);

	return <ContactForm {...props} contactContext={contactContext} />;
}
