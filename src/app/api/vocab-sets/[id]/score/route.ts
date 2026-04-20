/* ════════════════════════════════════════════════════════════════════════
   POST /api/vocab-sets/[id]/score
   Submit a completed game session. The server re-calculates the score
   from raw timestamps (anti-cheat). Only saves if new score > best.
   ════════════════════════════════════════════════════════════════════════ */
import { withAuth, apiSuccess, apiError } from '@/lib/apiUtils';
import { prisma } from '@/lib/prisma';
import {
  calcMCQScore,      validateMCQPayload,
  calcFillBlankScore, validateFillBlankPayload,
  calcMatchingScore,  validateMatchingPayload,
  calcGuessWhoScore,  validateGuessWhoPayload,
} from '@/lib/vocab/scoreCalculator';
import type { MCQQuestion, FillBlankWord, MatchingSession, GuessWhoSession } from '@/lib/vocab/scoreCalculator';

type ScoreBody =
  | { mode: 'MCQ';       questions: MCQQuestion[] }
  | { mode: 'FILL_BLANK'; words: FillBlankWord[] }
  | { mode: 'MATCHING';  sessionStartTime: number; sessionEndTime: number; penaltyMs: number }
  | { mode: 'GUESS_WHO'; sessionStartTime: number; sessionEndTime: number; penaltyMs: number };

type Ctx = { params: Promise<{ id: string }> };

export const POST = withAuth(async (request, user, ctx) => {
  const { id: vocabSetId } = await (ctx as Ctx).params;
  const nowMs = Date.now();

  // Validate the set exists
  const set = await prisma.vocabSet.findUnique({ where: { id: vocabSetId }, select: { id: true } });
  if (!set) return apiError('Vocab set not found', 404);

  let body: ScoreBody;
  try { body = await request.json(); }
  catch { return apiError('Invalid JSON', 400); }

  let score: number;
  const mode = body.mode;

  if (mode === 'MCQ') {
    const err = validateMCQPayload(body.questions, nowMs);
    if (err) return apiError(`Validation: ${err}`, 422);
    score = calcMCQScore(body.questions);

  } else if (mode === 'FILL_BLANK') {
    const err = validateFillBlankPayload(body.words, nowMs);
    if (err) return apiError(`Validation: ${err}`, 422);
    score = calcFillBlankScore(body.words);

  } else if (mode === 'MATCHING') {
    const session: MatchingSession = {
      sessionStartTime: body.sessionStartTime,
      sessionEndTime:   body.sessionEndTime,
      penaltyMs:        body.penaltyMs,
    };
    const err = validateMatchingPayload(session, nowMs);
    if (err) return apiError(`Validation: ${err}`, 422);
    score = calcMatchingScore(session);

  } else if (mode === 'GUESS_WHO') {
    const session: GuessWhoSession = {
      sessionStartTime: body.sessionStartTime,
      sessionEndTime:   body.sessionEndTime,
      penaltyMs:        body.penaltyMs,
    };
    const err = validateGuessWhoPayload(session, nowMs);
    if (err) return apiError(`Validation: ${err}`, 422);
    score = calcGuessWhoScore(session);

  } else {
    return apiError('Unknown game mode', 400);
  }

  // Fetch current best
  const existing = await prisma.gameScore.findUnique({
    where: { userId_vocabSetId_mode: { userId: user.id, vocabSetId, mode } },
  });

  const isNewBest = !existing || score > existing.score;
  let savedScore = existing?.score ?? null;

  if (isNewBest) {
    const userName = user.name ?? user.email ?? 'Unknown';
    await prisma.gameScore.upsert({
      where:  { userId_vocabSetId_mode: { userId: user.id, vocabSetId, mode } },
      create: { userId: user.id, userName, vocabSetId, mode, score },
      update: { score, userName },
    });
    savedScore = score;
  }

  return apiSuccess({
    score,
    isNewBest,
    previousBest: existing?.score ?? null,
    savedScore,
  });
});
