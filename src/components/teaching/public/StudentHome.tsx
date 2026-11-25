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
		<div id="public-panel-me" role="tabpanel" aria-labelledby="public-tab-me" className="space-y-8">
			{announcement ? (
				<div className="teaching-public-note" role="note">
					<p className="teaching-public-note-label">Thông báo của giảng viên</p>
					<p className="whitespace-pre-wrap break-words">{announcement}</p>
				</div>
			) : null}

			{!me ? (
				<div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
					<StudentIdentityPicker
						students={board.students}
						onSelect={onSelectMe}
						onOpenGradebook={onOpenGradebook}
					/>
					<ClassInfoList board={board} />
				</div>
			) : (
				<>
					<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
						<h2 className="min-w-0 break-words text-xl font-semibold tracking-tight text-ink sm:text-2xl">
							Chào {me.familyName} {me.givenName}
						</h2>
						<p className="text-sm text-ink-secondary">
							Không phải bạn?{' '}
							<button
								type="button"
								onClick={onClearMe}
								className="-my-3 inline-flex min-h-11 items-center px-1 font-semibold text-accent hover:underline"
							>
								Chọn lại
							</button>
						</p>
					</div>

					<div className="grid gap-x-12 gap-y-8 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:items-start">
						<div className="space-y-8">
							{!learningChoice ? (
								<section className="teaching-public-section" aria-labelledby="todo-title">
									<div className="teaching-public-section-head">
										<h3 id="todo-title">Việc cần làm</h3>
									</div>
									<button type="button" onClick={onOpenLearning} className="teaching-public-row">
										<span className="min-w-0">
											<span className="teaching-public-row-title">Chọn phong cách học</span>
											<span className="teaching-public-row-sub">
												Teach me a lesson hoặc Prince / Princess treatment · khoảng 1 phút
											</span>
										</span>
										<span aria-hidden="true" className="teaching-public-row-go">
											›
										</span>
									</button>
								</section>
							) : null}

							<StudentStatusCard
								student={me}
								sessions={board.sessions}
								totalWeeks={board.policy.totalWeeks}
								attendanceMaxPoints={board.policy.attendanceMaxPoints}
								cpMaxPoints={board.policy.cpMaxPoints}
								onOpenGradebook={onOpenGradebook}
							/>

							{learningChoice || recallCount > 0 ? (
								<section className="teaching-public-section" aria-labelledby="study-card-title">
									<div className="teaching-public-section-head">
										<h3 id="study-card-title">Học tập</h3>
									</div>
									{learningChoice ? (
										<div className="teaching-public-row">
											<span className="min-w-0">
												<span className="teaching-public-row-sub">Phong cách học</span>
												<span className="teaching-public-row-title">
													{learningStyleName(learningChoice)}
												</span>
											</span>
											<button
												type="button"
												onClick={onOpenLearning}
												className="teaching-public-link -my-2"
											>
												Đổi
											</button>
										</div>
									) : null}
									{recallCount > 0 ? (
										<button type="button" onClick={onOpenRecall} className="teaching-public-row">
											<span className="min-w-0">
												<span className="teaching-public-row-sub">Ôn tập</span>
												<span className="teaching-public-row-title">
													<span className="mc-num">{recallCount}</span> bộ thẻ và Test yourself
												</span>
											</span>
											<span aria-hidden="true" className="teaching-public-row-go">
												›
											</span>
										</button>
									) : null}
								</section>
							) : null}
						</div>

						<div className="space-y-8">
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
