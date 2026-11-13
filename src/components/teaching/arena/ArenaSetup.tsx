'use client';

import { useState } from 'react';

import { McIcon } from '@/components/myclass/ui';
import type {
	RecallArenaData,
	RecallArenaPlayer,
	TeachingSessionRecord,
} from '@/features/teaching/types';

import { ArenaSetupCast } from './ArenaSetupCast';
import { ArenaSetupClasses } from './ArenaSetupClasses';
import { ArenaSetupLessons } from './ArenaSetupLessons';
import { ArenaSetupPlayers } from './ArenaSetupPlayers';
import { ArenaSetupRules } from './ArenaSetupRules';
import { arenaCast } from './arenaCharacters';
import { callablePlayers, type ArenaConfig } from './arenaGame';
import styles from './arena.module.css';
import setup from './arenaSetup.module.css';
import { useArenaDialogFocus } from './useArenaDialogFocus';

export type ArenaSetupStep = 'classes' | 'players' | 'rules' | 'lessons' | 'cast';

const RULE_SUMMARY = { ALL: 'Cả lớp', CHALLENGE: 'Challenging', SUPPORT: 'Supporting' } as const;

const STEPS: Array<{ id: ArenaSetupStep; label: string }> = [
	{ id: 'classes', label: 'Lớp học' },
	{ id: 'players', label: 'Người chơi' },
	{ id: 'rules', label: 'Luật gọi' },
	{ id: 'lessons', label: 'Bài học' },
	{ id: 'cast', label: 'Nhân vật' },
];

/**
 * Lecturer-only settings, in the order a lesson starts: which classes are in
 * the room, who plays (including make-up students from other classes), which
 * lessons the questions come from, and the heroes and boss on screen. Every
 * step has a sensible default, so "Vào trận" works from any of them; once
 * playing, any step opens directly. Group names appear only here, never on
 * the game screen.
 */
export function ArenaSetup({
	data,
	config,
	sessions,
	hosts,
	roster,
	answered,
	started,
	initialStep = 'classes',
	openingCpId,
	onChange,
	onOpenCp,
	onReload,
	onDone,
	onClose,
}: {
	data: RecallArenaData;
	config: ArenaConfig;
	/** Every live session of every class, kept up to date when CP is opened. */
	sessions: TeachingSessionRecord[];
	hosts: TeachingSessionRecord[];
	roster: RecallArenaPlayer[];
	/** Students who already answered today; they are not called again. */
	answered: ReadonlySet<string>;
	/** True once the lecturer entered the game; the main button then just closes. */
	started: boolean;
	initialStep?: ArenaSetupStep;
	openingCpId: string | null;
	onChange: (next: ArenaConfig) => void;
	onOpenCp: (sessionId: string) => void;
	onReload: () => void;
	onDone: () => void;
	onClose?: () => void;
}) {
	const [step, setStep] = useState<ArenaSetupStep>(initialStep);
	// Escape stays with RecallArena, which only closes setup once a game has started.
	const dialogRef = useArenaDialogFocus();
	const callable = callablePlayers(roster, config.filter);
	const chosenDecks = data.decks.filter((deck) => config.deckIds.includes(deck.deckId));
	const cardTotal = chosenDecks.reduce((sum, deck) => sum + deck.cardCount, 0);
	const summary: Record<ArenaSetupStep, string> = {
		classes: config.classIds.length ? `${config.classIds.length} lớp` : 'Chưa chọn',
		players: `${roster.length} bạn`,
		rules: RULE_SUMMARY[config.filter],
		lessons: chosenDecks.length ? `${chosenDecks.length} bài · ${cardTotal} câu` : 'Chưa chọn bài',
		cast: `${arenaCast(config.heroIds).length} nhân vật`,
	};
	const index = STEPS.findIndex((item) => item.id === step);
	const last = index === STEPS.length - 1;

	return (
		<div className={styles.setupBackdrop} onClick={onClose}>
			<section
				ref={dialogRef}
				tabIndex={-1}
				className={`${styles.setup} ${setup.panel}`}
				role="dialog"
				aria-modal="true"
				aria-labelledby="arena-setup-title"
				onClick={(event) => event.stopPropagation()}
			>
				<header className={styles.setupHead}>
					<div className={setup.title}>
						<h2 id="arena-setup-title">Thiết lập kiểm tra bài cũ</h2>
						<span className={styles.setupHint}>
							{data.course.courseCode} · {data.course.courseName}
						</span>
					</div>
					{onClose ? (
						<button
							type="button"
							className={styles.iconButton}
							onClick={onClose}
							aria-label="Đóng thiết lập"
							title="Đóng (Esc)"
						>
							<McIcon name="close" size={20} />
						</button>
					) : null}
				</header>

				<nav className={setup.steps} aria-label="Các bước thiết lập">
					{STEPS.map((item, position) => (
						<button
							key={item.id}
							type="button"
							className={setup.step}
							aria-current={item.id === step ? 'step' : undefined}
							onClick={() => setStep(item.id)}
						>
							<span className={setup.stepNo}>{position + 1}</span>
							<span className={setup.stepText}>
								<span>{item.label}</span>
								<span className={setup.stepSummary}>{summary[item.id]}</span>
							</span>
						</button>
					))}
				</nav>

				<div key={step} className={setup.body}>
					{step === 'classes' ? (
						<ArenaSetupClasses
							data={data}
							config={config}
							sessions={sessions}
							openingCpId={openingCpId}
							onChange={onChange}
							onOpenCp={onOpenCp}
						/>
					) : null}
					{step === 'players' ? (
						<ArenaSetupPlayers
							data={data}
							config={config}
							sessions={sessions}
							hosts={hosts}
							roster={roster}
							openingCpId={openingCpId}
							onChange={onChange}
							onOpenCp={onOpenCp}
						/>
					) : null}
					{step === 'rules' ? (
						<ArenaSetupRules
							config={config}
							roster={roster}
							answered={answered}
							onChange={onChange}
						/>
					) : null}
					{step === 'lessons' ? (
						<ArenaSetupLessons data={data} config={config} onChange={onChange} />
					) : null}
					{step === 'cast' ? <ArenaSetupCast config={config} onChange={onChange} /> : null}
				</div>

				<footer className={styles.setupFoot}>
					<button
						type="button"
						className={styles.linkButton}
						onClick={onReload}
						title="Lấy lại điểm danh mới nhất. Lịch sử gọi vẫn giữ."
					>
						Tải lại điểm danh
					</button>
					<span className={setup.footActions}>
						{!started && index > 0 ? (
							<button
								type="button"
								className={styles.textButton}
								onClick={() => setStep(STEPS[index - 1]!.id)}
							>
								Quay lại
							</button>
						) : null}
						{!started && !last ? (
							<button
								type="button"
								className={setup.nextButton}
								onClick={() => setStep(STEPS[index + 1]!.id)}
							>
								Tiếp
							</button>
						) : null}
						<button
							type="button"
							className={styles.startButton}
							disabled={!started && callable.length === 0}
							title={!started && callable.length === 0 ? 'Chưa có ai để gọi' : undefined}
							onClick={onDone}
						>
							{started ? 'Xong' : 'Vào trận'}
						</button>
					</span>
				</footer>
			</section>
		</div>
	);
}
