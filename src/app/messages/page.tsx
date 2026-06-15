import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { getMessagesByUser } from '@/services/messageService';

export const dynamic = 'force-dynamic';

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString('vi-VN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

export default async function MessagesPage() {
	const session = await auth();
	if (!session?.user) redirect('/login?from=/messages');

	const messages = await getMessagesByUser(session.user.id);

	return (
		<main className="min-h-screen pb-16">
			<section className="border-b border-border">
				<div className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
					<div className="flex flex-wrap items-end justify-between gap-4">
						<div>
							<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
								Lời nhắn thiệp
							</p>
							<h1 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
								Lời nhắn của bạn
							</h1>
							<p className="mt-1.5 text-sm text-foreground-secondary">
								Tạo lời nhắn, sinh QR code và gắn vào thiệp.
							</p>
						</div>
						<Link
							href="/messages/create"
							className="inline-flex items-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
						>
							+ Tạo lời nhắn
						</Link>
					</div>
				</div>
			</section>

			<section className="mx-auto max-w-4xl px-6 py-10">
				{messages.length === 0 ? (
					<div className="rounded-2xl border border-dashed border-border bg-surface-secondary/40 px-6 py-16 text-center">
						<p className="text-4xl">💌</p>
						<p className="mt-4 text-lg font-semibold text-foreground">Chưa có lời nhắn nào</p>
						<p className="mt-2 text-sm text-foreground-secondary">
							Tạo lời nhắn đầu tiên và in QR code lên thiệp.
						</p>
						<Link
							href="/messages/create"
							className="mt-6 inline-flex rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
						>
							Bắt đầu tạo
						</Link>
					</div>
				) : (
					<div className="grid gap-4">
						{messages.map((msg) => (
							<Link
								key={msg.slug}
								href={`/messages/${msg.slug}`}
								className="group flex gap-4 rounded-2xl border border-border bg-surface p-4 transition hover:border-accent/30 hover:shadow-sm sm:p-5"
							>
								<div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-secondary">
									{msg.coverImageUrl ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={msg.coverImageUrl}
											alt=""
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center text-2xl">
											💌
										</div>
									)}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<h2 className="truncate text-base font-bold text-foreground group-hover:text-accent">
											{msg.title}
										</h2>
										{msg.isPublished ? (
											<span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-600">
												Đã xuất bản
											</span>
										) : (
											<span className="rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
												Nháp
											</span>
										)}
										{msg.hasPassword && (
											<span className="text-xs text-muted">🔐</span>
										)}
									</div>
									<p className="mt-1 text-xs text-muted">
										{formatDate(msg.createdAt)} · {msg.viewCount} lượt đọc · Gửi cho {msg.recipientName}
									</p>
									<p className="mt-1 truncate text-xs text-foreground-secondary">
										/m/{msg.slug}
									</p>
								</div>
							</Link>
						))}
					</div>
				)}
			</section>
		</main>
	);
}
