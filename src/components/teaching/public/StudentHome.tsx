'use client';

import type {
	LearningExperienceChoice,
	PublicAttendanceBoardStudent,
	PublicClassBoard,
} from '@/features/teaching/types';

import { ClassInfoList } from './ClassInfoList';
import { StudentGroupCard } from './StudentGroupCard';
import { StudentIdentityPicker } from './StudentIdentityPicker';
import { StudentStatusCard } from './StudentStatusCard';

function learningStyleName(choice: LearningExperienceChoice): string {
	return choice === 'CHALLENGE' ? 'Teach me a lesson' : 'Prince / Princess treatment';
}

export function StudentHome({
	board,
	me,
	learningChoice,
	groupBoardEnabled,
	recallCount,
	onSelectMe,
	onClearMe,
	onOpenGradebook,
	onOpenGroups,
	onOpenRecall,
	onOpenLearning,
}: {
	board: PublicClassBoard;
	me: PublicAttendanceBoardStudent | null;
	learningChoice: LearningExperienceChoice | null;
	groupBoardEnabled: boolean;
	recallCount: number;
	onSelectMe: (enrollmentId: string) => void;
	onClearMe: () => void;
	onOpenGradebook: () => void;
	onOpenGroups: () => void;
	onOpenRecall: () => void;
	onOpenLearning: () => void;
}) {
	const announcement = board.announcement.trim();

	return (
		<div
			id="public-panel-me"
			role="tabpanel"
			aria-labelledby="public-tab-me"
			className="max-w-5xl space-y-4"
		>
			{announcement ? (
				<div
					className="mc-surface border-accent/20 bg-accent-subtle px-4 py-3 sm:px-5"
					role="note"
				>
					<p className="text-xs font-semibold text-accent">Thông báo của giảng viên</p>
					<p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-ink">
						{announcement}
					</p>
				</div>
			) : null}

			{!me ? (
				<div className="space-y-4">
					<StudentIdentityPicker
						students={board.students}
						onSelect={onSelectMe}
						onOpenGradebook={onOpenGradebook}
					/>
					<div className="max-w-2xl">
						<ClassInfoList board={board} />
					</div>
				</div>
			) : (
				<>
					<div className="flex flex-wrap items-center justify-between gap-2">
						<h2 className="text-lg font-semibold text-ink sm:text-xl">
							Chào {me.familyName} {me.givenName}
						</h2>
						<p className="flex items-center gap-1 text-xs text-ink-secondary">
							<span>Không phải bạn?</span>
							<button
								type="button"
								onClick={onClearMe}
								className="inline-flex min-h-11 items-center px-1.5 font-semibold text-accent hover:underline"
							>
								Đổi
							</button>
						</p>
					</div>

					<div className="grid gap-4 md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] md:items-start">
						<div className="space-y-4">
							<StudentStatusCard
								student={me}
								sessions={board.sessions}
								totalWeeks={board.policy.totalWeeks}
								attendanceMaxPoints={board.policy.attendanceMaxPoints}
								cpMaxPoints={board.policy.cpMaxPoints}
								onOpenGradebook={onOpenGradebook}
							/>

							<section className="mc-surface overflow-hidden" aria-label="Việc cần làm">
								<div className="border-b border-mc-rule px-4 py-3">
									<h3 className="text-xs font-semibold text-ink-secondary">Việc cần làm</h3>
								</div>
								<div className="divide-y divide-mc-rule">
									{!learningChoice ? (
										<button
											type="button"
											onClick={onOpenLearning}
											className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
										>
											<span className="min-w-0">
												<span className="block text-sm font-semibold text-ink">
													Chọn phong cách học
												</span>
												<span className="mt-0.5 block text-xs text-ink-secondary">
													Teach me a lesson hoặc Prince / Princess treatment
												</span>
											</span>
											<span aria-hidden="true" className="shrink-0 text-accent">
												→
											</span>
										</button>
									) : (
										<div className="flex min-h-12 flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
											<span className="text-ink-secondary">
												Phong cách học:{' '}
												<strong className="font-semibold text-ink">
													{learningStyleName(learningChoice)}
												</strong>
											</span>
											<button
												type="button"
												onClick={onOpenLearning}
												className="inline-flex min-h-11 items-center px-1.5 text-xs font-semibold text-accent hover:underline"
											>
												Đổi
											</button>
										</div>
									)}

									{recallCount > 0 ? (
										<button
											type="button"
											onClick={onOpenRecall}
											className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
										>
											<span className="min-w-0 text-sm font-semibold text-ink">
												Ôn tập · {recallCount} bộ thẻ
											</span>
											<span aria-hidden="true" className="shrink-0 text-accent">
												→
											</span>
										</button>
									) : null}
								</div>
							</section>
						</div>

						<div className="space-y-4">
							{groupBoardEnabled ? (
								<StudentGroupCard
									slug={board.slug}
									enrollmentId={me.enrollmentId}
									tutorialClassId={me.tutorialClassId}
									tutorials={board.tutorials}
									onOpenGroups={onOpenGroups}
								/>
							) : null}
							<ClassInfoList board={board} />
						</div>
					</div>
				</>
			)}
		</div>
	);
}
