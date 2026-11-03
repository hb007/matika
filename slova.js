// Slova: plocha 5 × 5 je rozdělená na barevná pole, v každém je jedno
// slovo s přeházenými písmeny. Tažením prstem po sousedních políčkách
// (nahoru, dolů, doleva, doprava) projdi celé pole tak, aby vzniklo slovo.
// Šedá políčka nejsou ve hře. Skóre je čas v sekundách, čím méně, tím lépe;
// nápověda ukáže, kde slovo začíná, a přidá NAPOVEDA_S sekund.
window.Slova = (() => {
  const N = 5;
  const MIN_LEN = 3;
  const MAX_LEN = 6;
  const MAX_EMPTY = 4;          // nejvýš tolik šedých políček
  const NAPOVEDA_S = 10;
  const HUES = [345, 75, 220, 190, 25, 140, 290, 50];

  // Slova pro děti (podstatná jména), velkými písmeny s diakritikou.
  const WORDS = `
    PES LES DŮM MÍČ NOS SÝR LEV VŮZ OKO ZUB DUB MAK ROK DEN HAD KŮŇ SŮL MED LED LOĎ KOS JEŽ BUK ČAJ HRA LUK
    NŮŽ OSA RYS SEN MYŠ KLÍČ
    KOZA RYBA LIPA VODA MOST HRAD PTÁK SOVA LIST KMEN NEBE MRAK SNÍH ŽÁBA AUTO VLAK HORA POLE ŘEKA MOŘE SLON
    STŮL PERO DORT ZIMA LÉTO JARO NOTA KOLO SÍLA MAPA OKNO DÍRA GUMA VÁHA OBĚD LYŽE TRUP KÁVA RUKA NOHA
    HLAVA KOČKA KRÁVA LOUKA KRTEK LÍSKA ŽIDLE KNIHA TUŽKA ŠKOLA TŘÍDA ČÍSLO CHLÉB MÁSLO MLÉKO LAMPA VČELA
    ZÁMEK KÁMEN MĚSÍC OBLAK POTOK BRÁNA SKÁLA PÍSEK TRÁVA LIŠKA MINCE DŘEVO PAPÍR BARVA SEŠIT ÚLOHA PODÍL
    DÉLKA TÝDEN MRKEV KOLÁČ RAJČE MÍČEK HRNEK LŽÍCE VIDLE DOMEK ZEBRA OPICE TYGR SÝKORA
    JABLKO HRUŠKA SLUNCE HVĚZDA RYBNÍK OSTROV MEDVĚD VLAJKA KORUNA ŠTĚTEC ZLOMEK SOUČET ROZDÍL SOUČIN
    MINUTA HODINA MOUCHA TABULE KYTARA HOUSLE FLÉTNA CIBULE OKURKA BUCHTA VEČEŘE BRUSLE KAMION LETADLO
    MOTÝL ŽIRAFA KLOKAN DELFÍN PLANETA RAKETA KRUH
  `.trim().split(/\s+/);
  const BY_LEN = {};
  for (const w of WORDS) {
    const n = [...w].length;
    if (n >= MIN_LEN && n <= MAX_LEN) (BY_LEN[n] = BY_LEN[n] || []).push(w);
  }
  const DICT = new Set(WORDS);

  const rnd = (n) => Math.floor(Math.random() * n);
  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const nbrs = (c) => {
    const x = c % N, y = Math.floor(c / N), out = [];
    if (x > 0) out.push(c - 1);
    if (x < N - 1) out.push(c + 1);
    if (y > 0) out.push(c - N);
    if (y < N - 1) out.push(c + N);
    return out;
  };

  // Náhodná cesta délky len po volných políčkách z políčka start (prohledávání
  // do hloubky, přednost mají sousedé s méně volnými sousedy, ať nezůstávají díry).
  function walk(owner, start, len) {
    const path = [start];
    owner[start] = -2;
    const free = (c) => nbrs(c).filter((d) => owner[d] === -1).length;
    let tries = 0;
    // slovo musí zahnout (rovná řada se dá přečíst bez hledání), delší i víckrát
    const turns = () => path.slice(2).filter((c, i) => c - path[i + 1] !== path[i + 1] - path[i]).length;
    const need = len >= 5 ? 2 : 1;
    function go() {
      if (path.length === len) return turns() >= need;
      if (tries++ > 400) return false;
      const opts = shuffle(nbrs(path[path.length - 1]).filter((d) => owner[d] === -1))
        .sort((a, b) => free(a) - free(b) + (Math.random() - 0.5));
      for (const d of opts) {
        owner[d] = -2;
        path.push(d);
        if (go()) return true;
        path.pop();
        owner[d] = -1;
      }
      return false;
    }
    const ok = go();
    for (const c of path) owner[c] = -1;
    return ok ? path : null;
  }

  // Rozdělí plochu na pole se slovy. Vrací { owner, letters, regions }.
  function generate() {
    let best = null;
    for (let attempt = 0; attempt < 300; attempt++) {
      const owner = new Array(N * N).fill(-1);   // -1 volné, -3 šedé, jinak číslo pole
      const regions = [];
      const used = new Set();
      for (;;) {
        const free = owner.map((o, c) => (o === -1 ? c : -1)).filter((c) => c >= 0);
        if (!free.length) break;
        // začni u políčka s nejméně volnými sousedy (rohy, zákoutí)
        const deg = (c) => nbrs(c).filter((d) => owner[d] === -1).length;
        free.sort((a, b) => deg(a) - deg(b) + (Math.random() - 0.5) * 0.9);
        const start = free[0];
        let placed = false;
        const lens = shuffle([3, 4, 4, 5, 5, 5, 6, 6].filter((n) => n <= free.length && BY_LEN[n]));
        for (const len of [...new Set(lens)]) {
          const path = walk(owner, start, len);
          if (!path) continue;
          const words = shuffle(BY_LEN[len].filter((w) => !used.has(w)));
          if (!words.length) continue;
          used.add(words[0]);
          path.forEach((c) => { owner[c] = regions.length; });
          regions.push({ word: words[0], path, size: len });
          placed = true;
          break;
        }
        if (!placed) owner[start] = -3;
      }
      const empty = owner.filter((o) => o === -3).length;
      if (!best || empty < best.empty) best = { owner, regions, empty };
      if (empty <= MAX_EMPTY && regions.length >= 4) break;
    }
    const letters = new Array(N * N).fill('');
    best.regions.forEach((r) => r.path.forEach((c, i) => { letters[c] = [...r.word][i]; }));
    best.regions.sort((a, b) => a.size - b.size || a.word.localeCompare(b.word, 'cs'));
    best.regions.forEach((r, i) => { r.path.forEach((c) => { best.owner[c] = i; }); r.hue = HUES[i % HUES.length]; });
    return { owner: best.owner, letters, regions: best.regions };
  }

  const SVG = 'http://www.w3.org/2000/svg';

  function create(stage, { onScore, onOver } = {}) {
    const box = document.createElement('div');
    box.className = 'slova';
    box.innerHTML = '<svg class="slova-grid" viewBox="0 0 5 5" role="img" aria-label="Plocha se slovy"></svg>'
      + '<div class="slova-words" aria-live="polite"></div>'
      + '<button type="button" class="btn slova-hint">Nápověda (+' + NAPOVEDA_S + ' s)</button>';
    stage.appendChild(box);
    const svg = box.querySelector('svg');
    const wordsEl = box.querySelector('.slova-words');
    const hintBtn = box.querySelector('.slova-hint');

    let puzzle, paths, solved, hinted, penalty, elapsed, running, over, tick, last, drag, wrong;

    const seconds = () => Math.floor(elapsed / 1000) + penalty;
    function score() { if (onScore) onScore(seconds()); }

    function reset() {
      stopClock();
      puzzle = generate();
      paths = puzzle.regions.map(() => []);
      solved = puzzle.regions.map(() => false);
      hinted = puzzle.regions.map(() => false);
      penalty = 0;
      elapsed = 0;
      running = false;
      over = false;
      drag = null;
      wrong = -1;
      draw();
      score();
    }

    function startClock() {
      stopClock();
      last = performance.now();
      tick = setInterval(() => {
        const now = performance.now();
        elapsed += now - last;
        last = now;
        score();
      }, 250);
    }
    function stopClock() {
      if (tick) {
        clearInterval(tick);
        elapsed += performance.now() - last;
        tick = null;
      }
    }

    const el = (name, attrs, parent) => {
      const e = document.createElementNS(SVG, name);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      (parent || svg).appendChild(e);
      return e;
    };
    const xy = (c) => [c % N + 0.5, Math.floor(c / N) + 0.5];
    const solid = (h) => `hsl(${h} 72% 52%)`;
    const tint = (h) => `hsl(${h} 72% 52% / .2)`;

    function draw() {
      svg.textContent = '';
      const { owner, letters, regions } = puzzle;
      // políčka (šedá mimo hru)
      owner.forEach((o, c) => {
        const [x, y] = xy(c);
        el('rect', { x: x - 0.5, y: y - 0.5, width: 1, height: 1, class: o < 0 ? 'slova-off' : '', fill: o < 0 ? '' : tint(regions[o].hue) });
      });
      // hranice polí
      const d = [];
      owner.forEach((o, c) => {
        const x = c % N, y = Math.floor(c / N);
        if (x < N - 1 && owner[c + 1] !== o) d.push(`M${x + 1} ${y}v1`);
        if (y < N - 1 && owner[c + N] !== o) d.push(`M${x} ${y + 1}h1`);
      });
      el('path', { d: d.join(''), class: 'slova-wall' });
      el('rect', { x: 0.03, y: 0.03, width: N - 0.06, height: N - 0.06, rx: 0.12, class: 'slova-frame' });
      // tažené cesty
      paths.forEach((p, i) => {
        if (!p.length) return;
        const g = el('g', { class: 'slova-path' + (i === wrong ? ' wrong' : '') });
        const pts = p.map((c) => xy(c).join(' ')).join(' ');
        el('polyline', { points: pts, stroke: solid(regions[i].hue) }, g);
        if (p.length === 1) el('circle', { cx: xy(p[0])[0], cy: xy(p[0])[1], r: 0.33, fill: solid(regions[i].hue) }, g);
        if (solved[i]) el('circle', { cx: xy(p[0])[0], cy: xy(p[0])[1], r: 0.4, class: 'slova-start', stroke: solid(regions[i].hue) }, g);
      });
      // nápověda: kroužek na prvním písmenu
      regions.forEach((r, i) => {
        if (hinted[i] && !solved[i]) {
          const [x, y] = xy(r.path[0]);
          el('circle', { cx: x, cy: y, r: 0.42, class: 'slova-hinted', stroke: solid(r.hue) });
        }
      });
      // písmena
      letters.forEach((l, c) => {
        if (!l) return;
        const [x, y] = xy(c);
        const o = owner[c];
        const on = paths[o].includes(c);
        el('text', { x, y, class: 'slova-letter' + (on ? ' on' : '') }).textContent = l;
      });
      // seznam slov: délky, po vyřešení celé slovo
      wordsEl.innerHTML = regions.map((r, i) =>
        `<span class="slova-word${solved[i] ? ' done' : ''}" style="--h:${r.hue}" aria-label="${solved[i] ? r.word : r.size + ' písmen'}">`
        + [...r.word].map((ch) => `<i>${solved[i] ? ch : ''}</i>`).join('') + (solved[i] ? '<b aria-hidden="true">✓</b>' : '') + '</span>'
      ).join('');
      hintBtn.disabled = over || regions.every((r, i) => solved[i] || hinted[i]);
    }

    // políčko pod prstem (nebo -1)
    function cellAt(e) {
      const r = svg.getBoundingClientRect();
      const fx = ((e.clientX - r.left) / r.width) * N;
      const fy = ((e.clientY - r.top) / r.height) * N;
      if (fx < 0 || fy < 0 || fx >= N || fy >= N) return -1;
      // u tažení jen blízko středu políčka, ať se nepřeskakuje přes roh
      if (drag && (Math.abs(fx % 1 - 0.5) > 0.42 || Math.abs(fy % 1 - 0.5) > 0.42)) return -1;
      return Math.floor(fy) * N + Math.floor(fx);
    }

    function down(e) {
      if (!running || over) return;
      const c = cellAt(e);
      const o = c < 0 ? -1 : puzzle.owner[c];
      if (o < 0 || solved[o]) return;
      e.preventDefault();
      svg.setPointerCapture && svg.setPointerCapture(e.pointerId);
      const p = paths[o];
      const at = p.indexOf(c);
      if (at === -1) paths[o] = [c];          // nová cesta od tohoto políčka
      else paths[o] = p.slice(0, at + 1);     // zkrátit zpět k políčku
      drag = o;
      draw();
    }
    function move(e) {
      if (drag === null || !running) return;
      const c = cellAt(e);
      if (c < 0 || puzzle.owner[c] !== drag) return;
      const p = paths[drag];
      const end = p[p.length - 1];
      if (c === end) return;
      if (p.length > 1 && c === p[p.length - 2]) { p.pop(); draw(); return; }   // zpět
      if (p.includes(c) || !nbrs(end).includes(c)) return;
      p.push(c);
      draw();
      if (p.length === puzzle.regions[drag].size) check(drag);
    }
    function up() {
      drag = null;
    }

    function check(i) {
      const r = puzzle.regions[i];
      const word = paths[i].map((c) => puzzle.letters[c]).join('');
      if (word === r.word || DICT.has(word)) {
        r.word = word;   // jiné platné slovo ze stejných písmen se počítá taky
        solved[i] = true;
        drag = null;
        draw();
        if (solved.every(Boolean)) {
          over = true;
          running = false;
          stopClock();
          score();
          draw();
          if (onOver) onOver(seconds());
        }
        return;
      }
      // špatné slovo: cesta zatřese a zmizí
      wrong = i;
      drag = null;
      draw();
      setTimeout(() => {
        if (wrong !== i) return;
        wrong = -1;
        paths[i] = [];
        draw();
      }, 450);
    }

    hintBtn.addEventListener('click', () => {
      if (!running || over) return;
      const i = puzzle.regions.findIndex((r, j) => !solved[j] && !hinted[j]);
      if (i < 0) return;
      hinted[i] = true;
      penalty += NAPOVEDA_S;
      score();
      draw();
    });

    svg.addEventListener('pointerdown', down);
    svg.addEventListener('pointermove', move);
    ['pointerup', 'pointercancel'].forEach((ev) => svg.addEventListener(ev, up));

    reset();
    return {
      reset, turn() {}, recolor() { draw(); },
      start() { if (over) return; running = true; startClock(); },
      stop() { running = false; drag = null; stopClock(); },
      get running() { return running; }, get over() { return over; },
      get puzzle() { return puzzle; },   // pro testy
    };
  }
  return { create, generate, WORDS, N };
})();
