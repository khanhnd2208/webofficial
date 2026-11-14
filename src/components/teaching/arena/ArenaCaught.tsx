'use client';

import { m } from 'framer-motion';
import { useState } from 'react';

import { McIcon } from '@/components/myclass/ui';
import { recallHasContent, recallToStoredHtml } from '@/features/active-recall/richText';
import { ARENA_AWARD_LEVELS, type ArenaAwardLevel } from '@/features/teaching/domain/recallArena';
import type {
	RecallArenaCard,
	RecallArenaPlayer,
	TeachingSessionRecord,
} from '@/features/teaching/types';

import { ArenaAssistPicker } from './ArenaAssistPicker';
import { ArenaCountdown } from './ArenaCountdown';
import { ArenaCpStatus } from './ArenaCpStatus';
import { ArenaCharacter } from './ArenaCharacter';
import { ArenaMonster } from './ArenaFigures';
import type { ArenaBoss } from './arenaBosses';
import type { ArenaCharacter as Character } from './arenaCharacters';
import { fullName, isManualPlayer, matchesPlayerSearch } from './arenaGame';
import styles from './arenaCaught.module.css';

/** Seconds a Challenging student gets to think before answering. */
const CHALLENGE_THINK_SECONDS = 30;

/** The key that presses a button, shown on the button itself. */
function Key({ children }: { children: string }) {
	return (
		<kbd className={styles.key} aria-hidden="true">
			{children}
		</kbd>
	);
}

function RichText({ html }: { html: string }) {
	return (
		<div
			className={`recall-text ${styles.richText}`}
			suppressHydrationWarning
			dangerouslySetInnerHTML={{ __html: recallToStoredHtml(html) }}
		/>
	);
}

/**
 * One card: question, language switch and the hidden answer. Keyed by card id
 * so "Đổi câu" resets the answer without rebuilding the whole dialog.
 */
function QuestionCard({
	card,
	deckLabel,
	saving,
	onNextCard,
}: {
	card: RecallArenaCard;
	deckLabel: string;
	saving: boolean;
	/** Null when the chosen lessons hold a single card. */
	onNextCard: (() => void) | null;
}) {
	const hasEn = recallHasContent(card.question);
	const hasVi = recallHasContent(card.questionVi);
	const [lang, setLang] = useState<'en' | 'vi'>(hasEn || !hasVi ? 'en' : 'vi');
	const [revealed, setRevealed] = useState(false);
	const useVi = lang === 'vi' && hasVi;
	const question = useVi ? card.questionVi : card.question;
	const answer = useVi && recallHasContent(card.answerVi) ? card.answerVi : card.answer;

	return (
		<div className={styles.question}>
			<div className={styles.questionHead}>
				<p className={styles.questionLabel}>
					<span>Câu hỏi</span>
					{deckLabel ? <span className={styles.lesson}>{deckLabel}</span> : null}
				</p>
				<div className={styles.questionTools}>
					{hasEn && hasVi ? (
						<span className={styles.langSwitch} role="group" aria-label="Ngôn ngữ câu hỏi">
							<button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
								EN
							</button>
							<button type="button" aria-pressed={lang === 'vi'} onClick={() => setLang('vi')}>
								VI
							</button>
						</span>
					) : null}
					{onNextCard ? (
						<button
							type="button"
							className={styles.ghostButton}
							disabled={saving}
							onClick={onNextCard}
							data-arena-key="q"
						>
							<McIcon name="retry" size={18} />
							Đổi câu
							<Key>Q</Key>
						</button>
					) : null}
				</div>
			</div>
			<div className={styles.questionBody}>
				<RichText html={question} />
				{revealed ? (
					<div className={styles.answer}>
						<span className={styles.answerLabel}>Đáp án</span>
						{recallHasContent(answer) ? (
							<RichText html={answer} />
						) : (
							<p className={styles.note}>Thẻ này chưa có đáp án.</p>
						)}
					</div>
				) : (
					<button
						type="button"
						className={styles.revealButton}
						onClick={() => setRevealed(true)}
						data-arena-key="a"
					>
						<McIcon name="visibility" size={20} />
						Hiện đáp án
						<Key>A</Key>
					</button>
				)}
			</div>
		</div>
	);
}

/** Another student answering the question the caught student missed. */
export interface ArenaCaughtAssist {
	/** The student who missed the question; their Gift is already saved. */
	failedName: string;
	candidates: RecallArenaPlayer[];
	/** True once a volunteer is chosen: `player` is then that volunteer. */
	picked: boolean;
	onPick: (enrollmentId: string) => void;
	/** The volunteer did not get it either: back to the picker, nothing saved. */
	onRepick: () => void;
	/** Nobody answers: the turn ends. */
	onEnd: () => void;
}

/** Who was caught, the question, and the lecturer's grading controls. */
export function ArenaCaught({
	player,
	character,
	boss,
	card,
	deckLabel,
	cpNow,
	manual,
	saving,
	unconfirmed,
	canChangeCard,
	cardsExhausted,
	cpSession,
	openingCp,
	onOpenCp,
	onPass,
	onBarePass,
	onFail,
	onSkipStudent,
	onChooseStudent,
	otherPlayers,
	onNextCard,
	onClose,
	assist = null,
}: {
	player: RecallArenaPlayer;
	/** The student's hero, as shown on the floor. */
	character: Character;
	boss: ArenaBoss;
	card: RecallArenaCard | null;
	deckLabel: string;
	cpNow: number;
	manual: boolean;
	saving: boolean;
	unconfirmed: { result: 'pass' | 'fail'; level: ArenaAwardLevel | 0 } | null;
	canChangeCard: boolean;
	cardsExhausted: boolean;
	cpSession: TeachingSessionRecord | null;
	openingCp: boolean;
	onOpenCp: (sessionId: string) => void;
	onPass: (level: ArenaAwardLevel) => void;
	onBarePass: () => void;
	onFail: () => void;
	onSkipStudent: () => void;
	onChooseStudent: (enrollmentId: string) => void;
	otherPlayers: RecallArenaPlayer[];
	onNextCard: () => void;
	/** Close without grading: the student keeps their turn. */
	onClose: () => void;
	/** Set after a missed answer, while another student may answer instead. */
	assist?: ArenaCaughtAssist | null;
}) {
	const [choosing, setChoosing] = useState(false);
	const [query, setQuery] = useState('');
	const matches = otherPlayers.filter((candidate) => matchesPlayerSearch(candidate, query));
	return (
		<m.div
			className={styles.backdrop}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
		>
			<m.section
				className={styles.panel}
				role="dialog"
				aria-modal="true"
				aria-labelledby="arena-caught-name"
				initial={{ scale: 0.92, y: 40, opacity: 0 }}
				animate={{ scale: 1, y: 0, opacity: 1 }}
				exit={{ scale: 0.96, opacity: 0 }}
				transition={{ type: 'spring', stiffness: 260, damping: 24 }}
			>
				<button
					type="button"
					className={styles.close}
					onClick={assist ? assist.onEnd : onClose}
					disabled={saving || Boolean(unconfirmed)}
					aria-label={assist ? 'Không ai trả lời thay, tiếp tục' : 'Đóng, không chấm'}
					title={
						assist
							? 'Không ai trả lời thay, tiếp tục (Esc)'
							: 'Đóng, không chấm (Esc). Bạn này vẫn giữ lượt.'
					}
					data-arena-key="escape"
				>
					<McIcon name="close" size={22} />
				</button>

				<div className={styles.layout}>
					<section className={styles.who} aria-label={`${fullName(player)} đối đầu ${boss.name}`}>
						<div className={styles.captor}>
							<span className={styles.captorFace}>
								<ArenaMonster boss={boss} mood="laugh" size={52} decorative />
							</span>
							{assist?.picked ? (
								<span>
									Trả lời thay <strong>{assist.failedName}</strong>
								</span>
							) : (
								<span>
									<strong>{boss.name}</strong> đã bắt được
								</span>
							)}
						</div>
						<m.div
							className={styles.hero}
							initial={{ y: 30, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.12, type: 'spring', stiffness: 220, damping: 18 }}
						>
							<ArenaCharacter character={character} size={224} decorative={false} />
						</m.div>
						<div className={styles.identity}>
							<h2 id="arena-caught-name" className={styles.name}>
								{fullName(player)}
							</h2>
							{manual ? (
								<p className={styles.meta}>Khách chơi thử</p>
							) : (
								<p className={styles.meta}>
									<span>{player.studentCode}</span>
									<span className={styles.cp}>
										CP tuần này <strong>{cpNow}</strong>
									</span>
								</p>
							)}
							{player.group === 'CHALLENGE' && !assist ? (
								<ArenaCountdown key={card?.id ?? 'own'} seconds={CHALLENGE_THINK_SECONDS} />
							) : null}
							{assist && !assist.picked ? (
								<p className={styles.giftDone}>
									<McIcon name="check" size={18} />
									Chưa đạt · đã ghi +1 Gift
								</p>
							) : null}
							{!manual && cpSession && !cpSession.participationOpen ? (
								<ArenaCpStatus
									session={cpSession}
									opening={openingCp || saving}
									onOpen={onOpenCp}
								/>
							) : null}
							{!manual && !cpSession ? (
								<p className={styles.note}>Sinh viên này chưa có buổi phù hợp để ghi CP.</p>
							) : null}
						</div>
					</section>

					{card ? (
						<QuestionCard
							key={card.id}
							card={card}
							deckLabel={deckLabel}
							saving={saving}
							onNextCard={canChangeCard && !unconfirmed && !assist ? onNextCard : null}
						/>
					) : (
						<div className={styles.question}>
							<div className={styles.questionBody}>
								<p className={styles.note}>
									{cardsExhausted
										? 'Các câu trong bài đã chọn đều đã qua. Bạn có thể hỏi câu riêng.'
										: 'Hãy hỏi câu riêng rồi chấm như bình thường.'}
								</p>
							</div>
						</div>
					)}
				</div>

				{assist && !assist.picked ? (
					<div className={styles.dock}>
						<ArenaAssistPicker
							failedName={assist.failedName}
							candidates={assist.candidates}
							onPick={assist.onPick}
							onEnd={assist.onEnd}
						/>
					</div>
				) : (
					<div className={styles.dock}>
						<div className={styles.verdicts}>
							<div
								className={styles.passGroup}
								role="group"
								aria-label={manual ? 'Đạt' : 'Đạt, chọn mức CP'}
							>
								{manual ? (
									<button
										type="button"
										className={styles.passButton}
										disabled={saving}
										onClick={() => onPass(1)}
										data-arena-key="1"
									>
										Đạt
										<Key>1</Key>
									</button>
								) : (
									<>
										<span className={styles.passLabel}>{assist ? 'Thưởng' : 'Đạt'}</span>
										{ARENA_AWARD_LEVELS.map((level, index) => (
											<button
												key={level}
												type="button"
												className={styles.passButton}
												disabled={
													saving ||
													openingCp ||
													!cpSession?.participationOpen ||
													Boolean(
														unconfirmed &&
														(unconfirmed.result !== 'pass' || unconfirmed.level !== level),
													)
												}
												onClick={() => onPass(level)}
												data-arena-key={String(index + 1)}
												aria-label={`Đạt +${level}`}
											>
												{unconfirmed?.level === level ? `Xác nhận lại +${level}` : `+${level}`}
												<Key>{String(index + 1)}</Key>
											</button>
										))}
									</>
								)}
							</div>
							{assist ? (
								<>
									<button
										type="button"
										className={styles.failButton}
										disabled={saving || Boolean(unconfirmed)}
										onClick={assist.onRepick}
										title="Không ghi Gift cho bạn trả lời thay"
										data-arena-key="0"
									>
										Chưa đạt · chọn bạn khác
										<Key>0</Key>
									</button>
									<button
										type="button"
										className={styles.ghostButton}
										disabled={saving || Boolean(unconfirmed)}
										onClick={assist.onEnd}
									>
										Không ai · tiếp tục
									</button>
								</>
							) : !manual ? (
								<>
									<button
										type="button"
										className={styles.barePassButton}
										disabled={saving || Boolean(unconfirmed)}
										onClick={onBarePass}
										title="Qua lượt này, không cộng CP và không thêm Gift"
										data-arena-key="4"
									>
										Vừa đủ qua
										<Key>4</Key>
									</button>
									<button
										type="button"
										className={styles.failButton}
										disabled={saving || unconfirmed?.result === 'pass'}
										onClick={onFail}
										data-arena-key="0"
									>
										{unconfirmed?.result === 'fail' ? 'Xác nhận lại Gift' : 'Chưa đạt · +1 Gift'}
										<Key>0</Key>
									</button>
								</>
							) : null}
						</div>

						{otherPlayers.length > 0 && !unconfirmed && !assist ? (
							<div className={styles.others}>
								<button
									type="button"
									className={styles.ghostButton}
									disabled={saving}
									onClick={onSkipStudent}
									data-arena-key="s"
								>
									<McIcon name="shuffle" size={18} />
									Gọi ngẫu nhiên bạn khác
									<Key>S</Key>
								</button>
								<button
									type="button"
									className={styles.ghostButton}
									disabled={saving}
									aria-expanded={choosing}
									onClick={() => setChoosing((value) => !value)}
								>
									<McIcon name="search" size={18} />
									Gọi chỉ định
								</button>
								{choosing ? (
									<div className={styles.choose}>
										<label htmlFor="arena-choose-player">Gọi chỉ định một bạn trong trận</label>
										<input
											id="arena-choose-player"
											type="search"
											autoFocus
											autoComplete="off"
											value={query}
											onChange={(event) => setQuery(event.target.value)}
											onKeyDown={(event) => {
												if (event.key === 'Escape') setChoosing(false);
											}}
											placeholder="Nhập tên hoặc mã sinh viên"
										/>
										{query.trim() ? (
											<div className={styles.chooseResults}>
												{matches.length ? (
													matches.map((candidate) => (
														<button
															type="button"
															key={candidate.enrollmentId}
															onClick={() => onChooseStudent(candidate.enrollmentId)}
														>
															<span>{fullName(candidate)}</span>
															{isManualPlayer(candidate.enrollmentId) ? null : (
																<span className={styles.chooseCode}>{candidate.studentCode}</span>
															)}
														</button>
													))
												) : (
													<p>Không tìm thấy bạn nào trong trận.</p>
												)}
											</div>
										) : null}
									</div>
								) : null}
							</div>
						) : null}
					</div>
				)}
			</m.section>
		</m.div>
	);
}
