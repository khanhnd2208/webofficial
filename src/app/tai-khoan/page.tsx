import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { getMyProfile } from '@/services/userProfileService';
import { routes } from '@/config/routes';

import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

export const metadata = {
	title: 'Tài khoản',
	description: 'Hồ sơ tài khoản Duy Khánh.',
};

export default async function ProfilePage() {
	const session = await auth();
	if (!session?.user?.id || !session.user.email) {
		redirect(`${routes.login}?from=${routes.account}`);
	}

	const profile = await getMyProfile({
		userId: session.user.id,
		email: session.user.email,
		name: session.user.name ?? '',
		image: session.user.image ?? undefined,
	});

	return (
		<main className="min-h-screen pb-16">
			<section className="border-b border-hairline">
				<div className="shell max-w-3xl py-10 sm:py-12">
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Tài khoản</p>
					<h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
						Hồ sơ học viên
					</h1>
					<p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-secondary">
						Thông tin Google được đồng bộ tự động. Bạn có thể bổ sung ngày sinh, trường, chuyên ngành và bio.
					</p>
				</div>
			</section>

			<section className="shell max-w-3xl pt-8 sm:pt-10">
				{/* Identity strip — no parallax */}
				<div className="mb-8 flex items-center gap-4 rounded-[18px] border border-hairline bg-paper p-5">
					{session.user.image ? (
						<img
							src={session.user.image}
							alt=""
							width={56}
							height={56}
							className="h-14 w-14 rounded-full object-cover"
							referrerPolicy="no-referrer"
						/>
					) : (
						<div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink font-display text-xl text-paper">
							{(session.user.name ?? 'U')[0].toUpperCase()}
						</div>
					)}
					<div className="min-w-0">
						<p className="truncate font-display text-xl font-medium text-ink">{session.user.name}</p>
						<p className="truncate text-sm text-ink-secondary">{session.user.email}</p>
					</div>
				</div>

				<ProfileForm initialProfile={profile} />
			</section>
		</main>
	);
}
