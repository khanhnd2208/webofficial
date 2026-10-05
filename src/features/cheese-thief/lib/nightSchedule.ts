import { CHEESE_HOURS, CHEESE_SLEEP_MAX_MS } from '@/features/cheese-thief/config/cheeseThief';

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

	const sleepMs = Math.min(CHEESE_SLEEP_MAX_MS, Math.floor(timing.hourMs / 2));
	const wakeMs = timing.hourMs - sleepMs;

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

/** Recorded narration, one file per line. `wake-N` bakes the hour into the clip. */
export const CHEESE_VOICE_CLIPS = [
	'night-start',
	'wake-1',
	'wake-2',
	'wake-3',
	'wake-4',
	'wake-5',
	'wake-6',
	'sleep',
	'night-end',
] as const;

export type VoiceClip = (typeof CHEESE_VOICE_CLIPS)[number];

export interface NightCue {
	atMs: number;
	clip: VoiceClip;
}

/** Every line of one night, in order, with its offset from the night start. Feeds the recorded night track. */
export function nightCues(timing: NightTiming): NightCue[] {
	const cues: NightCue[] = [];
	let at = 0;
	for (;;) {
		const segment = segmentAt(0, at, timing);
		if (segment.kind === 'done') return cues;
		const key = narrationKey(segment);
		const clip = (segment.kind === 'hour-wake' ? `wake-${segment.hour}` : key) as VoiceClip;
		cues.push({ atMs: at, clip });
		at = segment.endsAt;
	}
}

/** How long the preview keeps playing after it calls the next hour. */
export const ROUND_PREVIEW_TAIL_MS = 4_500;

/**
 * One round as the table will hear it: "1 o'clock" to "2 o'clock", so the host
 * can hear the length they picked before the night.
 */
export function roundPreviewCues(timing: NightTiming): { cues: NightCue[]; seconds: number } {
	const from = timing.introMs;
	const to = timing.introMs + timing.hourMs;
	const cues = nightCues(timing)
		.filter((cue) => cue.atMs >= from && cue.atMs <= to)
		.map((cue) => ({ ...cue, atMs: cue.atMs - from }));
	return { cues, seconds: (timing.hourMs + ROUND_PREVIEW_TAIL_MS) / 1000 };
}

/** Which spoken line this slice of the night is. */
export function narrationKey(segment: NightSegment): string {
	return segment.cueId;
}
