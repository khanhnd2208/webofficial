# Tutorial group rollout

The group list is read-only for students. All edits require the existing admin session.

## Database rollout

Use the intended server environment and take the normal PostgreSQL backup before deployment. Do not point these commands at another environment's database.

1. Keep `TEACHING_GROUP_BOARD_ENABLED=false` during the schema/data transition.
2. Run `npx prisma migrate deploy` and `npx prisma generate`. The additional integrity migration enforces unique tutorial boards and prevents creation of new class-wide boards. Existing legacy NULL tutorial IDs are temporarily allowed.
3. Run `npx tsx scripts/migrate-group-boards-to-tutorial.ts --dry-run`. This reads only and writes a local JSON report with restricted file permissions. Any unresolved tutorial, inactive assigned enrollment or existing destination board blocks application. Resolve the reported records explicitly before continuing; the script does not guess or overwrite.
4. Run `npx tsx scripts/migrate-group-boards-to-tutorial.ts --apply`. Unlike the previous script, omitting a flag never applies changes. All source boards, membership moves, archives and final NOT NULL validation commit in one serializable transaction; a failure rolls everything back. Disable other editing during this short maintenance step to avoid concurrent-write conflicts.
5. Verify that the report has `applied: true` and no issues, then enable `TEACHING_GROUP_BOARD_ENABLED=true` and restart the application.

Each original board, group, assignment and audit is retained as a JSON snapshot in `TeachingGroupBoardArchive`. It is independent of live foreign keys, so deleting a converted board does not erase its migration history. Assignment IDs are retained. Groups with members are renumbered consecutively per tutorial. Rerunning the successful migration does not duplicate data.

The database archive is a recovery/inspection source, not an automatic rollback command. If rollback is needed, stop writes and use the verified pre-deployment database backup; do not reinstall old application code against the new schema.

Fresh installations with no legacy boards receive NOT NULL immediately. Populated installations finish that constraint in the successful data migration. Do not enable the new application while unresolved legacy boards remain.

## Verification

- `npm run typecheck`
- `npm run lint -- --max-warnings=0`
- `npm run test -- src/features/teaching src/components/teaching src/app/api/teaching`
- `npm run build`
- With an isolated test server and the feature enabled: `TEACHING_GROUP_BOARD_ENABLED=true PLAYWRIGHT_BASE_URL=http://localhost:3011 npx playwright test e2e/teaching-groups.spec.ts --project=chromium --workers=1`
- PostgreSQL migration, rollback, membership and concurrency checks: provision a disposable database named `codex_groups_*` or `teaching_groups_test*`, apply all migrations there, and run `TEST_DATABASE_URL=<disposable database URL> npx tsx scripts/test-group-workflow.ts`. This script deliberately injects failures and changes constraints in that disposable database; never use production.

The E2E test creates its own class and removes it afterwards. Use a disposable database because student identity fixtures remain after class deletion.
