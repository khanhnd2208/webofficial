'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';

import { useLocale } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { Button } from '@/features/board-game-shared/components/ui';
import { resolveErrorMessage } from '@/features/board-game-shared/lib/i18n/tLocale';

import type { LiveBotGame } from './types';

const COPY = {
	vi: {
		title: 'Chế độ bot · Admin',
		body: 'Thêm bot cho đủ người. Bot tự xác nhận vai, chọn và bỏ phiếu; bạn vẫn điều khiển ván. Bớt bot bằng nút mời ra khỏi phòng.',
		add: 'Thêm bot',
		added: (name: string) => `Đã thêm ${name}.`,
	},
	en: {
		title: 'Bot mode · Admin',
		body: 'Add bots to fill the table. Bots confirm roles, pick and vote on their own; you still run the game. Remove one with the kick button.',
		add: 'Add bot',
		added: (name: string) => `${name} joined.`,
	},
} as const;

/**
 * Lobby panel for a signed-in admin who hosts a real room: seat bots. Hidden for everyone else,
 * so ordinary players never see it.
 */
export default function LiveBotControls({
	game,
	code,
	hostToken,
	full,
	onChanged,
}: {
	game: LiveBotGame;
	code: string;
	hostToken: string | null;
	full: boolean;
	onChanged: () => void | Promise<void>;
}) {
	const { data: session } = useSession();
	const { locale } = useLocale();
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
	if (session?.user?.role !== 'admin' || !hostToken) return null;
	const copy = COPY[locale];

	async function add() {
		setBusy(true);
		setMessage(null);
		try {
			const response = await fetch(`/api/admin/board-game/rooms/${game}/${code}/bots`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: hostToken }),
			});
			const body = (await response.json()) as {
				ok: boolean;
				data?: { name: string };
				code?: string;
			};
			if (!response.ok || !body.ok) {
				setMessage({ tone: 'error', text: resolveErrorMessage(locale, body.code ?? 'UNKNOWN') });
				return;
			}
			setMessage({ tone: 'ok', text: copy.added(body.data?.name ?? 'Bot') });
			await onChanged();
		} catch {
			setMessage({ tone: 'error', text: resolveErrorMessage(locale, 'UNKNOWN') });
		} finally {
			setBusy(false);
		}
	}

	return (
		<section
			className="rounded-2xl border border-vermilion/40 bg-vermilion/5 p-4"
			data-testid="live-bot-controls"
		>
			<p className="text-sm font-semibold text-ink">{copy.title}</p>
			<p className="mt-1 text-xs leading-relaxed text-muted">{copy.body}</p>
			<div className="mt-3 flex flex-wrap items-center gap-3">
				<Button type="button" size="sm" loading={busy} disabled={full} onClick={() => void add()}>
					{copy.add}
				</Button>
				{message ? (
					<p
						role={message.tone === 'error' ? 'alert' : 'status'}
						className={`text-xs ${message.tone === 'error' ? 'text-danger' : 'text-muted'}`}
					>
						{message.text}
					</p>
				) : null}
			</div>
		</section>
	);
}
