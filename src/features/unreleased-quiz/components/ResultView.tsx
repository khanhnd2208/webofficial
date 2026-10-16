'use client';

import { EXPERIENCE_PREP, resultCopy } from '../content/results';
import type { Answers, QuizResult } from '../domain/quiz';
import { RegisterBlock } from './RegisterBlock';
import { Paragraphs } from './RichText';

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
		<div className="space-y-10">
			{/* The card people screenshot: name, where they stand, what the workshop does for them. */}
			<article className="border border-ink bg-paper px-5 py-8 sm:px-8 sm:py-10">
				<p className="editorial-label">Điểm xuất phát của bạn</p>
				<h2 className="mt-3 font-display text-5xl leading-none text-ink md:text-6xl">
					{copy.name}
				</h2>
				<p className="mt-4 font-display text-lg italic leading-snug text-ink-secondary md:text-xl">
					{copy.musicLine}
				</p>
				<Paragraphs items={copy.body} className="mt-7 text-base leading-relaxed text-ink" />
				<p className="mt-8 border-t border-hairline pt-6 text-base leading-relaxed text-ink">
					{copy.atWorkshop}
				</p>
			</article>

			<section aria-labelledby="unreleased-prepare">
				<h2 id="unreleased-prepare" className="font-display text-3xl text-ink">
					Trước buổi workshop
				</h2>
				<ul className="mt-4 space-y-3 leading-relaxed text-ink-secondary">
					{prepare.map((item) => (
						<li key={item} className="border-l-2 border-accent pl-4">
							{item}
						</li>
					))}
				</ul>
				<p className="mt-5 text-sm italic text-ink-secondary">
					Kết quả này chỉ dựa trên lựa chọn của bạn hôm nay, với vị trí bạn đang nghĩ tới. Đổi vị
					trí hoặc có thêm kinh nghiệm, kết quả cũng sẽ khác.
				</p>
			</section>

			<RegisterBlock
				source={`result-${result.group}`}
				note="Chụp lại kết quả này và mang theo đến workshop nhé."
			/>

			<div className="text-center">
				<button
					type="button"
					onClick={onRestart}
					className="inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-wider text-ink-secondary transition-colors hover:text-ink"
				>
					Làm lại quiz
				</button>
			</div>
		</div>
	);
}
