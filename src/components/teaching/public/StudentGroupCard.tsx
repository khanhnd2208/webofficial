'use client';

import { useEffect, useState } from 'react';

import { teachingApi } from '@/components/teaching/admin/api';
import type { TeachingGroupBoard, TeachingTutorialRecord } from '@/features/teaching/types';

export function StudentGroupCard({
	slug,
	enrollmentId,
	tutorialClassId,
	tutorials,
	onOpenGroups,
}: {
	slug: string;
	enrollmentId: string;
	tutorialClassId: string | null;
	tutorials: TeachingTutorialRecord[];
	onOpenGroups: () => void;
}) {
	const effectiveTutorialId = tutorialClassId ?? tutorials[0]?.id ?? '';
	const [fetched, setFetched] = useState<{
		key: string;
		board: TeachingGroupBoard | null;
	} | null>(null);
	const requestKey = effectiveTutorialId ? `${slug}:${effectiveTutorialId}` : '';

	useEffect(() => {
		if (!effectiveTutorialId || !requestKey) return;
		const controller = new AbortController();
		void teachingApi<TeachingGroupBoard>(
			`/api/teaching/classes/${encodeURIComponent(slug)}/groups?tutorialClassId=${encodeURIComponent(effectiveTutorialId)}`,
			{ signal: controller.signal },
		)
			.then((data) => {
				if (!controller.signal.aborted) setFetched({ key: requestKey, board: data });
			})
			.catch(() => {
				if (!controller.signal.aborted) setFetched({ key: requestKey, board: null });
			});
		return () => controller.abort();
	}, [slug, effectiveTutorialId, requestKey]);

	if (!effectiveTutorialId) return null;

	const loading = fetched?.key !== requestKey;
	if (loading) {
		return (
			<section className="mc-surface p-4 sm:p-5" aria-label="Nhóm của bạn">
				<p className="text-xs font-semibold text-ink-secondary">Nhóm của bạn</p>
				<p className="mt-2 text-sm text-ink-secondary">Đang tải thông tin nhóm…</p>
			</section>
		);
	}

	const groupBoard = fetched.board;
	if (!groupBoard?.configured) return null;

	const myGroup = groupBoard.groups.find((group) =>
		group.assignments.some((member) => member.enrollmentId === enrollmentId),
	);

	return (
		<section className="mc-surface p-4 sm:p-5" aria-label="Nhóm của bạn">
			<p className="text-xs font-semibold text-ink-secondary">Nhóm của bạn</p>
			{myGroup ? (
				<>
					<h3 className="mt-1 text-base font-semibold text-ink">
						Nhóm {myGroup.displayOrder + 1} · {myGroup.assignments.length} người
					</h3>
					<ul className="mt-3 space-y-1.5 text-sm text-ink-secondary">
						{myGroup.assignments.map((member) => {
							const isMe = member.enrollmentId === enrollmentId;
							return (
								<li key={member.enrollmentId} className="flex items-center justify-between gap-2">
									<span className={isMe ? 'font-semibold text-ink' : undefined}>
										{member.familyName} {member.givenName}
									</span>
									{isMe ? (
										<span className="rounded-full bg-accent-subtle px-2 py-0.5 text-xs font-medium text-accent">
											Bạn
										</span>
									) : null}
								</li>
							);
						})}
					</ul>
				</>
			) : (
				<p className="mt-2 text-sm text-ink-secondary">Bạn chưa được xếp vào nhóm nào.</p>
			)}
			<div className="mt-3 border-t border-mc-rule pt-2">
				<button
					type="button"
					onClick={onOpenGroups}
					className="inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:underline"
				>
					Xem tất cả nhóm →
				</button>
			</div>
		</section>
	);
}
