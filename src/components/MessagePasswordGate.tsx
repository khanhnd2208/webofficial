'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { PublicMessageDTO } from '@/types/message';

interface MessagePasswordGateProps {
	slug: string;
	title: string;
	coverImageUrl?: string;
	onUnlock: (message: PublicMessageDTO) => void;
}

const UNLOCK_KEY_PREFIX = 'message-unlock-';
const CONTENT_KEY_PREFIX = 'message-content-';

export function isMessageUnlocked(slug: string): boolean {
	try {
		return sessionStorage.getItem(`${UNLOCK_KEY_PREFIX}${slug}`) === '1';
	} catch {
		return false;
	}
}

export function getStoredMessageContent(slug: string): PublicMessageDTO | null {
	try {
		const raw = sessionStorage.getItem(`${CONTENT_KEY_PREFIX}${slug}`);
		if (!raw) return null;
		return JSON.parse(raw) as PublicMessageDTO;
	} catch {
		return null;
	}
}

export function setMessageUnlocked(slug: string, message: PublicMessageDTO): void {
	try {
		sessionStorage.setItem(`${UNLOCK_KEY_PREFIX}${slug}`, '1');
		sessionStorage.setItem(`${CONTENT_KEY_PREFIX}${slug}`, JSON.stringify(message));
	} catch {
		/* ignore */
	}
}

export default function MessagePasswordGate({
	slug,
	title,
	coverImageUrl,
	onUnlock,
}: MessagePasswordGateProps) {
	const [digits, setDigits] = useState<string[]>(Array(8).fill(''));
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	const tryUnlock = useCallback(
		async (code: string) => {
			setLoading(true);
			setError('');
			try {
				const res = await fetch(`/api/m/${slug}/unlock`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ password: code }),
				});
				const json = (await res.json()) as {
					ok?: boolean;
					error?: string;
					data?: PublicMessageDTO;
				};
				if (!res.ok || !json.ok || !json.data) {
					throw new Error(json.error ?? 'Mật khẩu không đúng');
				}
				setMessageUnlocked(slug, json.data);
				onUnlock(json.data);
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Mật khẩu không đúng');
				setDigits(Array(8).fill(''));
				inputRefs.current[0]?.focus();
			} finally {
				setLoading(false);
			}
		},
		[slug, onUnlock],
	);

	const handleChange = (index: number, value: string) => {
		const digit = value.replace(/\D/g, '').slice(-1);
		const next = [...digits];
		next[index] = digit;
		setDigits(next);
		setError('');

		if (digit && index < 7) {
			inputRefs.current[index + 1]?.focus();
		}

		if (next.every((d) => d !== '') && next.join('').length === 8) {
			void tryUnlock(next.join(''));
		}
	};

	const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Backspace' && !digits[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	useEffect(() => {
		inputRefs.current[0]?.focus();
	}, []);

	return (
		<div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
			{/* Background */}
			{coverImageUrl ? (
				<div
					className="pointer-events-none absolute inset-0 scale-110 bg-cover bg-center opacity-25 blur-3xl"
					style={{ backgroundImage: `url(${coverImageUrl})` }}
				/>
			) : (
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/10" />
			)}

			<div className="relative z-10 w-full max-w-xs text-center">
				{/* Envelope icon */}
				<div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/10 text-4xl shadow-inner ring-1 ring-accent/20">
					💌
				</div>

				<h1 className="text-xl font-bold leading-tight tracking-tight text-foreground">{title}</h1>
				<p className="mt-2 text-sm text-muted">Nhập mã 8 chữ số để mở lời nhắn</p>

				{/* OTP inputs */}
				<div className="mt-8 flex justify-center gap-2">
					{digits.map((digit, i) => (
						<input
							key={i}
							ref={(el) => { inputRefs.current[i] = el; }}
							type="text"
							inputMode="numeric"
							maxLength={1}
							value={digit}
							disabled={loading}
							onChange={(e) => handleChange(i, e.target.value)}
							onKeyDown={(e) => handleKeyDown(i, e)}
							className={`h-12 w-10 rounded-xl border bg-surface text-center text-lg font-bold text-foreground shadow-sm transition focus:outline-none focus:ring-2 sm:h-14 sm:w-12 ${
								error
									? 'border-error/60 focus:border-error focus:ring-error/20'
									: 'border-border focus:border-accent focus:ring-accent/20'
							} ${i === 3 ? 'mr-2' : ''}`}
						/>
					))}
				</div>

				{error && (
					<p className="mt-4 text-sm font-medium text-error">{error}</p>
				)}

				{loading && (
					<div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted">
						<span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-accent" />
						Đang mở...
					</div>
				)}

				<p className="mt-6 text-[11px] text-muted/60">
					Mã được cung cấp bởi người gửi
				</p>
			</div>
		</div>
	);
}
