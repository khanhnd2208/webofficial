// Keep the timing game separate from the server-authoritative prize draw.
const SWEEP_MS = 2350;
const HOLD_LIMIT_MS = 8000;
// Một cú chạm lỡ tay ngắn hơn mức này không tính là lắc.
const MIN_HOLD_MS = 420;
// Khe sáng nằm ở đỉnh mặt đồng hồ. Lõi rất hẹp cho 100%; ra hai phía độ chính xác giảm đều
// và về 0% ở điểm đối diện. Một vòng 2,35 giây nên 1% ứng với khoảng 11 mili giây.
const SLOT_MID = 0.75;
const SLOT_CORE = 0.01;
// Phần đuôi sáng mờ dần hai bên lõi (chỉ để nhìn).
const SLOT_TAIL = 0.07;
const NEAR_ACCURACY = 90;
// Từ mức này trở lên mặt nút đổi thành "Nhả!".
const CUE_ACCURACY = 94;
const INSTRUCTION = 'Giữ Lắc, nhả khi kim lọt vào khe sáng.';

export function createShakeTiming({ root, button, hint, word, status, sound, getPhase, setPhase, say, onPower, onRating, reduced, launch }) {
  let hold = null;
  let frameId = 0;
  let launchTimer = 0;
  let power = 0;
  let wasInCue = false;
  let countId = 0;

  root.style.setProperty('--slot-mid', SLOT_MID);
  root.style.setProperty('--slot-core', SLOT_CORE);
  root.style.setProperty('--slot-tail', SLOT_TAIL);

  function setTiming(state, label, instruction) {
    root.dataset.timing = state;
    word.textContent = label;
    hint.textContent = instruction;
  }

  function showPower(value) {
    power = value;
    root.style.setProperty('--power', value.toFixed(4));
    // 0..1: kim càng gần khe sáng, mặt đồng hồ càng rực.
    root.style.setProperty('--near', Math.max(0, 1 - gap(value) / 0.2).toFixed(3));
    onPower(value);
  }

  function reset() {
    if (hold) sound.stopShakeMusic();
    hold = null;
    cancelAnimationFrame(frameId);
    cancelAnimationFrame(countId);
    clearTimeout(launchTimer);
    root.dataset.holding = 'false';
    showPower(0);
    setTiming('', 'Lắc', INSTRUCTION);
    status.textContent = '';
  }

  function sweepPower(elapsed) {
    return (elapsed % SWEEP_MS) / SWEEP_MS;
  }

  // Khoảng cách vòng tròn từ kim tới giữa khe sáng (0..0.5).
  function gap(value) {
    const distance = Math.abs(value - SLOT_MID);
    return Math.min(distance, 1 - distance);
  }

  // Độ chính xác 0..100. Chỉ trong lõi khe mới được 100; ngoài lõi cao nhất là 99.
  function accuracyOf(value) {
    const off = gap(value) - SLOT_CORE;
    if (off <= 0) return 100;
    return Math.min(99, Math.max(0, Math.floor(100 * (1 - off / (0.5 - SLOT_CORE)))));
  }

  // Số phần trăm chạy từ 0 lên trên mặt nút.
  function countTo(target) {
    cancelAnimationFrame(countId);
    if (reduced()) {
      word.textContent = target + '%';
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const u = Math.min(1, (now - start) / 380);
      word.textContent = Math.round(target * (1 - (1 - u) ** 3)) + '%';
      if (u < 1) countId = requestAnimationFrame(step);
    };
    step(start);
  }

  function begin(input) {
    if (getPhase() !== 'charge' || hold) return;
    hold = { input, start: performance.now() };
    wasInCue = false;
    showPower(0);
    root.dataset.holding = 'true';
    setTiming('', 'Lắc', INSTRUCTION);
    status.textContent = '';
    sound.startShakeMusic();
    say('shake');
    frameId = requestAnimationFrame(frame);
  }

  function frame(now) {
    if (!hold) return;
    const elapsed = Math.max(0, now - hold.start);
    if (elapsed >= HOLD_LIMIT_MS) {
      end(hold.input, 'timeout');
      return;
    }
    showPower(sweepPower(elapsed));
    const cue = accuracyOf(power) >= CUE_ACCURACY;
    // Tiếng "ting" mỗi lần kim lướt tới khe giúp người chơi bắt nhịp ở vòng sau.
    if (cue && !wasInCue) sound.slotPass();
    wasInCue = cue;
    const timing = cue ? 'target' : '';
    if (root.dataset.timing !== timing) {
      setTiming(timing, timing ? 'Nhả!' : 'Lắc', timing ? 'Nhả ngay!' : INSTRUCTION);
    }
    frameId = requestAnimationFrame(frame);
  }

  function end(input, reason = 'release') {
    if (getPhase() !== 'charge' || hold?.input !== input) return;
    const elapsed = performance.now() - hold.start;
    const value = sweepPower(elapsed);
    hold = null;
    cancelAnimationFrame(frameId);
    root.dataset.holding = 'false';
    sound.stopShakeMusic();

    if (reason === 'cancel') {
      showPower(0);
      setTiming('', 'Lắc', INSTRUCTION);
      return;
    }
    if (reason === 'release' && elapsed < MIN_HOLD_MS) {
      showPower(0);
      sound.fizzle();
      say('fizzle');
      setTiming('retry', 'Lắc', 'Giữ lại và nhả trong khe sáng!');
      status.textContent = hint.textContent;
      return;
    }

    showPower(value);
    if (reason === 'timeout') {
      // Giữ quá lâu: túi tự tung, không chấm điểm.
      setTiming('auto', 'Tự tung!', '');
      status.textContent = 'Tự tung!';
      onRating({ grade: 'auto', rating: 'Tự tung!', accuracy: null });
      setPhase('timing');
      launchTimer = setTimeout(() => { void launch(0.65); }, 520);
      return;
    }
    const accuracy = accuracyOf(value);
    const perfect = accuracy === 100;
    const near = !perfect && accuracy >= NEAR_ACCURACY;
    // Nửa vòng ngay sau khe là "trễ", nửa vòng trước khe là "sớm".
    const late = (value - SLOT_MID + 1) % 1 < 0.5;
    const grade = perfect ? 'perfect' : near ? 'near' : 'ok';
    const rating = perfect ? 'Chuẩn khe!' : near ? 'Sát khe!' : late ? 'Hơi trễ!' : 'Hơi sớm!';
    const summary = 'Độ chính xác ' + accuracy + '%';
    setTiming(perfect ? 'perfect' : near ? 'near' : 'released', '0%', summary);
    countTo(accuracy);
    status.textContent = rating + ' ' + summary;
    if (perfect) sound.perfect();
    else if (near) sound.near();
    onRating({ grade, rating, accuracy });
    setPhase('timing');
    // Càng chính xác, quà tung càng mạnh; kết quả rút vẫn do máy chủ quyết định.
    const strength = Math.max(0.45, accuracy / 100);
    launchTimer = setTimeout(() => { void launch(strength); }, perfect ? 820 : 620);
  }

  button.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || hold || getPhase() !== 'charge') return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    begin(event.pointerId);
  });
  button.addEventListener('pointerup', (event) => end(event.pointerId));
  for (const type of ['pointercancel', 'lostpointercapture']) {
    button.addEventListener(type, (event) => end(event.pointerId, 'cancel'));
  }
  button.addEventListener('contextmenu', (event) => event.preventDefault());
  addEventListener('blur', () => { if (hold) end(hold.input, 'cancel'); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && hold) end(hold.input, 'cancel');
  });

  return { reset, begin, end };
}
