'use client';

interface NumberPadProps {
  boardSize: number;
  maxAllowed: number | null;
  candidates: number[];
  cellNotes: number[];
  notesMode: boolean;
  rejectPulse: number;
  onPick: (n: number) => void;
  onClear: () => void;
  onToggleNotes: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  disabled?: boolean;
}

function EraserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 20H7L3 16l10-10 7 7-10 10z" />
      <path d="M14 6l4 4" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

export function NumberPad({
  boardSize,
  maxAllowed,
  candidates,
  cellNotes,
  notesMode,
  rejectPulse,
  onPick,
  onClear,
  onToggleNotes,
  onUndo,
  canUndo = false,
  disabled,
}: NumberPadProps) {
  const nums = Array.from({ length: boardSize }, (_, i) => i + 1);
  const padShake = rejectPulse > 0 ? 'animate-puzzle-shake' : '';

  return (
    <div className={`flex flex-col gap-3 w-full max-w-xs ${padShake}`} key={rejectPulse}>
      <button
        type="button"
        onClick={onToggleNotes}
        disabled={disabled}
        aria-pressed={notesMode}
        className={[
          'h-10 rounded-full border text-xs font-bold uppercase tracking-wider transition-colors',
          'inline-flex items-center justify-center gap-2',
          notesMode
            ? 'bg-accent text-background border-accent shadow-sm'
            : 'border-border text-muted-foreground hover:text-foreground hover:border-border-hover',
        ].join(' ')}
      >
        <PencilIcon className="h-4 w-4 shrink-0" />
        <span>Ghi chú{notesMode ? ' · Bật' : ''}</span>
      </button>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.min(boardSize, 6)}, minmax(0, 1fr))` }}
      >
        {nums.map((n) => {
          const hidden = maxAllowed !== null && n > maxAllowed;
          if (hidden) return null;

          const blockedByCandidates =
            !notesMode && maxAllowed !== null && !candidates.includes(n);
          const noteActive = notesMode && cellNotes.includes(n);

          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onPick(n)}
              className={[
                'h-11 rounded-full border font-bold text-lg transition-colors active:scale-95',
                noteActive
                  ? 'border-accent/60 bg-accent/15 text-accent'
                  : blockedByCandidates
                    ? 'border-border/50 bg-surface-elevated/60 text-muted-foreground/50'
                    : 'border-border bg-surface-elevated hover:bg-accent hover:text-background',
                blockedByCandidates && !notesMode
                  ? 'hover:bg-surface-elevated hover:text-muted-foreground/50'
                  : '',
              ].join(' ')}
            >
              {n}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onClear}
          className={[
            'h-11 rounded-full border border-border text-sm font-bold uppercase tracking-wider',
            'inline-flex items-center justify-center gap-1.5 min-h-[44px]',
            'text-muted-foreground hover:text-foreground hover:border-border-hover hover:bg-surface-elevated',
            'disabled:opacity-40 transition-colors active:scale-95',
          ].join(' ')}
          aria-label="Xóa số và ghi chú trong ô đang chọn"
          title="Xóa số và ghi chú trong ô này"
        >
          <EraserIcon className="h-4 w-4" />
          Xóa
        </button>
        <button
          type="button"
          disabled={disabled || !canUndo}
          onClick={onUndo}
          className={[
            'h-11 rounded-full border border-border text-sm font-bold uppercase tracking-wider',
            'inline-flex items-center justify-center gap-1 min-h-[44px]',
            'text-muted-foreground hover:text-foreground hover:border-border-hover hover:bg-surface-elevated',
            'disabled:opacity-40 transition-colors active:scale-95',
          ].join(' ')}
          aria-label="Hoàn tác bước trước"
          title="Hoàn tác (Ctrl+Z)"
        >
          ↶ Hoàn tác
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground text-center leading-tight">
        {notesMode
          ? 'Đang ghi chú — chạm số để bật/tắt dấu nhỏ'
          : 'Số mờ: bấm để xem lý do không đặt được'}
      </p>
    </div>
  );
}
