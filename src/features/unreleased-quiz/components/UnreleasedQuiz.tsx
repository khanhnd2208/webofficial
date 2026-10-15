'use client';

import { useRef, useState } from 'react';

import { trackEvent } from '@/lib/analytics';

import { QUESTIONS } from '../content/questions';
import {
	computeResult,
	expectedLength,
	nextQuestion,
	questionPath,
	type Answers,
	type OptionKey,
	type QuestionId,
	type QuizResult,
} from '../domain/quiz';
import { QuestionStep } from './QuestionStep';
import { EventFacts } from './RegisterBlock';
import { saveResponse } from './responseClient';
import { ResultView } from './ResultView';

type Stage =
	| { kind: 'intro' }
	| { kind: 'question'; id: QuestionId }
	| { kind: 'result'; result: QuizResult };

const ORDER: QuestionId[] = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'];

/** Keep answers up to and including `id`; later ones may no longer be on the path. */
function answer(answers: Answers, id: QuestionId, key: OptionKey): Answers {
	const kept: Answers = {};
	for (const qid of ORDER.slice(0, ORDER.indexOf(id))) {
		if (answers[qid]) kept[qid] = answers[qid];
	}
	kept[id] = key;
	return kept;
}

export function UnreleasedQuiz() {
	const [stage, setStage] = useState<Stage>({ kind: 'intro' });
	const [answers, setAnswers] = useState<Answers>({});
	const topRef = useRef<HTMLDivElement>(null);

	const go = (next: Stage) => {
		setStage(next);
		topRef.current?.scrollIntoView({ block: 'start' });
	};

	const start = () => {
		setAnswers({});
		trackEvent('unreleased_quiz_start', { sourcePage: 'unreleased' });
		go({ kind: 'question', id: 'q1' });
	};

	return (
		<div ref={topRef} className="scroll-mt-24">
			{stage.kind === 'intro' ? <Intro onStart={start} /> : null}

			{stage.kind === 'question'
				? (() => {
						const path = questionPath(answers);
						const position = path.indexOf(stage.id) + 1;
						const total = expectedLength(answers);
						const selected = answers[stage.id];
						const isLast = selected ? nextQuestion(answers) === null : false;
						return (
							<QuestionStep
								question={QUESTIONS[stage.id]}
								position={position}
								total={Math.max(total, position)}
								selected={selected}
								isLast={isLast}
								onSelect={(key) => setAnswers((prev) => answer(prev, stage.id, key))}
								onBack={() => {
									const previous = path[position - 2];
									go(previous ? { kind: 'question', id: previous } : { kind: 'intro' });
								}}
								onNext={() => {
									const next = nextQuestion(answers);
									if (next) {
										go({ kind: 'question', id: next });
										return;
									}
									const result = computeResult(answers);
									trackEvent('unreleased_quiz_complete', {
										sourcePage: 'unreleased',
										type: result.group,
										label: result.variant ?? undefined,
									});
									void saveResponse(answers);
									go({ kind: 'result', result });
								}}
							/>
						);
					})()
				: null}

			{stage.kind === 'result' ? (
				<ResultView answers={answers} result={stage.result} onRestart={start} />
			) : null}
		</div>
	);
}

function Intro({ onStart }: { onStart: () => void }) {
	return (
		<div>
			<p className="editorial-label">UNRELEASED · Quiz trước workshop</p>
			<h1 className="premium-display mt-5 text-ink">CV của bạn đang ở bản nào?</h1>
			<div className="premium-lead mt-6 space-y-4">
				<p>
					Mỗi người bắt đầu viết CV từ một chỗ khác nhau. Có bạn chưa biết mình muốn làm gì. Có bạn
					đã làm khá nhiều, nhưng không biết điều gì đáng đưa vào CV. Vì thế, lời khuyên đúng với
					người này có khi lại không hợp với người kia.
				</p>
				<p>
					Mình chuẩn bị một quiz nhỏ để các bạn thử nhìn lại những gì mình đang có, còn thiếu và nên
					bắt đầu từ đâu. Hôm workshop, mình sẽ nói tiếp từ chính chỗ đó.
				</p>
			</div>
			<p className="mt-8 text-xs font-semibold uppercase tracking-wider text-ink-secondary">
				Tối đa 7 câu · Khoảng 3 phút · Ẩn danh
			</p>
			<button
				type="button"
				onClick={onStart}
				className="mt-5 inline-flex min-h-12 items-center rounded-[4px] bg-ink px-8 text-sm font-semibold uppercase tracking-wider text-paper transition-colors duration-250 hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
			>
				Bắt đầu
			</button>
			<p className="mt-4 max-w-xl text-sm italic text-ink-secondary">
				Không có đáp án đúng sai. Cứ chọn điều giống bạn nhất lúc này, không phải điều bạn nghĩ mình
				nên chọn.
			</p>
			<p className="mt-3 max-w-xl text-sm text-ink-secondary">
				Quiz không hỏi tên, email hay tài khoản. Mình chỉ lưu các lựa chọn của bạn, ẩn danh, để biết
				trước các bạn đang ở đâu và chuẩn bị buổi workshop cho sát hơn.
			</p>

			<div className="mt-14 border-t border-hairline pt-6">
				<EventFacts />
			</div>
		</div>
	);
}
