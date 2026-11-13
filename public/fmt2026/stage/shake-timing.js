// Keep the timing game separate from the server-authoritative prize draw.
const SWEEP_MS = 2350;
const HOLD_LIMIT_MS = 8000;
// Một cú chạm lỡ tay ngắn hơn mức này không tính là lắc.
const MIN_HOLD_MS = 420;
const GOLD_START = 0.727;
const GOLD_END = 0.773;
const GOLD_MID = (GOLD_START + GOLD_END) / 2;
// Vùng "sát khe" quanh khe sáng: không trúng nhưng vẫn được khen.
const NEAR_MARGIN = 0.055;
const INSTRUCTION = 'Giữ Lắc, nhả khi kim lọt vào khe sáng.';

export function createShakeTiming({ root, button, hint, word, status, sound, getPhase, setPhase, say, onPower, onRating, launch }) {
  let hold = null;
  let frameId = 0;
  let launchTimer = 0;
  let power = 0;
  let wasInGold = false;

  root.style.setProperty('--gold-start', GOLD_START);
  root.style.setProperty('--gold-end', GOLD_END);

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
    clearTimeout(launchTimer);
    root.dataset.holding = 'false';
    showPower(0);
    setTiming('', 'Lắc', INSTRUCTION);
    status.textContent = '';
  }

  function sweepPower(elapsed) {
    return (elapsed % SWEEP_MS) / SWEEP_MS;
  }

  function inGoldZone(value) {
    return value >= GOLD_START && value <= GOLD_END;
  }

  // Khoảng cách vòng tròn từ kim tới giữa khe sáng (0..0.5).
  function gap(value) {
    const distance = Math.abs(value - GOLD_MID);
    return Math.min(distance, 1 - distance);
  }

  function begin(input) {
    if (getPhase() !== 'charge' || hold) return;
    hold = { input, start: performance.now() };
    wasInGold = false;
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
    const gold = inGoldZone(power);
    // Tiếng "ting" mỗi lần kim lướt qua khe giúp người chơi bắt nhịp ở vòng sau.
    if (gold && !wasInGold) sound.slotPass();
    wasInGold = gold;
    const timing = gold ? 'target' : '';
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
    const perfect = reason === 'release' && inGoldZone(value);
    const near = reason === 'release' && !perfect && gap(value) <= NEAR_MARGIN + (GOLD_END - GOLD_START) / 2;
    // Nửa vòng ngay sau khe là "trễ", nửa vòng trước khe là "sớm".
    const late = (value - GOLD_MID + 1) % 1 < 0.5;
    const grade = perfect ? 'perfect' : reason === 'timeout' ? 'auto' : near ? 'near' : 'ok';
    const rating = perfect ? 'Chuẩn khe!' : reason === 'timeout' ? 'Tự tung!' : near ? 'Sát khe!' : late ? 'Hơi trễ!' : 'Hơi sớm!';
    setTiming(perfect ? 'perfect' : near ? 'near' : 'released', rating, perfect ? 'Trúng khe sáng!' : near ? 'Suýt trúng khe sáng!' : '');
    status.textContent = rating;
    if (perfect) sound.perfect();
    else if (near) sound.near();
    onRating({ grade, rating });
    setPhase('timing');
    // Càng sát khe, quà tung càng mạnh; kết quả rút vẫn do máy chủ quyết định.
    const strength = perfect ? 1 : reason === 'timeout' ? 0.65 : Math.max(0.45, 0.88 - gap(value) * 1.1);
    launchTimer = setTimeout(() => { void launch(strength); }, perfect ? 760 : 520);
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
