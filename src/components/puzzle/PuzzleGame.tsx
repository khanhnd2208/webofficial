'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDailyPuzzleSession } from '@/lib/puzzle/useDailyPuzzleSession';
import { PuzzleCatalog } from '@/components/puzzle/PuzzleCatalog';
import { PuzzleBoard } from '@/components/puzzle/PuzzleBoard';
import { NumberPad } from '@/components/puzzle/NumberPad';
import { PuzzleTimer } from '@/components/puzzle/PuzzleTimer';
import { PuzzleLeaderboard } from '@/components/puzzle/PuzzleLeaderboard';
import { PuzzleStatsCard } from '@/components/puzzle/PuzzleStatsCard';
import { HowToPlayModal, shouldAutoOpenHowToPlay } from '@/components/puzzle/HowToPlayModal';
import { CellDomainHint } from '@/components/puzzle/CellDomainHint';
import { SaveStatusBadge } from '@/components/puzzle/SaveStatusBadge';
import { PuzzleSolvedModal } from '@/components/puzzle/PuzzleSolvedModal';

type MobileTab = 'play' | 'leaderboard' | 'stats';

function buildPuzzleUrl(puzzleId: string, dateOverride: string | null): string {
  const params = new URLSearchParams();
  params.set('puzzleId', puzzleId);
  if (dateOverride) params.set('date', dateOverride);
  return `/puzzle?${params}`;
}

function PuzzleBrowsePage({
  dateOverride,
  onSelect,
}: {
  dateOverride: string | null;
  onSelect: (puzzleId: string) => void;
}) {
  const [howToOpen, setHowToOpen] = useState(false);

  return (
    <div className="space-y-8 py-4">
      <HowToPlayModal open={howToOpen} onClose={() => setHowToOpen(false)} />
      <header className="space-y-2 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">ThinkGrid</p>
        <h1 className="text-2xl sm:text-3xl font-bold">Thư viện câu đố</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Chọn kích thước và độ khó — gồm câu <strong>8×8</strong> mới.
        </p>
        <button
          type="button"
          onClick={() => setHowToOpen(true)}
          className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-border hover:bg-surface-elevated"
        >
          Cách chơi
        </button>
      </header>
      <PuzzleCatalog selectedPuzzleId={null} onSelect={onSelect} />
      {dateOverride ? (
        <p className="text-center text-xs text-amber-600 dark:text-amber-400">
          Chế độ staging: date override {dateOverride}
        </p>
      ) : null}
    </div>
  );
}

function PuzzlePlayPage({
  puzzleId,
  dateOverride,
  isLoggedIn,
  authStatus,
}: {
  puzzleId: string;
  dateOverride: string | null;
  isLoggedIn: boolean;
  authStatus: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [howToOpen, setHowToOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('play');

  const s = useDailyPuzzleSession(isLoggedIn, { puzzleId, dateOverride });

  useEffect(() => {
    if (s.phase === 'idle' && shouldAutoOpenHowToPlay()) {
      setHowToOpen(true);
    }
  }, [s.phase]);

  useEffect(() => {
    if (s.phase !== 'playing' && s.phase !== 'solved') return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setHowToOpen(false);
        return;
      }
      if (s.phase !== 'playing' || !s.compiled) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        s.moveSelection('up');
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        s.moveSelection('down');
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        s.moveSelection('left');
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        s.moveSelection('right');
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        s.toggleNotesMode();
        return;
      }

      const max = s.selectedCellMeta?.maxAllowedValue ?? s.puzzle!.size;
      if (e.key >= '1' && e.key <= String(max)) {
        s.pickNumber(Number(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        s.clearCell();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        s.undo();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    s.phase,
    s.puzzle,
    s.compiled,
    s.notesMode,
    s.pickNumber,
    s.clearCell,
    s.undo,
    s.moveSelection,
    s.toggleNotesMode,
    s.selectedCellMeta,
  ]);

  const userRank = useMemo(() => {
    const uid = session?.user?.id;
    if (!uid) return null;
    const entry = s.leaderboard.find((e) => e.userId === uid);
    return entry?.rank ?? null;
  }, [session?.user?.id, s.leaderboard]);

  if (s.phase === 'loading' || authStatus === 'loading') {
    return <div className="py-20 text-center text-muted-foreground">Đang tải puzzle...</div>;
  }

  if (s.phase === 'error' || !s.puzzle || !s.compiled) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-red-600 dark:text-red-400">{s.errorMessage ?? 'Không có puzzle hôm nay.'}</p>
        <button
          type="button"
          onClick={() => s.reload()}
          className="px-6 py-2 rounded-full border border-border font-bold uppercase tracking-wider text-sm"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const playColumn = (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      <div className="flex items-center justify-between w-full gap-3 flex-wrap">
        <PuzzleTimer elapsedMs={s.elapsedMs} running={s.phase === 'playing'} />
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            Lỗi: <strong className="text-foreground">{s.mistakes}</strong>
          </span>
          <SaveStatusBadge status={s.phase === 'playing' ? s.saveStatus : 'idle'} />
        </div>
      </div>

      {s.notesMode && s.phase === 'playing' && (
        <p className="text-xs font-bold uppercase tracking-wider text-accent">Đang ghi chú</p>
      )}

      <div className="relative w-full flex justify-center">
        <PuzzleBoard
          compiled={s.compiled}
          entries={s.entries}
          notes={s.notes}
          selectedCell={s.phase === 'playing' || s.phase === 'solved' ? s.selectedCell : null}
          conflictCells={s.conflictCells}
          rejectPulse={s.rejectPulse}
          onSelectCell={s.selectCell}
          inputEnabled={s.phase === 'playing'}
        />
        {s.phase === 'idle' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-md bg-background/75 backdrop-blur-[2px] px-4"
            aria-hidden={false}
          >
            <p className="text-center text-sm font-medium max-w-xs">
              Sẵn sàng?
              <br />
              <span className="text-muted-foreground font-normal">
                Bấm Bắt đầu chơi để bật đồng hồ và nhập số.
              </span>
            </p>
          </div>
        )}
      </div>

      {s.phase === 'playing' && (
        <CellDomainHint
          selectedCellMeta={s.selectedCellMeta}
          candidates={s.candidates}
          notesMode={s.notesMode}
        />
      )}

      {s.phase === 'idle' && (
        <button
          type="button"
          onClick={() => s.startGame()}
          className="w-full sm:w-auto px-8 py-3 min-h-[44px] rounded-full bg-accent text-background font-bold uppercase tracking-wider hover:opacity-90 active:scale-95"
        >
          {isLoggedIn ? 'Bắt đầu chơi' : 'Đăng nhập để chơi'}
        </button>
      )}

      {s.phase === 'playing' && (
        <div className="w-full max-w-xs space-y-3 lg:static fixed bottom-0 left-0 right-0 z-20 px-4 pb-4 pt-3 bg-background/95 border-t border-border lg:border-0 lg:bg-transparent lg:p-0 lg:max-w-xs">
          <NumberPad
            boardSize={s.puzzle.size}
            maxAllowed={s.selectedCellMeta?.maxAllowedValue ?? null}
            candidates={s.candidates}
            cellNotes={s.selectedCellNotes}
            notesMode={s.notesMode}
            rejectPulse={s.rejectPulse}
            onPick={(n) => s.pickNumber(n)}
            onClear={() => s.clearCell()}
            onToggleNotes={() => s.toggleNotesMode()}
            onUndo={() => s.undo()}
            canUndo={s.canUndo}
          />
          <button
            type="button"
            onClick={() => s.trySubmit()}
            className="w-full px-8 py-3 min-h-[44px] rounded-full bg-foreground text-background font-bold uppercase tracking-wider hover:opacity-90 active:scale-95"
          >
            Nộp đáp án
            {s.emptyCellCount > 0 ? (
              <span className="normal-case font-normal text-background/80 text-xs block">
                ({s.emptyCellCount} ô chưa điền)
              </span>
            ) : null}
          </button>
        </div>
      )}

      {s.phase === 'solved' && s.submitResult?.shareText && (
        <PuzzleSolvedModal
          durationMs={s.submitResult.durationMs ?? s.elapsedMs}
          mistakes={s.submitResult.mistakes ?? s.mistakes}
          streak={s.submitResult.streak?.currentStreak ?? s.stats?.currentStreak ?? 0}
          rank={userRank}
          shareText={s.submitResult.shareText}
          onViewLeaderboard={() => {
            setMobileTab('leaderboard');
            if (typeof window !== 'undefined') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        />
      )}

      {s.inputHint && (
        <p
          className="text-sm text-amber-600 dark:text-amber-400 text-center max-w-md"
          role="status"
          aria-live="polite"
        >
          {s.inputHint}
        </p>
      )}
      {s.phase === 'playing' && s.conflictCells.size > 0 && !s.inputHint && (
        <p className="text-xs text-red-600 dark:text-red-400 text-center max-w-md" role="status">
          Có {s.conflictCells.size} ô mâu thuẫn — kiểm tra các ô viền đỏ (!).
        </p>
      )}
      {s.errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">{s.errorMessage}</p>
      )}
    </div>
  );

  const sidebar = (
    <>
      {isLoggedIn && <PuzzleStatsCard stats={s.stats} />}
      <div>
        <h2 className="font-bold uppercase tracking-wider text-xs text-muted-foreground mb-3">
          Bảng xếp hạng — câu này
        </h2>
        <PuzzleLeaderboard
          entries={s.leaderboard}
          dateKey={s.puzzle.dateKey}
          highlightUserId={session?.user?.id}
        />
      </div>
    </>
  );

  return (
    <div className="space-y-6 pb-32 lg:pb-8">
      <HowToPlayModal open={howToOpen} onClose={() => setHowToOpen(false)} />

      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">ThinkGrid</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push(dateOverride ? `/puzzle?date=${dateOverride}` : '/puzzle')}
              className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-border hover:bg-surface-elevated"
            >
              Đổi câu đố
            </button>
            <button
              type="button"
              onClick={() => setHowToOpen(true)}
              className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-border hover:bg-surface-elevated"
            >
              Cách chơi
            </button>
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">{s.puzzle.title}</h1>
        <p className="text-sm text-muted-foreground">
          {s.puzzle.dateKey} · {s.puzzle.difficulty} · {s.puzzle.size}×{s.puzzle.size}
          {dateOverride ? (
            <span className="ml-2 text-amber-600 dark:text-amber-400">(staging)</span>
          ) : null}
        </p>
        <p className="text-sm text-muted-foreground max-w-xl">
          Mỗi <strong className="text-foreground font-medium">đoạn</strong> bị ngăn bởi tường hoặc ô đen
          phải chứa đủ các số từ 1 đến độ dài của đoạn đó.{' '}
          <span className="text-foreground/80">Ví dụ: đoạn 3 ô → 1, 2, 3.</span>
        </p>
      </header>

      <div className="lg:hidden flex gap-1 p-1 rounded-full bg-surface-elevated border border-border">
        {(
          [
            ['play', 'Chơi'],
            ['leaderboard', 'Xếp hạng'],
            ['stats', 'Thống kê'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMobileTab(id)}
            className={[
              'flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-colors',
              mobileTab === id ? 'bg-accent text-background' : 'text-muted-foreground',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div
          className={[
            'flex-1 w-full min-w-0',
            mobileTab !== 'play' ? 'hidden lg:block' : '',
          ].join(' ')}
        >
          {playColumn}
        </div>

        <aside
          className={[
            'w-full lg:w-64 space-y-6 shrink-0',
            mobileTab === 'play' ? 'hidden lg:block' : 'block',
          ].join(' ')}
        >
          <div className="hidden lg:block space-y-6">{sidebar}</div>
          {mobileTab === 'leaderboard' && (
            <div className="lg:hidden">
              <h2 className="font-bold uppercase tracking-wider text-xs text-muted-foreground mb-3">
                Bảng xếp hạng — câu này
              </h2>
              <PuzzleLeaderboard
                entries={s.leaderboard}
                dateKey={s.puzzle.dateKey}
                highlightUserId={session?.user?.id}
              />
            </div>
          )}
          {mobileTab === 'stats' && isLoggedIn && (
            <div className="lg:hidden">
              <PuzzleStatsCard stats={s.stats} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export function PuzzleGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
  const isLoggedIn = !!session?.user;

  const puzzleId = useMemo(() => searchParams.get('puzzleId'), [searchParams]);
  const dateOverride = useMemo(() => {
    const raw = searchParams.get('date');
    return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
  }, [searchParams]);

  if (!puzzleId) {
    return (
      <PuzzleBrowsePage
        dateOverride={dateOverride}
        onSelect={(id) => router.push(buildPuzzleUrl(id, dateOverride))}
      />
    );
  }

  return (
    <PuzzlePlayPage
      puzzleId={puzzleId}
      dateOverride={dateOverride}
      isLoggedIn={isLoggedIn}
      authStatus={authStatus}
    />
  );
}
