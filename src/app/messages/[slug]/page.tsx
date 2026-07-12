import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { getMessageBySlugForOwner } from '@/services/messageService';

import MessageManageClient from './MessageManageClient';

export const dynamic = 'force-dynamic';

export default async function MessageManagePage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const session = await auth();
	if (!session?.user) redirect('/dang-nhap?from=/messages');

	const { slug } = await params;
	let message;

	try {
		message = await getMessageBySlugForOwner(slug, session.user.id);
	} catch {
		notFound();
	}

	const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'https://toiladuykhanh.com';
	const publicUrl = `${baseUrl}/m/${message.slug}`;

	return (
		<main className="min-h-screen pb-20">
			<div className="border-b border-border">
				<div className="mx-auto max-w-4xl px-6 py-6">
					<Link href="/messages" className="text-xs text-muted hover:text-foreground">
						← Quay lại danh sách
					</Link>
					<h1 className="mt-1 text-xl font-bold text-foreground">{message.title}</h1>
					<p className="mt-1 text-sm text-muted">
						{message.isPublished ? 'Đã xuất bản' : 'Nháp'} · {message.viewCount} lượt đọc
						{message.hasPassword ? ' · Có mật khẩu' : ''}
					</p>
				</div>
			</div>

			<MessageManageClient message={message} publicUrl={publicUrl} />
		</main>
	);
}
