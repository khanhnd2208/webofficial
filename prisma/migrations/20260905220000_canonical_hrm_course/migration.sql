CREATE OR REPLACE FUNCTION teaching_is_hrm_key(value text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(trim(value)) IN (
    'hrm',
    'hrm101',
    '61mgt3hrm',
    'human resource management',
    'human resources management',
    'quản trị nhân sự',
    'quan tri nhan su'
  );
$$;

CREATE OR REPLACE FUNCTION teaching_merge_hrm_courses()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  canonical_id text;
  canonical_name text;
  conflict_report text;
  leftover RECORD;
BEGIN
  SELECT cls.id
  INTO canonical_id
  FROM "TeachingCourse" AS cls
  WHERE cls."courseCode" = '61MGT3HRM'
  LIMIT 1;

  IF canonical_id IS NULL THEN
    SELECT cls.id
    INTO canonical_id
    FROM "TeachingCourse" AS cls
    WHERE teaching_is_hrm_key(cls."courseCode")
       OR teaching_is_hrm_key(cls."courseName")
    ORDER BY
      CASE WHEN teaching_is_hrm_key(cls."courseCode") THEN 0 ELSE 1 END,
      (SELECT COUNT(*) FROM "TeachingClass" AS teaching WHERE teaching."courseId" = cls.id) DESC,
      cls."createdAt" ASC,
      cls.id ASC
    LIMIT 1;
  END IF;

  IF canonical_id IS NULL THEN
    INSERT INTO "TeachingCourse" ("id", "courseCode", "courseName", "createdAt", "updatedAt")
    SELECT
      'c' || substr(md5('61mgt3hrm'), 1, 24),
      '61MGT3HRM',
      'Quản trị nhân sự',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    WHERE EXISTS (
      SELECT 1
      FROM "ActiveRecallDeck"
      WHERE teaching_is_hrm_key(subject)
    )
    ON CONFLICT ("courseCode") DO NOTHING;

    SELECT id INTO canonical_id FROM "TeachingCourse" WHERE "courseCode" = '61MGT3HRM';
  END IF;

  IF canonical_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    CASE
      WHEN teaching_is_hrm_key(course."courseName")
           AND lower(trim(course."courseName")) <> lower('Quản trị nhân sự')
        THEN 'Quản trị nhân sự'
      ELSE course."courseName"
    END
  INTO canonical_name
  FROM "TeachingCourse" AS course
  WHERE course.id = canonical_id;

  SELECT string_agg(
           format(
             'groupNo=%s classCode=%s term=%s ids=%s',
             grouped."groupNo",
             grouped."classCode",
             grouped.term,
             grouped.ids
           ),
           '; '
         )
  INTO conflict_report
  FROM (
    SELECT
      cls."groupNo",
      cls."classCode",
      cls.term,
      string_agg(cls.id, ', ' ORDER BY cls.id) AS ids
    FROM "TeachingClass" AS cls
    WHERE teaching_is_hrm_key(cls."courseCode")
       OR cls."courseId" IN (
         SELECT id FROM "TeachingCourse"
         WHERE teaching_is_hrm_key("courseCode") OR teaching_is_hrm_key("courseName")
       )
    GROUP BY cls."groupNo", cls."classCode", cls.term
    HAVING COUNT(*) > 1
  ) AS grouped;

  IF conflict_report IS NOT NULL THEN
    RAISE EXCEPTION 'HRM class unique conflict: %', conflict_report;
  END IF;

  UPDATE "TeachingCourse"
  SET
    "courseCode" = '61MGT3HRM',
    "courseName" = COALESCE(NULLIF(canonical_name, ''), 'Quản trị nhân sự'),
    "updatedAt" = CURRENT_TIMESTAMP
  WHERE id = canonical_id;

  UPDATE "TeachingClass" AS cls
  SET
    "courseId" = canonical_id,
    "courseCode" = '61MGT3HRM',
    "courseName" = (SELECT "courseName" FROM "TeachingCourse" WHERE id = canonical_id),
    "updatedAt" = CURRENT_TIMESTAMP
  WHERE teaching_is_hrm_key(cls."courseCode")
     OR cls."courseId" IN (
       SELECT id FROM "TeachingCourse"
       WHERE id <> canonical_id
         AND (teaching_is_hrm_key("courseCode") OR teaching_is_hrm_key("courseName"))
     );

  UPDATE "ActiveRecallDeck" AS deck
  SET
    "courseId" = canonical_id,
    subject = (SELECT "courseName" FROM "TeachingCourse" WHERE id = canonical_id),
    "updatedAt" = CURRENT_TIMESTAMP
  WHERE teaching_is_hrm_key(deck.subject)
     OR deck."courseId" IN (
       SELECT id FROM "TeachingCourse"
       WHERE id <> canonical_id
         AND (teaching_is_hrm_key("courseCode") OR teaching_is_hrm_key("courseName"))
     );

  INSERT INTO "TeachingClassRecallDeck" ("id", "classId", "deckId", "enabled", "displayOrder", "createdAt", "updatedAt")
  SELECT
    'r' || substr(md5(cls.id || deck.id), 1, 24),
    cls.id,
    deck.id,
    true,
    deck.position,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM "TeachingClass" AS cls
  JOIN "ActiveRecallDeck" AS deck ON deck."courseId" = cls."courseId"
  WHERE cls."courseId" = canonical_id
    AND deck.status = 'PUBLISHED'
  ON CONFLICT ("classId", "deckId") DO NOTHING;

  FOR leftover IN
    SELECT id
    FROM "TeachingCourse"
    WHERE id <> canonical_id
      AND (teaching_is_hrm_key("courseCode") OR teaching_is_hrm_key("courseName"))
  LOOP
    IF EXISTS (SELECT 1 FROM "TeachingClass" WHERE "courseId" = leftover.id)
       OR EXISTS (SELECT 1 FROM "ActiveRecallDeck" WHERE "courseId" = leftover.id)
    THEN
      RAISE EXCEPTION 'Cannot delete leftover HRM course % because references remain', leftover.id;
    END IF;
    DELETE FROM "TeachingCourse" WHERE id = leftover.id;
  END LOOP;
END;
$$;

SELECT teaching_merge_hrm_courses();
