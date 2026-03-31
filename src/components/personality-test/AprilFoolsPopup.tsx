'use client';

/* ════════════════════════════════════════════════════════════════════════
   AprilFoolsPopup — April Fools' Day Event Popup (1/4)

   Flow:
     State 1 — "Choose a lucky number" (3 buttons)
     State 2 — "You got pranked!" + confetti + random script
     State 3 — Fade out & unmount

   Appears only on April 1st (month=3, day=1 in JS Date).
   User can dismiss at any state via ESC or ✕ button.
   ════════════════════════════════════════════════════════════════════════ */

import { useEffect, useCallback, useState, useRef } from 'react';
import confetti from 'canvas-confetti';

// ─── April Fools scripts (15 kịch bản, random mỗi lần load) ─────────────────
const SCRIPTS: readonly string[] = [
  // ── Nhóm gốc ──
  'Tèn ten! Không có món quà vật chất nào ở đây cả, bạn đã dính cú lừa Cá Tháng Tư rồi! 🐟 Nhưng bạn biết không, món quà tuyệt vời nhất không nằm sau một nút bấm, mà nằm ở chính việc bạn đang nỗ lực thấu hiểu bản thân mình. Chúc bạn một ngày ngập tràn niềm vui và hãy để bài test này giúp bạn mở khóa \u201Ckho báu\u201D thực sự bên trong bạn nhé!',
  'Bíp bíp! Cảnh báo: Bạn vừa trúng giải \u201CNgười Dễ Tin Nhất Hệ Mặt Trời\u201D nhân ngày 1/4! 😜 Đùa chút thôi! Sự cả tin đôi khi lại là biểu hiện của một tâm hồn cởi mở và chân thành đấy. Chúc bạn luôn giữ được sự đáng yêu này. Giờ thì, hãy làm bài test để xem chúng ta có đoán đúng về tính cách \u201Cngây thơ vô số tội\u201D của bạn không nhé!',
  'Aha! Bạn bị lừa rồi! 🎁 Chiếc hộp này rỗng tuếch! Nhưng đừng vội thất vọng. May mắn không tự nhiên sinh ra từ việc chọn những con số, may mắn đến khi bạn biết rõ mình là ai và phát huy thế mạnh của mình. Chúc bạn một tháng 4 rực rỡ và luôn tự tin là chính mình. Bắt đầu hành trình khám phá bản thân ngay thôi!',
  'Vũ trụ gửi đến bạn thông điệp: BẠN VỪA BỊ LỪA CÁ THÁNG TƯ! 🌌 😂 Sự thật là chẳng có quà tặng random nào cả. Vũ trụ chỉ muốn nhắc bạn rằng, định mệnh của bạn nằm trong tay bạn, và hiểu rõ bản thân là bước đầu tiên để làm chủ nó. Chúc bạn luôn bình an và sáng suốt. Cùng xem bài test này sẽ tiết lộ thông điệp gì tiếp theo cho bạn nhé!',
  'Bùm! 💥 Quà bay màu rồi vì hôm nay là Cá Tháng Tư! Dù không có quà, nhưng tôi gửi đến bạn 100% năng lượng tích cực cho ngày hôm nay. Chúc bạn lúc nào cũng cười tươi như lúc này (hoặc ít nhất là bớt quạu vì bị lừa nha). Vào làm test thôi nào!',

  // ── Nhóm 1: Giáo sư / Chuyên gia Tâm lý ──
  'Ting ting! Chúc mừng bạn đã quay vào ô... Mất Lượt! 🎓 Nếu đây là một bài kiểm tra trên lớp, có lẽ bạn vừa bị trừ 1 điểm vì tội quá cả tin rồi đó! Nhưng ở đây, không có đúng sai, chỉ có sự thấu hiểu. Cười một cái cho ngày Cá tháng Tư thêm vui, và cùng bước vào bài trắc nghiệm thực sự nhé!',
  'Bất ngờ chưa! Chẳng có phần thưởng nào cả, chỉ có một \u201Ccú lừa\u201D ngọt ngào thôi! 😈 Liệu sự lựa chọn ngẫu nhiên vừa rồi có phản ánh chút gì đó về chỉ số rủi ro hay sự tò mò trong bạn không? Hãy để bài test tính cách này bóc tách chi tiết hơn, từ những điểm sáng rực rỡ đến những góc khuất bất ngờ nhất. Sẵn sàng đối diện với chính mình chưa?',
  'Oops! Món quà này đã bị phòng Nhân sự cắt giảm ngân sách đúng ngày 1/4 rồi! 📉 Nhưng bù lại, phần thưởng lớn nhất chính là việc bạn thấu hiểu bản năng và hành vi của chính mình. Quản trị bản thân tốt là bước đầu tiên để làm chủ mọi thứ khác. Cùng làm bài test xem \u201Ctổ chức\u201D nội tâm của bạn đang vận hành thế nào nhé!',

  // ── Nhóm 2: Chiêm tinh / Vũ trụ ──
  'Cá cắn câu! 🎣 Hôm nay các chòm sao may mắn của bạn đang đi vắng, và các vì tinh tú báo rằng: Không có quà \u201Ctừ trên trời rơi xuống\u201D đâu! 🌠 Thay vì chờ đợi vận may, sao chúng ta không tự giải mã lá số cuộc đời mình bằng việc thấu hiểu bản thân nhỉ? Bắt đầu bài test ngay để xem \u201Cvũ trụ\u201D bên trong bạn ẩn chứa sức mạnh gì!',
  'Trải bài Tarot ngày 1/4 của bạn hiện lên lá... \u201CThe Fool\u201D (Kẻ Ngốc)! 🃏 Xin lỗi vì cú lừa này nhé! Nhưng bạn biết không, \u201CThe Fool\u201D cũng mang ý nghĩa của một khởi đầu mới đầy can đảm và tự do. Hãy mang tinh thần cởi mở đó vào bài test này để khám phá những khía cạnh tính cách mà chính bạn cũng chưa từng nghĩ tới!',

  // ── Nhóm 3: Kể chuyện (Storytelling) ──
  'Chương 1: Cú lừa ngày Cá Tháng Tư! 📖 Bạn vừa lật mở một trang sách không có kho báu, nhưng lại mở ra một hành trình thú vị hơn nhiều. Mỗi người chúng ta là một cuốn tiểu thuyết đồ sộ, và bài test này chính là phần mục lục giúp bạn đọc vị chính mình. Lật trang tiếp theo và khám phá câu chuyện của bạn nhé!',
  'Bạn đi tìm vàng, nhưng lại nhặt được... một vố lừa 1/4! 🪙 Đừng buồn, vì mỏ vàng thực sự không nằm sau những con số vô tri kia, mà nằm sâu trong tư duy và tính cách của bạn. Hôm nay có thể bạn mất cảnh giác một chút, nhưng chắc chắn bạn sẽ tìm thấy một phiên bản rất tuyệt vời của mình sau khi hoàn thành bài test này!',

  // ── Nhóm 4: Gen Z ──
  'Cảm giác bị lừa ngày 1/4 thế nào? Cay ngang không? 🌶️ Quà thì xin phép \u201Ckhất\u201D nhé, nhưng bù lại xin tặng bạn một tấm vé VIP để khám phá trạm vũ trụ tâm hồn của chính bạn. Hãy cứ tò mò và ngây thơ như cách bạn vừa bấm nút vậy. Bắt đầu test thôi, hứa đoạn sau không lừa nữa!',
  'Hệ thống thông báo: Giao dịch nhận quà thất bại vì lý do... hôm nay là 1/4! 🤖 Bị lừa một vố đau xót, nhưng thà đau một lần rồi thôi còn hơn cả đời không biết mình là ai đúng không? Quẹt nước mắt và dồn sự \u201Ctổn thương\u201D này vào việc hoàn thành xuất sắc bài test tính cách dưới đây nào!',
  'Ú òa! Nút bấm này chỉ là cú lừa, y hệt cách deadline dí bạn vậy! ⏰ Dù không có quà, nhưng mong bạn luôn giữ được sự lạc quan tuyệt đối này. Giờ thì hít một hơi thật sâu, dẹp sự dỗi hờn sang một bên và xem tính cách của bạn thú vị cỡ nào nhé!',
];

// ─── Types ────────────────────────────────────────────────────────────────────
type PopupPhase = 'choose' | 'reveal' | 'closing' | 'done';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isAprilFools(): boolean {
  const now = new Date();
  return now.getMonth() === 3 && now.getDate() === 1; // April = month 3
}

function randomScript(): string {
  return SCRIPTS[Math.floor(Math.random() * SCRIPTS.length)];
}

function fireConfetti() {
  const defaults = { startVelocity: 30, spread: 360, ticks: 80, zIndex: 9999 };
  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  const interval = window.setInterval(() => {
    confetti({
      ...defaults,
      particleCount: 50,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#c44b28', '#5b7fb5', '#8b6fb0', '#4a9e8f', '#c48a1a'],
    });
    confetti({
      ...defaults,
      particleCount: 50,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#c44b28', '#5b7fb5', '#8b6fb0', '#4a9e8f', '#c48a1a'],
    });
  }, 250);

  // Stop after 2.5 s
  window.setTimeout(() => window.clearInterval(interval), 2500);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AprilFoolsPopup() {
  const [phase, setPhase] = useState<PopupPhase>('choose');
  const [revealText, setRevealText] = useState('');
  const [visible, setVisible] = useState(false); // drives CSS opacity
  const [mounted, setMounted] = useState(false);  // controls DOM presence
  const initialized = useRef(false);

  // ── Mount with slight delay so CSS transition can fire
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Only show on April 1st (and not if user already dismissed today)
    if (!isAprilFools()) return;

    const dismissed = sessionStorage.getItem('april-fools-dismissed');
    if (dismissed === 'true') return;

    // Pick random script early so it's stable per session
    setRevealText(randomScript());

    setMounted(true);
    // Small rAF delay to allow mount → trigger CSS fade-in
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setVisible(true));
    });
  }, []);

  // ── ESC key handler
  const dismiss = useCallback(() => {
    setPhase('closing');
    setVisible(false);
    sessionStorage.setItem('april-fools-dismissed', 'true');
    confetti.reset();
    window.setTimeout(() => setPhase('done'), 450);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mounted, dismiss]);

  // ── Number button clicked
  const handleNumberClick = useCallback(() => {
    fireConfetti();
    setPhase('reveal');
  }, []);

  // ── CTA button → close
  const handleCTA = useCallback(() => {
    dismiss();
  }, [dismiss]);

  if (!mounted || phase === 'done') return null;

  return (
    <>
      {/* ── Inline styles (pure CSS, no runtime overhead) ── */}
      <style>{`
        .af-overlay {
          position: fixed;
          inset: 0;
          z-index: 9998;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .af-overlay.af-visible {
          opacity: 1;
        }

        .af-modal {
          position: relative;
          background: var(--surface-elevated);
          border-radius: var(--radius-xl);
          box-shadow:
            0 20px 60px -10px rgba(0, 0, 0, 0.25),
            0 8px 24px -6px rgba(0, 0, 0, 0.12);
          padding: 2rem 2rem 1.75rem;
          width: 100%;
          max-width: 420px;
          transform: translateY(24px) scale(0.97);
          opacity: 0;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                      opacity 0.35s ease;
        }
        .af-overlay.af-visible .af-modal {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
        /* Fade-out for closing */
        .af-overlay.af-closing .af-modal {
          transform: translateY(-16px) scale(0.96);
          opacity: 0;
        }

        /* ── Close (X) button */
        .af-close-btn {
          position: absolute;
          top: 0.875rem;
          right: 0.875rem;
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          border: none;
          background: var(--surface-hover);
          color: var(--muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          line-height: 1;
          transition: background 0.18s ease, color 0.18s ease;
        }
        .af-close-btn:hover {
          background: var(--surface-active);
          color: var(--foreground);
        }

        /* ── Header fish tag */
        .af-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--accent);
          background: var(--accent-subtle);
          border-radius: var(--radius-full);
          padding: 0.25rem 0.75rem;
          margin-bottom: 0.75rem;
        }

        .af-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--foreground);
          line-height: 1.3;
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
        }
        .af-title-reveal {
          font-size: 1.375rem;
        }

        .af-desc {
          font-size: 0.9rem;
          color: var(--muted-foreground);
          line-height: 1.65;
          margin: 0 0 1.5rem;
        }

        /* ── Number buttons */
        .af-numbers {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          margin-bottom: 0.25rem;
        }
        .af-num-btn {
          flex: 1;
          padding: 0.875rem 0.5rem;
          border: 2px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--surface);
          color: var(--foreground);
          font-size: 1.05rem;
          font-weight: 700;
          cursor: pointer;
          transition: border-color 0.2s ease,
                      background 0.2s ease,
                      transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.2s ease;
        }
        .af-num-btn:hover {
          border-color: var(--accent);
          background: var(--accent-subtle);
          color: var(--accent);
          transform: translateY(-3px) scale(1.04);
          box-shadow: 0 6px 20px -4px rgba(196, 75, 40, 0.25);
        }
        .af-num-btn:active {
          transform: scale(0.97);
        }

        /* ── Reveal content area */
        .af-reveal {
          animation: af-pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes af-pop-in {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }

        .af-script-card {
          background: var(--surface-secondary);
          border-radius: var(--radius-lg);
          border-left: 3px solid var(--accent);
          padding: 1rem 1rem 1rem 1.1rem;
          font-size: 0.875rem;
          color: var(--foreground-secondary);
          line-height: 1.7;
          margin-bottom: 1.25rem;
        }

        /* ── CTA button */
        .af-cta-btn {
          display: block;
          width: 100%;
          padding: 0.875rem 1.5rem;
          border-radius: var(--radius-lg);
          border: none;
          background: var(--accent);
          color: var(--accent-foreground);
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: -0.01em;
          transition: background 0.18s ease,
                      transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.2s ease;
        }
        .af-cta-btn:hover {
          background: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px -6px rgba(196, 75, 40, 0.4);
        }
        .af-cta-btn:active {
          transform: scale(0.98);
        }

        /* ── Divider */
        .af-divider {
          height: 1px;
          background: var(--border);
          margin: 1.25rem 0 1rem;
        }

        /* ── Skip hint */
        .af-skip {
          text-align: center;
          font-size: 0.75rem;
          color: var(--muted);
          margin-top: 0.75rem;
        }

        /* ── Responsive */
        @media (max-width: 480px) {
          .af-modal {
            padding: 1.5rem 1.25rem 1.5rem;
          }
          .af-title { font-size: 1.1rem; }
          .af-title-reveal { font-size: 1.2rem; }
          .af-num-btn { font-size: 0.95rem; padding: 0.8rem 0.35rem; }
        }
      `}</style>

      {/* ── Overlay ── */}
      <div
        className={`af-overlay ${visible ? 'af-visible' : ''} ${phase === 'closing' ? 'af-closing' : ''}`}
        aria-modal="true"
        role="dialog"
        aria-label="Sự kiện Cá Tháng Tư"
        onClick={(e) => {
          // Click outside modal dismisses
          if (e.target === e.currentTarget) dismiss();
        }}
      >
        {/* ── Modal ── */}
        <div className="af-modal">
          {/* Close ✕ */}
          <button className="af-close-btn" onClick={dismiss} aria-label="Đóng popup">
            ✕
          </button>

          {/* ════ STATE 1: Choose a number ════ */}
          {phase === 'choose' && (
            <>
              <div className="af-tag">🐟 Sự kiện 1/4</div>
              <h2 className="af-title">
                Tôi có món quà — hãy chọn 1 số may mắn điiiii
              </h2>
              <p className="af-desc">
                Hãy chọn 1 trong 3 con số dưới đây để nhận một món quà bất ngờ
                trước khi làm bài test nhé!
              </p>

              <div className="af-numbers">
                {(['Số 1', 'Số 2', 'Số 3'] as const).map((label) => (
                  <button
                    key={label}
                    className="af-num-btn"
                    onClick={handleNumberClick}
                    aria-label={`Chọn ${label}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="af-divider" />
              <p className="af-skip">Nhấn ESC hoặc ✕ để bỏ qua</p>
            </>
          )}

          {/* ════ STATE 2: Reveal ════ */}
          {phase === 'reveal' && (
            <div className="af-reveal">
              <div className="af-tag">🎉 Kết quả</div>
              <h2 className="af-title af-title-reveal">
                🐟 Aha! Bạn dính thính rồi!
              </h2>

              <div className="af-script-card">
                {revealText}
              </div>

              <button className="af-cta-btn" onClick={handleCTA}>
                😄 Cười lên và bắt đầu làm Test thôi!
              </button>

              <div className="af-divider" />
              <p className="af-skip">Nhấn ESC hoặc ✕ để bỏ qua</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
