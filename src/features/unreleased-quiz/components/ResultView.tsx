'use client';

import { EVENT, EXPERIENCE_PREP, RESULT_SCALE, resultCopy } from '../content/results';
import type { Answers, QuizResult } from '../domain/quiz';
import { RegisterBlock } from './RegisterBlock';
import { Paragraphs } from './RichText';
import styles from './unreleased.module.css';

type ResultViewProps = {
	answers: Answers;
	result: QuizResult;
	onRestart: () => void;
};

export function ResultView({ answers, result, onRestart }: ResultViewProps) {
	const copy = resultCopy(result.group, result.variant);
	const prepare =
		result.group !== 'chua-chon-bai' && answers.q4
			? [...copy.prepare, EXPERIENCE_PREP[answers.q4]]
			: copy.prepare;

	return (
		<div className={`${styles.enter} mx-auto max-w-2xl space-y-6`}>
			{/* The card people screenshot: name, where they stand, what it means. Fits one phone screen. */}
			<article className={`${styles.cover} px-6 py-8 sm:px-10 sm:py-11`}>
				<div className="flex items-start justify-between gap-4">
					<p className={styles.label}>Điểm xuất phát của bạn</p>
					<p className={`${styles.label} ${styles.faint} text-right`}>
						UNRELEASED · {EVENT.dateBadge}
					</p>
				</div>
				<h2 className={`${styles.groupName} mt-5 text-[3.25rem] sm:text-7xl`}>{copy.name}</h2>
				<p className={`${styles.musicLine} mt-4 text-lg sm:text-xl`}>{copy.musicLine}</p>
				<Paragraphs items={copy.body} className="mt-6 text-[1.05rem] leading-[1.75]" />

				<ol className="mt-8 grid gap-1" aria-label="Bốn điểm xuất phát">
					{RESULT_SCALE.map((step, index) => {
						const active = step.group === result.group;
						return (
							<li
								key={step.group}
								aria-current={active ? 'step' : undefined}
								className={`${styles.scaleItem} ${active ? styles.scaleItemActive : ''}`}
							>
								<span className={styles.scaleIndex}>{String(index + 1).padStart(2, '0')}</span>
								<span className="min-w-0">
									<span className={`${styles.scaleName} block`}>{step.name}</span>
									<span className="block text-[0.8rem] leading-snug opacity-90">{step.hint}</span>
								</span>
								{active ? <span className={styles.here}>BẠN Ở ĐÂY</span> : null}
							</li>
						);
					})}
				</ol>
			</article>

			<section className={`${styles.panel} p-6 sm:p-8`} aria-labelledby="unreleased-workshop">
				<h2 id="unreleased-workshop" className={styles.label}>
					Ở workshop
				</h2>
				<p
					className={`${styles.display} mt-3 text-[1.25rem] !font-medium !leading-[1.45] !tracking-[-0.015em] sm:text-[1.4rem]`}
				>
					{copy.atWorkshop}
				</p>
			</section>

			<section className={`${styles.panel} p-6 sm:p-8`} aria-labelledby="unreleased-prepare">
				<h2 id="unreleased-prepare" className={styles.label}>
					Trước buổi workshop
				</h2>
				<ol className="mt-5 space-y-4">
					{prepare.map((item, index) => (
						<li key={item} className="flex gap-4">
							<span aria-hidden="true" className={styles.stepNumber}>
								{String(index + 1).padStart(2, '0')}
							</span>
							<span className="pt-0.5 text-[1.02rem] leading-relaxed">{item}</span>
						</li>
					))}
				</ol>
				<p className={`${styles.faint} mt-6 text-sm leading-relaxed`}>
					Kết quả này chỉ dựa trên lựa chọn của bạn hôm nay, với vị trí bạn đang nghĩ tới. Đổi vị
					trí hoặc có thêm kinh nghiệm, kết quả cũng sẽ khác.
				</p>
			</section>

			<RegisterBlock
				source={`result-${result.group}`}
				note="Chụp lại kết quả này và mang theo đến workshop nhé."
			/>

			<div className="pt-2 text-center">
				<button type="button" onClick={onRestart} className={styles.ghost}>
					<span aria-hidden="true">↺</span> Làm lại quiz
				</button>
			</div>
		</div>
	);
}
