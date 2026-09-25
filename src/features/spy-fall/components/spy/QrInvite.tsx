'use client';

import QRCode from 'react-qr-code';

import { BASE_PATH, withBasePath } from '@/features/spy-fall/lib/basePath';
import { Button } from '@/features/spy-fall/components/ui';
import { useToast } from '@/features/spy-fall/components/ui/Toast';
import TicketCard from '@/features/spy-fall/components/ui/TicketCard';
import { hapticLight } from '@/features/spy-fall/lib/haptics';
import { playTap } from '@/features/spy-fall/lib/sounds';
import { routes } from '@/config/routes';

interface Props {
	code: string;
	roomName?: string;
}

export default function QrInvite({ code, roomName }: Props) {
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
			toast('Đã sao chép mã phòng', 'success');
		} catch {
			toast('Không sao chép được mã', 'error');
		}
	}

	async function copyLink() {
		hapticLight();
		playTap();
		try {
			await navigator.clipboard.writeText(url);
			toast('Đã sao chép link mời', 'success');
		} catch {
			toast('Không sao chép được link', 'error');
		}
	}

	async function shareInvite() {
		hapticLight();
		playTap();
		const text = `Tham gia Spy Fall — mã phòng ${code}`;
		if (typeof navigator !== 'undefined' && navigator.share) {
			try {
				await navigator.share({ title: roomName ?? 'Spy Fall', text, url });
				toast('Đã mở chia sẻ', 'success');
				return;
			} catch {
				// user cancelled or unsupported — fall through to copy
			}
		}
		await copyLink();
	}

	return (
		<TicketCard title={roomName} code={code} subtitle="Quét để tham gia điệp vụ">
			<div className="flex flex-col items-center gap-4">
				<div className="rounded-xl bg-white p-3 shadow-sm">
					<QRCode value={url} size={160} />
				</div>
				<p className="max-w-[240px] break-all text-center text-xs text-muted">{url}</p>
				<div className="flex w-full flex-wrap justify-center gap-2">
					<Button type="button" variant="secondary" size="sm" onClick={() => void copyCode()}>
						Sao chép mã
					</Button>
					<Button type="button" variant="secondary" size="sm" onClick={() => void copyLink()}>
						Sao chép link
					</Button>
					<Button type="button" variant="tertiary" size="sm" onClick={() => void shareInvite()}>
						Chia sẻ
					</Button>
				</div>
			</div>
		</TicketCard>
	);
}
