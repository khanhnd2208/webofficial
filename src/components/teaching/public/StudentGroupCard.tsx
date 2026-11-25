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
			<section className="teaching-public-section" aria-label="Nhóm của bạn">
				<div className="teaching-public-section-head">
					<h3>Nhóm của bạn</h3>
				</div>
				<span className="sr-only" role="status">
					Đang tải thông tin nhóm…
				</span>
				<span aria-hidden="true" className="mt-3 block space-y-2.5">
					<span className="teaching-public-skeleton w-2/5" />
					<span className="teaching-public-skeleton w-4/5" />
					<span className="teaching-public-skeleton w-3/5" />
					<span className="teaching-public-skeleton w-3/4" />
				</span>
			</section>
		);
	}

	const groupBoard = fetched.board;
	if (!groupBoard?.configured) return null;

	const myGroup = groupBoard.groups.find((group) =>
		group.assignments.some((member) => member.enrollmentId === enrollmentId),
	);

	return (
		<section className="teaching-public-section" aria-label="Nhóm của bạn">
			<div className="teaching-public-section-head">
				<h3>Nhóm của bạn</h3>
				{myGroup ? (
					<span className="mc-num">{myGroup.assignments.length} người</span>
				) : null}
			</div>
			{myGroup ? (
				<>
					<p className="mt-3 text-base font-semibold text-ink">
						Nhóm {myGroup.displayOrder + 1}
					</p>
					<ul className="mt-2 space-y-1.5 text-sm text-ink-secondary">
						{myGroup.assignments.map((member) => {
							const isMe = member.enrollmentId === enrollmentId;
							return (
								<li key={member.enrollmentId} className="flex items-center justify-between gap-2">
									<span className={isMe ? 'font-semibold text-ink' : undefined}>
										{member.familyName} {member.givenName}
									</span>
									{isMe ? (
										<span className="text-xs font-semibold text-accent">Bạn</span>
									) : null}
								</li>
							);
						})}
					</ul>
				</>
			) : (
				<p className="mt-3 text-sm text-ink-secondary">Bạn chưa được xếp vào nhóm nào.</p>
			)}
			<button type="button" onClick={onOpenGroups} className="teaching-public-link mt-2">
				Xem tất cả nhóm →
			</button>
		</section>
	);
}
