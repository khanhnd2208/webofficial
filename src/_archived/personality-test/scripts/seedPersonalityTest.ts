/**
 * Seed script: Insert 50 synthetic personality test sessions with realistic data.
 *
 * Run (local):
 *   DATABASE_URL='postgresql://khanhwebsite:KhanhPro1234*@localhost:5432/khanhwebsite' \
 *   npx tsx scripts/seedPersonalityTest.ts
 *
 * Run (VPS — from /var/www/webofficial):
 *   DATABASE_URL='postgresql://khanhwebsite:KhanhPro1234%2A@localhost:5432/khanhwebsite' \
 *   npx tsx scripts/seedPersonalityTest.ts
 *
 * Notes:
 *   - Attention checks are always answered correctly (BFI item 25 → 1, SD3 item 17 → 2)
 *   - Responses are generated from predefined personality "profiles" to produce
 *     varied and realistic OCEAN / Dark Triad score distributions
 *   - 48 sessions are "completed" (valid), 2 are "invalid" (wrong attention check
 *     or too fast) to test the filter UI
 */

import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { BFI2S_QUESTIONS, SD3_QUESTIONS, scorePersonalityTest } from '../src/lib/personalityScoring';
import type { RawResponse } from '../src/types/personalityTest';

// ─── DB Pool ──────────────────────────────────────────────────────────────────

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

// ─── Persona Archetypes (drives realistic response patterns) ──────────────────

/**
 * A "persona" encodes the target Likert bias for each domain.
 * high   → tends to agree with +items, disagree with R-items  (score ~4.0-4.8)
 * medium → moderate responses                                   (score ~2.8-3.4)
 * low    → tends to disagree with +items, agree with R-items   (score ~1.4-2.2)
 */
type Level = 'high' | 'medium' | 'low';
interface Persona {
  label: string;
  ocean: { E: Level; A: Level; C: Level; N: Level; O: Level };
  dt:    { M: Level; Narc: Level; P: Level };
}

const PERSONAS: Persona[] = [
  // 1. The Flourisher — high on all good traits, low dark triad
  { label: 'Flourisher', ocean: { E:'high',   A:'high',   C:'high',   N:'low',    O:'high'   }, dt: { M:'low',    Narc:'low',    P:'low'    }},
  // 2. The Introvert Scholar
  { label: 'Scholar',    ocean: { E:'low',    A:'high',   C:'high',   N:'medium', O:'high'   }, dt: { M:'low',    Narc:'low',    P:'low'    }},
  // 3. The Anxious Achiever
  { label: 'Anxious',    ocean: { E:'medium', A:'medium', C:'high',   N:'high',   O:'medium' }, dt: { M:'medium', Narc:'low',    P:'low'    }},
  // 4. The Adventurer
  { label: 'Adventurer', ocean: { E:'high',   A:'medium', C:'low',    N:'low',    O:'high'   }, dt: { M:'low',    Narc:'medium', P:'medium' }},
  // 5. The Dark Leader (high Mach + Narc)
  { label: 'DarkLeader', ocean: { E:'high',   A:'low',    C:'high',   N:'low',    O:'medium' }, dt: { M:'high',   Narc:'high',   P:'medium' }},
  // 6. The Neurotic Introvert
  { label: 'Neurotic',   ocean: { E:'low',    A:'low',    C:'low',    N:'high',   O:'medium' }, dt: { M:'medium', Narc:'low',    P:'medium' }},
  // 7. The Pragmatist
  { label: 'Pragmatist', ocean: { E:'medium', A:'medium', C:'medium', N:'medium', O:'medium' }, dt: { M:'medium', Narc:'medium', P:'medium' }},
  // 8. The Charismatic Leader
  { label: 'Charismatic',ocean: { E:'high',   A:'high',   C:'high',   N:'low',    O:'medium' }, dt: { M:'low',    Narc:'high',   P:'low'    }},
  // 9. The Rebel
  { label: 'Rebel',      ocean: { E:'medium', A:'low',    C:'low',    N:'medium', O:'high'   }, dt: { M:'high',   Narc:'medium', P:'high'   }},
  // 10. The Empath
  { label: 'Empath',     ocean: { E:'medium', A:'high',   C:'medium', N:'high',   O:'high'   }, dt: { M:'low',    Narc:'low',    P:'low'    }},
];

// ─── Vietnamese Names ─────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ',
  'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Mai',
];
const MIDDLE_NAMES_MALE = ['Văn', 'Hữu', 'Đức', 'Minh', 'Quốc', 'Tuấn', 'Anh', 'Quang'];
const MIDDLE_NAMES_FEMALE = ['Thị', 'Thùy', 'Ngọc', 'Thảo', 'Bích', 'Thanh', 'Hương', 'Lan'];
const GIVEN_NAMES_MALE = [
  'Hùng', 'Dũng', 'Khánh', 'Long', 'Nam', 'Hải', 'Tú', 'Bảo', 'Khoa', 'Đạt',
  'Phúc', 'Thịnh', 'Hưng', 'Khải', 'Việt', 'Trung', 'Sơn', 'Hiếu', 'Lâm', 'Tài',
  'An', 'Tâm', 'Duy', 'Toàn', 'Linh',
];
const GIVEN_NAMES_FEMALE = [
  'Linh', 'Trang', 'Ngọc', 'Hà', 'Mai', 'Thu', 'Hương', 'Anh', 'Thảo', 'Nga',
  'Yến', 'Vy', 'Phương', 'Hồng', 'Thanh', 'Lan', 'Tiên', 'Trúc', 'Nhi', 'Diễm',
  'Như', 'Quỳnh', 'Châu', 'Bích', 'Ánh',
];

const UNIVERSITIES = [
  'Đại học Kinh tế TP.HCM (UEH)',
  'Đại học Kinh tế Quốc dân (NEU)',
  'Đại học Ngoại thương (FTU)',
  'Đại học Bách khoa Hà Nội (HUST)',
  'Đại học Quốc gia Hà Nội (VNU)',
  'Đại học Quốc gia TP.HCM (VNUHCM)',
  'Đại học Đà Nẵng',
  'Đại học Huế',
  'Đại học Cần Thơ',
  'Đại học Sư phạm TP.HCM',
  'Học viện Tài chính',
  'Đại học Thương mại',
  'Đại học Tôn Đức Thắng',
  'Đại học Văn Lang',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function generateName(isFemale: boolean, rand: () => number): string {
  const surname = pick(FIRST_NAMES, rand);
  const middle = isFemale ? pick(MIDDLE_NAMES_FEMALE, rand) : pick(MIDDLE_NAMES_MALE, rand);
  const given  = isFemale ? pick(GIVEN_NAMES_FEMALE, rand) : pick(GIVEN_NAMES_MALE, rand);
  return `${surname} ${middle} ${given}`;
}

/** Generate a username from name: lowercase + numbers */
function generateUsername(name: string, idx: number): string {
  const parts = name.split(' ');
  const given = parts[parts.length - 1]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase();
  return `${given}${1000 + idx}`;
}

/** Map Level → expected raw Likert answer for a normal (non-reversed) item */
function levelToLikert(level: Level, rand: () => number): number {
  // center value ± small noise
  const centers: Record<Level, number> = { high: 4.2, medium: 3.0, low: 1.8 };
  const noise = (rand() - 0.5) * 1.4;  // ±0.7
  return clamp(Math.round(centers[level] + noise), 1, 5);
}

/**
 * Generate all 30 BFI-2-S responses with realistic answers.
 * For reversed items: a "high" trait level means the person should disagree (low value).
 */
function generateBFIResponses(persona: Persona, rand: () => number): RawResponse[] {
  const domainMap: Record<string, Level> = {
    extraversion:         persona.ocean.E,
    agreeableness:        persona.ocean.A,
    conscientiousness:    persona.ocean.C,
    negativeEmotionality: persona.ocean.N,
    openMindedness:       persona.ocean.O,
  };

  return BFI2S_QUESTIONS.map((q) => {
    let value: number;

    if (q.isAttentionCheck) {
      value = q.attentionCheckExpected!;  // always pass attention check
    } else {
      const level = domainMap[q.domain];
      const rawAnswer = levelToLikert(level, rand);
      // Reversed items: high trait → low raw answer
      value = q.isReversed ? (6 - rawAnswer) : rawAnswer;
      value = clamp(value, 1, 5);
    }

    return { testType: 'BFI2S' as const, itemNumber: q.itemNumber, value };
  });
}

/**
 * Generate all 27 SD3 responses.
 * Machiavellianism & Narcissism & Psychopathy items are mostly non-reversed
 * (high dark triad → high raw score), except noted reversed items.
 */
function generateSD3Responses(persona: Persona, rand: () => number): RawResponse[] {
  const domainMap: Record<string, Level> = {
    machiavellianism: persona.dt.M,
    narcissism:       persona.dt.Narc,
    psychopathy:      persona.dt.P,
  };

  return SD3_QUESTIONS.map((q) => {
    let value: number;

    if (q.isAttentionCheck) {
      value = q.attentionCheckExpected!;  // always 2
    } else {
      const level = domainMap[q.domain];
      const rawAnswer = levelToLikert(level, rand);
      value = q.isReversed ? (6 - rawAnswer) : rawAnswer;
      value = clamp(value, 1, 5);
    }

    return { testType: 'SD3' as const, itemNumber: q.itemNumber, value };
  });
}

// ─── getFormOrder helper (mirrors model logic) ────────────────────────────────

function getFormOrder(testType: string, itemNumber: number): number {
  const all = [...BFI2S_QUESTIONS, ...SD3_QUESTIONS];
  return all.find(q => q.testType === testType && q.itemNumber === itemNumber)?.formOrder ?? 0;
}

// ─── Insert one session ───────────────────────────────────────────────────────

async function insertSession(params: {
  userId: string;
  userName: string;
  fullName: string;
  university: string;
  studentYear: number;
  cumulativeGpa: number;
  selfRatedIntelligence: number;
  responses: RawResponse[];
  durationSeconds: number;
  status: 'completed' | 'invalid';
  failAttentionCheck?: boolean;  // if true, corrupt one attention check answer
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [{ id: sessionId }] } = await client.query<{ id: string }>(
      `INSERT INTO personality_test_sessions
         (user_id, user_name, full_name, university, student_year, cumulative_gpa,
          self_rated_intelligence, status, duration_seconds, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [
        params.userId,
        params.userName,
        params.fullName,
        params.university,
        params.studentYear,
        params.cumulativeGpa,
        params.selfRatedIntelligence,
        params.status,
        params.durationSeconds,
        new Date(),
      ]
    );

    // Optionally corrupt attention check to make session invalid
    let responses = params.responses;
    if (params.failAttentionCheck) {
      responses = responses.map(r => {
        if (r.testType === 'BFI2S' && r.itemNumber === 25) return { ...r, value: 4 };
        return r;
      });
    }

    // Batch-insert responses
    const values: unknown[] = [];
    const placeholders: string[] = [];
    let idx = 1;
    for (const r of responses) {
      const formOrder = getFormOrder(r.testType, r.itemNumber);
      placeholders.push(`($${idx},$${idx+1},$${idx+2},$${idx+3},$${idx+4})`);
      values.push(sessionId, r.testType, r.itemNumber, formOrder, r.value);
      idx += 5;
    }
    await client.query(
      `INSERT INTO personality_test_responses (session_id, test_type, item_number, form_order, value)
       VALUES ${placeholders.join(', ')}`,
      values
    );

    await client.query('COMMIT');

    // Score and insert result
    const scoringResult = scorePersonalityTest(responses);
    await client.query(
      `INSERT INTO personality_test_results
         (session_id, is_valid, invalid_reason,
          extraversion, agreeableness, conscientiousness, negative_emotionality, open_mindedness,
          machiavellianism, narcissism, psychopathy, archetype)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        sessionId,
        scoringResult.isValid,
        scoringResult.invalidReason ?? null,
        scoringResult.ocean?.extraversion.score ?? null,
        scoringResult.ocean?.agreeableness.score ?? null,
        scoringResult.ocean?.conscientiousness.score ?? null,
        scoringResult.ocean?.negativeEmotionality.score ?? null,
        scoringResult.ocean?.openMindedness.score ?? null,
        scoringResult.darkTriad?.machiavellianism.score ?? null,
        scoringResult.darkTriad?.narcissism.score ?? null,
        scoringResult.darkTriad?.psychopathy.score ?? null,
        scoringResult.archetype ? JSON.stringify(scoringResult.archetype) : null,
      ]
    );

    return sessionId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Seeding 50 personality test sessions...\n');

  const TOTAL = 50;
  let success = 0;
  let failed = 0;

  for (let i = 0; i < TOTAL; i++) {
    const rand = rng(i * 7919 + 42);  // deterministic seed per user

    // Persona: rotate through 10 personas, 5 users each
    const persona = PERSONAS[i % PERSONAS.length];

    // Demographics
    const isFemale = rand() > 0.45;
    const fullName  = generateName(isFemale, rand);
    const userName  = generateUsername(fullName, i + 1);
    const userId    = randomUUID();
    const university = pick(UNIVERSITIES, rand);
    const studentYear = clamp(Math.round(rand() * 4) + 1, 1, 5);
    const cumulativeGpa = parseFloat((2.0 + rand() * 2.0).toFixed(2));  // 2.0–4.0
    const selfRatedIntelligence = clamp(Math.round(5 + rand() * 4), 5, 9);  // 5–9
    const durationSeconds = Math.round(480 + rand() * 900);  // 8–23 min

    // Last 2 sessions are invalid (wrong attention check)
    const failAttentionCheck = i >= TOTAL - 2;
    const status = failAttentionCheck ? 'invalid' : 'completed';

    const bfiResponses = generateBFIResponses(persona, rand);
    const sd3Responses = generateSD3Responses(persona, rand);
    const responses = [...bfiResponses, ...sd3Responses];

    try {
      const sessionId = await insertSession({
        userId, userName, fullName, university, studentYear,
        cumulativeGpa, selfRatedIntelligence, responses,
        durationSeconds, status, failAttentionCheck,
      });

      const icon = failAttentionCheck ? '⚠️ ' : '✅';
      console.log(`${icon} [${String(i + 1).padStart(2, '0')}] ${fullName.padEnd(30)} | ${persona.label.padEnd(12)} | ${university.substring(0, 35).padEnd(35)} | Yr${studentYear} GPA${cumulativeGpa} | ${sessionId.substring(0, 8)}...`);
      success++;
    } catch (err) {
      console.error(`❌ [${i + 1}] ${fullName}: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\n${'─'.repeat(80)}`);
  console.log(`✅  Inserted: ${success}  |  ❌ Failed: ${failed}  |  Total: ${TOTAL}`);
  await pool.end();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
