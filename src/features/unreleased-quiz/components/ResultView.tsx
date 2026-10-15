'use client';

import { optionText, QUESTIONS } from '../content/questions';
import {
	EXAMPLE_BUT_UNCLEAR_JD,
	EXPERIENCE_NOTES,
	MISMATCH_NOTES,
	resultCopy,
	START_NOTES,
} from '../content/results';
import type { Answers, QuizResult } from '../domain/quiz';
import { RegisterBlock, RegisterButton } from './RegisterBlock';
import { Paragraphs } from './RichText';

type ResultViewProps = {
	answers: Answers;
	result: QuizResult;
	onRestart: () => void;
};

function SubHeading({ children }: { children: string }) {
	return <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">{children}</h3>;
}

export function ResultView({ answers, result, onRestart }: ResultViewProps) {
	const copy = resultCopy(result.group, result.variant);
	const note = result.note ? MISMATCH_NOTES[result.note] : null;
	const q3 = answers.q3 as keyof typeof START_NOTES | undefined;

	return (
		<div className="space-y-12">
			{/* The card people screenshot: name, plain statement, one thought, the invitation. */}
			<article className="border border-ink bg-paper px-5 py-8 sm:px-8 sm:py-10">
				<p className="editorial-label">Điểm xuất phát của bạn</p>
				<h2 className="mt-3 font-display text-5xl leading-none text-ink md:text-6xl">
					{copy.name}
				</h2>
				<p className="mt-4 font-display text-lg italic leading-snug text-ink-secondary md:text-xl">
					{copy.musicLine}
				</p>
				<Paragraphs items={copy.body} className="mt-7 text-base leading-relaxed text-ink" />

				<div className="mt-8 border-l-2 border-accent pl-5">
					<p className="text-xs font-semibold uppercase tracking-wider text-accent">
						Một điều đáng nghĩ
					</p>
					<p className="mt-2 font-display text-xl leading-snug text-ink">{copy.think}</p>
				</div>

				<div className="mt-8 border-t border-hairline pt-6">
					<p className="text-xs font-semibold uppercase tracking-wider text-ink">
						Hẹn bạn ở UNRELEASED
					</p>
					<Paragraphs
						items={copy.invite}
						className="mt-3 text-base leading-relaxed text-ink-secondary"
					/>
				</div>
			</article>

			<RegisterBlock
				source={`result-${result.group}`}
				note="Chụp lại kết quả của bạn và mang theo đến workshop nhé."
			/>

			<section aria-labelledby="unreleased-more" className="space-y-8">
				<h2 id="unreleased-more" className="font-display text-3xl text-ink">
					Hiểu thêm về kết quả
				</h2>

				{note ? (
					<div className="bg-surface-sunken p-5">
						<SubHeading>{note.title}</SubHeading>
						<Paragraphs items={note.body} className="mt-3 leading-relaxed text-ink-secondary" />
					</div>
				) : null}

				{copy.whatYouHave ? (
					<div>
						<SubHeading>Điều bạn đang có</SubHeading>
						<Paragraphs
							items={copy.whatYouHave}
							className="mt-3 leading-relaxed text-ink-secondary"
						/>
					</div>
				) : null}

				<div>
					<SubHeading>Điều bạn có thể thử</SubHeading>
					<Paragraphs items={copy.tryThis} className="mt-3 leading-relaxed text-ink-secondary" />
				</div>

				<div>
					<SubHeading>Riêng với bạn, tại workshop</SubHeading>
					<Paragraphs items={copy.atWorkshop} className="mt-3 leading-relaxed text-ink-secondary" />
				</div>

				<details className="group border-y border-hairline py-5">
					<summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-ink">
						Vì sao mình nhận được kết quả này?
						<span
							aria-hidden="true"
							className="text-accent transition-transform duration-150 group-open:rotate-45"
						>
							+
						</span>
					</summary>
					<div className="mt-5 space-y-6 leading-relaxed text-ink-secondary">
						<div>
							<p className="text-ink">
								Bạn thuộc nhóm <strong>{copy.name}</strong> vì những câu trả lời này:
							</p>
							<ul className="mt-3 space-y-2">
								{result.decidingQuestions.map((id) => (
									<li key={id} className="border-l border-hairline pl-4">
										<span className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary">
											{QUESTIONS[id].shortLabel}
										</span>
										<span className="text-ink">{optionText(id, answers[id]!)}</span>
									</li>
								))}
							</ul>
							{result.hasExampleButUnclearJd ? (
								<p className="mt-4">{EXAMPLE_BUT_UNCLEAR_JD}</p>
							) : null}
							<p className="mt-4 italic">{copy.whyClosing}</p>
						</div>

						{q3 ? (
							<div>
								<SubHeading>Cách bạn đang bắt đầu</SubHeading>
								<p className="mt-2">{START_NOTES[q3]}</p>
							</div>
						) : null}

						{answers.q4 ? (
							<div>
								<SubHeading>Một trải nghiệm đáng nhìn lại</SubHeading>
								<p className="mt-2">{EXPERIENCE_NOTES[answers.q4]}</p>
							</div>
						) : null}

						<p className="text-sm italic">
							Đây không phải bài kiểm tra năng lực, cũng không phải kết luận về tiềm năng của bạn.
							Kết quả chỉ gợi ý bạn đang ở đâu với vị trí muốn ứng tuyển. Nếu đổi vị trí hoặc có
							thêm kinh nghiệm, kết quả cũng có thể thay đổi.
						</p>
					</div>
				</details>
			</section>

			<section aria-labelledby="unreleased-try" className="space-y-6">
				<h2 id="unreleased-try" className="font-display text-3xl text-ink">
					Tại UNRELEASED, chúng ta sẽ cùng thử…
				</h2>
				<div className="grid gap-6 sm:grid-cols-2">
					<div className="border-t border-ink pt-4">
						<p className="font-mono text-xs font-semibold text-accent">01</p>
						<h3 className="mt-2 text-lg font-semibold text-ink">Đổi vai thành người tuyển dụng</h3>
						<p className="mt-2 leading-relaxed text-ink-secondary">
							Bạn có 7 giây để xem mỗi CV và chọn một ứng viên. Sau đó, bạn được đọc kỹ hơn, đối
							chiếu với tin tuyển dụng và chọn lại.
						</p>
						<p className="mt-2 font-semibold text-ink">Liệu bạn có đổi quyết định?</p>
					</div>
					<div className="border-t border-ink pt-4">
						<p className="font-mono text-xs font-semibold text-accent">02</p>
						<h3 className="mt-2 text-lg font-semibold text-ink">Xem AI viết CV</h3>
						<p className="mt-2 leading-relaxed text-ink-secondary">
							Mình sẽ dùng AI viết CV ngay trước cả phòng. Các bạn sẽ cùng tìm những chỗ AI tự thêm
							thông tin, rồi thử xem làm thế nào để AI thực sự giúp ích mà không viết sai câu chuyện
							của mình.
						</p>
					</div>
				</div>
			</section>

			<section className="border-t border-hairline pt-10 text-center">
				<p className="mx-auto max-w-xl leading-relaxed text-ink-secondary">
					Mình không mong các bạn bước ra khỏi workshop với một chiếc CV hoàn hảo. Mình chỉ hy vọng
					sau buổi đó, các bạn hiểu rõ hơn những gì mình đã có, những gì còn thiếu và biết nên bắt
					đầu từ đâu.
				</p>
				<p className="mt-6 font-display text-2xl text-ink">Hẹn gặp các bạn ở UNRELEASED.</p>
				<div className="mt-7 flex flex-col items-center gap-3">
					<RegisterButton source="closing" />
					<button
						type="button"
						onClick={onRestart}
						className="inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-wider text-ink-secondary transition-colors hover:text-ink"
					>
						Làm lại quiz
					</button>
				</div>
			</section>
		</div>
	);
}
