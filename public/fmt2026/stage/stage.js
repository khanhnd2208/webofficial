import { api } from './booth-api.js';
import { allocateSlots } from './wheel-slots.js';
import { COLORS, COUPONS, LINES, LUCK, SHORT_NAMES, TIER_LABEL } from './stage-content.js';

(() => {
  const { sound } = FMT;
  const root = document.querySelector('.stage');
  const $ = (selector) => root.querySelector(selector);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ASSET = '/fmt2026/';
  const TAU = Math.PI * 2;
  const SLOTS = 12;
  const STEP = TAU / SLOTS;
  const MIN_POWER = 0.35;

  let prizes = [];
  let luckLeft = 0;
  let canDraw = false;
  let refreshing = false;
  let stockSnapshot = null;

  const prizeSrc = (item) => {
    const original = ASSET + 'prizes/' + item.slug + '.svg';
    return SHORT_NAMES[item.slug] && item.imagePath === original
      ? ASSET + 'prizes/' + item.slug + '.webp'
      : item.imagePath || toteSrc;
  };
  const poseSrc = (side, pose) => ASSET + 'teachers/teacher-' + side + '-' + pose + '.webp';
  const toteSrc = ASSET + 'stage/tote.webp';
  // Dùng ảnh gần nhất nếu một tư thế tải lỗi.
  const POSE_FALLBACK = { shake: 'reach', wow: 'present', cheer: 'present' };
  const poseReady = {};

  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const clamp01 = (value) => Math.max(0, Math.min(1, value));
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const mod = (value, n) => ((value % n) + n) % n;

  const gate = $('.gate');
  const gateStatus = $('#gateStatus');
  const errorText = $('#stageError');
  const pinForm = $('#pinForm');
  const retry = $('#retry');
  const intro = $('.intro');
  const chargeBox = $('.charge');
  const shakeBtn = $('#shake');
  const chargeHint = $('#chargeHint');
  const wheelEl = $('.wheel');
  const tokensEl = $('.tokens');
  const hubName = $('#hubName');
  const pointer = $('.pointer i');
  const bubble = $('.bubble');
  const reveal = $('.reveal');
  const confetti = FMT.confetti($('canvas'));

  let phase = 'loading';
  let active = null;
  let power = 0;
  let holding = false;
  let fullSince = 0;
  let lastRattle = 0;
  let chargeLast = 0;
  let chargeFrameId = 0;
  let sinceEpic = 0;
  let idleTimer = 0;
  let turn = 0;
  const recent = [];

  // ── Dựng sân khấu ─────────────────────────────────────────────
  const hosts = ['a', 'b'].map((side) => {
    const host = document.createElement('button');
    host.type = 'button';
    host.className = 'host';
    host.dataset.host = side;
    host.setAttribute('aria-label', side === 'a' ? 'Rút quà cùng thầy' : 'Rút quà cùng cô');
    host.innerHTML = '<span class="bag bag-back"><img alt=""></span><img class="pose" alt=""><img class="peek" alt=""><span class="glow"></span><span class="bag bag-front"><img alt=""></span><span class="host-label" aria-hidden="true">Chọn ' + (side === 'a' ? 'thầy' : 'cô') + '</span>';
    host.querySelectorAll('.bag img').forEach((img) => { img.src = toteSrc; });
    host.addEventListener('click', () => choose(host));
    $('.hosts').append(host);
    return host;
  });
  hosts.forEach((host) => setPose(host, 'idle'));
  for (const side of ['a', 'b']) {
    for (const pose of Object.keys(POSE_FALLBACK)) {
      const probe = new Image();
      probe.onload = () => { poseReady[side + pose] = true; };
      probe.src = poseSrc(side, pose);
    }
  }

  $('.bulbs').innerHTML = Array.from({ length: 24 }, (_, i) => '<i style="--i:' + i + '"></i>').join('');
  function toStagePrize(prize) {
    const names = SHORT_NAMES[prize.slug];
    return { ...prize, short: names?.[0] === prize.name ? names[1] : prize.name, count: prize.remaining };
  }

  function syncStock(state) {
    luckLeft = state.luckLeft;
    const snapshot = JSON.stringify(state.prizes);
    if (snapshot === stockSnapshot) return;
    stockSnapshot = snapshot;
    prizes = state.prizes.map(toStagePrize);
    const stock = $('.stock');
    stock.replaceChildren(...prizes.map((item) => {
      const cell = document.createElement('div');
      cell.className = 'stock-item';
      cell.setAttribute('role', 'listitem');
      cell.title = item.name;
      cell.innerHTML = '<img alt=""><span></span><small hidden>Hết</small>';
      cell.querySelector('img').src = prizeSrc(item);
      cell.querySelector('span').textContent = item.short;
      item.stock = cell;
      renderStock(item);
      return cell;
    }));
    stock.hidden = !prizes.length;
  }

  function showError(message) {
    errorText.textContent = message;
    errorText.hidden = !message;
  }

  async function refreshBooth(next = 'idle') {
    if (refreshing) return;
    refreshing = true;
    const before = phase;
    try {
      const state = await api('state');
      if (phase !== before) return;
      canDraw = state.unlocked && state.isOpen && state.spinsLeft > 0;
      pinForm.hidden = state.unlocked || !state.hasPin;
      retry.hidden = canDraw || !pinForm.hidden;
      gateStatus.textContent = !state.hasPin ? 'Ban tổ chức chưa đặt mã PIN.'
        : !state.unlocked ? ''
        : !state.isOpen ? 'Quầy quà đang đóng.'
        : !state.spinsLeft ? 'Quầy đã hết lượt rút.'
        : '';
      if (state.unlocked) syncStock(state);
      setPhase(canDraw ? next : state.unlocked ? 'unavailable' : 'locked');
      showError('');
    } catch {
      if (phase !== before) return;
      if (phase === 'idle' || phase === 'choosing') return;
      gateStatus.textContent = '';
      setPhase('unavailable');
      retry.hidden = false;
      showError('Không tải được quầy quà. Hãy kiểm tra kết nối.');
    } finally {
      refreshing = false;
    }
  }

  function setPose(host, pose) {
    const side = host.dataset.host;
    host.dataset.pose = pose;
    const file = POSE_FALLBACK[pose] && !poseReady[side + pose] ? POSE_FALLBACK[pose] : pose;
    host.querySelector('.pose').src = poseSrc(side, file);
  }

  function renderStock(item) {
    const soldOut = item.count === 0;
    item.stock.classList.toggle('out', soldOut);
    item.stock.querySelector('small').hidden = !soldOut;
  }

  function setPhase(next) {
    const previous = phase;
    phase = next;
    root.dataset.phase = next;
    hosts.forEach((host) => { host.disabled = next !== 'choosing'; });
    gate.hidden = !['loading', 'locked', 'unavailable'].includes(next);
    if (next === 'choosing' && previous !== next) hosts[0].focus({ preventScroll: true });
    intro.hidden = next !== 'idle' && next !== 'choosing';
    $('#start').hidden = next !== 'idle';
    $('#hint').hidden = next !== 'choosing';
    chargeBox.hidden = next !== 'charge';
    wheelEl.hidden = next !== 'spin';
    reveal.hidden = next !== 'reveal';
    clearTimeout(idleTimer);
    if (next === 'choosing') idleTimer = setTimeout(() => { if (phase === 'choosing') setPhase('idle'); }, 45000);
  }

  function say(key, options = {}) {
    const self = active?.dataset.host === 'b' ? 'cô' : 'thầy';
    const text = (LINES[key] ? pick(LINES[key]) : key).replace('{self}', self);
    bubble.textContent = text;
    bubble.dataset.side = active?.dataset.host ?? 'a';
    bubble.dataset.loud = String(Boolean(options.loud));
    bubble.hidden = false;
    if (!reduced.matches) bubble.animate([{ transform: 'scale(.6) rotate(-4deg)', opacity: 0 }, { transform: 'scale(1.06)', opacity: 1, offset: 0.6 }, { transform: 'none' }], { duration: 260, easing: 'ease-out' });
  }

  // Miệng túi của một thầy/cô, tính theo điểm ảnh trong khung sân khấu.
  function mouthOf(host) {
    const bag = host.querySelector('.bag-back');
    return { x: host.offsetLeft + bag.offsetLeft + bag.offsetWidth / 2, y: host.offsetTop + bag.offsetTop + bag.offsetHeight * 0.2 };
  }
  function geometry() {
    const W = root.clientWidth;
    return { W, H: root.clientHeight, cx: W * 0.5, cy: W * 0.245, R: W * 0.132 };
  }
  function bagKick(host, name) {
    host.querySelectorAll('.bag').forEach((bag) => {
      bag.classList.remove('gulp', 'burst');
      void bag.offsetWidth;
      bag.classList.add(name);
    });
  }

  // ── Màn chờ: thỉnh thoảng một món quà ló khỏi túi ──────────────
  setInterval(() => {
    if ((phase !== 'idle' && phase !== 'choosing') || reduced.matches || document.hidden) return;
    const left = prizes.filter((item) => item.count > 0);
    if (!left.length) return;
    const host = pick(hosts);
    const peek = host.querySelector('.peek');
    peek.src = prizeSrc(pick(left));
    peek.animate([
      { transform: 'translateY(70%) rotate(-8deg)', opacity: 0 },
      { transform: 'translateY(-58%) rotate(6deg)', opacity: 1, offset: 0.3 },
      { transform: 'translateY(-52%) rotate(-3deg)', opacity: 1, offset: 0.7 },
      { transform: 'translateY(70%) rotate(-8deg)', opacity: 0 },
    ], { duration: 1700, easing: 'cubic-bezier(.3,1.3,.5,1)' });
    bagKick(host, 'gulp');
  }, 2400);

  // ── Chọn thầy cô ──────────────────────────────────────────────
  function openChoosing() {
    if (phase !== 'idle' || !canDraw) return;
    sound.select();
    setPhase('choosing');
  }

  function choose(host) {
    if (phase !== 'choosing') return;
    active = host;
    power = 0;
    root.style.setProperty('--power', '0');
    root.style.setProperty('--light-x', host.dataset.host === 'a' ? '24%' : '76%');
    root.dataset.tier = '';
    root.dataset.full = 'false';
    chargeHint.textContent = 'Giữ đến khi vòng đầy, rồi thả.';
    hosts.forEach((entry) => {
      entry.dataset.active = String(entry === host);
      entry.dataset.dim = String(entry !== host);
    });
    setPose(host, 'shake');
    sound.select();
    setPhase('charge');
    say('ready');
    shakeBtn.focus({ preventScroll: true });
  }

  // ── Nhịp 1: Lắc ───────────────────────────────────────────────
  function beginHold() {
    if (phase !== 'charge' || holding) return;
    holding = true;
    fullSince = 0;
    root.dataset.holding = 'true';
    sound.chargeStart();
    say('shake');
    chargeLast = performance.now();
    cancelAnimationFrame(chargeFrameId);
    chargeFrameId = requestAnimationFrame(chargeFrame);
  }

  function chargeFrame(now) {
    const dt = Math.min(0.25, (now - chargeLast) / 1000);
    chargeLast = now;
    power = holding ? Math.min(1, power + dt / 1.6) : Math.max(0, power - dt * 2.4);
    root.style.setProperty('--power', power.toFixed(3));
    if (holding) {
      sound.chargeUpdate(power);
      if (now - lastRattle > 170 - 110 * power) {
        lastRattle = now;
        sound.rattle(power);
        if (power > 0.45 && !reduced.matches) spark(2);
      }
      if (power >= 1) {
        if (!fullSince) {
          fullSince = now;
          root.dataset.full = 'true';
          chargeHint.textContent = 'Thả ra nào!';
        }
        // Giữ quá lâu thì túi tự bung, tránh kẹt lượt ở quầy.
        if (now - fullSince > 1500) { endHold(); return; }
      }
    }
    if (phase === 'charge' && (holding || power > 0)) chargeFrameId = requestAnimationFrame(chargeFrame);
  }

  function endHold() {
    if (!holding) return;
    holding = false;
    root.dataset.holding = 'false';
    root.dataset.full = 'false';
    sound.chargeStop();
    if (phase !== 'charge') return;
    if (power < MIN_POWER) {
      sound.fizzle();
      say('fizzle');
      chargeHint.textContent = 'Giữ lâu hơn, đầy vòng rồi hãy thả';
      return;
    }
    void launch(power);
  }

  function spark(count) {
    const { W, H } = geometry();
    const mouth = mouthOf(active);
    confetti.burst({ x: mouth.x / W, y: mouth.y / H, count, colors: COLORS.epic, spread: 1.1, power: 0.55 + power * 0.5 });
  }

  // ── Kho quà và bố trí vòng quay ──────────────────────────────────────────
  // Vòng quay minh họa kho; máy chủ chọn kết quả theo số lượng thực.
  function buildSlots(result) {
    const items = prizes.filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
    const entries = items.map((item) => ({ item, weight: item.count }));
    if (luckLeft > 0 || !entries.length) entries.push({ item: LUCK, weight: Math.max(1, luckLeft) });
    const displayed = entries.slice(0, SLOTS);
    if (result && !displayed.some((entry) => entry.item === result)) {
      displayed.splice(Math.min(displayed.length, SLOTS - 1), 1, { item: result, weight: Math.max(1, result.count || luckLeft) });
    }
    return allocateSlots(displayed, SLOTS);
  }

  function registerDraw({ prize }) {
    stockSnapshot = null;
    if (!prize) {
      luckLeft = Math.max(0, luckLeft - 1);
      return LUCK;
    }
    const result = prizes.find((item) => item.id === prize.id);
    if (result) {
      Object.assign(result, toStagePrize(prize));
      return result;
    }
    // An admin can add a prize between the last refresh and the draw.
    return toStagePrize(prize);
  }

  // ── Nhịp 2: Tung và quay ──────────────────────────────────────
  const wheel = { tokens: [], rot: 0, omega: 0, mode: 'off', tween: null, lastIndex: -1, frameId: 0, last: 0, speed: 0, onTick: null, geo: null, mouth: null };

  function makeToken(item) {
    const el = document.createElement('div');
    el.className = 'token';
    el.dataset.tier = item.tier;
    el.innerHTML = item === LUCK ? '<span class="face"><span class="heart"></span></span>' : '<span class="face"><img alt=""></span>';
    if (item !== LUCK) el.querySelector('img').src = prizeSrc(item);
    return el;
  }

  function wheelFrame(now) {
    const dt = Math.min(0.1, (now - wheel.last) / 1000);
    wheel.last = now;
    if (wheel.mode === 'spin') {
      wheel.rot += wheel.omega * dt;
      wheel.speed = 1;
    } else if (wheel.tween) {
      const tween = wheel.tween;
      const u = clamp01((now - tween.start) / tween.dur);
      wheel.rot = tween.from + (tween.to - tween.from) * tween.ease(u);
      wheel.speed = tween.speed ? tween.speed(u) : 0;
      if (u >= 1) {
        wheel.tween = null;
        wheel.mode = 'hold';
        tween.resolve();
      }
    }
    const index = mod(Math.round(-wheel.rot / STEP), SLOTS);
    if (index !== wheel.lastIndex && wheel.mode !== 'hold') {
      wheel.lastIndex = index;
      wheel.onTick?.(index, wheel.speed);
    }
    layoutTokens(now);
    $('.disc').style.rotate = wheel.rot + 'rad';
    wheel.frameId = wheel.mode === 'off' ? 0 : requestAnimationFrame(wheelFrame);
  }

  function layoutTokens(now) {
    const { W, cx, cy, R } = wheel.geo;
    const mouth = wheel.mouth;
    for (const token of wheel.tokens) {
      if (token.gone) continue;
      const theta = wheel.rot + token.index * STEP;
      const ringX = cx + Math.sin(theta) * R;
      const ringY = cy - Math.cos(theta) * R;
      const away = Math.abs(mod(theta + Math.PI, TAU) - Math.PI);
      const near = Math.max(0, 1 - away / STEP);
      let x = ringX;
      let y = ringY;
      let scale = 1 + near * 0.34;
      let opacity = 1;
      if (token.state === 'launch') {
        const p = clamp01((now - token.start) / 620);
        const k = 1 - (1 - p) ** 3;
        x = mouth.x + (ringX - mouth.x) * k;
        y = mouth.y + (ringY - mouth.y) * k - Math.sin(Math.PI * p) * W * 0.06;
        scale = 0.2 + 0.8 * k;
        opacity = Math.min(1, p * 5);
        if (p > 0 && !token.popped) { token.popped = true; sound.pop(token.index); }
        if (p >= 1) token.state = 'ring';
      } else if (token.state === 'return') {
        const p = clamp01((now - token.start) / 460);
        const k = p ** 3;
        x = token.fromX + (mouth.x - token.fromX) * k;
        y = token.fromY + (mouth.y - token.fromY) * k - Math.sin(Math.PI * p) * W * 0.07;
        scale = 1 - 0.8 * k;
        opacity = p > 0.85 ? (1 - p) / 0.15 : 1;
        if (p >= 1) {
          token.gone = true;
          token.el.remove();
          sound.gulp(token.index);
          bagKick(active, 'gulp');
          continue;
        }
      } else if (token.state === 'win') {
        const p = clamp01((now - token.start) / token.dur);
        const k = p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
        x = token.fromX + (cx - token.fromX) * k;
        y = token.fromY + (cy - token.fromY) * k;
        scale = 1.34 + (token.scaleTo - 1.34) * k + Math.sin(now / 130) * 0.03;
      }
      token.x = x;
      token.y = y;
      token.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + scale.toFixed(3) + ')';
      token.el.style.opacity = opacity.toFixed(2);
      token.el.style.zIndex = near > 0.5 || token.state === 'win' ? 2 : 1;
      token.el.classList.toggle('on', near > 0.5 && token.state === 'ring');
    }
  }

  function startWheel(slots, strength) {
    const now = performance.now();
    wheel.geo = geometry();
    wheel.mouth = mouthOf(active);
    tokensEl.replaceChildren();
    wheel.tokens = slots.map((item, index) => {
      const el = makeToken(item);
      el.style.opacity = '0';
      tokensEl.append(el);
      return { el, item, index, state: 'launch', start: now + 60 + index * 55 };
    });
    wheel.rot = Math.random() * TAU;
    wheel.omega = TAU * (1.1 + 0.75 * strength);
    wheel.mode = 'spin';
    wheel.lastIndex = -1;
    wheel.last = now;
    cancelAnimationFrame(wheel.frameId);
    wheel.frameId = requestAnimationFrame(wheelFrame);
  }

  // Hãm vòng quay sao cho ô `index` dừng dưới kim. Đường hãm bậc ba nối trơn với tốc độ đang quay,
  // nên không có cú giật nào báo trước kết quả. Điểm dừng lệch ngẫu nhiên trong ô, không dàn dựng.
  function brakeTo(index) {
    const offset = (Math.random() * 0.76 - 0.38) * STEP;
    const base = -index * STEP + offset;
    const earliest = wheel.rot + wheel.omega * 1.05;
    const to = base + Math.ceil((earliest - base) / TAU) * TAU;
    const dur = (3 * (to - wheel.rot) / wheel.omega) * 1000;
    return new Promise((resolve) => {
      wheel.tween = { from: wheel.rot, to, start: performance.now(), dur, ease: (u) => 1 - (1 - u) ** 3, speed: (u) => (1 - u) ** 2, resolve };
      wheel.mode = 'brake';
    });
  }
  function snapTo(index) {
    const to = wheel.rot + (mod(-index * STEP - wheel.rot + Math.PI, TAU) - Math.PI);
    return new Promise((resolve) => {
      const back = (u) => 1 + 2.4 * (u - 1) ** 3 + 1.4 * (u - 1) ** 2;
      wheel.tween = { from: wheel.rot, to, start: performance.now(), dur: 280, ease: back, resolve };
      wheel.mode = 'snap';
    });
  }
  function stopWheel() {
    wheel.mode = 'off';
    wheel.tween = null;
    cancelAnimationFrame(wheel.frameId);
    wheel.frameId = 0;
    wheel.tokens = [];
    tokensEl.replaceChildren();
  }

  async function launch(strength) {
    turn += 1;
    const pending = api('draw', {});
    const slots = buildSlots();

    setPose(active, 'present');
    bagKick(active, 'burst');
    sound.launch(strength);
    setPhase('spin');
    if (reduced.matches) wheelEl.hidden = true;
    try {
      await animateDraw(strength, slots, pending);
    } catch (error) {
      // A failed request may have reached the server. Refresh state and let the operator decide.
      resetStage();
      canDraw = false;
      setPhase('unavailable');
      pinForm.hidden = true;
      retry.hidden = false;
      gateStatus.textContent = '';
      showError(error instanceof Error ? error.message : 'Không nhận được kết quả rút quà.');
    }
  }

  async function animateDraw(strength, slots, pending) {
    if (reduced.matches) return showReveal(registerDraw(await pending));
    spark(26);
    wheelEl.dataset.out = 'false';
    setPhase('spin');
    say('launch');
    hubName.textContent = '';
    startWheel(slots, strength);

    let braking = false;
    let lastBark = 0;
    let slowSaid = false;
    wheel.onTick = (index, speed) => {
      sound.tick(speed);
      hubName.textContent = slots[index].short;
      pointer.animate([{ transform: 'rotate(-24deg)' }, { transform: 'none' }], { duration: 130, easing: 'ease-out' });
      if (!braking) return;
      const now = performance.now();
      const item = slots[index];
      if (item.tier === 'epic' && speed < 0.5 && speed > 0.06 && now - lastBark > 800) {
        lastBark = now;
        say('Ối, ' + item.short.toLowerCase() + ' kìa!');
      } else if (!slowSaid && speed < 0.16 && now - lastBark > 600) {
        slowSaid = true;
        say('slow');
      }
    };

    const [drawn] = await Promise.all([pending, pause(1250)]);
    const result = registerDraw(drawn);
    if (!slots.includes(result)) {
      slots = buildSlots(result);
      startWheel(slots, strength);
      await pause(1250);
    }
    const candidates = slots.map((item, index) => (item === result ? index : -1)).filter((index) => index >= 0);
    const target = pick(candidates);
    braking = true;
    await brakeTo(target);
    await snapTo(target);
    hubName.textContent = result.short;
    sound.lock();
    const winner = wheel.tokens[target];
    winner.el.classList.add('locked');
    root.dataset.tier = result.tier;
    root.style.setProperty('--light-x', '50%');

    const neighbour = [slots[mod(target - 1, SLOTS)], slots[mod(target + 1, SLOTS)]].find((item) => item.tier === 'epic');
    if (result.tier !== 'epic' && neighbour) {
      say('Suýt nữa thì ' + neighbour.short.toLowerCase() + '!');
      sound.nearMiss();
      await pause(950);
    } else {
      await pause(480);
    }
    await settle(result, winner);
  }

  // ── Nhịp 3: Chốt ──────────────────────────────────────────────
  async function settle(result, winner) {
    const epic = result.tier === 'epic';
    const now = performance.now();
    bubble.hidden = true;
    root.dataset.hush = epic ? 'deep' : 'soft';
    wheelEl.dataset.out = 'true';
    sound.whoosh();
    let order = 0;
    for (const token of wheel.tokens) {
      token.fromX = token.x;
      token.fromY = token.y;
      if (token === winner) continue;
      token.state = 'return';
      token.start = now + order * 45;
      order += 1;
    }
    winner.state = 'win';
    winner.start = now + 120;
    winner.dur = epic ? 1500 : 700;
    winner.scaleTo = epic ? 2.7 : 2.3;
    if (epic) {
      winner.el.classList.add('flip');
      sound.drumroll(1.55);
      await pause(1650);
      $('.flash').classList.remove('go');
      void root.offsetWidth;
      $('.flash').classList.add('go');
      root.classList.add('quake');
      sound.crash();
    } else {
      await pause(860);
    }
    showReveal(result);
  }

  function showReveal(result) {
    const tier = result.tier;
    const luck = result === LUCK;
    stopWheel();
    root.dataset.tier = tier;
    root.dataset.hush = tier === 'epic' ? 'soft' : '';
    if (tier !== 'epic') delete root.dataset.hush;
    root.style.setProperty('--light-x', '50%');

    $('#tierTag').textContent = TIER_LABEL[tier];
    $('#prize').hidden = luck;
    if (!luck) $('#prize').src = prizeSrc(result);
    reveal.querySelector('.heart').hidden = !luck;
    reveal.querySelector('.stamp').hidden = !luck;
    reveal.querySelector('.banner').hidden = tier !== 'epic';
    const note = $('#resultNote');
    if (luck) {
      const [title, line] = pick(COUPONS);
      $('#prizeName').textContent = title;
      note.textContent = line;
      note.hidden = false;
    } else {
      $('#prizeName').textContent = result.name;
      note.textContent = 'Một bình · Minh họa hai màu';
      note.hidden = result.slug !== 'binh-nuoc';
    }
    setPhase('reveal');
    setPose(active, tier === 'epic' ? 'cheer' : luck ? 'present' : 'wow');
    say(tier, { loud: tier === 'epic' });
    celebrate(tier);

    sinceEpic = tier === 'epic' ? 0 : sinceEpic + 1;
    recent.unshift(result);
    recent.length = Math.min(recent.length, 6);
    renderHunt(tier === 'epic' ? result : null);
    if (result.stock) {
      renderStock(result);
      setTimeout(() => flyToStock(result), reduced.matches ? 0 : 900);
    }
    $('#again').focus({ preventScroll: true });
  }

  function celebrate(tier) {
    const other = hosts.find((host) => host !== active);
    if (tier === 'luck') {
      sound.winLuck();
      setTimeout(() => sound.stamp(), 780);
      if (!reduced.matches) confetti.hearts(24, COLORS.luck);
      return;
    }
    const colors = COLORS[tier];
    const cannons = (count, force) => {
      if (reduced.matches) return;
      confetti.burst({ x: 0.3, y: 0.78, count, colors, angle: -1.15, spread: 0.9, power: force });
      confetti.burst({ x: 0.7, y: 0.78, count, colors, angle: -1.99, spread: 0.9, power: force });
    };
    if (tier === 'common') {
      sound.winCommon();
      cannons(30, 1);
      return;
    }
    other.dataset.dim = 'false';
    setPose(other, 'present');
    if (tier === 'rare') {
      sound.winRare();
      cannons(60, 1.15);
      setTimeout(() => cannons(36, 0.9), 380);
      if (!reduced.matches) {
        const wave = document.createElement('div');
        wave.className = 'ring-wave';
        root.append(wave);
        wave.addEventListener('animationend', () => wave.remove());
      }
      return;
    }
    // Quà đặc biệt: cả hai thầy cô cùng nhảy, pháo giấy, mưa vàng và pháo hoa.
    sound.winEpic();
    setPose(other, 'cheer');
    hosts.forEach((host) => { host.dataset.cheer = 'true'; });
    other.dataset.join = 'true';
    cannons(66, 1.25);
    if (reduced.matches) return;
    confetti.rain(3.8, colors);
    const myTurn = turn;
    for (let i = 0; i < 5; i += 1) {
      setTimeout(() => {
        if (phase !== 'reveal' || myTurn !== turn) return;
        confetti.firework({ x: 0.12 + Math.random() * 0.76, y: 0.12 + Math.random() * 0.3, colors });
        sound.firework();
      }, 350 + i * 520);
    }
  }

  // ── Bảng săn quà ──────────────────────────────────────────────
  function flyToStock(item) {
    const done = () => {
      item.stock.classList.remove('bump');
      void item.stock.offsetWidth;
      item.stock.classList.add('bump');
      sound.blip();
    };
    if (reduced.matches || phase !== 'reveal') return done();
    const base = root.getBoundingClientRect();
    const from = $('#prize').getBoundingClientRect();
    const to = item.stock.querySelector('img').getBoundingClientRect();
    const ghost = document.createElement('img');
    ghost.className = 'fly';
    ghost.src = prizeSrc(item);
    ghost.style.cssText = 'left:' + (from.left - base.left) + 'px;top:' + (from.top - base.top) + 'px;width:' + from.width + 'px;height:' + from.height + 'px';
    root.append(ghost);
    const move = 'translate(' + (to.left - from.left) + 'px,' + (to.top - from.top) + 'px) scale(' + to.width / from.width + ',' + to.height / from.height + ')';
    ghost.animate([{ transform: 'none', opacity: 0.85 }, { transform: move, opacity: 0.9 }], { duration: 620, easing: 'cubic-bezier(.5,-.3,.7,.5)' }).onfinish = () => {
      ghost.remove();
      done();
    };
  }

  function renderHunt(justWon) {
    const drought = $('.drought');
    const epicLeft = prizes.some((item) => item.tier === 'epic' && item.count > 0);
    if (justWon) {
      drought.hidden = false;
      drought.dataset.hot = 'true';
      drought.textContent = 'Vừa trúng ' + justWon.short.toLocaleLowerCase('vi') + '!';
    } else if (epicLeft && sinceEpic >= 4) {
      drought.hidden = false;
      drought.dataset.hot = 'false';
      drought.textContent = 'Quà đặc biệt vẫn còn';
    } else {
      drought.hidden = true;
    }
    const list = $('#recentList');
    list.replaceChildren(...recent.map((item, index) => {
      const dot = document.createElement('span');
      dot.dataset.tier = item.tier;
      dot.title = item === LUCK ? 'Quà tinh thần' : item.name;
      if (index > 0) dot.style.animation = 'none';
      if (item === LUCK) dot.innerHTML = '<i class="heart" role="img" aria-label="Quà tinh thần"></i>';
      else dot.append(Object.assign(new Image(), { src: prizeSrc(item), alt: item.name }));
      return dot;
    }));
    $('.hunt').hidden = recent.length === 0;
  }

  // ── Lượt tiếp theo ────────────────────────────────────────────
  function next() {
    if (phase !== 'reveal') return;
    resetStage();
    setPhase('loading');
    gateStatus.textContent = 'Đang cập nhật quầy quà…';
    retry.hidden = true;
    void refreshBooth('choosing');
  }

  function resetStage() {
    turn += 1;
    confetti.clear();
    stopWheel();
    root.classList.remove('quake');
    delete root.dataset.hush;
    root.dataset.tier = '';
    bubble.hidden = true;
    hosts.forEach((host) => {
      host.dataset.dim = 'false';
      host.dataset.active = 'false';
      host.dataset.cheer = 'false';
      host.dataset.join = 'false';
      setPose(host, 'idle');
    });
    root.querySelectorAll('.fly, .ring-wave').forEach((el) => el.remove());
    active = null;
    root.style.setProperty('--power', '0');
  }

  // ── Điều khiển ────────────────────────────────────────────────
  $('#start').addEventListener('click', openChoosing);
  $('#again').addEventListener('click', next);
  shakeBtn.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    shakeBtn.setPointerCapture?.(event.pointerId);
    beginHold();
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => shakeBtn.addEventListener(type, endHold));
  shakeBtn.addEventListener('contextmenu', (event) => event.preventDefault());
  addEventListener('blur', endHold);
  root.addEventListener('animationend', (event) => { if (event.animationName === 'quake') root.classList.remove('quake'); });

  document.addEventListener('keydown', (event) => {
    sound.unlock();
    if (event.repeat || event.target.closest?.('input')) return;
    if (phase === 'choosing' && (event.key === 'ArrowLeft' || event.key === '1')) return choose(hosts[0]);
    if (phase === 'choosing' && (event.key === 'ArrowRight' || event.key === '2')) return choose(hosts[1]);
    if (event.code !== 'Space' && event.key !== 'Enter') return;
    if (phase === 'charge') {
      event.preventDefault();
      beginHold();
    } else if (!event.target.closest?.('button')) {
      if (phase === 'idle') { event.preventDefault(); openChoosing(); }
      else if (phase === 'reveal') { event.preventDefault(); next(); }
    }
  });
  document.addEventListener('keyup', (event) => {
    if (event.code === 'Space' || event.key === 'Enter') endHold();
  });
  document.addEventListener('pointerdown', () => sound.unlock(), { capture: true });

  $('#sound').addEventListener('click', () => {
    sound.setEnabled(!sound.enabled);
    $('#sound').textContent = sound.enabled ? 'Tắt tiếng' : 'Bật tiếng';
    $('#sound').setAttribute('aria-pressed', String(sound.enabled));
  });
  $('#fullscreen').addEventListener('click', () => {
    const action = document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen?.();
    action?.catch(() => {});
  });
  addEventListener('resize', () => {
    if (wheel.mode !== 'off' && active) {
      wheel.geo = geometry();
      wheel.mouth = mouthOf(active);
    }
  });

  retry.addEventListener('click', () => void refreshBooth());
  pinForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = $('#pin');
    const button = pinForm.querySelector('button');
    button.disabled = true;
    showError('');
    try {
      await api('unlock', { pin: input.value });
      input.value = '';
      await refreshBooth();
      if (phase === 'idle') $('#start').focus();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Không mở được quầy.');
      input.select();
    } finally {
      button.disabled = false;
    }
  });

  setPhase('loading');
  void refreshBooth();
  setInterval(() => {
    if (phase === 'idle' || phase === 'choosing') void refreshBooth(phase);
  }, 15000);
})();
