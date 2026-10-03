import { z } from 'zod';

export const RECALL_SESSION_GAP_MS = 30 * 60_000;
export const RECALL_IDLE_MS = 5 * 60_000;
export const RECALL_LEASE_MS = 2 * 60_000;
export const RECALL_HEARTBEAT_MS = 60_000;
export const RECALL_REPORT_PAGE_SIZE = 25;

export const beginRecallSchema = z.object({
	deckId: z.string().min(1).max(128),
	classSlug: z.string().max(128).optional(),
	clientId: z.string().uuid(),
	visitId: z.string().uuid(),
	claimLease: z.boolean(),
});
export const heartbeatRecallSchema = z
	.object({
		sessionId: z.string().uuid(),
		visitId: z.string().uuid(),
		clientId: z.string().uuid(),
		sequence: z.number().int().min(0).max(2_147_483_647),
		seconds: z.number().int().min(0).max(75),
		interactions: z.number().int().min(0).max(120),
		answerReveals: z.number().int().min(0).max(120),
		activityAgeSeconds: z.number().int().min(0).max(86_400),
		active: z.boolean(),
		releaseLease: z.boolean(),
	})
	.refine((input) => input.answerReveals <= input.interactions, {
		message: 'Số lượt mở đáp án không hợp lệ',
	});
export type RecallBeginInput = z.infer<typeof beginRecallSchema>;
export type RecallHeartbeatInput = z.infer<typeof heartbeatRecallSchema>;
export type RecallBeginResult = {
	sessionId: string;
	visitId: string;
	lastSequence: number;
	leaseGranted: boolean;
};
export type RecallHeartbeatResult = {
	accepted: boolean;
	leaseGranted: boolean;
	lastSequence: number;
};
export type RecallReportFilters = {
	start: string;
	end: string;
	course: string;
	class: string;
	deck: string;
	visitor: string;
	page: number;
	historyPage: number;
};
export type RecallMetrics = {
	opens: number;
	visitors: number;
	learners: number;
	sessions: number;
	seconds: number;
	reveals: number;
};
export type RecallDailyRow = RecallMetrics & { day: string };
export type RecallDeckRow = RecallMetrics & { deckId: string; title: string; courseName: string };
export type RecallVisitorRow = {
	publicId: string;
	firstSeenAt: string;
	lastSeenAt: string;
	days: number;
	sessions: number;
	seconds: number;
};
export type RecallHistoryRow = {
	sessionId: string;
	startedAt: string;
	lastActivityAt: string;
	engaged: boolean;
	seconds: number;
	decks: string[];
	classes: string[];
};
export type RecallReport = {
	today: string;
	filters: RecallReportFilters;
	totals: RecallMetrics & { returning: number; sessionsPerLearner: number };
	daily: RecallDailyRow[];
	decks: RecallDeckRow[];
	visitors: RecallVisitorRow[];
	visitorCount: number;
	history: RecallHistoryRow[];
	historyCount: number;
	selectedVisitor: RecallVisitorRow | null;
	options: {
		courses: { id: string; name: string }[];
		classes: { id: string; name: string }[];
		decks: { id: string; name: string }[];
	};
};
