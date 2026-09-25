-- Backfill the stored reading time added in 20260925120000_learn_section_minutes.
-- Mirrors sectionMinutes() in src/features/learn/content.ts (180 words per minute),
-- so existing sections do not show the column default of 1 minute after deploy.
WITH texts AS (
  SELECT
    s.id,
    s.type,
    s."durationMinutes",
    s.quiz,
    CASE
      WHEN s.type = 'DISCUSSION' AND jsonb_typeof(s.discussion -> 'questions') = 'array' THEN (
        SELECT string_agg(COALESCE(q ->> 'question', '') || E'\n' || COALESCE(q ->> 'answer', ''), E'\n')
        FROM jsonb_array_elements(s.discussion -> 'questions') AS q
      )
      WHEN s.type = 'DISCUSSION' THEN ''
      ELSE s.markdown
    END AS body
  FROM "LearnSection" s
),
counted AS (
  SELECT
    t.*,
    (
      SELECT count(*)
      FROM regexp_split_to_table(
        regexp_replace(
          regexp_replace(COALESCE(t.body, ''), '```.*?```', ' ', 'g'),
          '[#>*_`|\[\]()-]', ' ', 'g'
        ),
        '\s+'
      ) AS word
      WHERE word <> ''
    ) AS words,
    CASE WHEN jsonb_typeof(t.quiz -> 'questions') = 'array' THEN jsonb_array_length(t.quiz -> 'questions') END AS question_count
  FROM texts t
),
computed AS (
  SELECT
    c.id,
    CASE
      WHEN COALESCE(c."durationMinutes", 0) > 0 THEN c."durationMinutes"
      WHEN c.type = 'QUIZ' AND jsonb_typeof(c.quiz -> 'timeLimitMinutes') = 'number' THEN (c.quiz ->> 'timeLimitMinutes')::int
      WHEN c.type IN ('QUIZ', 'PRACTICE') THEN GREATEST(1, COALESCE(c.question_count, 1))
      ELSE GREATEST(1, round(c.words::numeric / 180))::int
    END AS minutes
  FROM counted c
)
UPDATE "LearnSection" AS s
SET "estimatedMinutes" = computed.minutes
FROM computed
WHERE s.id = computed.id AND s."estimatedMinutes" IS DISTINCT FROM computed.minutes;
