import 'server-only';

import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** Kept outside public/ so only completed respondents can download it. */
export const GIFT_PDF_PATH = join(
	process.cwd(),
	'content',
	'unreleased-gift',
	'unreleasedgift.pdf',
);

export function giftPdfIsReady(): boolean {
	return existsSync(GIFT_PDF_PATH);
}
