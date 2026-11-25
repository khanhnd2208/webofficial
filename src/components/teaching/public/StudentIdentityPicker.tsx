'use client';

import { useMemo, useState } from 'react';

import type { PublicAttendanceBoardStudent } from '@/features/teaching/types';
import { formatStudentCode } from '@/features/teaching/domain/privacy';

import { matchesStudentQuery } from './studentIdentity';

export function StudentIdentityPicker({
	students,
	onSelect,
	onOpenGradebook,
}: {
	students: PublicAttendanceBoardStudent[];
	onSelect: (enrollmentId: string) => void;
	onOpenGradebook: () => void;
}) {
	const [query, setQuery] = useState('');

	const filtered = useMemo(
		() => students.filter((student) => matchesStudentQuery(student, query)),
		[query, students],
	);

	return (
		<section aria-labelledby="identity-picker-title">
			<div>
				<h2 id="identity-picker-title" className="text-lg font-semibold text-ink sm:text-xl">
					Bạn là ai trong lớp?
				</h2>
				<p className="mt-1 text-sm text-ink-secondary">
					Chọn tên của bạn để xem chuyên cần, điểm CP và nhóm của mình. Lựa chọn chỉ lưu
					trên thiết bị này.
				</p>

				<label className="mt-4 block">
					<span className="sr-only">Tìm theo tên hoặc 2 số cuối MSV</span>
					<input
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Tìm theo tên hoặc 2 số cuối MSV"
						className="mc-input w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3.5 text-sm text-ink placeholder:text-ink-tertiary"
						autoComplete="off"
					/>
				</label>
			</div>

			{students.length === 0 ? (
				<p role="status" className="mt-4 border-y border-mc-rule py-5 text-sm text-ink-secondary">
					Lớp chưa có danh sách sinh viên.
				</p>
			) : filtered.length === 0 ? (
				<p role="status" className="mt-4 border-y border-mc-rule py-5 text-sm text-ink-secondary">
					Không tìm thấy sinh viên phù hợp. Hãy thử tên hoặc 2 số cuối MSV khác.
				</p>
			) : (
				<ul
					className="mt-4 border-t border-mc-rule"
					aria-label="Danh sách sinh viên trong lớp"
				>
					{filtered.map((student) => (
						<li key={student.enrollmentId}>
							<button
								type="button"
								onClick={() => onSelect(student.enrollmentId)}
								className="teaching-public-row"
							>
								<span className="min-w-0 font-medium text-ink">
									{student.familyName} {student.givenName}
								</span>
								<span className="mc-num shrink-0 text-xs text-ink-secondary">
									{formatStudentCode(student.studentCode)}
								</span>
							</button>
						</li>
					))}
				</ul>
			)}

			<div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-sm text-ink-secondary">
				<span>Chỉ muốn xem cả lớp?</span>
				<button
					type="button"
					onClick={onOpenGradebook}
					className="teaching-public-link"
				>
					Xem bảng cả lớp →
				</button>
			</div>
		</section>
	);
}
