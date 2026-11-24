'use client';

import { TutorialSwitcher } from '@/components/teaching/admin/TutorialSwitcher';
import type { TeachingGroupBoard, TeachingTutorialRecord } from '@/features/teaching/types';

export function GroupListHeader({
	admin,
	board,
	tutorials,
	tutorialId,
	saving,
	loading,
	onChangeTutorial,
	onOpenConfig,
}: {
	admin: boolean;
	board?: TeachingGroupBoard;
	tutorials: TeachingTutorialRecord[];
	tutorialId: string;
	saving: boolean;
	loading: boolean;
	onChangeTutorial: (id: string) => void;
	onOpenConfig: () => void;
}) {
	return (
		<header className="group-list-header mc-card-head">
			<div className="group-list-heading-row">
				<div>
					{admin ? (
						<>
							<p className="group-list-eyebrow">GROUP DIRECTORY · ADMIN VIEW</p>
							<h2 className="group-list-title">
								DANH SÁCH PHÂN CHIA NHÓM
								{board ? ` — TUTORIAL ${board.tutorialCode}` : ''}
							</h2>
							<p className="group-list-subtitle">
								{board ? board.tutorialName : 'Chọn tutorial để xem danh sách thành viên.'}
							</p>
						</>
					) : (
						<>
							<h2 className="group-list-title">
								Danh sách nhóm{board ? ` · ${board.tutorialCode}` : ''}
							</h2>
							<p className="group-list-subtitle">
								{board ? board.tutorialName : 'Chọn tutorial để xem danh sách nhóm.'}
							</p>
						</>
					)}
				</div>
				<div className="group-list-header-actions">
					<fieldset disabled={saving}>
						<TutorialSwitcher
							tutorials={tutorials}
							value={tutorialId}
							onChange={onChangeTutorial}
							prefix={admin ? 'Tutorial Class:' : 'Tutorial'}
						/>
					</fieldset>
					{admin ? (
						<button
							type="button"
							className="mc-button mc-button-secondary min-h-11"
							onClick={onOpenConfig}
							disabled={!board || saving || loading}
						>
							Thiết lập nhóm
						</button>
					) : null}
				</div>
			</div>
			{board ? (
				<div className="group-list-metrics" aria-label="Tổng quan phân nhóm">
					<div className="group-list-metric">
						<span>Đã xếp</span>
						<strong>
							{board.assignedCount}
							<small>/{board.activeStudentCount}</small>
						</strong>
					</div>
					<div className="group-list-metric">
						<span>Số nhóm</span>
						<strong>{board.groupCount}</strong>
					</div>
					<div
						className={`group-list-metric ${board.unassigned.length ? 'is-warning' : 'is-complete'}`}
					>
						<span>Chưa xếp</span>
						<strong>{board.unassigned.length}</strong>
					</div>
				</div>
			) : null}
		</header>
	);
}
