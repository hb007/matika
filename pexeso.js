// Pexeso s příklady: najdi dvojice příklad a jeho výsledek (7 · 8 a 56).
// Skóre jsou tahy, čím méně, tím lépe. Konec, když jsou všechny dvojice.
window.Pexeso = (() => {
  const PAIRS = 8;

  // dvojice s různými výsledky: násobilka a sčítání
  function makePairs() {
    const out = [];
    const used = new Set();
    let guard = 0;
    while (out.length < PAIRS && guard++ < 500) {
      let q, a;
      if (Math.random() < 0.6) {
        const x = 2 + Math.floor(Math.random() * 8);
        const y = 2 + Math.floor(Math.random() * 8);
        [q, a] = [`${x} · ${y}`, x * y];
      } else {
        const x = 5 + Math.floor(Math.random() * 40);
        const y = 3 + Math.floor(Math.random() * 30);
        [q, a] = [`${x} + ${y}`, x + y];
      }
      if (used.has(a)) continue;
      used.add(a);
      out.push([q, String(a)]);
    }
    return out;
  }

  function create(stage, { onScore, onOver } = {}) {
    const grid = document.createElement('div');
    grid.className = 'pexeso';
    stage.appendChild(grid);
    let cards, open, moves, found, over, running, lock;

    function reset() {
      const pairs = makePairs();
      cards = pairs.flatMap(([q, a], i) => [{ text: q, pair: i }, { text: a, pair: i }]);
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
      open = [];
      moves = 0;
      found = 0;
      over = false;
      running = false;
      lock = false;
      grid.innerHTML = cards.map((c, i) => `<button type="button" class="pex-card" data-i="${i}" aria-label="Kartička"><span>${c.text}</span></button>`).join('');
      if (onScore) onScore(0);
    }

    grid.addEventListener('click', (e) => {
      const b = e.target.closest('.pex-card');
      if (!b || over || lock) return;
      const i = Number(b.dataset.i);
      if (b.classList.contains('up') || b.classList.contains('done')) return;
      running = true;
      b.classList.add('up');
      open.push(i);
      if (open.length < 2) return;
      moves++;
      if (onScore) onScore(moves);
      const [x, y] = open;
      const bx = grid.children[x];
      const by = grid.children[y];
      if (cards[x].pair === cards[y].pair) {
        bx.classList.add('done');
        by.classList.add('done');
        open = [];
        found++;
        if (found === PAIRS) {
          over = true;
          running = false;
          if (onOver) onOver(moves);
        }
        return;
      }
      lock = true;
      setTimeout(() => {
        bx.classList.remove('up');
        by.classList.remove('up');
        open = [];
        lock = false;
      }, 900);
    });

    reset();
    return {
      reset, turn() {}, start() { running = !over; }, stop() { running = false; }, recolor() {},
      get running() { return running; }, get over() { return over; },
    };
  }
  return { create };
})();
