-- Align stored class identity with normalizeClassCode / normalizeTerm so that
-- previously imported dirty values cannot coexist with a later canonical create.

UPDATE "TeachingClass"
SET
    "groupNo" = upper(regexp_replace(btrim("groupNo"), '\s+', ' ', 'g')),
    "classCode" = upper(regexp_replace(btrim(COALESCE(NULLIF("classCode", ''), "groupNo")), '\s+', ' ', 'g')),
    "term" = regexp_replace(btrim("term"), '\s+', ' ', 'g');
