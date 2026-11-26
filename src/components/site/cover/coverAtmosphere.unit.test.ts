import { describe, expect, it } from 'vitest';

import {
	DESKTOP_CONSTELLATION,
	MOBILE_CONSTELLATION,
	parseAtmosphereParam,
	resolveTimeAtmosphere,
} from './coverAtmosphere';

describe('coverAtmosphere helpers', () => {
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
});
