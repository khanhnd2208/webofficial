'use client';

import Link from 'next/link';

import { Icon } from '@/components/ui/Icon';

/**
 * Shown in place of the card once the learner moves past the last card. The
 * next step depends on the result: cards still to learn come first, a fully
 * known deck points to the test.
 */
export default function RecallFinishPanel({
	total,
	known,
	reviewing,
	testHref,
	onReviewUnknown,
	onRestartAll,
	backHref,
	backLabel,
}: {
	/** Cards in the whole deck. */
	total: number;
	/** Cards in the deck marked known on this device. */
	known: number;
	/** The run that just ended covered only the cards not yet known. */
	reviewing: boolean;
	testHref?: string;
	onReviewUnknown: () => void;
	onRestartAll: () => void;
	backHref?: string;
	backLabel?: string;
}) {
	const left = Math.max(0, total - known);
	const percent = total ? Math.round((known / total) * 100) : 0;
	const allKnown = left === 0;
	const title = allKnown
		? 'Bạn đã nhớ cả bộ thẻ.'
		: known === 0
			? `Bạn đã xem hết ${total} thẻ.`
			: `Bạn đã nhớ ${known}/${total} thẻ.`;
	const copy = allKnown
		? 'Làm Test để kiểm tra lại theo thứ tự ngẫu nhiên, hoặc học lại khi cần.'
		: known === 0
			? 'Lần tới, sau khi lật thẻ hãy chọn Đã nhớ hoặc Chưa nhớ để biết thẻ nào cần ôn thêm.'
			: reviewing
				? `Còn ${left} thẻ chưa nhớ. Ôn tiếp những thẻ này đến khi nhớ hết.`
				: `Còn ${left} thẻ chưa nhớ. Ôn riêng những thẻ này sẽ nhanh hơn học lại cả bộ.`;

	return (
		<section className="recall-finish" aria-labelledby="recall-finish-title">
			<p className="recall-card-kicker">{reviewing ? 'Hết lượt ôn' : 'Hoàn thành'}</p>
			<h2 id="recall-finish-title" className="recall-finish-title">
				{title}
			</h2>
			<div
				className="recall-finish-meter"
				role="meter"
				aria-label="Thẻ đã nhớ"
				aria-valuemin={0}
				aria-valuemax={total}
				aria-valuenow={known}
				aria-valuetext={`${known}/${total} thẻ đã nhớ`}
			>
				<span style={{ width: `${percent}%` }} />
			</div>
			<p className="recall-finish-copy">{copy}</p>
			<div className="recall-finish-actions">
				{!allKnown && known > 0 ? (
					<button type="button" className="recall-reveal-button" onClick={onReviewUnknown}>
						<Icon name="retry" size={18} aria-hidden="true" />
						Ôn {left} thẻ chưa nhớ
					</button>
				) : null}
				{testHref ? (
					<Link
						href={testHref}
						className={
							allKnown || known === 0
								? 'recall-reveal-button recall-finish-test'
								: 'recall-nav-button recall-finish-test'
						}
					>
						<Icon name="quiz" size={18} aria-hidden="true" />
						Làm Test
					</Link>
				) : null}
				<button type="button" className="recall-nav-button" onClick={onRestartAll}>
					<Icon name="shuffle" size={18} aria-hidden="true" />
					Xáo và học lại cả bộ
				</button>
			</div>
			{backHref && backLabel ? (
				<Link href={backHref} className="recall-finish-link">
					<span aria-hidden="true">←</span> {backLabel}
				</Link>
			) : null}
		</section>
	);
}
