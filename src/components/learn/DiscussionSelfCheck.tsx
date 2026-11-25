'use client';

import { useId } from 'react';

export type SelfRating = 'yes' | 'partly' | 'no';

export const SELF_RATINGS: Array<{ id: SelfRating; label: string }> = [
	{ id: 'yes', label: 'Đúng ý' },
	{ id: 'partly', label: 'Một phần' },
	{ id: 'no', label: 'Chưa đúng' },
];

/**
 * Write-then-compare: an optional answer box before the model answer, and a self-rating after
 * it. Writing an answer before seeing one (retrieval practice) is what makes the questions stick.
 */
export default function DiscussionSelfCheck({
	open,
	answer,
	onAnswer,
	rating,
	onRate,
}: {
	open: boolean;
	answer: string;
	onAnswer: (value: string) => void;
	rating: SelfRating | null;
	onRate: (value: SelfRating | null) => void;
}) {
	const id = useId();

	if (!open) {
		return (
			<div className="ln-selfcheck">
				<label htmlFor={id} className="ln-selfcheck__label">
					Câu trả lời của bạn
					<span>Không bắt buộc · lưu trên thiết bị này</span>
				</label>
				<textarea
					id={id}
					className="ln-selfcheck__input"
					rows={4}
					value={answer}
					onChange={(event) => onAnswer(event.target.value)}
					placeholder="Viết vài ý chính trước khi xem đáp án mẫu…"
				/>
			</div>
		);
	}

	return (
		<div className="ln-selfcheck">
			{answer.trim() ? (
				<div className="ln-selfcheck__mine">
					<p className="ln-selfcheck__label">Bạn đã viết</p>
					<p>{answer}</p>
				</div>
			) : null}
			<div role="group" aria-labelledby={`${id}-rate`} className="ln-selfcheck__rate">
				<p id={`${id}-rate`} className="ln-selfcheck__label">
					So với đáp án mẫu, câu trả lời của bạn
				</p>
				<div className="ln-selfcheck__options">
					{SELF_RATINGS.map((item) => (
						<button
							key={item.id}
							type="button"
							className="ln-btn ln-selfcheck__option"
							data-rating={item.id}
							aria-pressed={rating === item.id}
							onClick={() => onRate(rating === item.id ? null : item.id)}
						>
							{item.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

/** End-of-set recap: how the learner rated themselves and which questions to revisit. */
export function DiscussionReview({
	ratings,
	onJump,
}: {
	ratings: Array<SelfRating | null>;
	onJump: (index: number) => void;
}) {
	const rated = ratings.filter(Boolean).length;
	if (!rated) return null;
	const count = (value: SelfRating) => ratings.filter((item) => item === value).length;
	const revisit = ratings
		.map((item, index) => (item === 'no' || item === 'partly' ? index : -1))
		.filter((index) => index >= 0);
	return (
		<section className="ln-review" aria-label="Tự đánh giá">
			<p className="ln-review__line">
				Bạn tự chấm {rated} câu: <b>{count('yes')}</b> đúng ý, <b>{count('partly')}</b> một phần,{' '}
				<b>{count('no')}</b> chưa đúng.
			</p>
			{revisit.length ? (
				<div className="ln-review__revisit">
					<span>Nên xem lại:</span>
					{revisit.map((index) => (
						<button
							key={index}
							type="button"
							className="ln-btn ln-btn--sm"
							onClick={() => onJump(index)}
						>
							Câu {index + 1}
						</button>
					))}
				</div>
			) : (
				<p className="ln-review__line">Không có câu nào cần xem lại.</p>
			)}
		</section>
	);
}
