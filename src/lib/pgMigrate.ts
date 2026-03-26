/* ════════════════════════════════════════════════════════════════════════
   PostgreSQL Schema Migration — Personality Test
   
   Run with:  npx tsx src/lib/pgMigrate.ts
   
   Creates all tables needed for the personality test feature.
   Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE).
   ════════════════════════════════════════════════════════════════════════ */

import { pgPool } from './pgPool';

const MIGRATION_SQL = `
-- ─── Enable uuid generation ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── personality_test_sessions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS personality_test_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,            -- References MongoDB user._id (string)
  user_name       TEXT NOT NULL DEFAULT '',

  -- Demographic / survey fields
  full_name       TEXT,
  university      TEXT,
  student_year    SMALLINT,                 -- e.g. 1, 2, 3, 4, 5
  cumulative_gpa  NUMERIC(4,2),             -- e.g. 3.45
  self_rated_intelligence SMALLINT,         -- 1-10 scale

  status          TEXT NOT NULL DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress', 'completed', 'invalid')),
  duration_seconds INTEGER,

  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pts_user_id ON personality_test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pts_status  ON personality_test_sessions(status);

-- ─── personality_test_responses ─────────────────────────────────────────────
-- One row per question answered (57 rows per complete session)
CREATE TABLE IF NOT EXISTS personality_test_responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES personality_test_sessions(id) ON DELETE CASCADE,
  test_type       TEXT NOT NULL CHECK (test_type IN ('BFI2S', 'SD3')),
  item_number     SMALLINT NOT NULL,        -- Academic item number within the test
  form_order      SMALLINT NOT NULL,        -- Order as displayed in the Google Form
  value           SMALLINT NOT NULL CHECK (value BETWEEN 1 AND 5),

  UNIQUE(session_id, test_type, item_number)
);

CREATE INDEX IF NOT EXISTS idx_ptr_session ON personality_test_responses(session_id);

-- ─── personality_test_results ───────────────────────────────────────────────
-- Denormalized scoring output — one row per session
CREATE TABLE IF NOT EXISTS personality_test_results (
  session_id      UUID PRIMARY KEY REFERENCES personality_test_sessions(id) ON DELETE CASCADE,
  is_valid        BOOLEAN NOT NULL DEFAULT TRUE,
  invalid_reason  TEXT,

  -- OCEAN scores (1.00 – 5.00)
  extraversion            NUMERIC(4,2),
  agreeableness           NUMERIC(4,2),
  conscientiousness       NUMERIC(4,2),
  negative_emotionality   NUMERIC(4,2),
  open_mindedness         NUMERIC(4,2),

  -- Dark Triad scores (1.00 – 5.00)
  machiavellianism        NUMERIC(4,2),
  narcissism              NUMERIC(4,2),
  psychopathy             NUMERIC(4,2),

  -- Percentiles (0 – 100, nullable until calculated)
  extraversion_pct            SMALLINT,
  agreeableness_pct           SMALLINT,
  conscientiousness_pct       SMALLINT,
  negative_emotionality_pct   SMALLINT,
  open_mindedness_pct         SMALLINT,
  machiavellianism_pct        SMALLINT,
  narcissism_pct              SMALLINT,
  psychopathy_pct             SMALLINT,

  -- Archetype (JSON blob for flexible schema)
  archetype       JSONB
);

-- ─── updated_at trigger ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pts_updated_at ON personality_test_sessions;
CREATE TRIGGER trg_pts_updated_at
  BEFORE UPDATE ON personality_test_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function runMigration() {
	console.log('🗄️  Running PostgreSQL migration for personality test...');
	try {
		await pgPool.query(MIGRATION_SQL);
		console.log('✅ Migration complete — all tables created.');
	} catch (err) {
		console.error('❌ Migration failed:', err);
		process.exit(1);
	} finally {
		await pgPool.end();
	}
}

runMigration();
