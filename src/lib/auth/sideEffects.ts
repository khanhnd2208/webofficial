import { logAuth, newAuthCorrelationId, type AuthLogStage } from '@/lib/auth/log';

type SignInIdentity = {
	id: string;
	email: string;
	name?: string | null;
	image?: string | null;
};

async function runIsolated(
	stage: AuthLogStage,
	event: string,
	correlationId: string,
	task: () => Promise<void>,
): Promise<void> {
	try {
		await task();
		logAuth({ event, stage, ok: true, correlationId, provider: 'google' });
	} catch {
		logAuth({ event, stage, ok: false, correlationId, provider: 'google' });
	}
}

/**
 * Profile sync and cohort membership must never fail the Auth.js callback.
 * Both operations are idempotent.
 */
export async function runSignInSideEffects(user: SignInIdentity): Promise<void> {
	const correlationId = newAuthCorrelationId();

	await runIsolated('profile.sync', 'auth.side_effect', correlationId, async () => {
		const { ensureUserProfile } = await import('@/services/userProfileService');
		await ensureUserProfile({
			userId: user.id,
			email: user.email,
			name: user.name ?? '',
			image: user.image ?? undefined,
		});
	});

	await runIsolated('membership.reconcile', 'auth.side_effect', correlationId, async () => {
		const { reconcilePendingMemberships } = await import('@/features/my-class/services/cohortService');
		await reconcilePendingMemberships(user.id, user.email);
	});
}
