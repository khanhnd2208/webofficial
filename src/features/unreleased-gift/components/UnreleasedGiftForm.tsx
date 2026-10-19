'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { routes } from '@/config/routes';
import { trackEvent } from '@/lib/analytics';
import brand from '@/features/unreleased-quiz/components/unreleased.module.css';

import styles from './gift.module.css';

const QUESTIONS = [
	{
		id: 'overall',
		number: '01',
		title: 'Cảm nhận tổng quan về buổi hôm nay',
		hint: 'Buổi workshop có đáp ứng điều bạn mong đợi không?',
	},
	{
		id: 'usefulness',
		number: '02',
		title: 'Kiến thức học được hữu ích với bạn đến mức nào?',
		hint: 'Bạn có thể áp dụng những điều vừa học vào CV của mình không?',
	},
	{
		id: 'clarity',
		number: '03',
		title: 'Cách truyền đạt có dễ hiểu, rõ ràng không?',
		hint: 'Nhịp độ, ví dụ và phần giải thích có giúp bạn theo kịp không?',
	},
] as const;

type RatingKey = (typeof QUESTIONS)[number]['id'];
type Ratings = Record<RatingKey, number | null>;

export function UnreleasedGiftForm() {
	const router = useRouter();
	const [ratings, setRatings] = useState<Ratings>({
		overall: null,
		usefulness: null,
		clarity: null,
	});
	const [comment, setComment] = useState('');
	const [pending, setPending] = useState(false);
	const [error, setError] = useState('');

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (pending) return;
		if (ratings.overall === null || ratings.usefulness === null || ratings.clarity === null) {
			setError('Hãy chọn điểm cho cả ba câu trước khi hoàn thành.');
			return;
		}

		setPending(true);
		setError('');
		try {
			const response = await fetch('/api/unreleased-gift/responses', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					overall: ratings.overall,
					usefulness: ratings.usefulness,
					clarity: ratings.clarity,
					comment: comment.trim(),
				}),
			});
			const body = (await response.json()) as {
				ok: boolean;
				data?: { id: string };
				error?: string;
			};
			if (!response.ok || !body.data?.id) {
				throw new Error(body.error ?? 'Chưa gửi được đánh giá. Vui lòng thử lại.');
			}
			trackEvent('unreleased_gift_feedback_complete', { sourcePage: 'unreleasedgift' });
			router.push(`${routes.unreleasedGiftThanks}?response=${encodeURIComponent(body.data.id)}`);
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : 'Chưa gửi được đánh giá. Vui lòng thử lại.',
			);
			setPending(false);
		}
	}

	return (
		<div className={brand.root}>
			<header className={`${brand.topbar} sticky top-0 z-20`}>
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
					<a href={routes.unreleased} className="flex flex-col">
						<span className={brand.brand}>HANU CAREER READY</span>
						<span className={`${brand.label} hidden sm:block`}>UNRELEASED / Sau workshop</span>
					</a>
					<span className={brand.chip}>SIDE B</span>
				</div>
			</header>

			<main className="mx-auto max-w-4xl px-4 pt-10 pb-20 sm:px-6 sm:pt-16 md:pb-28">
				<p className={brand.label}>Side B / Sau workshop</p>
				<h1 className={`${brand.display} mt-5 max-w-3xl text-[2.75rem] sm:text-6xl`}>
					Buổi hôm nay thế nào với bạn?
				</h1>
				<p className={`${brand.muted} mt-7 max-w-2xl text-[1.05rem] leading-[1.75]`}>
					Một vài đánh giá thật lòng sẽ giúp mình làm những buổi sau tốt hơn. Chọn điểm từ 1 đến 10
					cho ba câu hỏi, rồi chia sẻ thêm điều bạn muốn nói. Sau khi hoàn thành, bạn sẽ tới trang
					nhận tài liệu của workshop.
				</p>
				<div className="mt-7 flex flex-wrap gap-2">
					<span className={brand.chip}>3 câu chấm điểm</span>
					<span className={brand.chip}>Khoảng 2 phút</span>
					<span className={brand.chip}>Ẩn danh</span>
				</div>

				<form onSubmit={submit} className="mt-10 space-y-5">
					{QUESTIONS.map((question) => (
						<fieldset key={question.id} className={`${brand.panel} ${styles.question}`}>
							<legend className="sr-only">{question.title}</legend>
							<div className={styles.questionHeading} aria-hidden="true">
								<span className={styles.number}>{question.number}</span>
								<div>
									<p className={styles.questionTitle}>{question.title}</p>
									<p className={`${brand.faint} mt-1 text-sm`}>{question.hint}</p>
								</div>
							</div>
							<div className={styles.scale} role="group" aria-label={question.title}>
								{Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
									<label key={value} className={styles.ratingOption}>
										<input
											type="radio"
											name={question.id}
											value={value}
											checked={ratings[question.id] === value}
											onChange={() => {
												setRatings((current) => ({ ...current, [question.id]: value }));
												setError('');
											}}
											required
										/>
										<span>{value}</span>
									</label>
								))}
							</div>
							<div className={`${brand.faint} mt-3 flex justify-between text-xs`}>
								<span>Chưa tốt</span>
								<span>Rất tốt</span>
							</div>
						</fieldset>
					))}

					<div className={`${brand.panel} ${styles.question}`}>
						<label htmlFor="gift-comment" className={styles.questionHeading}>
							<span className={styles.number}>04</span>
							<span>
								<span className={styles.questionTitle}>Câu hỏi, nhận xét sau buổi này</span>
								<span className={`${brand.faint} mt-1 block text-sm`}>
									Điều bạn thích, điều cần cải thiện hoặc câu hỏi còn lại — cứ viết thoải mái.
								</span>
							</span>
						</label>
						<textarea
							id="gift-comment"
							className={styles.comment}
							rows={6}
							maxLength={5000}
							value={comment}
							onChange={(event) => setComment(event.target.value)}
							placeholder="Bạn muốn chia sẻ điều gì?"
						/>
						<p className={`${brand.faint} mt-2 text-right text-xs`}>{comment.length}/5000</p>
					</div>

					{error ? (
						<p className={styles.error} role="alert">
							{error}
						</p>
					) : null}
					<button type="submit" disabled={pending} className={`${brand.cta} w-full sm:w-auto`}>
						{pending ? 'Đang gửi...' : 'Hoàn thành'} <span aria-hidden="true">→</span>
					</button>
					<p className={`${brand.faint} max-w-2xl text-sm leading-relaxed`}>
						Không cần tên, email hay tài khoản. Mình chỉ lưu ba điểm số và phần bạn viết để cải
						thiện workshop.
					</p>
				</form>
			</main>
		</div>
	);
}
