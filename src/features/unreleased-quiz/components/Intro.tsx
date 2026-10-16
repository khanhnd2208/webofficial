'use client';

import { EventTicket } from './RegisterBlock';
import styles from './unreleased.module.css';

const HOW_IT_WORKS = [
	{ title: 'Trả lời tối đa 7 câu', text: 'Chọn một đáp án là quiz tự sang câu tiếp.' },
	{ title: 'Nhận điểm xuất phát', text: 'Bạn đang ở đâu và nên bắt đầu viết CV từ chỗ nào.' },
	{ title: 'Mang đến workshop', text: 'Hôm workshop, mình nói tiếp từ chính chỗ đó.' },
];

export function Intro({ onStart }: { onStart: () => void }) {
	return (
		<div
			className={`${styles.enter} grid gap-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16`}
		>
			<div>
				<p className={styles.label}>Side A / Quiz trước workshop</p>
				<h1 className={`${styles.display} mt-5 text-[2.75rem] sm:text-6xl lg:text-[4.5rem]`}>
					CV của bạn đang ở bản nào?
				</h1>
				<div className={`${styles.muted} mt-7 max-w-xl space-y-4 text-[1.05rem] leading-[1.75]`}>
					<p>
						Mỗi người bắt đầu viết CV từ một chỗ khác nhau. Có bạn chưa biết mình muốn làm gì. Có
						bạn đã làm khá nhiều, nhưng không biết điều gì đáng đưa vào CV. Vì thế, lời khuyên đúng
						với người này có khi lại không hợp với người kia.
					</p>
					<p>
						Mình chuẩn bị một quiz nhỏ để các bạn thử nhìn lại những gì mình đang có, còn thiếu và
						nên bắt đầu từ đâu. Hôm workshop, mình sẽ nói tiếp từ chính chỗ đó.
					</p>
				</div>

				<ul className="mt-8 flex flex-wrap gap-2" aria-label="Về quiz">
					<li className={styles.chip}>Tối đa 7 câu</li>
					<li className={styles.chip}>Khoảng 3 phút</li>
					<li className={styles.chip}>Ẩn danh</li>
				</ul>

				<button type="button" onClick={onStart} className={`${styles.cta} mt-8 w-full sm:w-auto`}>
					Bắt đầu <span aria-hidden="true">→</span>
				</button>

				<div className={`${styles.faint} mt-6 max-w-xl space-y-2 text-sm leading-relaxed`}>
					<p>
						Không có đáp án đúng sai. Cứ chọn điều giống bạn nhất lúc này, không phải điều bạn nghĩ
						mình nên chọn.
					</p>
					<p>
						Quiz không hỏi tên, email hay tài khoản. Mình chỉ lưu các lựa chọn của bạn, ẩn danh, để
						biết trước các bạn đang ở đâu và chuẩn bị buổi workshop cho sát hơn.
					</p>
				</div>
			</div>

			<div className="space-y-5 lg:pt-10">
				<section className={`${styles.panel} p-6 sm:p-7`} aria-labelledby="ur-how">
					<h2 id="ur-how" className={styles.label}>
						Tracklist / Cách quiz hoạt động
					</h2>
					<ol className="mt-5 space-y-5">
						{HOW_IT_WORKS.map((step, index) => (
							<li key={step.title} className="flex gap-4">
								<span aria-hidden="true" className={styles.stepNumber}>
									{String(index + 1).padStart(2, '0')}
								</span>
								<div>
									<p className={`${styles.display} text-[1.05rem] !tracking-[-0.01em]`}>
										{step.title}
									</p>
									<p className={`${styles.muted} mt-0.5 text-[0.95rem] leading-relaxed`}>
										{step.text}
									</p>
								</div>
							</li>
						))}
					</ol>
				</section>
				<EventTicket />
			</div>
		</div>
	);
}
