'use client';
import { useTestRoom } from '@/features/board-game-test/context';

import QRCode from 'react-qr-code';

import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { BASE_PATH, withBasePath } from '@/features/board-game-shared/lib/basePath';
import { Button } from '@/features/board-game-shared/components/ui';
import { useToast } from '@/features/board-game-shared/components/ui/Toast';
import TicketCard from '@/features/board-game-shared/components/ui/TicketCard';
import { hapticLight } from '@/features/board-game-shared/lib/haptics';
import { playTap } from '@/features/spy-fall/lib/sounds';
import { routes } from '@/config/routes';

interface Props {
	code: string;
	roomName?: string;
}

export default function QrInvite({ code, roomName }: Props) {
	const testRoom = useTestRoom();
	const t = useT();
	const { toast } = useToast();
	const url =
		typeof window !== 'undefined'
			? `${window.location.origin}${BASE_PATH}${routes.spyFallRoom(code)}`
			: withBasePath(routes.spyFallRoom(code));

	async function copyCode() {
		hapticLight();
		playTap();
		try {
			await navigator.clipboard.writeText(code);
			toast(t('spy.invite.copiedCode'), 'success');
		} catch {
			toast(t('spy.invite.copyFail'), 'error');
		}
	}

	async function copyLink() {
		hapticLight();
		playTap();
		try {
			await navigator.clipboard.writeText(url);
			toast(t('spy.invite.copiedLink'), 'success');
		} catch {
			toast(t('spy.invite.copyFail'), 'error');
		}
	}

	async function shareInvite() {
		hapticLight();
		playTap();
		const text = t('spy.invite.shareText', { code });
		if (typeof navigator !== 'undefined' && navigator.share) {
			try {
				await navigator.share({ title: roomName ?? 'Spy Fall', text, url });
				toast(t('spy.invite.shared'), 'success');
				return;
			} catch {
				// user cancelled or unsupported — fall through to copy
			}
		}
		await copyLink();
	}

	if (testRoom) return null;

	return (
		<TicketCard title={roomName} code={code} subtitle={t('spy.invite.scan')}>
			<div className="flex flex-col items-center gap-4">
				<div className="rounded-xl bg-white p-3 shadow-sm">
					<QRCode value={url} size={160} />
				</div>
				<p className="max-w-[240px] break-all text-center text-xs text-muted">{url}</p>
				<div className="grid w-full grid-cols-3 gap-2">
					<Button
						type="button"
						variant="secondary"
						size="sm"
						className="whitespace-nowrap px-2"
						onClick={() => void copyCode()}
					>
						{t('spy.invite.copyCode')}
					</Button>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						className="whitespace-nowrap px-2"
						onClick={() => void copyLink()}
					>
						{t('spy.invite.copyLink')}
					</Button>
					<Button
						type="button"
						variant="tertiary"
						size="sm"
						className="whitespace-nowrap px-2"
						onClick={() => void shareInvite()}
					>
						{t('spy.invite.share')}
					</Button>
				</div>
			</div>
		</TicketCard>
	);
}
