// Matika – klientská logika. Jedna stránka, obrazovky se přepínají, všechno
// důležité (generování příkladů, kontrola, body) dělá server v api.php.
(() => {
  const $ = (id) => document.getElementById(id);
  const state = { user: null, modules: {}, module: null, level: null, round: null, i: 0, streak: 0, lock: false };

  async function api(action, data) {
    const res = await fetch('api.php?action=' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {}),
    });
    const json = await res.json().catch(() => ({ error: 'Server neodpověděl.' }));
    if (!res.ok) throw new Error(json.error || 'Chyba serveru');
    return json;
  }

  function show(name) {
    document.querySelectorAll('.screen').forEach((s) => (s.hidden = true));
    $('screen-' + name).hidden = false;
    window.scrollTo(0, 0);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  // "3/4" → svislý zlomek, zbytek textu nechá být
  function renderQ(q) {
    return esc(q)
      .replace(/(\d+)\/(\d+)/g, '<span class="frac"><span>$1</span><span>$2</span></span>')
      .replace(/^(Zkrať:)/, '<span class="label">$1</span>');
  }

  // ---------- přihlášení ----------
  async function loadLogin() {
    const { users } = await api('users');
    $('names').innerHTML = users.map((u) => `<button type="button" data-name="${esc(u.name)}">${esc(u.name)}</button>`).join('');
    $('names').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => login(b.dataset.name)));
    show('login');
    $('login-name').focus();
  }

  async function login(name) {
    try {
      const { user } = await api('login', { name });
      state.user = user;
      await loadMenu();
    } catch (e) {
      alert(e.message);
    }
  }

  $('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('login-name').value.trim();
    if (name) login(name);
  });

  $('btn-logout').addEventListener('click', async () => {
    await api('logout');
    state.user = null;
    $('who').hidden = true;
    loadLogin();
  });

  // ---------- menu ----------
  const DESC = {
    mala: 'do 10 × 10',
    velka: '11–20 × 2–10',
    scitani: 'do 100 až 10 000, záporná, desetinná',
    zlomky: 'krácení, +, −, ·, :',
    deleni: 'podíl a zbytek',
    mix: 'všechno napřeskáčku',
  };

  async function loadMenu() {
    const stats = await api('stats');
    state.user = stats.user;
    $('who').hidden = false;
    $('who-name').textContent = stats.user.name;
    $('who-points').textContent = stats.points + ' b.';
    $('today').textContent = stats.correct_today
      ? `Dnes už máš ${stats.correct_today} správně. Jedeš dál?`
      : 'Dnes ještě nic. Vyber si, co procvičíš.';
    $('modules').innerHTML = Object.entries(state.modules)
      .map(([key, m]) => `<button class="module" data-module="${key}">${esc(m.title)}<small>${DESC[key] || ''}</small></button>`)
      .join('');
    $('modules').querySelectorAll('.module').forEach((b) => b.addEventListener('click', () => pickModule(b.dataset.module)));
    show('menu');
  }

  function pickModule(key) {
    state.module = key;
    const m = state.modules[key];
    $('level-title').textContent = m.title;
    $('levels').innerHTML = Object.entries(m.levels)
      .map(([lv, label]) => `<button type="button" data-level="${lv}">${esc(label)}</button>`)
      .join('');
    $('levels').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => startRound(key, b.dataset.level)));
    show('level');
  }

  // ---------- kolo ----------
  async function startRound(module, level) {
    state.module = module;
    state.level = level;
    try {
      state.round = await api('start', { module, level });
    } catch (e) {
      alert(e.message);
      return;
    }
    state.i = 0;
    state.streak = 0;
    show('round');
    showQuestion();
  }

  function showQuestion() {
    const qs = state.round.questions;
    const q = qs[state.i];
    $('bar').style.width = (state.i / qs.length) * 100 + '%';
    $('counter').textContent = `Příklad ${state.i + 1} / ${qs.length}`;
    $('streak').hidden = state.streak < 3;
    $('streak').textContent = `🔥 ${state.streak} v řadě`;
    $('question').innerHTML = renderQ(q.q) + (q.kind === 'divrem' || q.q.startsWith('Zkrať') ? '' : ' =');
    $('feedback').hidden = true;
    $('feedback').innerHTML = '';
    $('hints').hidden = true;
    $('hints').innerHTML = '';
    $('hint-info').textContent = '';
    $('btn-hint').hidden = false;
    $('btn-hint').textContent = 'Nápověda';
    paper.clear();
    $('btn-submit').hidden = false;
    state.lock = false;

    const inputs = $('inputs');
    // na dotykovém zařízení píšeme vlastní klávesnicí, systémová se nevysouvá
    const ro = KEYPAD ? ' readonly inputmode="none"' : '';
    if (q.kind === 'divrem') {
      inputs.innerHTML = `<span>=</span><input type="text" inputmode="numeric" id="ans-q" autocomplete="off" placeholder="podíl"${ro}>
        <span>zb.</span><input type="text" inputmode="numeric" id="ans-r" class="narrow" autocomplete="off" placeholder="0"${ro}>`;
      $('ans-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('ans-r').focus(); } });
    } else {
      const mode = q.kind === 'frac' ? 'text' : 'decimal';
      const ph = q.kind === 'frac' ? 'např. 3/4' : '';
      inputs.innerHTML = `<input type="text" inputmode="${mode}" id="ans" autocomplete="off" placeholder="${ph}"${ro}>`;
    }
    if (KEYPAD) {
      $('btn-submit').hidden = true;
      inputs.querySelectorAll('input').forEach((inp) => inp.addEventListener('click', () => setActive(inp)));
      setActive(inputs.querySelector('input'));
      renderKeypad(q);
    } else {
      autoFocus(inputs.querySelector('input'));
    }
  }

  // ---------- vlastní klávesnice (telefon, tablet) ----------
  const KEYPAD = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  let activeInput = null;

  function setActive(inp) {
    activeInput = inp;
    document.querySelectorAll('#inputs input').forEach((x) => x.classList.toggle('active', x === inp));
  }

  function renderKeypad(q) {
    const extra = q.keys || [];
    const k1 = q.kind === 'divrem' ? 'zb.' : extra[0] || '';
    const k2 = q.kind === 'divrem' ? '' : extra[1] || '';
    const key = (label, cls = '') => label
      ? `<button type="button" class="key ${cls}" data-key="${esc(label)}">${esc(label)}</button>`
      : '<button type="button" class="key blank" tabindex="-1" aria-hidden="true"></button>';
    $('keypad').innerHTML =
      key('7') + key('8') + key('9') + `<button type="button" class="key fn" data-key="del" aria-label="Smazat">⌫</button>` +
      key('4') + key('5') + key('6') + key(k1, 'fn') +
      key('1') + key('2') + key('3') + key(k2, 'fn') +
      key('0', 'wide') + `<button type="button" class="key ok wide" data-key="ok">Hotovo</button>`;
    $('keypad').hidden = false;
  }

  function pressKey(k) {
    if (state.lock || !activeInput) return;
    const v = activeInput.value;
    if (k === 'ok') {
      $('form-answer').requestSubmit ? $('form-answer').requestSubmit() : $('form-answer').dispatchEvent(new Event('submit', { cancelable: true }));
      return;
    }
    if (k === 'zb.') {
      setActive($('ans-r') || activeInput);
      return;
    }
    if (k === 'del') {
      activeInput.value = v.slice(0, -1);
      return;
    }
    if (v.length >= 12) return;
    if (k === '−') {
      activeInput.value = v.startsWith('-') ? v.slice(1) : '-' + v;   // přepíná znaménko
    } else if (k === ',') {
      if (!v.includes(',')) activeInput.value = (v === '' || v === '-' ? v + '0' : v) + ',';
    } else if (k === '/') {
      if (v !== '' && !v.includes('/')) activeInput.value = v + '/';
    } else {
      activeInput.value = v + k;
    }
  }

  $('keypad').addEventListener('click', (e) => {
    const b = e.target.closest('[data-key]');
    if (b) pressKey(b.dataset.key);
  });

  // tablet s fyzickou klávesnicí: psaní funguje i do políček jen pro čtení
  document.addEventListener('keydown', (e) => {
    if (!KEYPAD || $('screen-round').hidden || state.lock || e.metaKey || e.ctrlKey) return;
    const map = { Backspace: 'del', Enter: 'ok', '-': '−', ',': ',', '.': ',', '/': '/' };
    const k = /^[0-9]$/.test(e.key) ? e.key : map[e.key];
    if (!k) return;
    e.preventDefault();
    pressKey(k);
  });

  // Na dotykovém zařízení s otevřeným papírem políčko nezaměřujeme,
  // jinak by vyjela klávesnice a zakryla papír.
  function autoFocus(el) {
    const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (el && !(touch && !$('paper').hidden)) el.focus({ preventScroll: true });
  }

  function collectAnswer() {
    const q = state.round.questions[state.i];
    if (q.kind === 'divrem') {
      return { q: $('ans-q').value.trim(), r: $('ans-r').value.trim() };
    }
    return $('ans').value.trim();
  }

  function answerEmpty(a) {
    return typeof a === 'string' ? a === '' : a.q === '' || a.r === '';
  }

  $('form-answer').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.lock) return;
    const answer = collectAnswer();
    if (answerEmpty(answer)) return;
    state.lock = true;
    const q = state.round.questions[state.i];
    let r;
    try {
      r = await api('answer', { round_id: state.round.round_id, i: q.i, answer });
    } catch (err) {
      alert(err.message);
      state.lock = false;
      return;
    }
    const fb = $('feedback');
    fb.hidden = false;
    $('keypad').hidden = true;
    $('btn-submit').hidden = true;
    document.querySelectorAll('#inputs input').forEach((inp) => (inp.disabled = true));
    $('btn-hint').hidden = true;
    $('hint-info').textContent = '';
    if (r.correct) {
      state.streak++;
      fb.className = 'feedback ok';
      const extra = r.points < 10 ? ` <small>+${r.points} b. (s nápovědou)</small>` : ` <small>+${r.points} b.</small>`;
      fb.innerHTML = pick(['Správně!', 'Přesně tak!', 'Jo!', 'Paráda!', 'Trefa!']) + extra + (r.note ? `<small>${esc(r.note)}</small>` : '');
      setTimeout(next, r.note ? 2200 : 1000);
    } else {
      state.streak = 0;
      fb.className = 'feedback bad';
      const steps = (r.steps || []).length ? `<ol class="steps">${r.steps.map((l) => `<li>${renderQ(l)}</li>`).join('')}</ol>` : '';
      fb.innerHTML = `Správně je <b>${renderQ(r.answer)}</b>`
        + (r.note ? `<small>${esc(r.note)}</small>` : '')
        + (r.why ? `<span class="why">${esc(r.why)}</span>` : '')
        + steps
        + `<div class="next"><button type="button" class="btn" id="btn-next">Další</button></div>`;
      if (!KEYPAD) $('btn-next').focus();
      $('btn-next').addEventListener('click', next);
      // na telefonu může být vysvětlení pod okrajem obrazovky
      fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });

  // Nápověda po krocích: každé kliknutí odkryje další krok.
  $('btn-hint').addEventListener('click', async () => {
    if (!state.round || state.lock) return;
    const q = state.round.questions[state.i];
    let r;
    try {
      r = await api('hint', { round_id: state.round.round_id, i: q.i });
    } catch (err) {
      alert(err.message);
      return;
    }
    $('hints').innerHTML = r.steps.map((l) => `<li>${renderQ(l)}</li>`).join('');
    $('hints').hidden = false;
    const more = r.steps.length < r.total;
    $('btn-hint').hidden = !more;
    $('btn-hint').textContent = 'Další krok';
    $('hint-info').textContent = `Krok ${r.steps.length} z ${r.total}. Za správnou odpověď teď ${r.points} b.`;
    autoFocus(document.getElementById('ans') || document.getElementById('ans-q'));
  });

  // ---------- papír ----------
  const paper = window.Paper.create($('paper-canvas'));
  function setPaper(open) {
    $('paper').hidden = !open;
    $('paper-tools').hidden = !open;
    $('btn-paper').textContent = open ? '✏️ Schovat papír' : '✏️ Papír na počítání';
    if (open) paper.resize();
    try { localStorage.setItem('matika_paper', open ? '1' : '0'); } catch (e) { /* bez úložiště */ }
  }
  $('btn-paper').addEventListener('click', () => setPaper($('paper').hidden));
  document.querySelectorAll('#paper-tools [data-tool]').forEach((b) =>
    b.addEventListener('click', () => {
      paper.setTool(b.dataset.tool);
      document.querySelectorAll('#paper-tools [data-tool]').forEach((x) => x.classList.toggle('on', x === b));
    })
  );
  $('paper-undo').addEventListener('click', () => paper.undo());
  $('paper-clear').addEventListener('click', () => paper.clear());
  // výchozí stav: na širokém displeji (tablet na šířku) je papír vedle příkladu otevřený
  let paperOpen = window.matchMedia && window.matchMedia('(min-width: 900px)').matches;
  try {
    const saved = localStorage.getItem('matika_paper');
    if (saved !== null) paperOpen = saved === '1';
  } catch (e) { /* bez úložiště */ }
  setPaper(paperOpen);

  // Enter po špatné odpovědi = další příklad
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && state.lock && !$('feedback').hidden && $('btn-next')) {
      e.preventDefault();
      next();
    }
  });

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  async function next() {
    if (!state.round) return;
    state.i++;
    if (state.i < state.round.questions.length) {
      showQuestion();
      return;
    }
    const res = await api('finish', { round_id: state.round.round_id });
    const rid = state.round.round_id;
    state.round = null;
    showResult(res, rid);
  }

  // ---------- výsledek ----------
  function showResult(res) {
    const pct = res.correct / res.total;
    $('stars').innerHTML = [1, 2, 3].map((n) => `<span class="${n <= res.stars ? 'on' : ''}">★</span>`).join('');
    $('result-title').textContent =
      pct === 1 ? 'Bez chyby!' : pct >= 0.8 ? 'Skoro bez chyby!' : pct >= 0.5 ? 'Dobrá práce.' : 'Příště to půjde líp.';
    let text = `${res.correct} z ${res.total} správně, +${res.points} bodů.`;
    if (res.best_before && res.correct > res.best_before) text += ' Tvůj nový rekord!';
    else if (res.best_before) text += ` Tvůj rekord je ${res.best_before}.`;
    $('result-text').textContent = text;
    const wrong = res.answers.filter((a) => !Number(a.is_correct));
    $('mistakes').innerHTML = wrong.length
      ? `<h2>Kde to neklaplo</h2><p class="empty">Klepni na příklad a uvidíš postup.</p><div class="mistakes">${wrong
          .map((a) => `<details><summary><span>${renderQ(a.question)}</span><span class="answers"><span class="wrong">${esc(a.given_answer)}</span> <span class="right">${renderQ(a.correct_answer)}</span></span></summary>`
            + `<ol class="steps">${(a.steps || []).map((l) => `<li>${renderQ(l)}</li>`).join('')}</ol></details>`)
          .join('')}</div>`
      : '';
    show('result');
    $('btn-again').focus();
  }

  $('btn-again').addEventListener('click', () => startRound(state.module, state.level));

  // ---------- statistiky ----------
  async function loadStats() {
    const s = await api('stats');
    $('who-points').textContent = s.points + ' b.';
    $('tiles').innerHTML = `
      <div class="tile"><b>${s.points}</b><span>bodů celkem</span></div>
      <div class="tile"><b>${s.rounds}</b><span>odehraných kol</span></div>
      <div class="tile"><b>${s.correct_today}</b><span>správně dnes</span></div>`;
    const rows = s.per_level.map((p) => {
      const m = state.modules[p.module];
      const label = m ? `${m.title} – ${m.levels[p.level] || p.level}` : p.module;
      const pct = p.total ? Math.round((p.correct / p.total) * 100) : 0;
      return `<tr><td>${esc(label)}</td><td class="num">${p.rounds}</td><td class="num">${pct} %</td><td class="num">${p.best}/10</td></tr>`;
    });
    $('per-level').innerHTML = rows.length
      ? `<tr><th>Úkol</th><th>Kol</th><th>Úspěšnost</th><th>Rekord</th></tr>${rows.join('')}`
      : '<tr><td class="empty">Zatím žádné dokončené kolo.</td></tr>';
    $('hardest').innerHTML = s.hardest.length
      ? `<div class="mistakes">${s.hardest.map((h) => `<div><span>${renderQ(h.question)}</span><span class="right">${renderQ(h.correct_answer)}</span></div>`).join('')}</div>`
      : '<p class="empty">Žádné opakované chyby. Dobré znamení.</p>';
    $('board').innerHTML = s.leaderboard.length
      ? `<tr><th>#</th><th>Jméno</th><th>Body</th></tr>` + s.leaderboard
          .map((b, i) => `<tr class="${b.name === s.user.name ? 'me' : ''}"><td>${i + 1}.</td><td>${esc(b.name)}</td><td class="num">${b.points}</td></tr>`)
          .join('')
      : '<tr><td class="empty">Tento týden ještě nikdo necvičil.</td></tr>';
    show('stats');
  }

  // ---------- navigace ----------
  document.querySelectorAll('[data-go]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const to = el.dataset.go;
      if (!state.user) return loadLogin();
      state.round = null;
      if (to === 'menu') loadMenu();
      else if (to === 'stats') loadStats();
    })
  );

  // ---------- start ----------
  $('form-access').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('access', { password: $('access-pass').value });
      location.reload();
    } catch (err) {
      $('access-error').textContent = err.message;
    }
  });

  (async () => {
    try {
      const res = await api('modules');
      if (res.locked) {
        show('access');
        $('access-pass').focus();
        return;
      }
      const { modules, user } = res;
      state.modules = modules;
      state.user = user;
      if (user) await loadMenu();
      else await loadLogin();
    } catch (e) {
      document.body.insertAdjacentHTML('afterbegin', `<p style="padding:16px;color:#d64545">${esc(e.message)}</p>`);
    }
  })();
})();
