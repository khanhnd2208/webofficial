import { parseWithAppError, suggestTaxonomyFromKnowledgeUnits } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { z } from 'zod';
import { type NextRequest } from 'next/server';

const bodySchema = z.object({ knowledgeUnitIds: z.array(z.string().min(1)).min(1).max(50) });

export const POST = withAdmin(async (request: NextRequest) =>
	apiSuccess(
		await suggestTaxonomyFromKnowledgeUnits(
			parseWithAppError(bodySchema, await request.json()).knowledgeUnitIds,
		),
	),
);
