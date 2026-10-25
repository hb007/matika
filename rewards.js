// Odměny za skutečný úspěch: animace, texty a popisy nálepek do alba.
// Které odměny dítě dostalo, počítá server (lib/rewards.php) a vrací je
// v odpovědi na správný výsledek. Offline appka spočítá jen ty, které
// pozná sama (série, denní cíl, body); nálepky doplní server po připojení.
window.Rewards = (() => {
  const CALM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GOLD = 'sepia(1) saturate(6) hue-rotate(-12deg) brightness(1.15)';

  // Nálepky v pořadí alba: obrázek, název, jak ji získat.
  const STICKER = {
    jednorozec: { e: '🦄', name: 'Jednorožec', how: '10 správně napoprvé v řadě' },
    duha: { e: '🌈', name: 'Duha', how: '25 správně napoprvé v řadě' },
    zlaty_jednorozec: { e: '🦄', gold: true, name: 'Zlatý jednorožec', how: '50 správně napoprvé v řadě' },
    raketa: { e: '🚀', name: 'Raketa', how: '5 těžkých napoprvé v řadě' },
    sova: { e: '🦉', name: 'Sova', how: 'Vyřeš příklad, který ti minule nešel' },
    ohnostroj: { e: '🎆', name: 'Ohňostroj', how: 'Splň denní cíl' },
    drak3: { e: '🐲', name: 'Dráček', how: '3 dny v řadě splněný cíl' },
    drak7: { e: '🐉', name: 'Drak', how: '7 dní v řadě splněný cíl' },
    drak14: { e: '🐉', hue: 120, name: 'Velký drak', how: '14 dní v řadě splněný cíl' },
    drak30: { e: '🐉', gold: true, name: 'Dračí král', how: '30 dní v řadě splněný cíl' },
    poklad100: { e: '🪙', name: 'Mince', how: '100 bodů celkem' },
    poklad500: { e: '💰', name: 'Měšec', how: '500 bodů celkem' },
    poklad1000: { e: '💎', name: 'Diamant', how: '1 000 bodů celkem' },
    poklad2000: { e: '👑', name: 'Koruna', how: '2 000 bodů celkem' },
    poklad5000: { e: '🏆', name: 'Pohár', how: '5 000 bodů celkem' },
  };
  // Když jich přijde víc najednou, hraje se animace té nejvzácnější.
  const PRIORITY = ['zlaty_jednorozec', 'drak30', 'drak14', 'drak7', 'drak3', 'poklad5000', 'poklad2000', 'poklad1000',
    'duha', 'ohnostroj', 'poklad500', 'poklad100', 'raketa', 'jednorozec', 'sova'];

  function text(rw) {
    const v = rw.value;
    switch (rw.kind) {
      case 'jednorozec': return `${v} správně v řadě! Přiběhl jednorožec.`;
      case 'duha': return `${v} správně v řadě! Duha přes celé nebe.`;
      case 'zlaty_jednorozec': return `${v} správně v řadě! Zlatý jednorožec!`;
      case 'raketa': return `${v} těžkých napoprvé v řadě! Raketa startuje.`;
      case 'sova': return 'Už to umíš! Tenhle ti minule nešel.';
      case 'ohnostroj': return 'Denní cíl splněný! Ohňostroj!';
      default:
        if (rw.kind.startsWith('drak')) return `${v} ${v >= 2 && v <= 4 ? 'dny' : 'dní'} v řadě se splněným cílem! ${STICKER[rw.kind].name} přiletěl.`;
        if (rw.kind.startsWith('poklad')) return `${v.toLocaleString('cs-CZ')} bodů celkem! ${STICKER[rw.kind].name} do pokladu.`;
        return '';
    }
  }

  function primary(rewards) {
    const kinds = rewards.map((r) => r.kind);
    return PRIORITY.find((k) => kinds.includes(k)) || null;
  }

  // Offline: odměny, které appka pozná bez serveru (předběžné, nálepky zapíše server).
  function local({ streak, first, solvedToday, goal, totalBefore, totalAfter }) {
    const out = [];
    if (first && streak > 0) {
      if (streak % 50 === 0) out.push({ kind: 'zlaty_jednorozec', value: streak });
      else if (streak % 25 === 0) out.push({ kind: 'duha', value: streak });
      else if (streak % 10 === 0) out.push({ kind: 'jednorozec', value: streak });
    }
    if (solvedToday === goal) out.push({ kind: 'ohnostroj', value: goal });
    [100, 500, 1000, 2000, 5000].forEach((m) => {
      if (totalBefore < m && totalAfter >= m) out.push({ kind: 'poklad' + m, value: m });
    });
    return out;
  }

  // ---------- animace ----------
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const COLORS = ['#ff4d6d', '#ffd43b', '#4dabf7', '#69db7c', '#b197fc', '#ffa94d', '#f783ac'];

  function particle(x, y, frames, duration, emoji, opts = {}) {
    const c = document.createElement('i');
    c.className = emoji ? 'fx emoji' : 'fx confetti';
    if (emoji) c.textContent = emoji;
    if (opts.size) c.style.fontSize = opts.size + 'px';
    if (opts.filter) c.style.filter = opts.filter;
    if (opts.color) { c.style.background = opts.color; c.style.borderRadius = '50%'; c.style.width = c.style.height = (opts.dot || 8) + 'px'; }
    c.style.left = x + 'px';
    c.style.top = y + 'px';
    document.body.appendChild(c);
    c.animate(frames, { duration, delay: opts.delay || 0, easing: opts.easing || 'ease-out', fill: 'backwards' }).onfinish = () => c.remove();
    return c;
  }

  // Postava přeletí zprava doleva (emoji koukají doleva) a nechává za sebou stopu.
  function flyAcross(emoji, { size = 104, dur = 2800, y = innerHeight * 0.4, hop = 34, trail = [], filter = '', wave = false }) {
    const x0 = innerWidth + size;
    const dist = innerWidth + size * 2.6;
    const frames = [];
    for (let i = 0; i <= 12; i++) {
      const dy = wave ? Math.sin(i / 12 * Math.PI * 2) * hop : (i % 2 ? -hop : 0);
      frames.push({ transform: `translate(${-dist * i / 12}px, ${dy}px) rotate(${wave ? 0 : i % 2 ? -8 : 4}deg)`, offset: i / 12 });
    }
    particle(x0, y, frames, dur, emoji, { size, easing: 'linear', filter });
    if (!trail.length) return;
    const t0 = performance.now();
    const timer = setInterval(() => {
      const t = (performance.now() - t0) / dur;
      if (t >= 1) { clearInterval(timer); return; }
      particle(x0 - dist * t + size / 2, y + 10 + Math.random() * size * 0.4, [
        { transform: 'translate(0, 0) scale(.6)', opacity: 1 },
        { transform: `translate(${20 + Math.random() * 40}px, ${40 + Math.random() * 90}px) scale(1.1)`, opacity: 0 },
      ], 900 + Math.random() * 500, pick(trail), { filter });
    }, 60);
  }

  // Ohňostroj: rakety vyletí zdola a rozprsknou se na barevné jiskry.
  function fireworks(bursts = 7) {
    for (let b = 0; b < bursts; b++) {
      const x = innerWidth * (0.15 + Math.random() * 0.7);
      const y = innerHeight * (0.12 + Math.random() * 0.3);
      const delay = b * 320 + Math.random() * 150;
      particle(x, innerHeight + 10, [
        { transform: 'translate(0, 0)', opacity: 1 },
        { transform: `translate(0, ${y - innerHeight - 10}px)`, opacity: 1 },
      ], 520, null, { color: '#fff3bf', delay, easing: 'ease-out' });
      const color = pick(COLORS);
      for (let n = 0; n < 40; n++) {
        const a = (n / 40) * Math.PI * 2;
        const d = 90 + Math.random() * 70;
        particle(x, y, [
          { transform: 'translate(0, 0) scale(1.2)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * d * 0.85}px, ${Math.sin(a) * d * 0.85}px) scale(1)`, opacity: 1, offset: 0.55 },
          { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 60}px) scale(.5)`, opacity: 0 },
        ], 1500 + Math.random() * 400, null, { color: Math.random() < 0.8 ? color : '#fff', dot: 10, delay: delay + 500, easing: 'cubic-bezier(.15,.7,.3,1)' });
      }
    }
  }

  // Sova přiletí, chvíli se pohupuje uprostřed a odletí.
  function owl() {
    const x = innerWidth / 2;
    const y = innerHeight * 0.38;
    particle(x, y, [
      { transform: `translate(${-innerWidth / 2 - 120}px, -160px) rotate(-20deg) scale(.6)`, offset: 0 },
      { transform: 'translate(0, 0) rotate(0deg) scale(1)', offset: 0.3 },
      { transform: 'translate(0, -14px) rotate(-6deg) scale(1)', offset: 0.45 },
      { transform: 'translate(0, 0) rotate(6deg) scale(1)', offset: 0.6 },
      { transform: 'translate(0, -10px) rotate(0deg) scale(1)', offset: 0.72 },
      { transform: `translate(${innerWidth / 2 + 140}px, -220px) rotate(20deg) scale(.6)`, offset: 1 },
    ], 3000, '🦉', { size: 120, easing: 'ease-in-out' });
    for (let n = 0; n < 14; n++) {
      particle(x + (Math.random() - 0.5) * 200, y + (Math.random() - 0.5) * 140, [
        { transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.4 }, { transform: 'scale(.4)', opacity: 0 },
      ], 900, pick(['✨', '⭐', '💡']), { delay: 800 + Math.random() * 1000 });
    }
  }

  function rocket() {
    const x = innerWidth / 2;
    const dur = 2000;
    particle(x, innerHeight + 60, [
      { transform: 'translate(0, 0) rotate(-45deg)' },
      { transform: `translate(0, ${-innerHeight - 200}px) rotate(-45deg)` },
    ], dur, '🚀', { size: 96, easing: 'cubic-bezier(.5,0,.8,.4)' });
    const t0 = performance.now();
    const timer = setInterval(() => {
      const t = (performance.now() - t0) / dur;
      if (t >= 1) { clearInterval(timer); return; }
      const eased = t * t * (3 - 2 * t) * 0.9 + t * 0.1;   // přibližně jako křivka rakety
      particle(x + (Math.random() - 0.5) * 30, innerHeight + 110 - (innerHeight + 200) * eased, [
        { transform: 'scale(1)', opacity: 1 }, { transform: `translate(${(Math.random() - 0.5) * 60}px, 80px) scale(.3)`, opacity: 0 },
      ], 700, pick(['🔥', '💨', '✨']));
    }, 50);
  }

  // Duha přes celou obrazovku: oblouk se postupně nakreslí a pak zmizí.
  function rainbow() {
    const w = Math.min(innerWidth * 0.95, 900);
    const el = document.createElement('div');
    el.className = 'fx rainbow';
    el.style.width = w + 'px';
    el.style.height = w / 2 + 'px';
    el.style.left = (innerWidth - w) / 2 + 'px';
    el.style.top = innerHeight * 0.78 - w / 2 + 'px';   // níž, ať nezakrývá pochvalu
    document.body.appendChild(el);
    el.animate([
      { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
      { clipPath: 'inset(0 0 0 0)', opacity: 1, offset: 0.45 },
      { clipPath: 'inset(0 0 0 0)', opacity: 1, offset: 0.8 },
      { clipPath: 'inset(0 0 0 0)', opacity: 0 },
    ], { duration: 3000, easing: 'ease-out' }).onfinish = () => el.remove();
    [0, 1].forEach((side) => particle((innerWidth - w) / 2 + side * w, innerHeight * 0.78 - 10, [
      { transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.3 }, { transform: 'scale(1)', opacity: 1, offset: 0.8 }, { opacity: 0 },
    ], 3000, '☁️', { size: 70 }));
  }

  // Poklad: velká mince / měšec / diamant / koruna / pohár a fontána mincí.
  function treasure(kind) {
    const x = innerWidth / 2;
    const y = innerHeight * 0.42;
    particle(x, y, [
      { transform: 'scale(0) rotate(-20deg)', opacity: 0 },
      { transform: 'scale(1.3) rotate(8deg)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1) rotate(0deg)', opacity: 1, offset: 0.75 },
      { transform: 'scale(1.5)', opacity: 0 },
    ], 2400, STICKER[kind].e, { size: 130 });
    for (let n = 0; n < 30; n++) {
      const dx = (Math.random() - 0.5) * innerWidth * 0.8;
      const up = 160 + Math.random() * 200;
      particle(x, y, [
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx / 2}px, ${-up}px) rotate(180deg)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${dx}px, ${innerHeight * 0.6}px) rotate(540deg)`, opacity: 0 },
      ], 1800 + Math.random() * 600, pick(['🪙', '🪙', '💎', '✨']), { delay: 300 + Math.random() * 400, easing: 'ease-in' });
    }
  }

  function play(kind) {
    if (CALM || !document.body.animate || !kind) return;
    const s = STICKER[kind];
    if (kind === 'jednorozec') flyAcross('🦄', { trail: ['🌈', '✨', '⭐', '💖', '✨'] });
    else if (kind === 'zlaty_jednorozec') flyAcross('🦄', { size: 130, dur: 3200, filter: GOLD, trail: ['✨', '🌟', '⭐'] });
    else if (kind === 'duha') rainbow();
    else if (kind === 'raketa') rocket();
    else if (kind === 'sova') owl();
    else if (kind === 'ohnostroj') fireworks();
    else if (kind.startsWith('drak')) {
      const size = { drak3: 84, drak7: 110, drak14: 136, drak30: 160 }[kind];
      flyAcross(s.e, { size, dur: 3200, wave: true, hop: 40, trail: ['🔥', '🔥', '✨'],
        filter: s.gold ? GOLD : s.hue ? `hue-rotate(${s.hue}deg)` : '' });
      fireworks(3);
    } else if (kind.startsWith('poklad')) treasure(kind);
  }

  return { STICKER, text, primary, local, play };
})();
