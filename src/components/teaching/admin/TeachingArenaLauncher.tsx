import Link from 'next/link';

import { McIcon } from '@/components/myclass/ui';
import { routes } from '@/config/routes';

/**
 * The one way into the kiểm tra bài cũ game. It always sits first in a TeachingAppHeader
 * `actions` slot, on the course page and on every class page, and opens the projector
 * screen in a new tab. Below 768px it shrinks to its icon so phone headers keep fitting.
 */
export function TeachingArenaLauncher({
	courseId,
	classId,
}: {
	courseId: string;
	/** When set, the arena opens with this class ticked. */
	classId?: string;
}) {
	return (
		<Link
			href={routes.mySpaceTeachingArena(courseId, classId)}
			target="_blank"
			className="teaching-arena-launcher"
			aria-label="Kiểm tra bài cũ (mở trò chơi trong tab mới)"
			title={
				classId
					? 'Mở trò chơi kiểm tra bài cũ cho lớp này trong tab mới'
					: 'Mở trò chơi kiểm tra bài cũ của cả môn trong tab mới'
			}
			data-testid="teaching-arena-launcher"
		>
			<span className="teaching-arena-launcher-icon" aria-hidden>
				<McIcon name="bolt" size={15} />
			</span>
			<span className="teaching-arena-launcher-label">Kiểm tra bài cũ</span>
		</Link>
	);
}
