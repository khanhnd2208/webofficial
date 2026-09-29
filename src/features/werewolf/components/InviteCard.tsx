'use client';
import { useTestRoom } from '@/features/board-game-test/context';

import QRCode from 'react-qr-code';

import { routes } from '@/config/routes';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button } from '@/features/spy-fall/components/ui';
import TicketCard from '@/features/spy-fall/components/ui/TicketCard';
import { useToast } from '@/features/spy-fall/components/ui/Toast';
import { BASE_PATH, withBasePath } from '@/features/spy-fall/lib/basePath';
import { hapticLight } from '@/features/spy-fall/lib/haptics';

interface Props {
	code: string;
}

export default function InviteCard({ code }: Props) {
	const testRoom = useTestRoom();
	const t = useT();
	const { toast } = useToast();
	const url =
		typeof window !== 'undefined'
			? `${window.location.origin}${BASE_PATH}${routes.maSoiRoom(code)}`
			: withBasePath(routes.maSoiRoom(code));

	async function copy(value: string, okKey: 'mafia.invite.copiedCode' | 'mafia.invite.copiedLink') {
		hapticLight();
		try {
			await navigator.clipboard.writeText(value);
			toast(t(okKey), 'success');
		} catch {
			toast(t('mafia.invite.copyFail'), 'error');
		}
	}

	async function shareInvite() {
		hapticLight();
		const text = t('mafia.invite.shareText', { code });
		if (typeof navigator !== 'undefined' && navigator.share) {
			try {
				await navigator.share({ title: 'Ma Sói', text, url });
				toast(t('mafia.invite.shared'), 'success');
				return;
			} catch {
				// cancelled or unsupported
			}
		}
		await copy(url, 'mafia.invite.copiedLink');
	}

	if (testRoom) return null;

	return (
		<TicketCard title={t('mafia.invite.title')} code={code} subtitle={t('mafia.invite.scan')}>
			<div className="flex flex-col items-center gap-4">
				<div className="rounded-xl bg-white p-3 shadow-sm">
					<QRCode value={url} size={160} />
				</div>
				<p className="max-w-[240px] break-all text-center text-xs text-muted">{url}</p>
				<div className="grid w-full grid-cols-3 gap-2">
					<Button type="button" variant="secondary" size="sm" className="whitespace-nowrap px-2" onClick={() => void copy(code, 'mafia.invite.copiedCode')}>
						{t('mafia.invite.copyCode')}
					</Button>
					<Button type="button" variant="secondary" size="sm" className="whitespace-nowrap px-2" onClick={() => void copy(url, 'mafia.invite.copiedLink')}>
						{t('mafia.invite.copyLink')}
					</Button>
					<Button type="button" variant="tertiary" size="sm" className="whitespace-nowrap px-2" onClick={() => void shareInvite()}>
						{t('mafia.invite.share')}
					</Button>
				</div>
			</div>
		</TicketCard>
	);
}
