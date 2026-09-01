import Link from 'next/link';

import { AdminEmptyState, AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { routes } from '@/config/routes';
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

export default async function AdminMessagesPage() {
	const session = await auth();
	const messages = session?.user ? await getMessagesByUser(session.user.id) : [];

	return (
		<div className="mx-auto max-w-4xl px-6 py-8">
			<AdminPageHeader
				eyebrow="Công cụ"
				title="Lời nhắn"
				description="Tạo lời nhắn, sinh mã QR và gắn vào thiệp. Người nhận mở qua /m/[slug]."
				actions={
					<Link
						href={routes.admin.messagesNew}
						className="inline-flex min-h-11 items-center rounded-lg bg-foreground px-4 text-sm font-semibold text-background"
					>
						Tạo lời nhắn
					</Link>
				}
			/>

			<div className="mt-8">
				{messages.length === 0 ? (
					<AdminEmptyState
						title="Chưa có lời nhắn nào"
						description="Tạo lời nhắn đầu tiên và in mã QR lên thiệp."
						action={{ href: routes.admin.messagesNew, label: 'Bắt đầu tạo' }}
					/>
				) : (
					<div className="grid gap-4">
						{messages.map((msg) => (
							<Link
								key={msg.slug}
								href={routes.admin.messageEdit(msg.slug)}
								className="group flex gap-4 rounded-xl border border-border bg-surface p-4 transition hover:border-border-hover sm:p-5"
							>
								<div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-secondary">
									{msg.coverImageUrl ? (
										<img src={msg.coverImageUrl} alt="" className="h-full w-full object-cover" />
									) : (
										<div className="flex h-full w-full items-center justify-center text-2xl">💌</div>
									)}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<h2 className="truncate text-base font-bold text-foreground">{msg.title}</h2>
										<span className="rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
											{msg.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
										</span>
									</div>
									<p className="mt-1 text-xs text-muted">
										{formatDate(msg.createdAt)} · {msg.viewCount} lượt đọc · Gửi cho {msg.recipientName}
									</p>
									<p className="mt-1 truncate text-xs text-foreground-secondary">/m/{msg.slug}</p>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
