'use client';

import Link from 'next/link';

import SaveIndicator from './SaveIndicator';
import StudioMenu, { type StudioMenuEntry } from './StudioMenu';
import type { SaveStatus } from './useStudioSaver';

export default function StudioTopBar({
	courseHref,
	title,
	published,
	status,
	error,
	retryInMs,
	issueCount,
	savedAt,
	onNavigate,
	onFlush,
	onShowIssue,
	onOpenSettings,
	onPreview,
	canPreview,
	onPublish,
	onUnpublish,
	onExportCourse,
	onExportLesson,
	onHelp,
}: {
	courseHref: string;
	title: string;
	published: boolean;
	status: SaveStatus;
	error: string | null;
	retryInMs: number | null;
	issueCount: number;
	savedAt: number | null;
	onNavigate: (href: string, event: React.MouseEvent<HTMLAnchorElement>) => void;
	onFlush: () => void;
	onShowIssue: () => void;
	onOpenSettings: () => void;
	onPreview: () => void;
	canPreview: boolean;
	onPublish: () => void;
	onUnpublish: () => void;
	onExportCourse: () => void;
	onExportLesson: () => void;
	onHelp: () => void;
}) {
	const menu: StudioMenuEntry[] = [
		{ label: 'Thông tin khóa học', icon: 'settings', onSelect: onOpenSettings },
		{ label: 'Xuất Markdown cả khóa', icon: 'download', onSelect: onExportCourse },
		{ label: 'Xuất Markdown bài đang mở', icon: 'download', onSelect: onExportLesson },
		{ label: 'Trợ giúp: cú pháp và phím tắt', icon: 'help', onSelect: onHelp },
		...(published
			? (['divider', { label: 'Chuyển về bản nháp…', onSelect: onUnpublish }] as StudioMenuEntry[])
			: []),
	];

	return (
		<header className="ln-studio__bar">
			<Link
				href={courseHref}
				className="ln-backlink"
				onClick={(event) => onNavigate(courseHref, event)}
			>
				← Về trang học
			</Link>
			<button
				type="button"
				className="ln-studio__course"
				onClick={onOpenSettings}
				title="Sửa thông tin khóa học"
			>
				<span className="truncate">{title}</span>
			</button>
			<SaveIndicator
				status={status}
				error={error}
				retryInMs={retryInMs}
				issueCount={issueCount}
				savedAt={savedAt}
				onFlush={onFlush}
				onShowIssue={onShowIssue}
			/>
			<button
				type="button"
				className="ln-btn ln-btn--sm"
				onClick={onPreview}
				disabled={!canPreview}
			>
				Xem như học viên
			</button>
			{published ? (
				<span className="ln-pill" data-tone="live">
					Đang công khai
				</span>
			) : (
				<button type="button" className="ln-btn ln-btn--primary" onClick={onPublish}>
					Xuất bản…
				</button>
			)}
			<StudioMenu label="Thêm thao tác với khóa học" items={menu} align="end" />
		</header>
	);
}
