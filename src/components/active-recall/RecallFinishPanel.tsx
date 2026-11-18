'use client';

import Link from 'next/link';

/** Shown in place of the card once the learner moves past the last card. */
export default function RecallFinishPanel({
	total,
	onShuffleRestart,
	backHref,
	backLabel,
}: {
	total: number;
	onShuffleRestart: () => void;
	backHref?: string;
	backLabel?: string;
}) {
	return (
		<section className="recall-finish" aria-labelledby="recall-finish-title">
			<p className="recall-card-kicker">Hoàn thành</p>
			<h2 id="recall-finish-title" className="recall-finish-title">
				Bạn đã ôn hết {total} thẻ.
			</h2>
			<p className="recall-finish-copy">
				Học lại từ đầu để nhớ chắc hơn, hoặc xáo thứ tự để tự kiểm tra mà không nhớ theo vị trí.
			</p>
			<div className="recall-finish-actions">
				<button type="button" className="recall-nav-button" onClick={onShuffleRestart}>
					Xáo thứ tự rồi học lại
				</button>
				{backHref && backLabel ? (
					<Link href={backHref} className="recall-finish-link">
						← {backLabel}
					</Link>
				) : null}
			</div>
		</section>
	);
}
