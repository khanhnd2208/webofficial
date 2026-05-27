/* GET /api/puzzle/health — puzzle catalog readiness (no auth) */
import { withErrorHandling, apiSuccess } from '@/lib/apiUtils';
import { countPublishedPuzzlesVisible } from '@/services/puzzleService';
import { PUZZLE_VALIDATOR_VERSION } from '@/lib/puzzle/puzzlePolicy';
import { PUZZLE_SEED_PUBLISHED_COUNT } from '@/lib/puzzle/seedCatalogMeta';

export const GET = withErrorHandling(async () => {
  const visible = await countPublishedPuzzlesVisible();
  return apiSuccess({
    validatorVersion: PUZZLE_VALIDATOR_VERSION,
    visiblePublishedCount: visible,
    expectedCount: PUZZLE_SEED_PUBLISHED_COUNT,
    ready: visible > 0,
    setupHint:
      visible === 0
        ? 'Run: npm run db:puzzle:reset (or db:migrate:deploy && db:seed:puzzle:future)'
        : null,
  });
});
