/**
 * Renders the Cheese Thief night narration to audio clips with macOS system voices.
 * Run on a Mac (with ffmpeg) after changing any `cheese.narrator.*` line:
 *   npx tsx scripts/generate-cheese-voice.ts
 *
 * Apple's system voices are licensed for personal, non-commercial use — fine for this site's
 * free party game, not for anything sold.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
	CHEESE_HOUR_SECONDS_MIN,
	CHEESE_INTRO_MS,
	CHEESE_OUTRO_MS,
	CHEESE_SLEEP_MAX_MS,
} from '../src/features/cheese-thief/config/cheeseThief';
import { LINE_LEAD_S, cueKind } from '../src/features/cheese-thief/lib/nightMix';
import { CHEESE_VOICE_CLIPS, type VoiceClip } from '../src/features/cheese-thief/lib/nightSchedule';
import { cheeseEn, cheeseVi } from '../src/features/spy-fall/lib/i18n/messages/cheeseThief';
import type { MessageTree } from '../src/features/spy-fall/lib/i18n/types';

/** Slower than the default rate, with breaths at punctuation, so the lines sound told rather than read. */
const VOICES = {
	vi: { voice: 'Linh', rate: 160, messages: cheeseVi },
	en: { voice: 'Samantha', rate: 165, messages: cheeseEn },
} as const;

/** Trim the edges, warm the low mids, soften the hiss, a small room, then level every clip alike. */
const WARM = [
	'silenceremove=start_periods=1:start_threshold=-45dB',
	'areverse',
	'silenceremove=start_periods=1:start_threshold=-45dB',
	'areverse',
	'highpass=f=90',
	'equalizer=f=220:t=q:w=1.2:g=2.5',
	'equalizer=f=4200:t=q:w=1.5:g=-2.5',
	'lowpass=f=9500',
	'aecho=0.85:0.6:35|60:0.10|0.06',
	'loudnorm=I=-17:TP=-2:LRA=7',
].join(',');

/** Seconds a clip may last before it runs into the next cue at the shortest allowed hour. */
function budgetFor(clip: VoiceClip): number {
	const minHourMs = CHEESE_HOUR_SECONDS_MIN * 1000;
	const sleepMs = Math.min(CHEESE_SLEEP_MAX_MS, Math.floor(minHourMs / 2));
	const kind = cueKind(clip);
	const windowS = {
		intro: CHEESE_INTRO_MS / 1000,
		wake: (minHourMs - sleepMs) / 1000,
		sleep: sleepMs / 1000,
		outro: CHEESE_OUTRO_MS / 1000,
		single: Number.POSITIVE_INFINITY,
	}[kind];
	return windowS - LINE_LEAD_S[kind] - 0.15;
}

function narratorLine(messages: MessageTree, clip: string): string {
	const narrator = messages.narrator as Record<string, string>;
	const wake = /^wake-(\d)$/.exec(clip);
	const template = narrator[wake ? 'wake' : clip];
	if (!template) throw new Error(`No narrator line for ${clip}`);
	return template.replaceAll('{hour}', wake?.[1] ?? '');
}

function withBreaths(text: string): string {
	return text.replace(/([.!?]) /g, '$1 [[slnc 280]] ').replace(/, /g, ', [[slnc 90]] ');
}

function secondsOf(file: string): number {
	return Number(
		execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim(),
	);
}

const OUT_DIR = path.join(process.cwd(), 'public/board-game/cheese-thief/voice');
const scratch = mkdtempSync(path.join(tmpdir(), 'cheese-voice-'));
const tooLong: string[] = [];
try {
	for (const [locale, { voice, rate, messages }] of Object.entries(VOICES)) {
		const dir = path.join(OUT_DIR, locale);
		mkdirSync(dir, { recursive: true });
		for (const clip of CHEESE_VOICE_CLIPS) {
			const text = narratorLine(messages, clip);
			const aiff = path.join(scratch, `${locale}-${clip}.aiff`);
			const out = path.join(dir, `${clip}.m4a`);
			execFileSync('say', ['-v', voice, '-r', String(rate), '-o', aiff, withBreaths(text)]);
			execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', aiff, '-af', WARM, '-ar', '44100', '-ac', '1', '-c:a', 'aac', '-b:a', '64k', out]);
			const seconds = secondsOf(out);
			const budget = budgetFor(clip);
			const flag = seconds > budget ? `  ← longer than ${budget.toFixed(2)}s` : '';
			if (flag) tooLong.push(`${locale}/${clip}`);
			console.log(`${locale}/${clip}.m4a  ${seconds.toFixed(2)}s  ${text}${flag}`);
		}
	}
} finally {
	rmSync(scratch, { recursive: true, force: true });
}

if (tooLong.length > 0) {
	console.error(`\nShorten these lines, or they will run into the next cue: ${tooLong.join(', ')}`);
	process.exit(1);
}
