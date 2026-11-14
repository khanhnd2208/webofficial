'use client';

import { McIcon, type McIconName } from '@/components/myclass/ui';
import { ARENA_AWARD_LEVELS, type ArenaAwardLevel } from '@/features/teaching/domain/recallArena';

import type { ArenaCardFate } from './arenaGame';
import styles from './arenaCaught.module.css';

/** The key that presses a button, shown on the button itself. */
export function ArenaKey({ children }: { children: string }) {
	return (
		<kbd className={styles.key} aria-hidden="true">
			{children}
		</kbd>
	);
}

/**
 * One row per question fate. Keys run along the number row in button order:
 * 1–5 hide the question, 6–0 keep it. 1–4 and 0 press what they pressed
 * before the rows existed (a pass hid the question, a miss kept it).
 */
const ROWS: {
	fate: ArenaCardFate;
	title: string;
	hint: string;
	icon: McIconName;
	keys: [string, string, string, string, string];
}[] = [
	{
		fate: 'hide',
		title: 'Ẩn câu',
		hint: 'Đã trả lời hoặc đã chữa',
		icon: 'visibility_off',
		keys: ['1', '2', '3', '4', '5'],
	},
	{
		fate: 'keep',
		title: 'Giữ câu',
		hint: 'Chưa chữa, hỏi lại sau',
		icon: 'flag',
		keys: ['6', '7', '8', '9', '0'],
	},
];

export interface ArenaUnconfirmed {
	result: 'pass' | 'fail';
	level: ArenaAwardLevel | 0;
	fate: ArenaCardFate;
}

/**
 * The lecturer's grade, as a grid: the row says what happens to the question,
 * the column what the student gets. One click decides both.
 */
export function ArenaVerdicts({
	manual,
	saving,
	cpReady,
	hasCard,
	unconfirmed,
	onPass,
	onBarePass,
	onFail,
}: {
	manual: boolean;
	saving: boolean;
	/** False while the student's CP session is closed or opening. */
	cpReady: boolean;
	/** Without a question card there is nothing to hide: one row only. */
	hasCard: boolean;
	unconfirmed: ArenaUnconfirmed | null;
	onPass: (level: ArenaAwardLevel, fate: ArenaCardFate) => void;
	onBarePass: (fate: ArenaCardFate) => void;
	onFail: (fate: ArenaCardFate) => void;
}) {
	// Without a card the single row keeps 0 for a miss, as before the rows existed.
	const rows = hasCard
		? ROWS
		: [{ ...ROWS[0]!, keys: ['1', '2', '3', '4', '0'] as (typeof ROWS)[number]['keys'] }];
	/** While a save waits to be confirmed, only that same button works. */
	const locked = (result: 'pass' | 'fail', level: ArenaAwardLevel | 0, fate: ArenaCardFate) =>
		Boolean(
			unconfirmed &&
			(unconfirmed.result !== result || unconfirmed.level !== level || unconfirmed.fate !== fate),
		);
	const isUnconfirmed = (
		result: 'pass' | 'fail',
		level: ArenaAwardLevel | 0,
		fate: ArenaCardFate,
	) => Boolean(unconfirmed && !locked(result, level, fate));

	return (
		<div
			className={styles.verdictGrid}
			data-manual={manual || undefined}
			data-single={!hasCard || undefined}
			role="group"
			aria-label="Chấm điểm"
		>
			{manual || !hasCard ? null : (
				<>
					<span className={styles.gridCorner} aria-hidden="true" />
					<span className={styles.colHead} data-kind="pass" aria-hidden="true">
						Đạt · cộng CP
					</span>
					<span className={styles.colHead} data-kind="bare" aria-hidden="true">
						Không điểm
					</span>
					<span className={styles.colHead} data-kind="fail" aria-hidden="true">
						Chưa đạt
					</span>
				</>
			)}
			{rows.map((row) => {
				const fateLabel = hasCard ? `, ${row.title.toLowerCase()}` : '';
				return (
					<div key={row.fate} className={styles.verdictRow} data-fate={row.fate}>
						{hasCard ? (
							<span className={styles.rowHead}>
								<McIcon name={row.icon} size={20} />
								<span>
									<strong>{row.title}</strong>
									<small>{row.hint}</small>
								</span>
							</span>
						) : null}
						{manual ? (
							<button
								type="button"
								className={styles.passButton}
								disabled={saving || locked('pass', 1, row.fate)}
								onClick={() => onPass(1, row.fate)}
								data-arena-key={row.keys[0]}
								aria-label={`Đạt${fateLabel}`}
							>
								Đạt
								<ArenaKey>{row.keys[0]}</ArenaKey>
							</button>
						) : (
							<>
								{ARENA_AWARD_LEVELS.map((level, index) => (
									<button
										key={level}
										type="button"
										className={styles.passButton}
										disabled={saving || !cpReady || locked('pass', level, row.fate)}
										onClick={() => onPass(level, row.fate)}
										data-arena-key={row.keys[index]}
										aria-label={`${isUnconfirmed('pass', level, row.fate) ? 'Xác nhận lại' : 'Đạt'} +${level}${fateLabel}`}
									>
										{isUnconfirmed('pass', level, row.fate)
											? `Xác nhận lại +${level}`
											: `+${level}`}
										<ArenaKey>{row.keys[index]!}</ArenaKey>
									</button>
								))}
								<button
									type="button"
									className={styles.barePassButton}
									disabled={saving || Boolean(unconfirmed)}
									onClick={() => onBarePass(row.fate)}
									title="Không cộng CP, không thêm Gift"
									data-arena-key={row.keys[3]}
									aria-label={`Không điểm${fateLabel}`}
								>
									±0
									<ArenaKey>{row.keys[3]}</ArenaKey>
								</button>
								<button
									type="button"
									className={styles.failButton}
									disabled={saving || locked('fail', 0, row.fate)}
									onClick={() => onFail(row.fate)}
									data-arena-key={row.keys[4]}
									aria-label={`${isUnconfirmed('fail', 0, row.fate) ? 'Xác nhận lại Gift' : 'Chưa đạt, +1 Gift'}${fateLabel}`}
								>
									{isUnconfirmed('fail', 0, row.fate) ? 'Xác nhận lại Gift' : '+1 Gift'}
									<ArenaKey>{row.keys[4]}</ArenaKey>
								</button>
							</>
						)}
					</div>
				);
			})}
		</div>
	);
}
