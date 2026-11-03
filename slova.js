// Slova: mřížka (5 × 5 až 9 × 9) je celá poskládaná ze slov, každé má
// písmena zakroucená do hada. Kde které slovo leží, není vidět: mřížka je
// bílá a pod ní jsou jen šedá okénka podle délek slov. Tažením prstem po
// sousedních písmenech (nahoru, dolů, doleva, doprava) najdi slovo; nalezené
// se obarví a ohraničí. Každé písmeno patří právě do jednoho slova, šedá
// políčka nejsou ve hře. Puštěný tah zůstane obarvený a jde na něj navázat
// (táhnout dál od jeho konce); zmizí, až dítě ťukne jinam. Skóre je čas
// v sekundách. Nápověda (bez trestu) odkryje v mřížce první písmeno náhodného
// slova, ale neřekne kterého; další kliknutí odkrývají jeho další písmena,
// po celém slově (nebo když ho dítě najde) začne další slovo.
window.Slova = (() => {
  // velikost plochy → délky slov (víc stejných = častější) a nejvýš šedých políček
  const SIZES = {
    5: { lens: [3, 4, 4, 5, 5, 6] },
    6: { lens: [4, 4, 5, 5, 6, 6, 7] },
    7: { lens: [4, 5, 5, 6, 6, 7, 7, 8] },
    8: { lens: [4, 5, 6, 6, 7, 7, 8, 8] },
    9: { lens: [5, 5, 6, 6, 7, 7, 8] },
  };
  // prázdná (šedá) políčka mezi slovy, ať se slova hledají snáz: každá hra
  // má náhodně šestinu až třetinu mřížky prázdnou
  const EMPTY_MIN = 1 / 6;
  const EMPTY_MAX = 1 / 3;
  const HUES = [345, 75, 220, 190, 25, 140, 290, 50, 0, 165, 265, 110, 315, 205, 35, 245];

  // Slova podle jazyka (slova-words.js): podle délky, celý slovník (uzná se
  // i jiné slovo ze stejných písmen) a český překlad u cizích jazyků.
  const LANGS = {};
  function lang(id) {
    if (LANGS[id]) return LANGS[id];
    const src = (window.SlovaWords || {})[id] || window.SlovaWords.cs;
    const L = { byLen: {}, dict: new Set(), trans: {} };
    for (const tok of src.trim().split(/\s+/)) {
      const [w, t] = tok.split('=');
      if (L.dict.has(w)) continue;
      L.dict.add(w);
      if (t) L.trans[w] = t.replace(/_/g, ' ');
      const n = [...w].length;
      if (n >= 3 && n <= 8) (L.byLen[n] = L.byLen[n] || []).push(w);
    }
    return (LANGS[id] = L);
  }

  // Nedávno použitá slova (v prohlížeči, pro každý jazyk): přednost mají
  // slova, která dítě ještě nevidělo, ať se co nejméně opakují.
  const RECENT_MAX = 800;
  const recentKey = (id) => 'matika_slova_recent_' + id;
  function recentLoad(id) {
    try { return JSON.parse(localStorage.getItem(recentKey(id))) || []; } catch (e) { return []; }
  }
  function recentAdd(id, words) {
    const list = recentLoad(id).filter((w) => !words.includes(w)).concat(words).slice(-RECENT_MAX);
    try { localStorage.setItem(recentKey(id), JSON.stringify(list)); } catch (e) { /* bez úložiště */ }
  }

  const rnd = (n) => Math.floor(Math.random() * n);
  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const nbrs = (c, N) => {
    const x = c % N, y = Math.floor(c / N), out = [];
    if (x > 0) out.push(c - 1);
    if (x < N - 1) out.push(c + 1);
    if (y > 0) out.push(c - N);
    if (y < N - 1) out.push(c + N);
    return out;
  };

  // Náhodná cesta délky len po volných políčkách z políčka start (prohledávání
  // do hloubky, přednost mají sousedé s méně volnými sousedy, ať nezůstávají díry).
  function walk(owner, start, len, N) {
    const path = [start];
    owner[start] = -2;
    const free = (c) => nbrs(c, N).filter((d) => owner[d] === -1).length;
    let tries = 0;
    // slovo musí zahnout (rovná řada se dá přečíst bez hledání), delší i víckrát
    const turns = () => path.slice(2).filter((c, i) => c - path[i + 1] !== path[i + 1] - path[i]).length;
    const need = len >= 7 ? 3 : len >= 5 ? 2 : 1;
    function go() {
      if (path.length === len) return turns() >= need;
      if (tries++ > 400) return false;
      const opts = shuffle(nbrs(path[path.length - 1], N).filter((d) => owner[d] === -1))
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

  // Rozdělí plochu N × N na pole se slovy. Vrací { N, owner, letters, regions }.
  function generate(N = 7, langId = 'cs', recent = []) {
    const cfg = SIZES[N];
    const BY_LEN = lang(langId).byLen;
    const old = new Set(recent);
    const empty = EMPTY_MIN + Math.random() * (EMPTY_MAX - EMPTY_MIN);
    const target = Math.round(N * N * (1 - empty));   // kolik políček má být ve slovech
    let best = null;
    for (let attempt = 0; attempt < 200; attempt++) {
      const owner = new Array(N * N).fill(-1);   // -1 volné, -3 šedé, jinak číslo pole
      const regions = [];
      const used = new Set();
      let filled = 0;
      while (filled < target) {
        const free = owner.map((o, c) => (o === -1 ? c : -1)).filter((c) => c >= 0);
        if (!free.length) break;
        // začni na náhodném volném políčku, přednostně takovém, které nesousedí
        // s jiným slovem: slova jsou rozesetá a mezi nimi zůstávají mezery
        const apart = free.filter((c) => nbrs(c, N).every((d) => owner[d] < 0));
        const from = apart.length && Math.random() < 0.8 ? apart : free;
        const start = from[rnd(from.length)];
        let placed = false;
        // ke konci kratší slova, ať se trefí počet políček ve slovech
        const left = target - filled;
        const lens = shuffle(cfg.lens.filter((n) => n <= left + 2 && BY_LEN[n])).concat([5, 4, 3].filter((n) => n <= left + 2 && BY_LEN[n]));
        for (const len of [...new Set(lens)]) {
          const path = walk(owner, start, len, N);
          if (!path) continue;
          let words = shuffle(BY_LEN[len].filter((w) => !used.has(w) && !old.has(w)));
          if (!words.length) words = shuffle(BY_LEN[len].filter((w) => !used.has(w)));
          if (!words.length) continue;
          used.add(words[0]);
          path.forEach((c) => { owner[c] = regions.length; });
          regions.push({ word: words[0], path, size: len });
          filled += len;
          placed = true;
          break;
        }
        if (!placed) owner[start] = -3;
      }
      for (let c = 0; c < owner.length; c++) if (owner[c] === -1) owner[c] = -3;   // zbytek je prázdný
      const miss = Math.abs(filled - target);
      if (regions.length >= 3 && (!best || miss < best.miss)) best = { owner, regions, miss };
      if (best && best.miss <= 1) break;
    }
    const letters = new Array(N * N).fill('');
    best.regions.forEach((r) => r.path.forEach((c, i) => { letters[c] = [...r.word][i]; }));
    // seznam pod mřížkou podle délky, stejně dlouhá slova zamíchaná (abeceda by napovídala)
    shuffle(best.regions).sort((a, b) => a.size - b.size);
    best.regions.forEach((r, i) => { r.path.forEach((c) => { best.owner[c] = i; }); r.hue = HUES[i % HUES.length]; });
    return { N, owner: best.owner, letters, regions: best.regions };
  }

  const SVG = 'http://www.w3.org/2000/svg';

  function create(stage, { onScore, onOver, size, lang: langId } = {}) {
    const N = SIZES[size] ? Number(size) : 7;
    const LG = window.SlovaWords && window.SlovaWords[langId] ? langId : 'cs';
    const L = lang(LG);
    const box = document.createElement('div');
    box.className = 'slova slova-' + N;
    box.innerHTML = `<svg class="slova-grid" viewBox="0 0 ${N} ${N}" role="img" aria-label="Plocha se slovy"></svg>`
      + '<div class="slova-words" aria-live="polite"></div>'
      + '<p class="slova-trans" aria-live="polite"></p>'
      + '<button type="button" class="btn slova-hint">Nápověda</button>';
    stage.appendChild(box);
    const svg = box.querySelector('svg');
    const wordsEl = box.querySelector('.slova-words');
    const hintBtn = box.querySelector('.slova-hint');
    const transEl = box.querySelector('.slova-trans');
    let shown = -1;   // u kterého vyřešeného slova je vidět překlad

    // cur = právě tažená cesta (políčka); slova se hledají bez nápovědy, kde
    // pole leží: dokud slovo není nalezené, mřížka je bílá a bez hranic.
    let puzzle, cur, solved, hints, hintWord, elapsed, running, over, tick, last, drag, msg, msgTimer;

    const seconds = () => Math.floor(elapsed / 1000);
    function score() { if (onScore) onScore(seconds()); }

    function reset() {
      stopClock();
      puzzle = generate(N, LG, recentLoad(LG));
      recentAdd(LG, puzzle.regions.map((r) => r.word));
      shown = -1;
      cur = [];
      solved = puzzle.regions.map(() => false);
      hints = puzzle.regions.map(() => 0);   // kolik písmen slova nápověda odkryla
      hintWord = -1;                          // slovo, jehož písmena nápověda právě odkrývá
      elapsed = 0;
      running = false;
      over = false;
      drag = false;
      msg = '';
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
    // pole, do kterého políčko patří, jen když je už nalezené (jinak -1)
    const found = (c) => (puzzle.owner[c] >= 0 && solved[puzzle.owner[c]] ? puzzle.owner[c] : -1);

    function draw() {
      svg.textContent = '';
      const { owner, letters, regions } = puzzle;
      // políčka: šedá mimo hru, bílá, nalezená slova v barvě svého pole
      owner.forEach((o, c) => {
        const [x, y] = xy(c);
        const f = found(c);
        el('rect', { x: x - 0.5, y: y - 0.5, width: 1, height: 1, class: o < 0 ? 'slova-off' : 'slova-cell', fill: f >= 0 ? tint(regions[f].hue) : '' });
      });
      // hranice jen kolem nalezených slov
      const d = [];
      owner.forEach((o, c) => {
        const x = c % N, y = Math.floor(c / N);
        const f = found(c);
        if (x < N - 1 && (f >= 0 || found(c + 1) >= 0) && found(c + 1) !== f) d.push(`M${x + 1} ${y}v1`);
        if (y < N - 1 && (f >= 0 || found(c + N) >= 0) && found(c + N) !== f) d.push(`M${x} ${y + 1}h1`);
      });
      el('path', { d: d.join(''), class: 'slova-wall' });
      el('rect', { x: 0.03, y: 0.03, width: N - 0.06, height: N - 0.06, rx: 0.12, class: 'slova-frame' });
      // nalezená slova
      regions.forEach((r, i) => {
        if (!solved[i]) return;
        const g = el('g', { class: 'slova-path' });
        el('polyline', { points: r.path.map((c) => xy(c).join(' ')).join(' '), stroke: solid(r.hue) }, g);
        el('circle', { cx: xy(r.path[0])[0], cy: xy(r.path[0])[1], r: 0.4, class: 'slova-start', stroke: solid(r.hue) }, g);
      });
      // právě tažená cesta
      if (cur.length) {
        const g = el('g', { class: 'slova-path slova-cur' });
        el('polyline', { points: cur.map((c) => xy(c).join(' ')).join(' ') }, g);
        if (cur.length === 1) el('circle', { cx: xy(cur[0])[0], cy: xy(cur[0])[1], r: 0.33 }, g);
      }
      // nápověda: odkrytá písmena v pořadí (kroužky spojené čárou)
      regions.forEach((r, i) => {
        if (!hints[i] || solved[i]) return;
        const g = el('g', { class: 'slova-hinted' });
        const cells = r.path.slice(0, hints[i]);
        if (cells.length > 1) el('polyline', { points: cells.map((c) => xy(c).join(' ')).join(' ') }, g);
        cells.forEach((c, k) => el('circle', { cx: xy(c)[0], cy: xy(c)[1], r: k ? 0.36 : 0.42, class: k ? '' : 'first' }, g));
      });
      // písmena
      letters.forEach((l, c) => {
        if (!l) return;
        const [x, y] = xy(c);
        el('text', { x, y, class: 'slova-letter' + (found(c) >= 0 || cur.includes(c) ? ' on' : '') }).textContent = l;
      });
      // seznam slov: šedá okénka podle délky, po nalezení slovo v barvě
      // (nápověda se tu neukazuje, ať dítě neví, kterého slova se týká)
      wordsEl.innerHTML = regions.map((r, i) => {
        const tr = solved[i] && L.trans[r.word];
        const tag = tr ? 'button type="button"' : 'span';
        return `<${tag} class="slova-word${solved[i] ? ' done' : ''}${i === shown ? ' shown' : ''}" data-i="${i}" style="--h:${r.hue}" aria-label="${solved[i] ? r.word + (tr ? ', ukázat překlad' : '') : r.size + ' písmen'}">`
          + [...r.word].map((ch) => `<i>${solved[i] ? ch : ''}</i>`).join('') + (solved[i] ? '<b aria-hidden="true">✓</b>' : '') + `</${tr ? 'button' : 'span'}>`;
      }).join('');
      // překlad: po ťuknutí na vyřešené slovo, po konci hry všechny
      const any = Object.keys(L.trans).length && solved.some(Boolean);
      transEl.innerHTML = msg ? msg
        : over && any ? regions.map((r) => `<span><b>${r.word}</b> = ${L.trans[r.word] || '?'}</span>`).join('')
        : shown >= 0 ? `<span><b>${regions[shown].word}</b> = ${L.trans[regions[shown].word] || '?'}</span>`
        : any ? 'Ťukni na vyřešené slovo a uvidíš překlad.' : '';
      transEl.classList.toggle('tip', !!msg || (!over && shown < 0));
      box.classList.toggle('done', over);
      transEl.hidden = !transEl.textContent;
      hintBtn.disabled = over || regions.every((r, i) => solved[i] || hints[i] >= r.size);
    }

    function say(text) {
      msg = text;
      clearTimeout(msgTimer);
      msgTimer = setTimeout(() => { msg = ''; draw(); }, 2200);
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
    // políčko, kterým jde táhnout: s písmenem a v ještě nenalezeném slově
    const free = (c) => c >= 0 && puzzle.owner[c] >= 0 && found(c) < 0;

    // Ťuknutí na konec puštěného tahu na něj naváže, jinam ho smaže
    // (na volném políčku začne nový tah).
    function down(e) {
      if (!running || over) return;
      const c = cellAt(e);
      if (cur.length && c === cur[cur.length - 1]) {
        e.preventDefault();
        if (svg.setPointerCapture) svg.setPointerCapture(e.pointerId);
        drag = true;
        return;
      }
      cur = [];
      if (free(c)) {
        e.preventDefault();
        if (svg.setPointerCapture) svg.setPointerCapture(e.pointerId);
        cur = [c];
        drag = true;
      }
      draw();
    }
    function move(e) {
      if (!drag || !running) return;
      const c = cellAt(e);
      if (!free(c)) return;
      const end = cur[cur.length - 1];
      if (c === end) return;
      if (cur.length > 1 && c === cur[cur.length - 2]) { cur.pop(); draw(); return; }   // zpět
      if (cur.includes(c) || !nbrs(end, N).includes(c)) return;
      cur.push(c);
      if (!check()) draw();
    }
    // puštěno: tah zůstane obarvený (dá se na něj navázat)
    function up() {
      if (!drag) return;
      drag = false;
      const word = cur.map((c) => puzzle.letters[c]).join('');
      if (cur.length > 1 && puzzle.regions.some((r, i) => !solved[i] && r.word === word)) { say(`Slovo ${word} je schované jinde.`); draw(); }
    }

    // Tažená cesta vede přesně přes všechna políčka nenalezeného slova a dává
    // platné slovo (jiné slovo ze stejných písmen se počítá taky)?
    function check() {
      const word = cur.map((c) => puzzle.letters[c]).join('');
      const set = new Set(cur);
      const i = puzzle.regions.findIndex((r, j) => !solved[j] && r.size === cur.length && r.path.every((c) => set.has(c)));
      if (i < 0) return false;
      const r = puzzle.regions[i];
      if (word !== r.word && !L.dict.has(word)) return false;
      r.word = word;
      r.path = cur.slice();
      solved[i] = true;
      cur = [];
      drag = false;
      msg = '';
      if (solved.every(Boolean)) {
        over = true;
        running = false;
        stopClock();
        score();
        draw();
        if (onOver) onOver(seconds());
        return true;
      }
      draw();
      return true;
    }

    // překlad vyřešeného slova (jde i po konci hry)
    wordsEl.addEventListener('click', (e) => {
      const b = e.target.closest('button.slova-word');
      if (!b) return;
      const i = Number(b.dataset.i);
      shown = shown === i ? -1 : i;
      draw();
    });

    // nápověda: další písmeno slova, které se právě odkrývá; když není (na
    // začátku, po celém slově, po jeho nalezení), náhodné nenalezené slovo
    // (přednostně bez odkrytých písmen)
    hintBtn.addEventListener('click', () => {
      if (!running || over) return;
      const regs = puzzle.regions;
      if (hintWord < 0 || solved[hintWord] || hints[hintWord] >= regs[hintWord].size) {
        const open = regs.map((r, j) => j).filter((j) => !solved[j] && hints[j] < regs[j].size);
        if (!open.length) return;
        const fresh = open.filter((j) => !hints[j]);
        const from = fresh.length ? fresh : open;
        hintWord = from[rnd(from.length)];
      }
      hints[hintWord]++;
      draw();
    });
    // ťuknutí mimo mřížku (kromě nápovědy) smaže puštěný tah
    box.addEventListener('pointerdown', (e) => {
      if (cur.length && !drag && !svg.contains(e.target) && !hintBtn.contains(e.target)) { cur = []; draw(); }
    });

    svg.addEventListener('pointerdown', down);
    svg.addEventListener('pointermove', move);
    ['pointerup', 'pointercancel'].forEach((ev) => svg.addEventListener(ev, up));

    reset();
    return {
      reset, turn() {}, recolor() { draw(); },
      start() { if (over) return; running = true; startClock(); },
      stop() { running = false; drag = false; cur = []; stopClock(); },
      get running() { return running; }, get over() { return over; },
      get puzzle() { return puzzle; },   // pro testy
    };
  }
  return { create, generate, lang, SIZES };
})();
