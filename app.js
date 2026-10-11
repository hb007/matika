// Matika – klientská logika. Jedna stránka, obrazovky se přepínají, všechno
// důležité (generování příkladů, kontrola) dělá server v api.php.
(() => {
  const $ = (id) => document.getElementById(id);
  const state = { modules: {}, diffs: {}, goal: 20, users: [], user: null, module: null, level: null, diff: 'stredni', ex: null, lock: false, timer: null };
  const EMOJI = { holka: '👧', kluk: '👦' };
  const DIFF_COLOR = { lehke: '#1f9d55', stredni: '#3b6cf6', tezke: '#d6452b' };

  async function api(action, data) {
    const res = await fetch('api.php?action=' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: state.user, ...(data || {}) }),   // kdo cvičí, jde s každým požadavkem
    });
    const json = await res.json().catch(() => ({ error: 'Server neodpověděl.' }));
    if (res.status === 401) { state.user = null; showWho(); }
    if (!res.ok) throw new Error(json.error || 'Chyba serveru');
    return json;
  }

  function show(name) {
    if (name !== 'round') delete document.body.dataset.diff;
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

  // ---------- uživatelé ----------
  function prefs() {
    try { return JSON.parse(localStorage.getItem('matika_pref_' + state.user)) || {}; } catch (e) { return {}; }
  }
  function savePrefs(p) {
    try { localStorage.setItem('matika_pref_' + state.user, JSON.stringify(p)); } catch (e) { /* bez úložiště */ }
  }
  function prefFor(module) {
    const p = prefs()[module] || {};
    const levels = Object.keys(state.modules[module].levels);
    return { level: levels.includes(p.level) ? p.level : levels[0], diff: p.diff in diffsFor(module) ? p.diff : 'stredni' };
  }

  // Náhodný mix má navíc „Vše“: každý příklad s jinou obtížností.
  function diffsFor(module) {
    return module === 'mix' ? { ...state.diffs, vse: 'Vše' } : state.diffs;
  }

  // Kdo cvičí, určuje adresa (/holka, /kluk). Aktivní dítě je v horním řádku
  // velké a nad příkladem, druhé malé; klik na něj přejde na jeho adresu.
  function renderKids(users) {
    state.users = users;
    const me = users.find((u) => u.id === state.user);
    $('kids').innerHTML = users.map((u) => {
      if (u.id !== state.user) {
        return `<a class="kid other" href="${u.kind}" title="Přepnout na ${esc(u.name)}">${EMOJI[u.kind]} <span class="kid-name">${esc(u.name)}</span> <b>${u.today}</b></a>`;
      }
      const goal = `<span class="goal" title="Denní cíl ${u.solved_today}/${state.goal}"><span style="width:${Math.min(100, (u.solved_today / state.goal) * 100)}%"></span></span>`;
      const days = u.days ? `<span class="days">🔥${u.days}</span>` : '';
      return `<span class="kid" aria-current="true"><span class="kid-emoji">${EMOJI[u.kind]}</span> <span class="kid-name">${esc(u.name)}</span> <b>${u.today}</b>${days}${goal}</span>`;
    }).join('');
    if (me) {
      $('me').innerHTML = `<span>${EMOJI[me.kind]}</span> ${esc(me.name)}`;
      $('hello').textContent = `${EMOJI[me.kind]} ${me.name}, co procvičíš?`;
      document.title = `${EMOJI[me.kind]} ${me.name} – Matika`;
    }
  }

  function showWho() {
    $('who-pick').innerHTML = state.users.map((u) =>
      `<a class="who-btn" href="${u.kind}"><span>${EMOJI[u.kind]}</span>${esc(u.name)}</a>`).join('');
    show('who');
  }

  // ---------- menu ----------
  function showMenu() {
    delete document.body.dataset.diff;
    $('modules').innerHTML = Object.entries(state.modules)
      .map(([key, m]) => `<button class="module" data-module="${key}">${esc(m.title)}</button>`)
      .join('');
    show('menu');
  }
  $('modules').addEventListener('click', (e) => {
    const b = e.target.closest('[data-module]');
    if (!b) return;
    const p = prefFor(b.dataset.module);
    startTask(b.dataset.module, p.level, p.diff);
  });

  // ---------- příklady ----------
  function startTask(module, level, diff) {
    Object.assign(state, { module, level, diff });
    const p = prefs();
    p[module] = { level, diff };
    savePrefs(p);
    if (diff !== 'vse') setDiffColor(diff);
    renderTabs();
    show('round');
    $('tabs').querySelector('[aria-current]').scrollIntoView({ inline: 'center', block: 'nearest' });
    next();
  }

  function setDiffColor(diff) {
    document.body.dataset.diff = diff;
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = DIFF_COLOR[diff];
  }

  function renderTabs() {
    const btn = (cls, attr, val, label, on) =>
      `<button type="button" class="${cls}" ${attr}="${val}"${on ? ' aria-current="true"' : ''}>${esc(label)}</button>`;
    $('tabs').innerHTML = Object.entries(state.modules)
      .map(([key, m]) => btn('tab', 'data-module', key, m.title, key === state.module)).join('');
    const levels = Object.entries(state.modules[state.module].levels);
    $('chips').hidden = levels.length < 2;
    $('chips').innerHTML = levels.map(([lv, label]) => btn('chip', 'data-level', lv, label, lv === state.level)).join('');
    $('diffs').innerHTML = Object.entries(diffsFor(state.module))
      .map(([d, label]) => btn('diff', 'data-diff', d, label, d === state.diff)).join('');
  }

  $('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-module]');
    if (!b) return;
    const p = prefFor(b.dataset.module);
    startTask(b.dataset.module, p.level, p.diff);
  });
  $('chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-level]');
    if (b) startTask(state.module, b.dataset.level, state.diff);
  });
  $('diffs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-diff]');
    if (b) startTask(state.module, state.level, b.dataset.diff);
  });

  async function next() {
    clearTimeout(state.timer);
    try {
      state.ex = await api('next', { module: state.module, level: state.level, difficulty: state.diff });
    } catch (e) {
      alert(e.message);
      return;
    }
    showQuestion();
  }

  function showQuestion() {
    const q = state.ex;
    setDiffColor(q.diff);   // v mixu „vše“ barva podle obtížnosti tohoto příkladu
    $('review').hidden = !q.review;
    $('question').innerHTML = renderQ(q.q) + (q.kind === 'divrem' || q.q.startsWith('Zkrať') ? '' : ' =');
    $('feedback').hidden = true;
    $('feedback').innerHTML = '';
    $('hints').hidden = true;
    $('hints').innerHTML = '';
    $('hint-info').textContent = '';
    $('btn-hint').hidden = false;
    $('btn-hint').textContent = 'Nápověda';
    $('btn-reveal').hidden = true;
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
    if (state.ex.kind === 'divrem') {
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
    let r;
    try {
      r = await api('answer', { answer });
    } catch (err) {
      alert(err.message);
      state.lock = false;
      return;
    }
    const fb = $('feedback');
    fb.hidden = false;
    if (r.correct) {
      endQuestion();
      fb.className = 'feedback ok';
      const me = r.users.find((u) => u.id === state.user);
      const pts = `<small>+${r.points} b.${r.bonus ? ` a +${r.bonus} navíc za ${r.streak} v řadě` : ''}</small>`;
      const fire = r.streak >= 3 ? `<small>🔥 ${r.streak} v řadě</small>` : '';
      const goal = me.solved_today === state.goal ? '<small>🎯 Denní cíl splněný!</small>' : '';
      fb.innerHTML = pick(['Správně!', 'Přesně tak!', 'Paráda!', 'Trefa!', 'Výborně!', 'Super!']) + pts + fire + goal + (r.note ? `<small>${esc(r.note)}</small>` : '');
      renderKids(r.users);
      celebrate($('question'));
      state.timer = setTimeout(next, r.note ? 2400 : 1500);
      return;
    }
    // špatně: výsledek neprozradíme, jen co je špatně, a dítě to zkusí znovu
    fb.className = 'feedback';
    void fb.offsetWidth;   // restart animace, i když je hláška stejná jako minule
    fb.className = 'feedback bad';
    fb.innerHTML = 'Ještě ne, zkus to znovu.'
      + (r.note ? `<small>${esc(r.note)}</small>` : '')
      + (r.why ? `<span class="why">${esc(r.why)}</span>` : '');
    $('btn-reveal').hidden = false;
    state.lock = false;
    const first = document.querySelector('#inputs input');
    if (KEYPAD) setActive(first);
    else first.select();
  });

  // Po vyřešení nebo ukázání výsledku: příklad už nejde měnit.
  function endQuestion() {
    state.lock = true;
    $('keypad').hidden = true;
    $('btn-submit').hidden = true;
    document.querySelectorAll('#inputs input').forEach((inp) => (inp.disabled = true));
    $('btn-hint').hidden = true;
    $('btn-reveal').hidden = true;
    $('hint-info').textContent = '';
  }

  // Správný výsledek s postupem, jen když si o něj dítě řekne.
  $('btn-reveal').addEventListener('click', async () => {
    if (!state.ex || state.lock) return;
    let r;
    try {
      r = await api('reveal');
    } catch (err) {
      alert(err.message);
      return;
    }
    endQuestion();
    renderKids(r.users);
    const fb = $('feedback');
    fb.hidden = false;
    fb.className = 'feedback bad reveal';
    const steps = r.steps.length ? `<ol class="steps">${r.steps.map((l) => `<li>${renderQ(l)}</li>`).join('')}</ol>` : '';
    fb.innerHTML = `Správně je <b>${renderQ(r.answer)}</b>`
      + steps
      + `<div class="next"><button type="button" class="btn" id="btn-next">Další</button></div>`;
    if (!KEYPAD) $('btn-next').focus();
    $('btn-next').addEventListener('click', next);
    // na telefonu může být vysvětlení pod okrajem obrazovky
    fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });

  // Nápověda po krocích: každé kliknutí odkryje další krok.
  $('btn-hint').addEventListener('click', async () => {
    if (!state.ex || state.lock) return;
    let r;
    try {
      r = await api('hint');
    } catch (err) {
      alert(err.message);
      return;
    }
    $('hints').innerHTML = r.steps.map((l) => `<li>${renderQ(l)}</li>`).join('');
    $('hints').hidden = false;
    const more = r.steps.length < r.total;
    $('btn-hint').hidden = !more;
    $('btn-hint').textContent = 'Další krok';
    $('hint-info').textContent = `Krok ${r.steps.length} z ${r.total}.`;
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

  // Enter po ukázání výsledku = další příklad
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && state.lock && !$('feedback').hidden && $('btn-next')) {
      e.preventDefault();
      next();
    }
  });

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ---------- efekty ----------
  // Za správnou odpověď náhodný efekt, nikdy dvakrát po sobě stejný.
  // Kdo má v systému omezené animace, uvidí jen pochvalu.
  const CALM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#3b6cf6', '#1f9d55', '#f5b400', '#e8590c', '#d6336c', '#7048e8'];
  let lastEffect = null;

  // Jedna animovaná částice (emoji, nebo barevná konfeta); po doběhnutí zmizí.
  function particle(x, y, frames, duration, emoji, delay = 0) {
    const c = document.createElement('i');
    c.className = emoji ? 'fx emoji' : 'fx confetti';
    if (emoji) c.textContent = emoji;
    else c.style.background = pick(COLORS);
    c.style.left = x + 'px';
    c.style.top = y + 'px';
    document.body.appendChild(c);
    c.animate(frames, { duration, delay, easing: 'ease-out', fill: 'backwards' }).onfinish = () => c.remove();
    return c;
  }

  // výbuch z místa příkladu, částice pak padají dolů
  function burst(r, count, emojis) {
    for (let n = 0; n < count; n++) {
      const a = Math.random() * Math.PI * 2;
      const d = 60 + Math.random() * 160;
      const x = Math.cos(a) * d;
      const y = Math.sin(a) * d - 60;
      const spin = (Math.random() - 0.5) * 1080;
      particle(r.left + r.width / 2, r.top + r.height / 2, [
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${x}px, ${y}px) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${x * 1.3}px, ${y + 260}px) rotate(${spin}deg)`, opacity: 0 },
      ], 1200 + Math.random() * 600, emojis && pick(emojis));
    }
  }

  const EFFECTS = {
    confetti: (r) => burst(r, 60),
    stars: (r) => burst(r, 24, ['⭐', '🌟', '✨']),
    balloons: () => {
      for (let n = 0; n < 14; n++) {
        const drift = (Math.random() - 0.5) * 160;
        particle(Math.random() * innerWidth, innerHeight + 40, [
          { transform: 'translate(0, 0)' },
          { transform: `translate(${drift}px, ${-innerHeight - 120}px)` },
        ], 2200 + Math.random() * 1200, pick(['🎈', '🎈', '🎈', '🎉']), Math.random() * 400);
      }
    },
    rain: () => {
      for (let n = 0; n < 30; n++) {
        particle(Math.random() * innerWidth, -40, [
          { transform: 'translate(0, 0) rotate(0deg)' },
          { transform: `translate(0, ${innerHeight + 80}px) rotate(${(Math.random() - 0.5) * 720}deg)` },
        ], 1400 + Math.random() * 900, pick(['🍀', '🌈', '💎', '🍭', '⭐']), Math.random() * 700);
      }
    },
    trophy: (r) => {
      particle(r.left + r.width / 2, innerHeight / 2, [
        { transform: 'scale(0) rotate(-30deg)', opacity: 0 },
        { transform: 'scale(1.25) rotate(10deg)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1) rotate(0deg)', opacity: 1, offset: 0.75 },
        { transform: 'scale(1.4)', opacity: 0 },
      ], 1400, pick(['👍', '🏆', '🥇', '💯', '🤩'])).style.fontSize = '120px';
    },
  };

  function celebrate(from) {
    if (CALM || !document.body.animate) return;
    const name = pick(Object.keys(EFFECTS).filter((k) => k !== lastEffect));
    lastEffect = name;
    EFFECTS[name](from.getBoundingClientRect());
  }

  // ---------- výsledky ----------
  const MODULE_NAME = (m) => (state.modules[m] ? state.modules[m].title : m);

  async function loadStats() {
    const s = await api('stats');
    renderKids(s.users);
    const row = (label, f) => `<tr><th>${label}</th>${s.users.map((u) => `<td class="num">${f(u)}</td>`).join('')}</tr>`;
    $('compare').innerHTML =
      `<tr><th></th>${s.users.map((u) => `<th class="num">${EMOJI[u.kind]} ${esc(u.name)} <button type="button" class="link rename" data-user="${u.id}" aria-label="Přejmenovat">✏️</button></th>`).join('')}</tr>`
      + row('Dnes', (u) => u.today + ' b.')
      + row('Tento týden', (u) => u.week + ' b.')
      + row('Celkem', (u) => u.total + ' b.')
      + row('Dnes vyřešeno', (u) => `${u.solved_today} / ${state.goal}`)
      + row('Série dní', (u) => (u.days ? '🔥 ' + u.days : '–'))
      + row('', (u) => `<button type="button" class="link reset" data-user="${u.id}">Smazat body</button>`);
    $('parent').innerHTML = s.users.map((u) => {
      const st = s.stats[u.id];
      const per = st.per_task.length
        ? `<table class="table">${st.per_task.map((p) => `<tr><td>${esc(MODULE_NAME(p.module))} – ${esc(state.diffs[p.difficulty] || p.difficulty)}</td><td class="num">${p.n}×</td><td class="num">${Math.round((p.first / p.n) * 100)} % napoprvé</td></tr>`).join('')}</table>`
        : '<p class="empty">Zatím nic.</p>';
      const hard = st.hardest.length
        ? `<div class="mistakes">${st.hardest.map((h) => `<div><span>${renderQ(h.question)}</span><span class="right">${renderQ(h.answer)}</span></div>`).join('')}</div>`
        : '<p class="empty">Žádné opakované chyby.</p>';
      return `<details open><summary>${EMOJI[u.kind]} ${esc(u.name)}</summary>${per}<h3>Co nejde (30 dní)</h3>${hard}</details>`;
    }).join('');
    show('stats');
  }

  $('btn-stats').addEventListener('click', () => { clearTimeout(state.timer); loadStats(); });
  $('compare').addEventListener('click', async (e) => {
    const r = e.target.closest('.reset');
    if (r) {
      const u = state.users.find((x) => x.id === Number(r.dataset.user));
      if (!confirm(`Smazat všechny body (${u.total}) dítěte ${u.name}? Vrátit to nejde. Vyřešené příklady v přehledu zůstanou.`)) return;
      try {
        await api('reset', { target: u.id });
        loadStats();
      } catch (err) {
        alert(err.message);
      }
      return;
    }
    const b = e.target.closest('.rename');
    if (!b) return;
    const u = state.users.find((x) => x.id === Number(b.dataset.user));
    const name = prompt('Přezdívka (1 až 20 znaků):', u.name);
    if (name === null) return;
    try {
      await api('rename', { target: u.id, name });
      loadStats();
    } catch (err) {
      alert(err.message);
    }
  });

  // ---------- navigace ----------
  document.querySelectorAll('[data-go]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.preventDefault();
      clearTimeout(state.timer);
      state.ex = null;
      if (state.user) showMenu(); else showWho();
    })
  );

  // ---------- start ----------
  (async () => {
    try {
      const s = await api('state');
      const me = s.users.find((u) => u.kind === document.body.dataset.kid);
      Object.assign(state, { modules: s.modules, diffs: s.difficulties, goal: s.goal, user: me ? me.id : null });
      renderKids(s.users);
      if (state.user) showMenu(); else showWho();
    } catch (e) {
      document.body.insertAdjacentHTML('afterbegin', `<p style="padding:16px;color:#d64545">${esc(e.message)}</p>`);
    }
  })();
})();
