// Keep the timing game separate from the server-authoritative prize draw.
const SWEEP_MS = 2350;
const HOLD_LIMIT_MS = 8000;
const MIN_POWER = 0.35;
const GOLD_START = 0.727;
const GOLD_END = 0.773;
const INSTRUCTION = 'Giữ Lắc, nhả khi kim lọt vào khe sáng.';

export function createShakeTiming({ root, button, hint, word, status, sound, getPhase, setPhase, say, onPower, onPerfect, launch }) {
  let hold = null;
  let frameId = 0;
  let launchTimer = 0;
  let power = 0;

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

  function begin(input) {
    if (getPhase() !== 'charge' || hold) return;
    hold = { input, start: performance.now() };
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
    const timing = inGoldZone(power) ? 'target' : '';
    if (root.dataset.timing !== timing) {
      setTiming(timing, timing ? 'Nhả!' : 'Lắc', timing ? 'Nhả ngay!' : INSTRUCTION);
    }
    frameId = requestAnimationFrame(frame);
  }

  function end(input, reason = 'release') {
    if (getPhase() !== 'charge' || hold?.input !== input) return;
    const strength = reason === 'timeout' ? 0.65 : sweepPower(performance.now() - hold.start);
    hold = null;
    cancelAnimationFrame(frameId);
    root.dataset.holding = 'false';
    sound.stopShakeMusic();

    if (reason === 'cancel') {
      showPower(0);
      setTiming('', 'Lắc', INSTRUCTION);
      return;
    }
    showPower(strength);
    if (strength < MIN_POWER) {
      showPower(0);
      sound.fizzle();
      say('fizzle');
      setTiming('retry', 'Lắc', 'Giữ lại và nhả trong khe sáng!');
      status.textContent = hint.textContent;
      return;
    }

    const perfect = reason === 'release' && inGoldZone(strength);
    const rating = perfect ? 'Tuyệt vời!' : reason === 'timeout' ? 'Tự tung!' : strength > GOLD_END ? 'Qua khe!' : 'Được rồi!';
    setTiming(perfect ? 'perfect' : 'released', rating, perfect ? 'Trúng khe sáng!' : '');
    status.textContent = rating;
    if (perfect) {
      sound.perfect();
      onPerfect();
    }
    setPhase('timing');
    launchTimer = setTimeout(() => { void launch(perfect ? 1 : Math.min(strength, 0.85)); }, perfect ? 620 : 460);
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
