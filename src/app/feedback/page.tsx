import Link from 'next/link';
import type { Metadata } from 'next';

import { getFeedbackPage } from '@/services/feedbackService';
import FeedbackMessages from '@/components/FeedbackMessages';

export const revalidate = 60;

export const metadata: Metadata = {
	title: 'Phản hồi | HANOICAM',
	description: 'Gửi phản hồi, góp ý, liên hệ — HANOICAM.',
};

export default async function FeedbackPublicPage() {
	const page = await getFeedbackPage();

	if (!page.isPublished) {
		return (
			<main className="min-h-screen">
				<div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
					<p className="font-serif text-2xl font-bold text-foreground">Trang phản hồi đang được cập nhật</p>
					<p className="mt-3 text-sm text-muted">Vui lòng quay lại sau.</p>
					<Link href="/" className="mt-6 inline-block text-sm font-bold text-accent underline underline-offset-4">
						← Về trang chủ
					</Link>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-screen">
			{/* Header */}
			<div className="border-b border-border">
				<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:max-w-4xl">
					<Link
						href="/"
						className="text-xs font-bold uppercase tracking-widest text-muted transition-colors hover:text-foreground"
					>
						← Trang chủ
					</Link>
					<h1 className="mt-3 font-serif text-2xl font-black tracking-tight text-foreground sm:text-3xl">
						{page.title}
					</h1>
				</div>
			</div>

			{/* Content */}
			<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:max-w-4xl">
				<article
					className="tiptap-content prose prose-lg dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-[1.8] prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-blockquote:border-l-accent prose-blockquote:text-foreground-secondary prose-strong:text-foreground prose-code:text-accent max-w-none"
					dangerouslySetInnerHTML={{ __html: page.content }}
				/>

				{/* Feedback messaging section */}
				<FeedbackMessages />
			</div>
		</main>
	);
}
