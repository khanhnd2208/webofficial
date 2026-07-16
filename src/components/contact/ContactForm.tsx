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
	inquiryType: InquiryType;
	context: string;
	timeframe: string;
	agreedPrivacy: boolean;
	website: string;
};

const DEFAULT_CONTACT_CONTEXT: ContactContext = {
	inquiryType: 'unsure',
	sourcePage: routes.contact,
};

function emptyForm(type: InquiryType): FormState {
	return {
		name: '',
		email: '',
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
		inquiryType: `${idPrefix}-inquiry-type`,
		context: `${idPrefix}-context`,
		timeframe: `${idPrefix}-timeframe`,
	};

	const [form, setForm] = useState<FormState>(() => emptyForm(initialType));
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [errorSummary, setErrorSummary] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [pending, setPending] = useState(false);
	const previousAccountEmail = useRef('');

	const isAccount = sessionStatus === 'authenticated';
	const accountEmail = session?.user?.email?.trim() || '';
	const accountName = session?.user?.name?.trim() || '';

	useEffect(() => {
		trackEvent('contact_form_start', {
			type: initialType,
			sourcePage: resolvedContext.sourcePage,
		});
	}, [initialType, resolvedContext.sourcePage]);

	useEffect(() => {
		setForm(emptyForm(initialType));
		setFieldErrors({});
		setErrorSummary(null);
		setSuccess(false);
		setPending(false);
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
						? 'Máy chủ chưa thể nhận lời nhắn lúc này. Vui lòng thử lại sau ít phút.'
						: json.error || 'Chưa gửi được lời nhắn. Vui lòng thử lại.',
				);
				if (json.fields) setFieldErrors(json.fields);
				return;
			}

			setSuccess(true);
			onSuccess?.();
		} catch {
			setErrorSummary('Không kết nối được máy chủ. Vui lòng thử lại.');
		} finally {
			setPending(false);
		}
	}

	if (success) {
		return (
			<div className="border-t border-hairline py-8" role="status">
				<p className="font-display text-2xl font-medium text-ink">Lời nhắn đã được gửi.</p>
				<p className="mt-3 text-sm leading-relaxed text-ink-secondary">
					Cảm ơn bạn đã viết. Tôi sẽ đọc và phản hồi qua email bạn đã cung cấp.
				</p>
				{showHomeLink ? (
					<Link
						href={routes.home}
						className="mt-6 inline-flex text-sm font-medium text-accent hover:underline"
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
				<p className="mt-3 text-sm text-ink-secondary">
					{disabledReason || 'Khánh sẽ mở lại kênh liên hệ sau khi hoàn tất cấu hình.'}
				</p>
			</div>
		);
	}

	const inputClass =
		'mt-2 w-full rounded-[4px] border border-hairline bg-canvas px-3 py-3 text-sm text-ink outline-none transition-colors focus:border-accent read-only:cursor-not-allowed read-only:bg-paper read-only:text-ink-secondary';
	const labelClass = 'text-sm font-medium text-ink';

	return (
		<form onSubmit={onSubmit} className="space-y-7" noValidate aria-busy={pending}>
			{errorSummary ? (
				<div
					role="alert"
					className="border border-vermilion/40 bg-accent-subtle px-4 py-3 text-sm text-ink"
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

			<div className="grid gap-6 sm:grid-cols-2">
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
					/>
					{fieldErrors.name ? <p className="mt-1 text-xs text-error">{fieldErrors.name}</p> : null}
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
						aria-describedby={ids.emailHelp}
						aria-invalid={Boolean(fieldErrors.email)}
					/>
					<p id={ids.emailHelp} className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
						{sessionStatus === 'loading'
							? 'Đang kiểm tra thông tin tài khoản…'
							: isAccount
								? 'Tôi sẽ phản hồi vào email của tài khoản này.'
								: 'Vui lòng nhập email bạn thường dùng để tôi có thể liên lạc.'}
					</p>
					{fieldErrors.email ? (
						<p className="mt-1 text-xs text-error">{fieldErrors.email}</p>
					) : null}
				</div>
			</div>

			<div>
				<label htmlFor={ids.inquiryType} className={labelClass}>
					Chủ đề
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

			<div>
				<label htmlFor={ids.context} className={labelClass}>
					Bạn muốn trao đổi điều gì?
				</label>
				<p className="mt-1 text-sm text-ink-secondary">
					Một vài dòng là đủ để tôi hiểu câu chuyện của bạn.
				</p>
				<textarea
					id={ids.context}
					required
					rows={6}
					className={inputClass}
					value={form.context}
					onChange={(event) => update('context', event.target.value)}
					aria-invalid={Boolean(fieldErrors.context)}
				/>
				{fieldErrors.context ? (
					<p className="mt-1 text-xs text-error">{fieldErrors.context}</p>
				) : null}
			</div>

			<div>
				<label htmlFor={ids.timeframe} className={labelClass}>
					Thời điểm bạn mong muốn (không bắt buộc)
				</label>
				<input
					id={ids.timeframe}
					className={inputClass}
					value={form.timeframe}
					onChange={(event) => update('timeframe', event.target.value)}
					placeholder="Ví dụ: trong tháng này, hoặc chưa vội"
				/>
			</div>

			<div>
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
				{fieldErrors.agreedPrivacy ? (
					<p className="mt-2 text-xs text-error">{fieldErrors.agreedPrivacy}</p>
				) : null}
			</div>

			<button
				type="submit"
				disabled={pending || sessionStatus === 'loading'}
				className="inline-flex min-h-11 items-center border-y border-hairline px-5 text-sm font-semibold text-accent transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-60"
			>
				{pending
					? 'Đang gửi…'
					: sessionStatus === 'loading'
						? 'Đang kiểm tra tài khoản…'
						: 'Gửi lời nhắn'}
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
