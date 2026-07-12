/* ════════════════════════════════════════════════════════════════════════
   Backfill Reliability Metrics for Existing Sessions
   
   Run: npx tsx scripts/backfillReliability.ts
   
   Computes longstring_max, irv, person_total_r, avg_item_time, and
   reliability_flag for all sessions that don't have them yet.
   ════════════════════════════════════════════════════════════════════════ */

import { pgPool } from '@/lib/pgPool';

async function backfill() {
	console.log('📊 Backfilling reliability metrics...');

	// 1. Compute mean response pattern from valid sessions
	const { rows: meanRows } = await pgPool.query<{ key: string; avg_value: string }>(
		`SELECT test_type || '_fo' || form_order AS key, AVG(value)::numeric(5,3) AS avg_value
		 FROM personality_test_responses resp
		 JOIN personality_test_sessions s ON s.id = resp.session_id
		 JOIN personality_test_results r ON r.session_id = s.id
		 WHERE r.is_valid = true
		 GROUP BY test_type, form_order
		 ORDER BY test_type, form_order`
	);
	const meanMap = new Map<string, number>();
	for (const r of meanRows) meanMap.set(r.key, Number(r.avg_value));
	console.log(`  Mean pattern: ${meanMap.size} items`);

	// 2. Get all sessions that need backfilling
	const { rows: sessions } = await pgPool.query<{ id: string; duration_seconds: number | null }>(
		`SELECT s.id, s.duration_seconds
		 FROM personality_test_sessions s
		 JOIN personality_test_results r ON r.session_id = s.id
		 WHERE r.reliability_flag IS NULL
		 ORDER BY s.created_at`
	);
	console.log(`  Sessions to backfill: ${sessions.length}`);

	let updated = 0;
	for (const sess of sessions) {
		const { rows: respRows } = await pgPool.query<{
			test_type: string;
			form_order: number;
			value: number;
		}>(
			`SELECT test_type, form_order, value
			 FROM personality_test_responses
			 WHERE session_id = $1
			 ORDER BY test_type, form_order`,
			[sess.id]
		);
		if (respRows.length === 0) continue;

		const values = respRows.map((r) => r.value);
		const dur = sess.duration_seconds ?? 0;
		const n = values.length;

		// Longstring
		let maxRun = 1,
			curRun = 1;
		for (let i = 1; i < n; i++) {
			if (values[i] === values[i - 1]) {
				curRun++;
				maxRun = Math.max(maxRun, curRun);
			} else {
				curRun = 1;
			}
		}

		// IRV (sample SD)
		const mean = values.reduce((s, v) => s + v, 0) / n;
		const variance =
			n > 1
				? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1)
				: 0;
		const irv = Math.sqrt(variance);

		// Avg item time
		const avgItemTime = n > 0 ? dur / n : 0;

		// Person-total correlation
		const meanPattern = respRows.map(
			(r) => meanMap.get(`${r.test_type}_fo${r.form_order}`) ?? 3
		);
		let personR: number | null = null;
		if (meanPattern.length === n && n >= 3) {
			const mx = values.reduce((s, v) => s + v, 0) / n;
			const my = meanPattern.reduce((s, v) => s + v, 0) / n;
			let sXY = 0,
				sX2 = 0,
				sY2 = 0;
			for (let i = 0; i < n; i++) {
				const dx = values[i] - mx;
				const dy = meanPattern[i] - my;
				sXY += dx * dy;
				sX2 += dx * dx;
				sY2 += dy * dy;
			}
			const denom = Math.sqrt(sX2 * sY2);
			personR = denom === 0 ? 0 : sXY / denom;
		}

		// Flag
		let severity = 0;
		if (maxRun >= 14) severity = 2;
		else if (maxRun >= 8) severity = 1;
		if (irv < 0.3) severity = Math.max(severity, 2);
		else if (irv < 0.5) severity = Math.max(severity, 1);
		if (avgItemTime > 0 && avgItemTime < 1.0) severity = Math.max(severity, 2);
		else if (avgItemTime > 0 && avgItemTime < 2.0) severity = Math.max(severity, 1);
		if (personR !== null) {
			if (personR < -0.2) severity = Math.max(severity, 2);
			else if (personR < 0) severity = Math.max(severity, 1);
		}
		const flag =
			severity >= 2 ? 'careless' : severity >= 1 ? 'suspect' : 'ok';

		await pgPool.query(
			`UPDATE personality_test_results SET
				longstring_max = $2, irv = $3, person_total_r = $4,
				avg_item_time = $5, reliability_flag = $6
			 WHERE session_id = $1`,
			[
				sess.id,
				maxRun,
				irv.toFixed(3),
				personR !== null ? personR.toFixed(3) : null,
				avgItemTime.toFixed(2),
				flag,
			]
		);
		updated++;
	}

	// 3. Print distribution
	const { rows: stats } = await pgPool.query<{
		reliability_flag: string;
		cnt: string;
	}>(
		`SELECT reliability_flag, COUNT(*)::int AS cnt
		 FROM personality_test_results
		 WHERE reliability_flag IS NOT NULL
		 GROUP BY reliability_flag
		 ORDER BY cnt DESC`
	);
	console.log(`\n✅ Backfilled ${updated} sessions`);
	console.log('  Reliability distribution:');
	for (const r of stats) {
		const emoji =
			r.reliability_flag === 'ok'
				? '✓'
				: r.reliability_flag === 'suspect'
					? '⚠'
					: '✗';
		console.log(`    ${emoji} ${r.reliability_flag}: ${r.cnt}`);
	}

	await pgPool.end();
}

backfill().catch((err) => {
	console.error('❌ Backfill failed:', err);
	process.exit(1);
});
