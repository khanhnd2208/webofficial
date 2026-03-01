import type { Metadata } from 'next';

import FeedbackMessages from '@/components/FeedbackMessages';

export const revalidate = 60;

export const metadata: Metadata = {
	title: 'Phản hồi | HANOICAM',
	description: 'Gửi phản hồi, góp ý, liên hệ trực tiếp với giảng viên.',
};

export default function FeedbackPublicPage() {
	return (
		<main className="min-h-screen">
			{/* Header */}
			<div className="border-b border-border">
				<div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:max-w-4xl">
					<p className="text-xs font-bold uppercase tracking-widest text-muted">Liên hệ</p>
					<h1 className="mt-2 font-serif text-3xl font-black tracking-tight text-foreground sm:text-4xl">
						Phản hồi
					</h1>
					<p className="mt-3 max-w-xl text-base text-foreground-secondary leading-relaxed">
						Có góp ý, câu hỏi hay gặp vấn đề? Gửi tin nhắn — giảng viên sẽ đọc và trả lời sớm nhất có thể.
					</p>
				</div>
			</div>

			{/* Messaging section */}
			<div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:max-w-4xl">
				<FeedbackMessages />
			</div>
		</main>
	);
}
