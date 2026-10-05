'use client';

import { useState } from 'react';

import { LiveRegion } from '@/components/ui/Dialog';

import type { SaveStatus } from './useStudioSaver';

const QUIET: SaveStatus[] = ['saved', 'error', 'conflict'];

function clock(at: number) {
	return new Date(at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function labelFor(
	status: SaveStatus,
	issueCount: number,
	retryInMs: number | null,
	savedAt: number | null,
): string {
	if (status === 'saved') return savedAt ? `Đã lưu · ${clock(savedAt)}` : 'Đã lưu ✓';
	if (status === 'saving') return 'Đang lưu…';
	if (status === 'retrying') {
		const seconds = Math.max(1, Math.ceil((retryInMs ?? 0) / 1000));
		return `Mất kết nối · thử lại sau ${seconds} giây`;
	}
	if (status === 'invalid') {
		const count = Math.max(issueCount, 1);
		return `Chưa lưu · ${count} lỗi cần sửa`;
	}
	if (status === 'conflict') return 'Có bản khác';
	return 'Lưu';
}

export default function SaveIndicator({
	status,
	error,
	retryInMs,
	issueCount,
	savedAt = null,
	onFlush,
	onShowIssue,
}: {
	status: SaveStatus;
	error: string | null;
	retryInMs: number | null;
	issueCount: number;
	savedAt?: number | null;
	onFlush: () => void;
	/** Jump to the field that cannot be saved. */
	onShowIssue?: () => void;
}) {
	const [seen, setSeen] = useState(status);
	const [announcement, setAnnouncement] = useState('');
	const label = labelFor(status, issueCount, retryInMs, savedAt);
	if (seen !== status) {
		setSeen(status);
		setAnnouncement(QUIET.includes(status) ? (status === 'saved' ? 'Đã lưu' : error || label) : '');
	}

	const actionable = status === 'pending' || status === 'error' || status === 'conflict';
	const retrying = status === 'retrying';

	return (
		<>
			<button
				type="button"
				className={`ln-save ln-btn${actionable || retrying ? ' ln-btn--primary' : ''}`}
				data-status={status}
				title={
					error ??
					(status === 'invalid'
						? 'Bấm để tới chỗ cần sửa'
						: status === 'saved'
							? 'Mọi thay đổi đã được lưu'
							: 'Lưu ngay (⌘/Ctrl S)')
				}
				disabled={
					status === 'saved' || status === 'saving' || (status === 'invalid' && !onShowIssue)
				}
				onClick={() => (status === 'invalid' ? onShowIssue?.() : onFlush())}
			>
				<span className="ln-save__dot" aria-hidden="true" />
				{label}
			</button>
			{retrying ? (
				<button type="button" className="ln-link-btn" onClick={() => onFlush()}>
					Thử lại ngay
				</button>
			) : null}
			<LiveRegion
				message={announcement}
				politeness={status === 'error' || status === 'conflict' ? 'assertive' : 'polite'}
			/>
		</>
	);
}
