import type { NextRequest } from 'next/server';

import { boothSetupSchema, unlockSchema } from '@/features/fmt2026/schemas';
import { isSetupTokenValid } from '@/features/fmt2026/services/boothUnlock';
import {
	configureBoothPin,
	getBoothSetup,
	getPinState,
	startBooth,
} from '@/features/fmt2026/services/drawService';
import { isAdmin } from '@/lib/apiAuth';
import { AppError, apiSuccess, withAdmin, withErrorHandling } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

export const dynamic = 'force-dynamic';

function hasSetupAccess(request: NextRequest, pinVersion: number) {
	return isSetupTokenValid(request.headers.get('x-fmt-setup') ?? undefined, pinVersion);
}

export const GET = withErrorHandling(async (request: NextRequest) => {
	const { pinHash, pinVersion } = await getPinState();
	const mode = !pinHash
		? (await isAdmin(request))
			? 'configure-pin'
			: 'needs-admin'
		: hasSetupAccess(request, pinVersion)
			? 'setup'
			: 'unlock';
	const response = apiSuccess(mode === 'setup' ? { mode, ...(await getBoothSetup()) } : { mode });
	response.headers.set('cache-control', 'private, no-store');
	return response;
});

export const POST = withErrorHandling(async (request: NextRequest) => {
	const { pinHash, pinVersion } = await getPinState();
	if (!pinHash || !hasSetupAccess(request, pinVersion)) {
		throw new AppError('Nhập mã PIN để thiết lập quầy.', 401, 'LOCKED');
	}
	const input = parseSchema(boothSetupSchema, await request.json());
	await startBooth(input, pinVersion);
	return apiSuccess({ started: true });
});

export const PUT = withAdmin(async (request) => {
	const { pin } = parseSchema(unlockSchema, await request.json());
	await configureBoothPin(pin);
	return apiSuccess({ configured: true });
});
