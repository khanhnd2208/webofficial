import { routes } from '@/config/routes';
import brand from '@/features/unreleased-quiz/components/unreleased.module.css';

import styles from './gift.module.css';

export function GiftThankYou({ responseId, pdfReady }: { responseId: string; pdfReady: boolean }) {
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

			<main className="mx-auto max-w-3xl px-4 pt-16 pb-24 sm:px-6 sm:pt-24">
				<p className={brand.label}>Hoàn thành / Cảm ơn bạn</p>
				<h1 className={`${brand.display} mt-5 text-[2.75rem] sm:text-6xl`}>
					Cảm ơn vì đã đi cùng mình hôm nay.
				</h1>
				<p className={`${brand.muted} mt-7 max-w-2xl text-[1.05rem] leading-[1.75]`}>
					Mình đã nhận được đánh giá của bạn. Những điều bạn chia sẻ sẽ giúp các buổi workshop sau
					thiết thực và dễ theo dõi hơn.
				</p>

				<section
					className={`${brand.panel} ${styles.giftPanel} mt-10`}
					aria-labelledby="gift-title"
				>
					<p className={brand.label}>Backstage pass / Món quà sau workshop</p>
					<h2 id="gift-title" className={`${brand.display} mt-3 text-3xl sm:text-4xl`}>
						Tài liệu UNRELEASED
					</h2>
					{pdfReady ? (
						<>
							<p className={`${brand.muted} mt-4 max-w-xl`}>
								Mang những ý chính của buổi học về và tiếp tục làm CV theo nhịp của bạn.
							</p>
							<a
								href={`/api/unreleased-gift/download?response=${encodeURIComponent(responseId)}`}
								className={`${brand.cta} mt-7 w-full sm:w-auto`}
							>
								Tải tài liệu PDF <span aria-hidden="true">↓</span>
							</a>
						</>
					) : (
						<p className={`${brand.muted} mt-4 max-w-xl`}>
							Tài liệu đang được chuẩn bị. Hãy giữ lại đường dẫn trang này để quay lại tải khi mình
							bổ sung bản PDF.
						</p>
					)}
				</section>
			</main>
		</div>
	);
}
