'use client';

import { useEffect, useRef, useState } from 'react';

import { trackEvent } from '@/lib/analytics';

import { QUESTIONS } from '../content/questions';
import { EVENT } from '../content/results';
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
import { Intro } from './Intro';
import { QuestionStep } from './QuestionStep';
import { RegisterLink } from './RegisterBlock';
import { saveResponse } from './responseClient';
import { ResultView } from './ResultView';
import styles from './unreleased.module.css';

type Stage =
	| { kind: 'intro' }
	| { kind: 'question'; id: QuestionId }
	| { kind: 'result'; result: QuizResult };

const ORDER: QuestionId[] = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'];

/** Long enough to see the choice land, short enough to feel instant. */
const ADVANCE_DELAY_MS = 360;

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
	const advanceTimer = useRef<number | null>(null);

	const cancelAdvance = () => {
		if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
		advanceTimer.current = null;
	};

	useEffect(() => cancelAdvance, []);

	const go = (next: Stage) => {
		cancelAdvance();
		setStage(next);
		if (window.scrollY > 0) window.scrollTo({ top: 0 });
	};

	const start = () => {
		setAnswers({});
		trackEvent('unreleased_quiz_start', { sourcePage: 'unreleased' });
		go({ kind: 'question', id: 'q1' });
	};

	const advance = (current: Answers) => {
		const next = nextQuestion(current);
		if (next) {
			go({ kind: 'question', id: next });
			return;
		}
		const result = computeResult(current);
		trackEvent('unreleased_quiz_complete', {
			sourcePage: 'unreleased',
			type: result.group,
			label: result.variant ?? undefined,
		});
		void saveResponse(current);
		go({ kind: 'result', result });
	};

	const renderQuestion = (id: QuestionId) => {
		const path = questionPath(answers);
		const position = path.indexOf(id) + 1;
		const previous = path[position - 2];
		const previousKey = previous ? answers[previous] : undefined;
		const carriedNote =
			previous && previousKey ? QUESTIONS[previous].followUp?.[previousKey] : undefined;
		const selected = answers[id];

		return (
			<QuestionStep
				key={id}
				question={QUESTIONS[id]}
				position={position}
				total={Math.max(expectedLength(answers), position)}
				selected={selected}
				note={carriedNote}
				isLast={selected ? nextQuestion(answers) === null : false}
				onSelect={(key) => {
					const updated = answer(answers, id, key);
					setAnswers(updated);
					cancelAdvance();
					advanceTimer.current = window.setTimeout(() => advance(updated), ADVANCE_DELAY_MS);
				}}
				onNext={() => advance(answers)}
				onBack={() => go(previous ? { kind: 'question', id: previous } : { kind: 'intro' })}
			/>
		);
	};

	return (
		<div className={styles.root}>
			<header className={`${styles.topbar} sticky top-0 z-20`}>
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
					<a
						href={EVENT.siteUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="flex flex-col"
					>
						<span className={styles.brand}>{EVENT.organizer.toUpperCase()}</span>
						<span className={`${styles.label} hidden sm:block`}>
							UNRELEASED / Pre-workshop quiz
						</span>
					</a>
					<RegisterLink source="topbar" />
				</div>
			</header>

			<main className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:px-6 sm:pt-16 md:pb-28">
				{stage.kind === 'intro' ? <Intro onStart={start} /> : null}
				{stage.kind === 'question' ? renderQuestion(stage.id) : null}
				{stage.kind === 'result' ? (
					<ResultView answers={answers} result={stage.result} onRestart={start} />
				) : null}
			</main>
		</div>
	);
}
