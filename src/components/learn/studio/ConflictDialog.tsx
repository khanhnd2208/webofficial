'use client';

import { useEffect, useState } from 'react';

import { sectionPlainText } from '@/features/learn/sectionText';
import { wordDiff } from '@/features/learn/textFidelity';
import type { LearnStudioSection } from '@/features/learn/types';
import { adminFetch } from '@/lib/admin/client';

import StudioDialog from './StudioDialog';
import TextDiff from './TextDiff';

export default function ConflictDialog({
	sectionId,
	local,
	onTakeRemote,
	onKeepMine,
}: {
	sectionId: string;
	local: LearnStudioSection;
	onTakeRemote: (remote: LearnStudioSection) => void;
	onKeepMine: (remoteUpdatedAt: string) => void;
}) {
	const [remote, setRemote] = useState<LearnStudioSection | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		adminFetch<LearnStudioSection>(`/api/admin/learn/sections/${sectionId}`)
			.then((section) => {
				if (!cancelled) setRemote(section);
			})
			.catch((err: unknown) => {
				if (!cancelled) setError(err instanceof Error ? err.message : 'Không tải được bản mới');
			});
		return () => {
			cancelled = true;
		};
	}, [sectionId]);

	const hunks =
		remote === null ? [] : wordDiff(sectionPlainText(remote), sectionPlainText(local)).slice(0, 40);

	return (
		<StudioDialog
			title={`Mục "${local.title}" vừa được sửa ở nơi khác`}
			size="narrow"
			onClose={() => undefined}
			footer={
				<div className="ln-confirm">
					<button
						type="button"
						className="ln-btn"
						disabled={!remote}
						onClick={() => remote && onTakeRemote(remote)}
					>
						Dùng bản mới nhất
					</button>
					<button
						type="button"
						className="ln-btn ln-btn--primary"
						disabled={!remote}
						onClick={() => remote && onKeepMine(remote.updatedAt)}
					>
						Giữ bản của tôi
					</button>
				</div>
			}
		>
			{error ? <p role="alert">{error}</p> : null}
			{remote ? <TextDiff hunks={hunks} /> : <p>Đang tải bản trên máy chủ…</p>}
			{remote && !hunks.length ? <p>Nội dung chữ giống nhau. Khác ở dữ liệu kèm theo.</p> : null}
		</StudioDialog>
	);
}
