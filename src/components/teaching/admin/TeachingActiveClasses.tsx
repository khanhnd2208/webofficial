'use client';

import Link from 'next/link';
import { useState } from 'react';

import { McIcon } from '@/components/myclass/ui';
import { routes } from '@/config/routes';
import type { TeachingClassListItem, TeachingCourseListItem } from '@/features/teaching/types';

/** Active classes across every course, most recently touched first (service order). */
export function collectActiveClasses(courses: TeachingCourseListItem[]): TeachingClassListItem[] {
	return courses
		.filter((course) => course.status === 'ACTIVE')
		.flatMap((course) => course.classes)
		.filter((row) => row.status === 'ACTIVE')
		.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function studentPagePath(row: TeachingClassListItem) {
	return row.publicSlug && row.attendanceVisible ? routes.teachingPublicClass(row.publicSlug) : null;
}

function CopyStudentLink({ path, classCode }: { path: string; classCode: string }) {
	const [copied, setCopied] = useState(false);
	return (
		<button
			type="button"
			className="teaching-icon-button min-h-11 min-w-11"
			aria-label={copied ? `Đã sao chép link lớp ${classCode}` : `Sao chép link sinh viên lớp ${classCode}`}
			title={copied ? 'Đã sao chép' : 'Sao chép link sinh viên'}
			onClick={async () => {
				try {
					await navigator.clipboard.writeText(`${window.location.origin}${path}`);
					setCopied(true);
					window.setTimeout(() => setCopied(false), 1800);
				} catch {
					window.prompt('Sao chép link sinh viên', `${window.location.origin}${path}`);
				}
			}}
		>
			<McIcon name={copied ? 'check' : 'link'} size={16} />
		</button>
	);
}

export function TeachingActiveClasses({ courses }: { courses: TeachingCourseListItem[] }) {
	const classes = collectActiveClasses(courses);
	if (classes.length === 0) return null;

	return (
		<section aria-labelledby="teaching-active-classes-title" data-testid="teaching-active-classes">
			<div className="mb-3 flex items-baseline justify-between gap-3">
				<h2 id="teaching-active-classes-title" className="text-base font-semibold text-ink">
					Lớp đang dạy
				</h2>
				<p className="mc-meta text-xs text-ink-secondary">Bấm để mở điểm danh</p>
			</div>
			<ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{classes.map((row) => {
					const classCode = row.classCode ?? row.groupNo;
					const warnings = row.atRiskCount + row.bannedCount;
					const publicPath = studentPagePath(row);
					return (
						<li
							key={row.id}
							className="flex items-stretch rounded-2xl border border-border/80 bg-surface transition-colors hover:border-border-hover"
						>
							<Link
								href={routes.mySpaceTeachingClassTab(row.id, 'attendance')}
								className="min-w-0 flex-1 rounded-l-2xl px-4 py-3 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
								data-testid={`teaching-active-class-${row.id}`}
							>
								<p className="font-mono text-[0.6875rem] font-bold uppercase tracking-wider text-accent">
									{row.courseCode} · Lớp {classCode}
								</p>
								<p className="mt-1 truncate text-sm font-semibold text-ink" title={row.courseName}>
									{row.courseName}
								</p>
								<p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-secondary">
									<span>{row.term}</span>
									<span aria-hidden>·</span>
									<span>
										<span className="font-semibold text-ink">{row.studentCount}</span> học viên
									</span>
									{warnings > 0 ? (
										<span className="rounded-full bg-error/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-error">
											{warnings} cảnh báo
										</span>
									) : null}
								</p>
							</Link>
							<div className="flex shrink-0 flex-col items-center justify-center gap-1 border-l border-border/60 px-1.5">
								{publicPath ? (
									<>
										<CopyStudentLink path={publicPath} classCode={classCode} />
										<Link
											href={publicPath}
											target="_blank"
											className="teaching-icon-button min-h-11 min-w-11"
											aria-label={`Mở trang sinh viên lớp ${classCode}`}
											title="Mở trang sinh viên"
										>
											<McIcon name="open_in_new" size={16} />
										</Link>
									</>
								) : (
									<Link
										href={routes.mySpaceTeachingClassTab(row.id, 'share')}
										className="teaching-icon-button min-h-11 min-w-11"
										aria-label={`Lớp ${classCode} chưa chia sẻ — mở cài đặt trang sinh viên`}
										title="Chưa chia sẻ cho sinh viên"
									>
										<McIcon name="lock" size={16} />
									</Link>
								)}
							</div>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
