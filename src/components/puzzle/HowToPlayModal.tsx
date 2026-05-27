'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'thinkgrid-howto-seen-v1';

interface HowToPlayModalProps {
  open: boolean;
  onClose: () => void;
}

function MiniSegmentBoard() {
  return (
    <div
      className="inline-grid grid-cols-5 gap-0 border-[3px] border-foreground rounded-sm text-xs font-bold"
      aria-hidden
    >
      {['1', '2', '|', '1', '2'].map((t, i) => (
        <div
          key={i}
          className={[
            'aspect-square flex items-center justify-center',
            t === '|'
              ? 'bg-foreground text-background text-[10px] px-0'
              : 'bg-background border border-border/60',
          ].join(' ')}
        >
          {t === '|' ? '' : t}
        </div>
      ))}
    </div>
  );
}

const STEPS = [
  {
    title: 'Đây không phải Sudoku',
    body: (
      <p>
        ThinkGrid <strong>không</strong> yêu cầu cả hàng hay cột không lặp số. Chỉ các{' '}
        <strong>đoạn</strong> bị ngăn bởi tường hoặc ô đen mới phải chứa đủ các số{' '}
        <strong>1…n</strong> (không trùng trong cùng đoạn).
      </p>
    ),
  },
  {
    title: 'Đoạn (segment) là gì?',
    body: (
      <div className="space-y-3">
        <MiniSegmentBoard />
        <p className="text-sm text-muted-foreground">
          Tường dọc chia hàng thành hai đoạn: đoạn 2 ô cần 1–2; đoạn 3 ô cần 1–2–3. Cùng một hàng
          có thể có hai số <strong>3</strong> nếu nằm ở hai đoạn khác nhau.
        </p>
      </div>
    ),
  },
  {
    title: 'Vì sao một ô chỉ nhận vài số?',
    body: (
      <p className="text-sm">
        Mỗi ô thuộc một đoạn ngang và một đoạn dọc. Ô chỉ được nhập từ{' '}
        <strong>1</strong> đến <strong>min(độ dài ngang, độ dài dọc)</strong>. Ví dụ: ngang 4 ô,
        dọc 2 ô → chỉ được <strong>1 hoặc 2</strong>.
      </p>
    ),
  },
  {
    title: 'Cách thao tác',
    body: (
      <ul className="text-sm space-y-1.5 list-disc pl-5 text-muted-foreground">
        <li>Chọn ô → chọn số trên bàn phím số.</li>
        <li>
          <strong>Ghi chú</strong>: đánh dấu khả năng (không tính là đáp án).
        </li>
        <li>
          <strong>Xóa</strong> / Backspace: xóa số và ghi chú ô đang chọn.
        </li>
        <li>
          <strong>Hoàn tác</strong> hoặc Ctrl+Z / ⌘Z.
        </li>
        <li>Bấm <strong>Bắt đầu chơi</strong> trước khi nhập và đếm giờ.</li>
      </ul>
    ),
  },
] as const;

export function HowToPlayModal({ open, onClose }: HowToPlayModalProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  if (!open) return null;

  const last = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="howto-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h2 id="howto-title" className="text-lg font-bold">
            Cách chơi ThinkGrid
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-bold"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <p className="text-xs font-bold uppercase tracking-wider text-accent">
          Bước {step + 1} / {STEPS.length}
        </p>
        <h3 className="font-semibold">{STEPS[step].title}</h3>
        <div className="text-foreground/90">{STEPS[step].body}</div>

        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-2.5 rounded-full border border-border font-bold text-sm"
            >
              Quay lại
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (last) {
                try {
                  localStorage.setItem(STORAGE_KEY, '1');
                } catch {
                  /* ignore */
                }
                onClose();
              } else {
                setStep((s) => s + 1);
              }
            }}
            className="flex-1 py-2.5 rounded-full bg-accent text-background font-bold text-sm uppercase tracking-wider"
          >
            {last ? 'Bắt đầu chơi' : 'Tiếp'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function shouldAutoOpenHowToPlay(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== '1';
  } catch {
    return false;
  }
}
