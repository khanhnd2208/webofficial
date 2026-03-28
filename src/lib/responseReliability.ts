/* ════════════════════════════════════════════════════════════════════════
   Response Reliability — Expert-level data quality metrics

   Computes psychometric quality indicators to detect careless,
   inattentive, or dishonest responding (Meade & Craig, 2012;
   Curran, 2016; Huang et al., 2012).

   Metrics:
   1. Longstring Max — longest run of identical consecutive answers
      (Meade & Craig, 2012: longstring ≥ 10 is suspect)
   2. IRV — Intra-individual Response Variability (SD of all responses)
      (Dunn et al., 2018: very low IRV indicates straight-lining)
   3. Person-Total Correlation — Pearson r between individual's
      response vector and sample mean response vector
      (Curran, 2016: low person-total r indicates random responding)
   4. Average Item Time — total duration / number of items
      (Huang et al., 2012: < 2s/item indicates inattentive responding)

   References:
   - Curran, P.G. (2016). Methods for the detection of carelessly
     invalid responses in survey data. J Exp Social Psych, 66, 4–19.
   - Meade, A.W. & Craig, S.B. (2012). Identifying careless responses
     in survey data. Psychological Methods, 17(3), 437–455.
   - Huang, J.L. et al. (2012). Detecting and deterring insufficient
     effort responding to surveys. J Business & Psychology, 27(1), 99–114.
   ════════════════════════════════════════════════════════════════════════ */

export interface ReliabilityMetrics {
	/** Maximum consecutive identical responses */
	longstringMax: number;
	/** Intra-individual response variability (SD of all responses) */
	irv: number;
	/** Average seconds per item */
	avgItemTime: number;
	/** Person-total correlation (Pearson r) — null if no mean pattern provided */
	personTotalR: number | null;
	/** Summary flag: 'ok' | 'suspect' | 'careless' */
	reliabilityFlag: 'ok' | 'suspect' | 'careless';
	/** Detailed reasons for flag */
	flagReasons: string[];
}

// ─── Thresholds (based on literature) ───────────────────────────────────────

/** Longstring ≥ this → suspect (Meade & Craig, 2012) */
const LONGSTRING_SUSPECT = 8;
/** Longstring ≥ this → careless */
const LONGSTRING_CARELESS = 14;

/** IRV < this → suspect (very low variability = straight-lining) */
const IRV_SUSPECT = 0.5;
/** IRV < this → careless */
const IRV_CARELESS = 0.3;

/** Average seconds/item < this → suspect (Huang et al., 2012) */
const ITEM_TIME_SUSPECT = 2.0;
/** Average seconds/item < this → careless */
const ITEM_TIME_CARELESS = 1.0;

/** Person-total r < this → suspect (Curran, 2016) */
const PERSON_TOTAL_R_SUSPECT = 0.0;
/** Person-total r < this → careless */
const PERSON_TOTAL_R_CARELESS = -0.2;

// ─── Core computation ───────────────────────────────────────────────────────

/**
 * Compute response reliability metrics from raw response values.
 *
 * @param values        - Array of Likert responses (1-5) in form order
 * @param durationSec   - Total test duration in seconds
 * @param meanPattern   - Optional: mean response vector from the sample (same order)
 *                        for computing person-total correlation
 */
export function computeReliabilityMetrics(
	values: number[],
	durationSec: number,
	meanPattern?: number[]
): ReliabilityMetrics {
	const n = values.length;
	if (n === 0) {
		return {
			longstringMax: 0,
			irv: 0,
			avgItemTime: 0,
			personTotalR: null,
			reliabilityFlag: 'careless',
			flagReasons: ['No responses'],
		};
	}

	// 1. Longstring — max consecutive identical answers
	const longstringMax = computeLongstring(values);

	// 2. IRV — standard deviation of all responses
	const irv = computeSD(values);

	// 3. Average item time
	const avgItemTime = n > 0 ? durationSec / n : 0;

	// 4. Person-total correlation (if mean pattern available)
	let personTotalR: number | null = null;
	if (meanPattern && meanPattern.length === n) {
		personTotalR = pearsonR(values, meanPattern);
	}

	// 5. Determine flag
	const flagReasons: string[] = [];
	let severity = 0; // 0=ok, 1=suspect, 2=careless

	if (longstringMax >= LONGSTRING_CARELESS) {
		flagReasons.push(`Longstring=${longstringMax} (≥${LONGSTRING_CARELESS})`);
		severity = Math.max(severity, 2);
	} else if (longstringMax >= LONGSTRING_SUSPECT) {
		flagReasons.push(`Longstring=${longstringMax} (≥${LONGSTRING_SUSPECT})`);
		severity = Math.max(severity, 1);
	}

	if (irv < IRV_CARELESS) {
		flagReasons.push(`IRV=${irv.toFixed(3)} (<${IRV_CARELESS})`);
		severity = Math.max(severity, 2);
	} else if (irv < IRV_SUSPECT) {
		flagReasons.push(`IRV=${irv.toFixed(3)} (<${IRV_SUSPECT})`);
		severity = Math.max(severity, 1);
	}

	if (avgItemTime < ITEM_TIME_CARELESS) {
		flagReasons.push(`AvgTime=${avgItemTime.toFixed(1)}s (<${ITEM_TIME_CARELESS}s)`);
		severity = Math.max(severity, 2);
	} else if (avgItemTime < ITEM_TIME_SUSPECT) {
		flagReasons.push(`AvgTime=${avgItemTime.toFixed(1)}s (<${ITEM_TIME_SUSPECT}s)`);
		severity = Math.max(severity, 1);
	}

	if (personTotalR !== null) {
		if (personTotalR < PERSON_TOTAL_R_CARELESS) {
			flagReasons.push(`PersonR=${personTotalR.toFixed(3)} (<${PERSON_TOTAL_R_CARELESS})`);
			severity = Math.max(severity, 2);
		} else if (personTotalR < PERSON_TOTAL_R_SUSPECT) {
			flagReasons.push(`PersonR=${personTotalR.toFixed(3)} (<${PERSON_TOTAL_R_SUSPECT})`);
			severity = Math.max(severity, 1);
		}
	}

	const reliabilityFlag: ReliabilityMetrics['reliabilityFlag'] =
		severity >= 2 ? 'careless' : severity >= 1 ? 'suspect' : 'ok';

	return { longstringMax, irv, avgItemTime, personTotalR, reliabilityFlag, flagReasons };
}

// ─── Statistical helpers ────────────────────────────────────────────────────

/** Longest run of consecutive identical values */
function computeLongstring(values: number[]): number {
	if (values.length === 0) return 0;
	let maxRun = 1;
	let currentRun = 1;
	for (let i = 1; i < values.length; i++) {
		if (values[i] === values[i - 1]) {
			currentRun++;
			maxRun = Math.max(maxRun, currentRun);
		} else {
			currentRun = 1;
		}
	}
	return maxRun;
}

/** Sample standard deviation */
function computeSD(values: number[]): number {
	const n = values.length;
	if (n < 2) return 0;
	const mean = values.reduce((s, v) => s + v, 0) / n;
	const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
	return Math.sqrt(variance);
}

/** Pearson correlation coefficient */
function pearsonR(x: number[], y: number[]): number {
	const n = x.length;
	if (n < 3) return 0;
	const mx = x.reduce((s, v) => s + v, 0) / n;
	const my = y.reduce((s, v) => s + v, 0) / n;
	let sumXY = 0, sumX2 = 0, sumY2 = 0;
	for (let i = 0; i < n; i++) {
		const dx = x[i] - mx;
		const dy = y[i] - my;
		sumXY += dx * dy;
		sumX2 += dx * dx;
		sumY2 += dy * dy;
	}
	const denom = Math.sqrt(sumX2 * sumY2);
	return denom === 0 ? 0 : sumXY / denom;
}

/**
 * Compute the mean response pattern from multiple sessions' values.
 * Used as the reference vector for person-total correlation.
 *
 * @param allSessionValues - Array of value arrays, all same length & same item order
 * @returns mean value for each item position
 */
export function computeMeanPattern(allSessionValues: number[][]): number[] {
	if (allSessionValues.length === 0) return [];
	const n = allSessionValues[0].length;
	const sums = new Array(n).fill(0);
	const counts = new Array(n).fill(0);
	for (const values of allSessionValues) {
		for (let i = 0; i < Math.min(values.length, n); i++) {
			if (values[i] != null && !isNaN(values[i])) {
				sums[i] += values[i];
				counts[i]++;
			}
		}
	}
	return sums.map((s, i) => counts[i] > 0 ? s / counts[i] : 3); // default to midpoint
}
