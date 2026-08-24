import type { Metadata } from 'next';
import Link from 'next/link';
import { getTest } from '@/features/my-class';
import { readGuestId } from '@/features/myspace-tests/guestIdentity';
import TestRunner from '@/components/myclass/TestRunner';
import { auth } from '@/lib/auth';
import { rethrowUnlessNotFound } from '@/lib/pageErrors';
import KnowledgeHeader from '@/components/knowledge/KnowledgeHeader';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Bài test | Kho kiến thức',
	robots: { index: false, follow: false },
};

export default async function MyClassTestPage({ params }: { params: Promise<{ courseSlug: string; testSlug: string }> }) {
	const { courseSlug, testSlug } = await params;
	const session = await auth();
	const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
	const guestId = userId ? null : await readGuestId();
	let test;
	try {
		test = await getTest(courseSlug, testSlug, { userId, guestId });
	} catch (error) {
		rethrowUnlessNotFound(error);
	}
	const authenticated = Boolean(userId);
	return (
		<><KnowledgeHeader crumb={test.title} user={session?.user ?? null} loginHref={`${routes.login}?from=${encodeURIComponent(routes.myClassTest(courseSlug, testSlug))}`} /><main className="min-h-svh bg-canvas">
			<div className="mx-auto max-w-3xl px-4 py-6">
				<Link href={test.returnTo.href} className="inline-flex min-h-11 items-center text-sm font-medium text-ink-secondary hover:text-ink">
					← Quay lại
				</Link>
				<TestRunner test={test} authenticated={authenticated} />
			</div>
		</main></>
	);
}
