import type { NextRequest } from 'next/server';

import {
	getGroupBoardVersion,
	getPublicClassIdBySlug,
	groupBoardTutorialQuerySchema,
	parseWithAppError,
} from '@/features/teaching';
import { isTeachingGroupBoardEnabled } from '@/features/teaching/groupBoardAvailability';
import { apiError } from '@/lib/apiUtils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
	if (!isTeachingGroupBoardEnabled()) return apiError('Not found', 404, { code: 'NOT_FOUND' });
	const slug = String((await context.params).slug);
	const classId = await getPublicClassIdBySlug(slug);
	if (!classId) return Response.json({ ok: false, error: 'Not found' }, { status: 404 });
	const tutorialClassId = request.nextUrl.searchParams.get('tutorialClassId')?.trim();
	if (!tutorialClassId) return apiError('Thiếu tutorialClassId.', 422, { code: 'VALIDATION' });
	parseWithAppError(groupBoardTutorialQuerySchema, { tutorialClassId });
	let lastVersion = await getGroupBoardVersion(classId, tutorialClassId);
	let timer: ReturnType<typeof setInterval> | undefined;
	let heartbeat: ReturnType<typeof setInterval> | undefined;
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			const encoder = new TextEncoder();
			const send = (event: string, data: unknown) =>
				controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
			send('connected', { version: lastVersion });
			timer = setInterval(() => {
				void getGroupBoardVersion(classId, tutorialClassId)
					.then((version) => {
						if (version !== lastVersion) {
							lastVersion = version;
							send('board.updated', { version: lastVersion });
						}
					})
					.catch(() => {
						/* The browser will reconnect after a transient database failure. */
					});
			}, 3000);
			heartbeat = setInterval(() => controller.enqueue(encoder.encode(': heartbeat\n\n')), 15000);
			request.signal.addEventListener('abort', () => {
				if (timer) clearInterval(timer);
				if (heartbeat) clearInterval(heartbeat);
				try {
					controller.close();
				} catch {
					/* already closed */
				}
			});
		},
		cancel() {
			if (timer) clearInterval(timer);
			if (heartbeat) clearInterval(heartbeat);
		},
	});
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no',
		},
	});
}
