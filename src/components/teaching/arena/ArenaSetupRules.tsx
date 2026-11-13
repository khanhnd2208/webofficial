'use client';

import type { ArenaGroupFilter } from '@/features/teaching/domain/recallArena';
import type { RecallArenaPlayer } from '@/features/teaching/types';

import { callablePlayers, type ArenaConfig } from './arenaGame';
import styles from './arena.module.css';
import setup from './arenaSetup.module.css';

const RULES: Array<{ id: ArenaGroupFilter; label: string; hint: string }> = [
	{ id: 'ALL', label: 'Cả lớp', hint: 'Gọi mọi bạn trong trận.' },
	{ id: 'CHALLENGE', label: 'Chỉ Challenging', hint: 'Chỉ gọi các bạn nhóm Challenging.' },
	{ id: 'SUPPORT', label: 'Chỉ Supporting', hint: 'Chỉ gọi các bạn nhóm Supporting.' },
];

/**
 * Step 3: who the monster may call. The floor always shows everyone in the
 * game, so the class cannot tell the groups apart; each student answers at
 * most once a day, and a question already passed is not asked again.
 */
export function ArenaSetupRules({
	config,
	roster,
	answered,
	onChange,
}: {
	config: ArenaConfig;
	roster: RecallArenaPlayer[];
	/** Students who already answered today. */
	answered: ReadonlySet<string>;
	onChange: (next: ArenaConfig) => void;
}) {
	const noGroup = roster.filter((player) => !player.group).length;

	return (
		<div className={setup.section}>
			<fieldset className={setup.rules}>
				<legend className={setup.total}>Gọi ai trả lời</legend>
				{RULES.map((rule) => {
					const group = callablePlayers(roster, rule.id);
					const left = group.filter((player) => !answered.has(player.enrollmentId)).length;
					return (
						<label
							key={rule.id}
							className={setup.rule}
							data-checked={config.filter === rule.id || undefined}
						>
							<input
								type="radio"
								name="arena-call-rule"
								value={rule.id}
								checked={config.filter === rule.id}
								onChange={() => onChange({ ...config, filter: rule.id })}
							/>
							<span className={setup.ruleText}>
								<strong>{rule.label}</strong>
								<span className={styles.setupHint}>{rule.hint}</span>
							</span>
							<span className={setup.ruleCount}>
								{left}/{group.length} chưa gọi
							</span>
						</label>
					);
				})}
			</fieldset>
			{noGroup > 0 && config.filter !== 'ALL' ? (
				<p className={styles.setupHint}>
					{noGroup} bạn chưa chọn nhóm chỉ được gọi khi chọn “Cả lớp”.
				</p>
			) : null}
			<ul className={setup.ruleNotes}>
				<li>
					Mỗi bạn chỉ trả lời một lần trong ngày; bạn đã trả lời có dấu ✓ trên đầu và không bị gọi
					lại.
				</li>
				<li>Câu hỏi đã có người trả lời đạt sẽ không xuất hiện lại.</li>
				<li>Trên sàn vẫn hiện cả lớp, kể cả khi chỉ gọi một nhóm.</li>
				<li>Nhân vật được chia ngẫu nhiên và đều cho mọi bạn.</li>
			</ul>
		</div>
	);
}
