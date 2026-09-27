import { CHEESE_HOURS } from '@/features/cheese-thief/config/cheeseThief';

export interface NightTiming {
	introMs: number;
	hourMs: number;
	outroMs: number;
}

export type NightSegment =
	| { kind: 'intro'; cueId: 'night-start'; endsAt: number }
	| { kind: 'hour-wake'; hour: number; cueId: 'wake'; endsAt: number }
	| { kind: 'hour-sleep'; hour: number; cueId: 'sleep'; endsAt: number }
	| { kind: 'outro'; cueId: 'night-end'; endsAt: number }
	| { kind: 'done'; cueId: 'done'; endsAt: number };

/**
 * The night is a pure function of the clock. Empty hours last exactly as long
 * as busy ones — skipping them would tell the table that nobody woke.
 */
export function segmentAt(startedAt: number, now: number, timing: NightTiming): NightSegment {
	const elapsed = Math.max(0, now - startedAt);
	let cursor = 0;

	const introEnd = timing.introMs;
	if (elapsed < introEnd) {
		return { kind: 'intro', cueId: 'night-start', endsAt: startedAt + introEnd };
	}
	cursor = introEnd;

	const wakeMs = Math.floor(timing.hourMs / 2);
	const sleepMs = timing.hourMs - wakeMs;

	for (const hour of CHEESE_HOURS) {
		const wakeEnd = cursor + wakeMs;
		if (elapsed < wakeEnd) {
			return { kind: 'hour-wake', hour, cueId: 'wake', endsAt: startedAt + wakeEnd };
		}
		cursor = wakeEnd;
		const sleepEnd = cursor + sleepMs;
		if (elapsed < sleepEnd) {
			return { kind: 'hour-sleep', hour, cueId: 'sleep', endsAt: startedAt + sleepEnd };
		}
		cursor = sleepEnd;
	}

	const outroEnd = cursor + timing.outroMs;
	if (elapsed < outroEnd) {
		return { kind: 'outro', cueId: 'night-end', endsAt: startedAt + outroEnd };
	}

	return { kind: 'done', cueId: 'done', endsAt: startedAt + outroEnd };
}

export function nightEndsAt(startedAt: number, timing: NightTiming): number {
	return startedAt + timing.introMs + CHEESE_HOURS.length * timing.hourMs + timing.outroMs;
}
