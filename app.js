// Matika – klientská logika. Jedna stránka, obrazovky se přepínají, všechno
// důležité (generování příkladů, kontrola) dělá server v api.php.
(() => {
  const $ = (id) => document.getElementById(id);
  const state = { modules: {}, diffs: {}, goal: 20, users: [], user: null, module: null, level: null, diff: 'stredni', ex: null, lock: false, timer: null };
  const DIFF_COLOR = { lehke: '#8fd970', stredni: '#ffd84d', tezke: '#ffa94d' };   // zvýrazňovače, i pro theme-color
  // Úrovně na telefonu krátce (symboly), celý název je v aria-label.
  const LEVEL_SHORT = {
    mala: { nasobeni: '·', deleni: ':', mix: '· :' },
    velka: { nasobeni: '·', deleni: ':', mix: '· :' },
    scitani: { cela: '123', zaporna: '−5', desetinna: '2,5' },
    zlomky: { kraceni: 'zkrátit', scitani: '+ −', nasobeni: '· :', mix: 'vše' },
  };
  // Obtížnost jako ikony: pírko, kámen, činka; „vše“ (jen v mixu) jako zamíchání.
  const ICON = (d) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const DIFF_ICON = {
    lehke: ICON('<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><path d="M16 8 2 22"/><path d="M17.5 15H9"/>'),
    stredni: ICON('<path d="M3.5 15.5c0-4.2 3.6-8 8.6-8 4.7 0 8.4 3 8.4 6.6 0 3.3-3.4 4.9-8.4 4.9S3.5 18.4 3.5 15.5z"/><path d="M8 12.5c1-1.3 2.4-2 4-2.2"/>'),
    tezke: ICON('<path d="M6.5 6.5v11"/><path d="M3.5 9v6"/><path d="M17.5 6.5v11"/><path d="M20.5 9v6"/><path d="M6.5 12h11"/>'),
    vse: ICON('<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>'),
  };

  async function api(action, data) {
    const res = await fetch('api.php?action=' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: state.user, ...(data || {}) }),   // kdo cvičí, jde s každým požadavkem
    });
    const json = await res.json().catch(() => ({ error: 'Server neodpověděl.' }));
    if (res.status === 401) { state.user = null; showWho(); }
    if (!res.ok) throw Object.assign(new Error(json.error || 'Chyba serveru'), { status: res.status });
    return json;
  }

  function show(name) {
    closeTaskMenu();
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

  // Kdo cvičí, určuje adresa (/holka, /kluk). V záhlaví je štítek aktivního
  // dítěte (jméno, body dnes, proužek denního cíle), druhé dítě je v seznamu úloh.
  function renderKids(users) {
    state.users = users;
    const me = users.find((u) => u.id === state.user);
    $('me').hidden = !me;
    $('brand').hidden = !!me;
    $('btn-task').hidden = !me;
    if (!me) return;
    const pct = Math.min(100, (me.solved_today / state.goal) * 100);
    $('me').innerHTML = `<span class="me-name">${esc(me.name)}</span> <b>${me.today} b.</b>`
      + (me.days ? ` <span class="me-days" title="Dní v řadě se splněným cílem">${me.days}× cíl</span>` : '')
      + `<span class="me-goal" title="Denní cíl ${me.solved_today} z ${state.goal}"><span style="width:${pct}%"></span></span>`;
    $('goal-text').textContent = `Dnes ${me.solved_today} z ${state.goal}`;
    document.title = `${me.name} – Matika`;
    // přepnutí dítěte je v seznamu úloh i pod štítkem se jménem
    const other = users.filter((u) => u.id !== state.user).map((u) =>
      `<a class="task-item" href="${u.kind}" data-kind="${u.kind}">Přepnout na <span class="kid-name">${esc(u.name)}</span><b>${u.today} b.</b></a>`).join('');
    $('task-other').innerHTML = other;
    $('me-other').innerHTML = other;
  }

  function showWho() {
    $('who-pick').innerHTML = state.users.map((u) =>
      `<a class="cover" href="${u.kind}" data-kind="${u.kind}"><span class="cover-label"><small>Jméno</small>`
      + `<span class="kid-name">${esc(u.name)}</span><small>Předmět: matika</small></span>`
      + `<span class="cover-note">Dnes ${u.today} bodů</span></a>`).join('');
    show('who');
  }

  // ---------- seznam úloh v záhlaví ----------
  function renderTaskMenu() {
    $('task-name').textContent = state.modules[state.module].title;
    $('task-list').innerHTML = Object.entries(state.modules).map(([key, m]) =>
      `<button type="button" class="task-item" data-module="${key}"${key === state.module ? ' aria-current="true"' : ''}>${esc(m.title)}</button>`).join('');
  }
  // Dvě rozbalovací nabídky v záhlaví: úlohy (tlačítko úlohy) a účet (štítek se jménem).
  const MENUS = [['btn-task', 'task-menu'], ['me', 'me-menu']];
  function openMenu(btn, menu) {
    closeTaskMenu();
    $(menu).hidden = false;
    $(btn).setAttribute('aria-expanded', 'true');
    const first = $(menu).querySelector('[aria-current]') || $(menu).querySelector('a, button');
    if (first) first.focus();
  }
  function closeTaskMenu() {
    MENUS.forEach(([btn, menu]) => {
      $(menu).hidden = true;
      $(btn).setAttribute('aria-expanded', 'false');
    });
  }
  MENUS.forEach(([btn, menu]) =>
    $(btn).addEventListener('click', () => ($(menu).hidden ? openMenu(btn, menu) : closeTaskMenu())));
  $('task-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-module]');
    if (!b) return;
    const p = prefFor(b.dataset.module);
    startTask(b.dataset.module, p.level, p.diff);
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.task, .account')) closeTaskMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = MENUS.find(([, menu]) => !$(menu).hidden);
    if (open) { closeTaskMenu(); $(open[0]).focus(); }
  });

  // Appka otevře poslední úlohu dítěte (s jeho úrovní a obtížností).
  function openLast() {
    const last = prefs()._last;
    const module = last in state.modules ? last : Object.keys(state.modules)[0];
    const p = prefFor(module);
    startTask(module, p.level, p.diff);
  }

  // ---------- příklady ----------
  function startTask(module, level, diff) {
    Object.assign(state, { module, level, diff });
    const p = prefs();
    p[module] = { level, diff };
    p._last = module;
    savePrefs(p);
    if (diff !== 'vse') setDiffColor(diff);
    renderTaskMenu();
    renderControls();
    show('round');
    next();
  }

  function setDiffColor(diff) {
    document.body.dataset.diff = diff;
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = DIFF_COLOR[diff];
  }

  // Jeden řádek: úrovně (symboly) vlevo, obtížnost (ikony) vpravo.
  function renderControls() {
    const levels = Object.entries(state.modules[state.module].levels);
    const short = LEVEL_SHORT[state.module] || {};
    $('chips').hidden = levels.length < 2;
    $('chips').innerHTML = levels.map(([lv, label]) =>
      `<button type="button" class="chip" data-level="${lv}" aria-label="${esc(label)}" title="${esc(label)}"${lv === state.level ? ' aria-current="true"' : ''}>${esc(short[lv] || label)}</button>`).join('');
    $('diffs').innerHTML = Object.entries(diffsFor(state.module)).map(([d, label]) =>
      `<button type="button" class="diff" data-diff="${d}" aria-label="${esc(label)}" title="${esc(label)}"${d === state.diff ? ' aria-current="true"' : ''}>${DIFF_ICON[d]}<span class="lbl">${esc(label)}</span></button>`).join('');
    // hodně úrovní (zlomky): u obtížnosti na úzkém displeji jen ikony
    $('controls').classList.toggle('crowded', levels.length > 3);
  }

  $('chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-level]');
    if (b) startTask(state.module, b.dataset.level, state.diff);
  });
  $('diffs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-diff]');
    if (b) startTask(state.module, state.level, b.dataset.diff);
  });

  // Session na serveru vypršela (příklad dlouho ležel): místo zaseknutí nový příklad.
  async function failOrRenew(err) {
    if (err.status !== 404) { alert(err.message); return; }
    await next();
    $('hint-info').textContent = 'Předchozí příklad vypršel, tady je nový.';
  }

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
    // Klávesnice v appce je vidět všude (i počítač, tablet s klávesnicí); na
    // počítači jde psát i rovnou do políčka, na dotyku nahrazuje systémovou.
    $('btn-submit').hidden = true;
    inputs.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('click', () => setActive(inp));
      inp.addEventListener('focus', () => setActive(inp));
    });
    setActive(inputs.querySelector('input'));
    renderKeypad(q);
    if (!KEYPAD) autoFocus(inputs.querySelector('input'));
  }

  // ---------- klávesnice v appce (všude; na dotyku místo systémové) ----------
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
      key('7') + key('8') + key('9') + `<button type="button" class="key fn" data-key="del" aria-label="Smazat">smaž</button>` +
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
    if (!b) return;
    pressKey(b.dataset.key);
    // na počítači se dá po kliknutí hned psát dál z klávesnice
    if (!KEYPAD && activeInput && !state.lock) activeInput.focus({ preventScroll: true });
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
      state.lock = false;
      failOrRenew(err);
      return;
    }
    const fb = $('feedback');
    fb.hidden = false;
    if (r.correct) {
      endQuestion();
      fb.className = 'feedback ok';
      const me = r.users.find((u) => u.id === state.user);
      const tick = '<svg class="tick" width="46" height="40" viewBox="0 0 46 40" aria-hidden="true"><path d="M4 22 C 10 26, 14 31, 17 36 C 22 24, 31 12, 43 4" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      const extra = [];
      if (r.bonus) extra.push(`${r.streak} správně v řadě, bod navíc`);
      else if (r.streak >= 3) extra.push(`${r.streak} správně v řadě`);
      if (me.solved_today === state.goal) extra.push('Denní cíl splněný!');
      if (r.note) extra.push(esc(r.note));
      fb.innerHTML = `<div class="praise">${tick}<span class="hand">${pick(['Výborně!', 'Správně!', 'Přesně tak!', 'Paráda!', 'Trefa!', 'Super!'])}</span>`
        + `<span class="stamp">+${r.points + (r.bonus || 0)}</span></div>`
        + extra.map((t) => `<small>${t}</small>`).join('');
      renderKids(r.users);
      celebrate($('question'));
      if (offerSuggestion(fb, r.suggest)) return;   // s návrhem čeká na dítě, jinak sám další příklad
      state.timer = setTimeout(next, r.note ? 2400 : 1500);
      return;
    }
    // špatně: výsledek neprozradíme, jen co je špatně, a dítě to zkusí znovu
    fb.className = 'feedback';
    void fb.offsetWidth;   // restart animace, i když je hláška stejná jako minule
    fb.className = 'feedback bad';
    fb.innerHTML = '<span class="hand">Ještě ne, zkus to znovu.</span>'
      + (r.note ? `<small>${esc(r.note)}</small>` : '')
      + (r.why ? `<span class="why">${esc(r.why)}</span>` : '');
    $('btn-reveal').hidden = false;
    state.lock = false;
    const first = document.querySelector('#inputs input');
    setActive(first);
    if (!KEYPAD) first.select();
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

  // Návrh těžší nebo lehčí obtížnosti (server ho dává po 10 příkladech v téže úloze).
  // Odmítnutý návrh se u úlohy do obnovení stránky neopakuje.
  const declined = {};
  function offerSuggestion(fb, suggest) {
    if (!suggest || declined[state.module + suggest]) return false;
    const keys = Object.keys(state.diffs);
    const harder = keys.indexOf(suggest) > keys.indexOf(state.diff);
    fb.insertAdjacentHTML('beforeend', `<div class="next suggest"><span>${harder ? 'Jde ti to skvěle.' : 'Tohle je zatím těžké.'}</span>`
      + `<button type="button" class="btn" id="btn-suggest">${DIFF_ICON[suggest]}Zkus ${harder ? 'těžší' : 'lehčí'}</button>`
      + '<button type="button" class="ghostbtn" id="btn-next">Další</button></div>');
    $('btn-suggest').addEventListener('click', () => startTask(state.module, state.level, suggest));
    $('btn-next').addEventListener('click', () => { declined[state.module + suggest] = true; next(); });
    if (!KEYPAD) $('btn-suggest').focus();
    return true;
  }

  // Správný výsledek s postupem, jen když si o něj dítě řekne.
  $('btn-reveal').addEventListener('click', async () => {
    if (!state.ex || state.lock) return;
    let r;
    try {
      r = await api('reveal');
    } catch (err) {
      failOrRenew(err);
      return;
    }
    endQuestion();
    renderKids(r.users);
    const fb = $('feedback');
    fb.hidden = false;
    fb.className = 'feedback bad reveal';
    const steps = r.steps.length ? `<ol class="steps">${r.steps.map((l) => `<li>${renderQ(l)}</li>`).join('')}</ol>` : '';
    fb.innerHTML = `Správně je <b>${renderQ(r.answer)}</b>`
      + steps;
    if (!offerSuggestion(fb, r.suggest)) {
      fb.insertAdjacentHTML('beforeend', '<div class="next"><button type="button" class="btn" id="btn-next">Další</button></div>');
      if (!KEYPAD) $('btn-next').focus();
      $('btn-next').addEventListener('click', next);
    }
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
      failOrRenew(err);
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
    $('btn-paper').textContent = open ? 'Schovat papír' : 'Papír na počítání';
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
    if (document.activeElement && document.activeElement.closest('#feedback button')) return;   // Enter stiskne tlačítko s fokusem
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
      `<tr><th></th>${s.users.map((u) => `<th class="num"><span class="kid-name" data-kind="${u.kind}">${esc(u.name)}</span> <button type="button" class="link rename" data-user="${u.id}">přejmenovat</button></th>`).join('')}</tr>`
      + row('Dnes', (u) => u.today + ' b.')
      + row('Tento týden', (u) => u.week + ' b.')
      + row('Celkem', (u) => u.total + ' b.')
      + row('Dnes vyřešeno', (u) => `${u.solved_today} / ${state.goal}`)
      + row('Dní v řadě se splněným cílem', (u) => u.days || '–')
      + row('', (u) => `<button type="button" class="link reset" data-user="${u.id}">Smazat body</button>`);
    $('parent').innerHTML = s.users.map((u) => {
      const st = s.stats[u.id];
      const per = st.per_task.length
        ? `<table class="table">${st.per_task.map((p) => `<tr><td>${esc(MODULE_NAME(p.module))} – ${esc(state.diffs[p.difficulty] || p.difficulty)}</td><td class="num">${p.n}×</td><td class="num">${Math.round((p.first / p.n) * 100)} % napoprvé</td></tr>`).join('')}</table>`
        : '<p class="empty">Zatím nic.</p>';
      const hard = st.hardest.length
        ? `<div class="mistakes">${st.hardest.map((h) => `<div><span>${renderQ(h.question)}</span><span class="right">${renderQ(h.answer)}</span></div>`).join('')}</div>`
        : '<p class="empty">Žádné opakované chyby.</p>';
      return `<details open><summary><span class="kid-name" data-kind="${u.kind}">${esc(u.name)}</span></summary>${per}<h3>Co nejde (30 dní)</h3>${hard}</details>`;
    }).join('');
    show('stats');
  }

  document.querySelectorAll('[data-stats]').forEach((b) =>
    b.addEventListener('click', () => { clearTimeout(state.timer); state.ex = null; loadStats(); }));
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
      if (state.user) openLast(); else showWho();
    })
  );

  // ---------- start ----------
  (async () => {
    try {
      const s = await api('state');
      const me = s.users.find((u) => u.kind === document.body.dataset.kid);
      Object.assign(state, { modules: s.modules, diffs: s.difficulties, goal: s.goal, user: me ? me.id : null });
      renderKids(s.users);
      if (state.user) openLast(); else showWho();
    } catch (e) {
      document.body.insertAdjacentHTML('afterbegin', `<p style="padding:16px;color:#d64545">${esc(e.message)}</p>`);
    }
  })();
})();
