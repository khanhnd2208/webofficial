import mongoose from 'mongoose';

/** Attempts per room mutation before a version conflict reaches the caller. */
export const MAX_SAVE_ATTEMPTS = 3;

/**
 * Re-run a load-mutate-save cycle when another player saved the same room
 * first. Mongoose version-checks array edits by index (lastSeenAt, voteToken,
 * roleId, ...), so a join, kick, or vote landing at the same moment makes the
 * save throw a VersionError. Reload and try again rather than overwrite.
 */
export async function withVersionRetry<T>(run: () => Promise<T>): Promise<T> {
	for (let attempt = 1; ; attempt++) {
		try {
			return await run();
		} catch (error) {
			if (!(error instanceof mongoose.Error.VersionError) || attempt >= MAX_SAVE_ATTEMPTS)
				throw error;
		}
	}
}
