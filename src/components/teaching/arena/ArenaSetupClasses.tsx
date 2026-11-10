'use client';

import { presentAt } from '@/features/teaching/domain/recallArena';
import type { RecallArenaData, TeachingSessionRecord } from '@/features/teaching/types';

import { ArenaCpStatus } from './ArenaCpStatus';
import { sessionLabel, toggleClass, type ArenaConfig } from './arenaGame';
import styles from './arena.module.css';
import setup from './arenaSetup.module.css';

/** Step 1: tick the classes in the room and pick the session each one plays. */
export function ArenaSetupClasses({
	data,
	config,
	sessions,
	openingCpId,
	onChange,
	onOpenCp,
}: {
	data: RecallArenaData;
	config: ArenaConfig;
	sessions: TeachingSessionRecord[];
	openingCpId: string | null;
	onChange: (next: ArenaConfig) => void;
	onOpenCp: (sessionId: string) => void;
}) {
	if (data.classes.length === 0) {
		return <p className={styles.setupHint}>Môn này chưa có lớp nào đang hoạt động.</p>;
	}
	return (
		<div className={setup.section}>
			<p className={styles.setupHint}>
				Tick các lớp đang ngồi trong phòng. Sinh viên được điểm danh có mặt ở buổi đã chọn sẽ vào
				trận.
			</p>
			<ul className={setup.list}>
				{data.classes.map((item) => {
					const checked = config.classIds.includes(item.id);
					const classSessions = sessions.filter((session) => session.classId === item.id);
					const session = classSessions.find(
						(entry) => entry.id === config.sessionByClass[item.id],
					);
					const present = session
						? data.players.filter((player) => presentAt(player, session)).length
						: 0;
					const isToday = classSessions.some(
						(entry) => entry.id === item.defaultSessionId && entry.heldOn === data.todayIso,
					);
					return (
						<li key={item.id} className={setup.classCard} data-checked={checked || undefined}>
							<label className={setup.classHead}>
								<input
									type="checkbox"
									checked={checked}
									onChange={() => onChange(toggleClass(config, data, item.id))}
								/>
								<span className={setup.className}>
									Lớp {item.classCode}
									<span className={styles.setupHint}>{item.term}</span>
								</span>
								{isToday ? <span className={setup.badge}>Hôm nay</span> : null}
							</label>
							{checked ? (
								<div className={setup.classBody}>
									<label className={setup.inline}>
										<span className={setup.inlineLabel}>Buổi</span>
										<select
											className={setup.select}
											aria-label={`Buổi học của lớp ${item.classCode}`}
											value={config.sessionByClass[item.id] ?? ''}
											onChange={(event) =>
												onChange({
													...config,
													sessionByClass: {
														...config.sessionByClass,
														[item.id]: event.target.value,
													},
												})
											}
										>
											{classSessions.length === 0 ? (
												<option value="">Lớp chưa có buổi học</option>
											) : null}
											{classSessions.map((entry) => (
												<option key={entry.id} value={entry.id}>
													{sessionLabel(entry, item.tutorials)}
												</option>
											))}
										</select>
									</label>
									{session ? (
										<div className={setup.classMeta}>
											<span
												className={styles.setupHint}
												data-tone={present === 0 ? 'bad' : undefined}
											>
												{present === 0
													? 'Chưa ai được điểm danh có mặt ở buổi này.'
													: `${present} bạn có mặt`}
											</span>
											<ArenaCpStatus
												session={session}
												opening={openingCpId === session.id}
												onOpen={onOpenCp}
											/>
										</div>
									) : null}
								</div>
							) : null}
						</li>
					);
				})}
			</ul>
		</div>
	);
}
