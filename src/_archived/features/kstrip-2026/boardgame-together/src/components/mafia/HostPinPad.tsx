'use client';

import { useCallback, useState } from 'react';

import { useT } from '@/components/i18n/LocaleProvider';
import { Button } from '@/components/ui';
import { mafiaGlass, mafiaPrimary } from '@/components/mafia/mafiaStyles';
import { DEFAULT_PIN_LENGTH } from '@/config/mafiaGame';
import { hapticLight } from '@/lib/haptics';
import { cn } from '@/lib/cn';
import { isValidPin } from '@/lib/mafia/pin';

interface HostPinPadProps {
	title?: string;
	onSubmit: (pin: string) => Promise<boolean>;
	onCancel?: () => void;
	error?: string | null;
	locked?: boolean;
}

export default function HostPinPad({
	title,
	onSubmit,
	onCancel,
	error,
	locked,
}: HostPinPadProps) {
	const t = useT();
	const [pin, setPin] = useState('');
	const [busy, setBusy] = useState(false);
	const pinLength = DEFAULT_PIN_LENGTH;

	const handleDigit = useCallback(
		(digit: string) => {
			if (locked || busy) return;
			hapticLight();
			setPin((prev) => (prev.length < pinLength ? prev + digit : prev));
		},
		[locked, busy, pinLength],
	);

	const handleBackspace = useCallback(() => {
		if (locked || busy) return;
		setPin((prev) => prev.slice(0, -1));
	}, [locked, busy]);

	const handleSubmit = useCallback(async () => {
		if (!isValidPin(pin, pinLength) || locked) return;
		setBusy(true);
		const ok = await onSubmit(pin);
		if (!ok) setPin('');
		setBusy(false);
	}, [pin, pinLength, locked, onSubmit]);

	return (
		<div className={cn('flex w-full max-w-sm flex-col items-center gap-6 p-6', mafiaGlass)}>
			<h2 className="font-display text-center text-xl font-semibold text-[var(--mafia-foreground)]">
				{title ?? t('mafia.pinPad.title')}
			</h2>

			<div className="flex gap-4" aria-label="PIN dots">
				{Array.from({ length: pinLength }).map((_, i) => (
					<div
						key={i}
						className={cn(
							'h-3.5 w-3.5 rounded-full transition-all duration-200',
							i < pin.length
								? 'scale-125 bg-[var(--mafia-gold)] shadow-[0_0_8px_var(--mafia-gold-glow)]'
								: 'bg-[var(--mafia-border)]',
						)}
					/>
				))}
			</div>

			{error ? <p className="text-sm text-red-400">{error}</p> : null}
			{locked ? (
				<p className="text-center text-sm text-amber-400">
					{t('mafia.pinPad.lockout')}
				</p>
			) : null}

			<div className="grid grid-cols-3 gap-3">
				{['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key) => {
					if (key === '') {
						return <div key="empty" />;
					}
					return (
						<button
							key={key}
							type="button"
							disabled={locked || busy}
							onClick={() => (key === '⌫' ? handleBackspace() : handleDigit(key))}
							className="flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--mafia-border)] bg-[var(--mafia-surface-elevated)] text-lg font-medium text-[var(--mafia-foreground)] transition hover:bg-white/5 active:scale-95 disabled:opacity-40"
						>
							{key}
						</button>
					);
				})}
			</div>

			<div className="flex w-full flex-col gap-2">
				<Button
					fullWidth
					disabled={!isValidPin(pin, pinLength) || locked || busy}
					loading={busy}
					className={mafiaPrimary}
					onClick={() => void handleSubmit()}
				>
					{t('mafia.pinPad.confirm')}
				</Button>
				{onCancel ? (
					<Button
						fullWidth
						variant="ghost"
						className="text-[var(--mafia-muted)] hover:bg-white/5"
						onClick={onCancel}
					>
						{t('mafia.pinPad.cancel')}
					</Button>
				) : null}
			</div>
		</div>
	);
}
