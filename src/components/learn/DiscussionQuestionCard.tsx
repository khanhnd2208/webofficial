'use client';

import {
	ANSWER_LABELS,
	ASK_LABELS,
	RECALL_LABELS,
	STEP_LABELS,
	TAKEAWAY_LABELS,
	splitLabelled,
	type DiscussionQuestionView,
} from '@/features/learn/discussionView';

import LearnMarkdown from './LearnMarkdown';

function blockKind(label: string | null) {
	if (!label) return undefined;
	if (ASK_LABELS.includes(label)) return 'ask';
	if (TAKEAWAY_LABELS.includes(label)) return 'takeaway';
	if (RECALL_LABELS.includes(label)) return 'recall';
	if (STEP_LABELS.includes(label)) return 'steps';
	return undefined;
}

/** The question card a learner sees. Open state stays with the parent. */
export default function DiscussionQuestionCard({
	index,
	view,
	answer,
	open,
	onOpenChange,
}: {
	index: number;
	view: DiscussionQuestionView;
	answer: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<section className="ln-stepper__card ln-disc" aria-label={`Câu ${index + 1}`}>
			{view.level || view.title ? (
				<header className="ln-disc__head">
					{view.title ? (
						<h2 className="ln-disc__title">
							{view.level ? <span className="ln-disc__level">{view.level}</span> : null}
							{view.title}
						</h2>
					) : null}
				</header>
			) : null}
			{view.blocks.map((block, blockIndex) => (
				<div key={blockIndex} className="ln-disc__block" data-kind={blockKind(block.label)}>
					{block.label ? <p className="ln-disc__label">{block.label}</p> : null}
					{block.markdown ? <LearnMarkdown markdown={block.markdown} /> : null}
				</div>
			))}
			{open ? (
				<div className="ln-disc__answer">
					<div className="ln-disc__answer-head">
						<p className="ln-disc__answer-title">Đáp án mẫu</p>
						<button type="button" className="ln-link-btn" onClick={() => onOpenChange(false)}>
							Ẩn đáp án
						</button>
					</div>
					{answer.trim() ? (
						splitLabelled(answer, ANSWER_LABELS).map((block, blockIndex) => (
							<div key={blockIndex} className="ln-disc__block" data-kind={blockKind(block.label)}>
								{block.label ? <p className="ln-disc__label">{block.label}</p> : null}
								{block.markdown ? <LearnMarkdown markdown={block.markdown} /> : null}
							</div>
						))
					) : (
						<p className="text-ink-secondary">Chưa có đáp án mẫu.</p>
					)}
				</div>
			) : null}
		</section>
	);
}
