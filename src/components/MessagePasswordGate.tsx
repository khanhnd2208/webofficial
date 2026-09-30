'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

import type { PublicMessageDTO } from '@/types/message';

interface MessagePasswordGateProps {
	slug: string;
	title: string;
	coverImageUrl?: string;
	onUnlock: (message: PublicMessageDTO) => void;
}

const UNLOCK_KEY_PREFIX = 'message-unlock-';
const CONTENT_KEY_PREFIX = 'message-content-';
const CODE_LENGTH = 8;

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
	const [code, setCode] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const liveId = useId();
	const slotsId = useId();

	const tryUnlock = useCallback(
		async (value: string) => {
			setLoading(true);
			setError('');
			try {
				const res = await fetch(`/api/m/${slug}/unlock`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ password: value }),
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
				setCode('');
				inputRef.current?.focus();
			} finally {
				setLoading(false);
			}
		},
		[slug, onUnlock],
	);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	function onCodeChange(raw: string) {
		const next = raw.replace(/\D/g, '').slice(0, CODE_LENGTH);
		setCode(next);
		setError('');
		if (next.length === CODE_LENGTH) {
			void tryUnlock(next);
		}
	}

	const slots = Array.from({ length: CODE_LENGTH }, (_, i) => code[i] ?? '');

	return (
		<div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
			{coverImageUrl ? (
				<div
					className="pointer-events-none absolute inset-0 scale-110 bg-cover bg-center opacity-25 blur-3xl"
					style={{ backgroundImage: `url(${coverImageUrl})` }}
					aria-hidden
				/>
			) : (
				<div
					className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/10"
					aria-hidden
				/>
			)}

			<main className="relative z-10 w-full max-w-xs text-center">
				<div
					className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/10 text-4xl shadow-inner ring-1 ring-accent/20"
					aria-hidden
				>
					💌
				</div>

				<h1 className="text-xl font-bold leading-tight tracking-tight text-foreground">{title}</h1>
				<p className="mt-2 text-sm text-muted">Nhập mã 8 chữ số để mở lời nhắn</p>

				<label htmlFor={liveId} className="sr-only">
					Mã mở khóa 8 chữ số
				</label>
				<input
					ref={inputRef}
					id={liveId}
					type="text"
					inputMode="numeric"
					autoComplete="one-time-code"
					pattern="[0-9]*"
					maxLength={CODE_LENGTH}
					value={code}
					disabled={loading}
					onChange={(e) => onCodeChange(e.target.value)}
					aria-invalid={error ? true : undefined}
					aria-describedby={error ? `${liveId}-error` : slotsId}
					className="sr-only"
				/>

				{/* Presentational slots only — real input is above for paste/autofill */}
				<div
					id={slotsId}
					aria-hidden
					className="mt-8 flex justify-center gap-2"
					onClick={() => inputRef.current?.focus()}
				>
					{slots.map((digit, i) => (
						<span
							key={i}
							className={`flex h-12 w-10 items-center justify-center rounded-xl border bg-surface text-lg font-bold text-foreground shadow-sm sm:h-14 sm:w-12 ${
								error ? 'border-error/60' : digit ? 'border-accent' : 'border-border'
							} ${i === 3 ? 'mr-2' : ''}`}
						>
							{digit || '·'}
						</span>
					))}
				</div>

				<div
					id={`${liveId}-error`}
					className="mt-4 min-h-5"
					aria-live="assertive"
					aria-atomic="true"
				>
					{error ? <p className="text-sm font-medium text-error">{error}</p> : null}
				</div>

				{loading ? (
					<div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted">
						<span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-accent" />
						Đang mở...
					</div>
				) : null}

				<p className="mt-6 text-[11px] text-muted/60">Mã được cung cấp bởi người gửi</p>
			</main>
		</div>
	);
}
