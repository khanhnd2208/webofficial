'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useState } from 'react';

import { Sheet } from '@/components/ui';
import { routes } from '@/config/routes';
import { trackEvent } from '@/lib/analytics';

type QuickContactPanelProps = {
	open: boolean;
	onClose: () => void;
	sourcePage: string;
};

function isValidEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function useSheetSide(): 'bottom' | 'right' {
	const [side, setSide] = useState<'bottom' | 'right'>('bottom');

	useEffect(() => {
		const media = window.matchMedia('(min-width: 768px)');
		const sync = () => setSide(media.matches ? 'right' : 'bottom');
		sync();
		media.addEventListener('change', sync);
		return () => media.removeEventListener('change', sync);
	}, []);

	return side;
}

export default function QuickContactPanel({ open, onClose, sourcePage }: QuickContactPanelProps) {
	const side = useSheetSide();
	const idPrefix = useId();
	const ids = {
		name: `${idPrefix}-name`,
		email: `${idPrefix}-email`,
		message: `${idPrefix}-message`,
		privacy: `${idPrefix}-privacy`,
		error: `${idPrefix}-error`,
	};

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState('');
	const [agreedPrivacy, setAgreedPrivacy] = useState(false);
	const [website, setWebsite] = useState('');
	const [pending, setPending] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	const reset = useCallback(() => {
		setName('');
		setEmail('');
		setMessage('');
		setAgreedPrivacy(false);
		setWebsite('');
		setPending(false);
		setSuccess(false);
		setError(null);
		setFieldErrors({});
	}, []);

	useEffect(() => {
		if (!open) return;
		reset();
	}, [open, reset]);

	async function onSubmit(event: React.FormEvent) {
		event.preventDefault();
		if (pending) return;

		const errors: Record<string, string> = {};
		if (!name.trim()) errors.name = 'Vui lòng cho biết tên của bạn.';
		if (!email.trim()) errors.email = 'Vui lòng nhập email.';
		else if (!isValidEmail(email.trim())) errors.email = 'Email không hợp lệ.';
		if (!message.trim()) errors.message = 'Vui lòng viết vài dòng lời nhắn.';
		if (!agreedPrivacy) errors.privacy = 'Vui lòng đồng ý với chính sách bảo mật.';

		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors);
			setError('Vui lòng kiểm tra lại những thông tin được đánh dấu.');
			return;
		}

		setFieldErrors({});
		setError(null);
		setPending(true);

		try {
			trackEvent('contact_form_submit', { type: 'other', sourcePage });
			const response = await fetch('/api/inquiries', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: name.trim(),
					email: email.trim(),
					inquiryType: 'other',
					context: message.trim(),
					sourcePage,
					agreedPrivacy: true,
					website,
				}),
			});
			const json = (await response.json()) as {
				ok: boolean;
				error?: string;
				fields?: Record<string, string>;
			};

			if (!response.ok || !json.ok) {
				setError(
					response.status >= 500
						? 'Lời nhắn chưa được gửi. Vui lòng thử lại sau.'
						: json.error || 'Lời nhắn chưa được gửi. Vui lòng thử lại sau.',
				);
				if (json.fields) setFieldErrors(json.fields);
				return;
			}

			setSuccess(true);
			trackEvent('contact_form_success', { type: 'other', sourcePage });
		} catch {
			setError('Lời nhắn chưa được gửi. Vui lòng thử lại sau.');
		} finally {
			setPending(false);
		}
	}

	return (
		<Sheet open={open} onClose={onClose} title="Gửi lời nhắn" side={side}>
			{success ? (
				<div role="status" className="space-y-4">
					<p className="text-base font-medium text-ink">Cảm ơn bạn đã chia sẻ.</p>
					<p className="text-sm leading-relaxed text-ink-secondary">
						Tôi sẽ đọc lời nhắn và phản hồi bằng một câu hỏi hoặc bước tiếp theo phù hợp.
					</p>
					<button
						type="button"
						onClick={onClose}
						className="editorial-text-link mt-2"
					>
						Đóng
					</button>
				</div>
			) : (
				<form onSubmit={onSubmit} className="space-y-5" noValidate>
					{error ? (
						<p id={ids.error} className="text-sm text-error" role="alert">
							{error}
						</p>
					) : null}

					<div>
						<label htmlFor={ids.name} className="text-sm font-medium text-ink">
							Tên
						</label>
						<input
							id={ids.name}
							name="name"
							autoComplete="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							aria-invalid={Boolean(fieldErrors.name)}
							className="premium-field mt-2"
						/>
						{fieldErrors.name ? (
							<p className="mt-1 text-sm text-error">{fieldErrors.name}</p>
						) : null}
					</div>

					<div>
						<label htmlFor={ids.email} className="text-sm font-medium text-ink">
							Email
						</label>
						<input
							id={ids.email}
							name="email"
							type="email"
							autoComplete="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							aria-invalid={Boolean(fieldErrors.email)}
							className="premium-field mt-2"
						/>
						{fieldErrors.email ? (
							<p className="mt-1 text-sm text-error">{fieldErrors.email}</p>
						) : null}
					</div>

					<div>
						<label htmlFor={ids.message} className="text-sm font-medium text-ink">
							Lời nhắn
						</label>
						<textarea
							id={ids.message}
							name="message"
							rows={5}
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							aria-invalid={Boolean(fieldErrors.message)}
							className="premium-field mt-2 min-h-[8rem] resize-y py-3"
						/>
						{fieldErrors.message ? (
							<p className="mt-1 text-sm text-error">{fieldErrors.message}</p>
						) : null}
					</div>

					{/* Honeypot */}
					<div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
						<label htmlFor={`${idPrefix}-website`}>Website</label>
						<input
							id={`${idPrefix}-website`}
							name="website"
							tabIndex={-1}
							autoComplete="off"
							value={website}
							onChange={(e) => setWebsite(e.target.value)}
						/>
					</div>

					<div>
						<label className="flex items-start gap-3 text-sm leading-relaxed text-ink-secondary">
							<input
								id={ids.privacy}
								type="checkbox"
								checked={agreedPrivacy}
								onChange={(e) => setAgreedPrivacy(e.target.checked)}
								aria-invalid={Boolean(fieldErrors.privacy)}
								className="mt-1"
							/>
							<span>
								Tôi đồng ý với{' '}
								<Link
									href={routes.policyPrivacy}
									className="underline underline-offset-2"
									target="_blank"
								>
									chính sách bảo mật
								</Link>
								.
							</span>
						</label>
						{fieldErrors.privacy ? (
							<p className="mt-1 text-sm text-error">{fieldErrors.privacy}</p>
						) : null}
					</div>

					<button
						type="submit"
						disabled={pending}
						className="editorial-button editorial-button-dark w-full disabled:opacity-60"
					>
						{pending ? 'Đang gửi…' : 'Gửi'}
					</button>

					<p className="pt-2 text-center">
						<Link
							href={`${routes.contact}?sourcePage=${encodeURIComponent(sourcePage)}`}
							className="text-sm text-ink/55 underline-offset-2 hover:text-ink hover:underline"
							onClick={onClose}
						>
							Mở trang liên hệ đầy đủ →
						</Link>
					</p>
				</form>
			)}
		</Sheet>
	);
}
