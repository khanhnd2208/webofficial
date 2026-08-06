'use client';

import { useState } from 'react';

import { useT } from '@/components/i18n/LocaleProvider';
import MafiaHeader from '@/components/mafia/MafiaHeader';
import MafiaScreen from '@/components/mafia/MafiaScreen';
import { mafiaGlass, mafiaPrimary } from '@/components/mafia/mafiaStyles';
import { DEFAULT_PIN_LENGTH } from '@/config/mafiaGame';
import { useMafiaGame } from '@/components/mafia/hooks/useMafiaGame';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { isValidPin } from '@/lib/mafia/pin';

export default function PinSetupScreen() {
	const { setHostPin, updateGame } = useMafiaGame();
	const t = useT();
	const [pin, setPin] = useState('');
	const [confirm, setConfirm] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const pinLength = DEFAULT_PIN_LENGTH;

	const handleSubmit = async () => {
		if (!isValidPin(pin, pinLength)) {
			setError(t('mafia.pinSetup.lengthError', { pinLength }));
			return;
		}
		if (pin !== confirm) {
			setError(t('mafia.pinSetup.mismatch'));
			return;
		}
		setBusy(true);
		await setHostPin(pin);
		setBusy(false);
	};

	const inputClass =
		'mt-1 w-full rounded-xl border border-[var(--mafia-border)] bg-[var(--mafia-surface-elevated)] px-3 py-3 text-center font-mono text-2xl tracking-[0.5em] text-[var(--mafia-foreground)]';

	return (
		<MafiaScreen
			footer={
				<Button
					fullWidth
					loading={busy}
					className={mafiaPrimary}
					disabled={!isValidPin(pin, pinLength) || !isValidPin(confirm, pinLength)}
					onClick={() => void handleSubmit()}
				>
					{t('mafia.pinSetup.continue')}
				</Button>
			}
		>
			<MafiaHeader
				title={t('mafia.pinSetup.title')}
				subtitle={t('mafia.pinSetup.subtitle')}
				onBack={() => updateGame({ status: 'SETUP_ROLES' })}
			/>

			<div className={cn('space-y-4 p-4', mafiaGlass)}>
				<label className="block text-sm font-medium text-[var(--mafia-foreground)]">
					{t('mafia.pinSetup.enter', { pinLength })}
					<input
						type="password"
						inputMode="numeric"
						maxLength={pinLength}
						value={pin}
						onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
						className={inputClass}
					/>
				</label>
				<label className="block text-sm font-medium text-[var(--mafia-foreground)]">
					{t('mafia.pinSetup.confirm')}
					<input
						type="password"
						inputMode="numeric"
						maxLength={pinLength}
						value={confirm}
						onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
						className={inputClass}
					/>
				</label>
			</div>

			{error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
		</MafiaScreen>
	);
}
