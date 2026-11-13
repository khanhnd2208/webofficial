'use client';

import { useState, type FormEvent } from 'react';

import { boothEndpoints, boothFetch } from './boothApi';
import styles from './fmt2026.module.css';

export function PinGate({ hasPin, onUnlocked }: { hasPin: boolean; onUnlocked: () => void }) {
	const [pin, setPin] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (pin.length < 4) return;
		setPending(true);
		setError(null);
		try {
			await boothFetch(boothEndpoints.unlock, { method: 'POST', body: JSON.stringify({ pin }) });
			onUnlocked();
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Không mở được quầy');
			setPin('');
		} finally {
			setPending(false);
		}
	}

	return (
		<div className={styles.gate}>
			<p className={styles.eyebrow}>FMT 2026</p>
			<h1 className={styles.title}>Nhận quà trở về</h1>
			{hasPin ? (
				<form className={styles.gateCard} onSubmit={submit}>
					<label htmlFor="fmt2026-pin" className={styles.subtitle}>
						Ban tổ chức nhập mã PIN để mở quầy quà
					</label>
					<input
						id="fmt2026-pin"
						className={styles.pinInput}
						type="password"
						inputMode="numeric"
						autoComplete="off"
						autoFocus
						value={pin}
						onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 12))}
					/>
					{error && (
						<p role="alert" className={styles.error}>
							{error}
						</p>
					)}
					<button className={styles.cta} type="submit" disabled={pending || pin.length < 4}>
						{pending ? 'Đang mở…' : 'Mở quầy'}
					</button>
				</form>
			) : (
				<p className={styles.subtitle}>Quầy quà chưa sẵn sàng. Admin cần đặt mã PIN trước.</p>
			)}
		</div>
	);
}
