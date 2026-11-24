import type { AttendanceStatus } from '@/features/teaching/domain/cp';

import { AttendanceGlyph } from './ClassRoster';
import { ATTENDANCE_STATUS_TEXT } from './classRosterModel';

const ORDER: AttendanceStatus[] = [
	'PRESENT',
	'LATE',
	'ABSENT_UNEXCUSED',
	'ABSENT_EXCUSED',
	'MAKEUP',
];

/** One quiet line that explains the marks in the week strip. */
export function GradebookLegend({ view }: { view: 'attendance' | 'cp' }) {
	if (view === 'cp') {
		return (
			<p className="teaching-public-legend">
				Mỗi ô là điểm CP của tuần (0 · ,5 · 1 · 2). Chạm vào tên để xem từng tuần.
			</p>
		);
	}
	return (
		<ul className="teaching-public-legend" aria-label="Chú thích điểm danh">
			{ORDER.map((status) => (
				<li key={status}>
					<AttendanceGlyph status={status} />
					{status === 'LATE' ? 'Muộn (tính như vắng)' : ATTENDANCE_STATUS_TEXT[status]}
				</li>
			))}
		</ul>
	);
}
