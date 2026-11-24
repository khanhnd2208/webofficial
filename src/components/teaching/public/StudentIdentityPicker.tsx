'use client';

import { useMemo, useState } from 'react';

import type { PublicAttendanceBoardStudent } from '@/features/teaching/types';

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
		<section className="mc-surface max-w-2xl overflow-hidden" aria-labelledby="identity-picker-title">
			<div className="p-4 sm:p-6">
				<h2 id="identity-picker-title" className="text-lg font-semibold text-ink sm:text-xl">
					Bạn là ai trong lớp?
				</h2>
				<p className="mt-1 text-sm text-ink-secondary">
					Chọn tên của bạn để xem nhanh chuyên cần, điểm CP và nhóm của mình.
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
				<p role="status" className="border-t border-mc-rule px-4 py-5 text-sm text-ink-secondary sm:px-6">
					Lớp chưa có danh sách sinh viên.
				</p>
			) : filtered.length === 0 ? (
				<p role="status" className="border-t border-mc-rule px-4 py-5 text-sm text-ink-secondary sm:px-6">
					Không tìm thấy sinh viên phù hợp. Hãy thử tên hoặc 2 số cuối MSV khác.
				</p>
			) : (
				<ul
					className="max-h-80 divide-y divide-mc-rule overflow-y-auto border-t border-mc-rule"
					aria-label="Danh sách sinh viên trong lớp"
				>
					{filtered.map((student) => (
						<li key={student.enrollmentId}>
							<button
								type="button"
								onClick={() => onSelect(student.enrollmentId)}
								className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-hover sm:px-6"
							>
								<span className="min-w-0 font-medium text-ink">
									{student.familyName} {student.givenName}
								</span>
								<span className="mc-num shrink-0 text-xs text-ink-secondary">
									{student.studentCode}
								</span>
							</button>
						</li>
					))}
				</ul>
			)}

			<div className="flex flex-wrap items-center justify-between gap-2 border-t border-mc-rule bg-surface-sunken px-4 py-3 text-xs text-ink-secondary sm:px-6">
				<span>Chỉ lưu trên thiết bị này.</span>
				<button
					type="button"
					onClick={onOpenGradebook}
					className="inline-flex min-h-11 items-center font-semibold text-accent hover:underline"
				>
					Xem bảng cả lớp →
				</button>
			</div>
		</section>
	);
}
