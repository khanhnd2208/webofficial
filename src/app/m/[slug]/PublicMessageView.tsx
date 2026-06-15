'use client';

import { useCallback, useEffect, useState } from 'react';

import MessageContentDisplay from '@/components/MessageContentDisplay';
import MessagePasswordGate, {
	getStoredMessageContent,
	isMessageUnlocked,
} from '@/components/MessagePasswordGate';
import type { PublicMessageDTO } from '@/types/message';

interface PublicMessageViewProps {
	slug: string;
}

export default function PublicMessageView({ slug }: PublicMessageViewProps) {
	const [message, setMessage] = useState<PublicMessageDTO | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [unlocked, setUnlocked] = useState(false);

	const fetchMessage = useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const res = await fetch(`/api/m/${slug}`);
			const json = (await res.json()) as { ok?: boolean; error?: string; data?: PublicMessageDTO };
			if (!res.ok || !json.ok || !json.data) {
				throw new Error(json.error ?? 'Không tìm thấy lời nhắn');
			}
			setMessage(json.data);

			if (json.data.hasPassword && isMessageUnlocked(slug)) {
				const stored = getStoredMessageContent(slug);
				if (stored?.content) {
					setMessage(stored);
					setUnlocked(true);
				}
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Lỗi không xác định');
		} finally {
			setLoading(false);
		}
	}, [slug]);

	useEffect(() => {
		void fetchMessage();
	}, [fetchMessage]);

	useEffect(() => {
		if (isMessageUnlocked(slug)) {
			setUnlocked(true);
		}
	}, [slug]);

	const handleUnlock = useCallback((unlockedMessage: PublicMessageDTO) => {
		setMessage(unlockedMessage);
		setUnlocked(true);
	}, []);

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-sm text-muted">Đang mở lời nhắn...</p>
			</div>
		);
	}

	if (error || !message) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
				<p className="text-4xl">💌</p>
				<p className="mt-4 text-lg font-semibold text-foreground">
					{error || 'Không tìm thấy lời nhắn'}
				</p>
			</div>
		);
	}

	if (message.isExpired) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
				<p className="text-4xl">⏳</p>
				<p className="mt-4 text-lg font-semibold text-foreground">Lời nhắn đã hết hạn</p>
			</div>
		);
	}

	const needsPassword = message.hasPassword && !message.content && !unlocked;

	if (needsPassword) {
		return (
			<MessagePasswordGate
				slug={slug}
				title={message.title}
				coverImageUrl={message.coverImageUrl}
				onUnlock={handleUnlock}
			/>
		);
	}

	if (message.hasPassword && unlocked && !message.content) {
		const stored = getStoredMessageContent(slug);
		if (stored?.content) {
			return <MessageContentDisplay message={stored} />;
		}
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-sm text-muted">Vui lòng nhập mật khẩu lại.</p>
			</div>
		);
	}

	return <MessageContentDisplay message={message} />;
}
