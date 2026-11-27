import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	DESKTOP_CONSTELLATION,
	MOBILE_CONSTELLATION,
	parseAtmosphereParam,
	resolveTimeAtmosphere,
	runAtmosphereViewTransition,
} from './coverAtmosphere';

describe('coverAtmosphere helpers', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('resolves warm Dawn during daytime hours (06:00–17:59) and Night after dusk', () => {
		expect(resolveTimeAtmosphere(new Date(2026, 10, 27, 6, 0))).toBe('dawn');
		expect(resolveTimeAtmosphere(new Date(2026, 10, 27, 12, 30))).toBe('dawn');
		expect(resolveTimeAtmosphere(new Date(2026, 10, 27, 17, 59))).toBe('dawn');
		expect(resolveTimeAtmosphere(new Date(2026, 10, 27, 18, 0))).toBe('night');
		expect(resolveTimeAtmosphere(new Date(2026, 10, 27, 23, 45))).toBe('night');
		expect(resolveTimeAtmosphere(new Date(2026, 10, 27, 0, 15))).toBe('night');
		expect(resolveTimeAtmosphere(new Date(2026, 10, 27, 5, 59))).toBe('night');
	});

	it('parses only valid atmosphere overrides', () => {
		expect(parseAtmosphereParam('dawn')).toBe('dawn');
		expect(parseAtmosphereParam('night')).toBe('night');
		expect(parseAtmosphereParam('dark')).toBeNull();
		expect(parseAtmosphereParam(null)).toBeNull();
		expect(parseAtmosphereParam(undefined)).toBeNull();
	});

	it('keeps constellation coordinates inside normalized 0..1000 artwork bounds', () => {
		for (const pt of [...DESKTOP_CONSTELLATION, ...MOBILE_CONSTELLATION]) {
			expect(pt.x).toBeGreaterThanOrEqual(0);
			expect(pt.x).toBeLessThanOrEqual(1000);
			expect(pt.y).toBeGreaterThanOrEqual(0);
			expect(pt.y).toBeLessThanOrEqual(1000);
		}
	});

	it('cancels an in-flight View Transition cleanly on rapid toggles without stale cleanup', async () => {
		const classSet = new Set<string>();
		const styleProps = new Map<string, string>();
		const skipFirst = vi.fn();
		let resolveFirst!: () => void;
		let resolveSecond!: () => void;
		const firstFinished = new Promise<void>((r) => {
			resolveFirst = r;
		});
		const secondFinished = new Promise<void>((r) => {
			resolveSecond = r;
		});

		let callCount = 0;
		vi.stubGlobal('window', { innerWidth: 1440, innerHeight: 900 });
		vi.stubGlobal('document', {
			documentElement: {
				classList: {
					add: (c: string) => classSet.add(c),
					remove: (c: string) => classSet.delete(c),
				},
				style: {
					setProperty: (k: string, v: string) => styleProps.set(k, v),
				},
			},
			startViewTransition: (cb: () => void) => {
				callCount += 1;
				cb();
				return callCount === 1
					? { finished: firstFinished, skipTransition: skipFirst }
					: { finished: secondFinished, skipTransition: vi.fn() };
			},
		});

		const finishFirst = vi.fn();
		const finishSecond = vi.fn();
		const commit = vi.fn();

		runAtmosphereViewTransition({
			clientX: 400,
			clientY: 300,
			reduced: false,
			commit,
			onFinish: finishFirst,
		});
		expect(classSet.has('cover-blooming')).toBe(true);

		runAtmosphereViewTransition({
			clientX: 420,
			clientY: 310,
			reduced: false,
			commit,
			onFinish: finishSecond,
		});
		expect(skipFirst).toHaveBeenCalledTimes(1);
		expect(commit).toHaveBeenCalledTimes(2);

		resolveFirst();
		await Promise.resolve();
		await Promise.resolve();
		// Stale first transition must NOT strip cover-blooming while second is still running
		expect(classSet.has('cover-blooming')).toBe(true);
		expect(finishFirst).not.toHaveBeenCalled();

		resolveSecond();
		await Promise.resolve();
		await Promise.resolve();
		expect(classSet.has('cover-blooming')).toBe(false);
		expect(finishSecond).toHaveBeenCalledTimes(1);
	});
});
