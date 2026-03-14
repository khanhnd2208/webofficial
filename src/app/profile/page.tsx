import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { getMyProfile } from '@/services/userProfileService';

import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
	const session = await auth();
	if (!session?.user?.id || !session.user.email) {
		redirect('/login?from=/profile');
	}

	const profile = await getMyProfile({
		userId: session.user.id,
		email: session.user.email,
		name: session.user.name ?? '',
		image: session.user.image ?? undefined,
	});

	return (
		<main className="min-h-screen pb-16">
			<section className="border-b border-border">
				<div className="mx-auto max-w-4xl px-6 py-10 sm:py-12">
					<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Hồ sơ cá nhân</p>
					<h1 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">Sổ hồ sơ học viên</h1>
					<p className="mt-2 text-sm text-foreground-secondary">
						Thông tin Google (email, tên, avatar) được đồng bộ tự động. Bạn có thể bổ sung ngày sinh, trường, chuyên ngành và bio tại đây.
					</p>
				</div>
			</section>

			<section className="mx-auto max-w-4xl px-6 pt-8">
				<ProfileForm initialProfile={profile} />
			</section>
		</main>
	);
}