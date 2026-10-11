// Matika – klientská logika. Jedna stránka, obrazovky se přepínají, všechno
// důležité (generování příkladů, kontrola) dělá server v api.php.
(() => {
  const $ = (id) => document.getElementById(id);
  const state = { modules: {}, module: null, level: null, levels: {}, ex: null, lock: false, timer: null };

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

  // ---------- menu ----------
  const DESC = {
    mala: 'do 10 × 10',
    velka: '11–20 × 2–10',
    scitani: 'do 100 až 10 000, záporná, desetinná',
    zlomky: 'krácení, +, −, ·, :',
    deleni: 'podíl a zbytek',
    mix: 'všechno napřeskáčku',
  };

  function renderMenu() {
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
    $('levels').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => startTask(key, b.dataset.level)));
    show('level');
  }

  // ---------- příklady ----------
  function startTask(module, level) {
    state.module = module;
    state.level = level;
    state.levels[module] = level;   // záložka si pamatuje poslední úroveň
    renderTabs();
    show('round');
    $('tabs').querySelector('[aria-current]').scrollIntoView({ inline: 'center', block: 'nearest' });
    next();
  }

  // Záložky s typy úloh a pod nimi úrovně: přepínání bez návratu do menu.
  function renderTabs() {
    const btn = (cls, attr, val, label, on) =>
      `<button type="button" class="${cls}" ${attr}="${val}"${on ? ' aria-current="true"' : ''}>${esc(label)}</button>`;
    $('tabs').innerHTML = Object.entries(state.modules)
      .map(([key, m]) => btn('tab', 'data-module', key, m.title, key === state.module)).join('');
    $('chips').innerHTML = Object.entries(state.modules[state.module].levels)
      .map(([lv, label]) => btn('chip', 'data-level', lv, label, lv === state.level)).join('');
  }

  $('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-module]');
    if (!b) return;
    const key = b.dataset.module;
    startTask(key, state.levels[key] || Object.keys(state.modules[key].levels)[0]);
  });
  $('chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-level]');
    if (b) startTask(state.module, b.dataset.level);
  });

  async function next() {
    clearTimeout(state.timer);
    try {
      state.ex = await api('next', { module: state.module, level: state.level });
    } catch (e) {
      alert(e.message);
      return;
    }
    showQuestion();
  }

  function showQuestion() {
    const q = state.ex;
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
      fb.innerHTML = pick(['Správně!', 'Přesně tak!', 'Paráda!', 'Trefa!', 'Výborně!', 'Super!']) + (r.note ? `<small>${esc(r.note)}</small>` : '');
      confetti($('question'));
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

  // ---------- efekt ----------
  // Konfety z místa příkladu; kdo má v systému omezené animace, uvidí jen pochvalu.
  const CALM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#3b6cf6', '#1f9d55', '#f5b400', '#e8590c', '#d6336c', '#7048e8'];

  function confetti(from) {
    if (CALM || !document.body.animate) return;
    const r = from.getBoundingClientRect();
    for (let n = 0; n < 60; n++) {
      const c = document.createElement('i');
      c.className = 'confetti';
      c.style.background = pick(COLORS);
      c.style.left = r.left + r.width / 2 + 'px';
      c.style.top = r.top + r.height / 2 + 'px';
      document.body.appendChild(c);
      const a = Math.random() * Math.PI * 2;
      const d = 60 + Math.random() * 160;
      const x = Math.cos(a) * d;
      const y = Math.sin(a) * d - 60;
      const spin = (Math.random() - 0.5) * 1080;
      c.animate([
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${x}px, ${y}px) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${x * 1.3}px, ${y + 260}px) rotate(${spin}deg)`, opacity: 0 },
      ], { duration: 1200 + Math.random() * 600, easing: 'ease-out' }).onfinish = () => c.remove();
    }
  }

  // ---------- navigace ----------
  document.querySelectorAll('[data-go]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.preventDefault();
      clearTimeout(state.timer);   // ať po odchodu nenaskočí další příklad
      state.ex = null;
      show('menu');
    })
  );

  // ---------- start ----------
  (async () => {
    try {
      state.modules = (await api('modules')).modules;
      renderMenu();
    } catch (e) {
      document.body.insertAdjacentHTML('afterbegin', `<p style="padding:16px;color:#d64545">${esc(e.message)}</p>`);
    }
  })();
})();
