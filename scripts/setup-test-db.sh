#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${TEST_DB_NAME:-teaching_platform_vocab_test}"
DB_URL="${TEST_DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/${DB_NAME}}"

echo "Setting up test database: ${DB_NAME}"
createdb "${DB_NAME}" 2>/dev/null || true

export DATABASE_URL="${DB_URL}"
export TEST_DATABASE_URL="${DB_URL}"

npx prisma migrate deploy
echo "Test database ready at ${DB_URL}"
