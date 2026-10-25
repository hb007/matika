// Matika – klientská logika. Jedna stránka, obrazovky se přepínají, všechno
// důležité (generování příkladů, kontrola) dělá server v api.php. Bez
// internetu appka řeší příklady ze zásoby v telefonu (offline.js) a výsledky
// pošle po připojení.
(() => {
  const $ = (id) => document.getElementById(id);
  const Rewards = window.Rewards;
  let game = null;    // právě hraná hra (viz GAMES)
  // user: id přihlášeného dítěte, 0 = bez sešitu (guest), null = nic nevybráno;
  // users: děti přihlášené na tomhle zařízení (+ řádek bez sešitu s id 0); page: dítě z adresy
  const state = { modules: {}, diffs: {}, goal: 20, colors: {}, pin: { min: 4, max: 6 }, users: [], user: null, page: null, module: null, level: null, diff: 'stredni', ex: null, lock: false, timer: null, offline: false };
  const Offline = window.Offline;
  const DIFF_COLOR = { lehke: '#8fd970', stredni: '#ffd84d', tezke: '#ffa94d' };   // zvýrazňovače, i pro theme-color
  // Úrovně na telefonu krátce (symboly), celý název je v aria-label.
  const LEVEL_SHORT = {
    mala: { nasobeni: '·', deleni: ':', mix: '· :' },
    velka: { nasobeni: '·', deleni: ':', mix: '· :' },
    scitani: { cela: '123', zaporna: '−5', desetinna: '2,5' },
    zlomky: { kraceni: 'zkrátit', scitani: '+ −', nasobeni: '· :', mix: 'vše' },
    zavorky: { poradi: '+ ·', zavorky: '( )', mix: 'vše' },
    rovnice: { jednoducha: 'x+3', dvoukrokova: '2x+3', obe: 'x=x' },
    desetinna: { nasobeni: '·', deleni: ':', posun: '·10' },
    procenta: { z_cisla: '% z', kolik: '?%', zaklad: '100%' },
    delitelnost: { znaky: '□', nsd: 'D', nsn: 'n' },
    statistika: { prumer: 'Ø', median: 'med', modus: 'mod' },
    rimske: { na_arabske: 'XII→12', na_rimske: '12→XII' },
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
    let res;
    try {
      res = await fetch('api.php?action=' + action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: state.user, ...(data || {}) }),   // kdo cvičí, jde s každým požadavkem
      });
    } catch (e) {
      // bez internetu: volající přepne na zásobu příkladů
      throw Object.assign(new Error('Bez internetu.'), { status: 0, network: true });
    }
    const json = await res.json().catch(() => ({ error: 'Server neodpověděl.' }));
    if (res.status === 401) onUnauthorized((data && 'user' in data) ? data.user : state.user);
    if (!res.ok) throw Object.assign(new Error(json.error || 'Chyba serveru'), { status: res.status });
    return json;
  }

  function show(name) {
    closeTaskMenu();
    if (name !== 'game' && game) game.stop();
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

  // Adresa stránky dítěte: holka a kluk mají adresy ze starší verze, ostatní /u/<přezdívka>.
  const kidHref = (u) => (u.slug === 'holka' || u.slug === 'kluk' ? u.slug : 'u/' + u.slug);
  const isGuest = () => state.user === 0;
  // děti se sešitem (bez řádku „bez sešitu“), třeba pro sync a čas v appce
  const realUsers = () => state.users.filter((u) => u.id);

  // Kdo cvičí, určuje adresa (/holka, /u/anicka) a přihlášení na zařízení. V záhlaví
  // je štítek aktivního dítěte (jméno, body dnes, proužek denního cíle), ostatní
  // přihlášené děti jsou v nabídce pod štítkem i v seznamu úloh.
  function renderKids(users) {
    state.users = users;
    Usage.fromUsers(realUsers());
    const cached = Offline.load('matika_state', null);
    if (cached) { cached.users = users; Offline.save('matika_state', cached); }
    updateBar();
    const me = users.find((u) => u.id === state.user);
    $('me').hidden = !me;
    $('brand').hidden = !!me;
    $('btn-task').hidden = !me;
    if (!me) return;
    document.body.dataset.color = me.color;
    const pct = Math.min(100, (me.solved_today / state.goal) * 100);
    $('me').innerHTML = `<span class="me-name">${esc(me.name)}</span> <b>${me.today} b.</b>`
      + (me.days ? ` <span class="me-days" title="Dní v řadě se splněným cílem">${me.days}× cíl</span>` : '')
      + `<span class="me-goal" title="Denní cíl ${me.solved_today} z ${state.goal}"><span style="width:${pct}%"></span></span>`;
    $('goal-text').textContent = `Dnes ${me.solved_today} z ${state.goal}`;
    renderGameButtons();
    document.title = `${me.name} – Matika`;
    // přepnutí dítěte je v seznamu úloh i pod štítkem se jménem
    const other = realUsers().filter((u) => u.id !== state.user).map((u) =>
      `<a class="task-item" href="${kidHref(u)}">Přepnout na <span class="kid-name" data-color="${esc(u.color)}">${esc(u.name)}</span><b>${u.today} b.</b></a>`).join('')
      + (isGuest() ? '<a class="task-item link-ink" href="./">Přihlásit se nebo založit účet</a>'
        : '<a class="task-item link-ink" href="./">Přihlásit jiné dítě</a>');
    $('task-other').innerHTML = other;
    $('me-other').innerHTML = other;
    document.querySelectorAll('[data-stats]').forEach((b) => { b.hidden = isGuest(); });
  }

  // Úvodní obrazovka: na zařízení bez účtu uvítání s „Zkusit hned“ (nováček
  // neví, co je sešit, tak nejdřív počítá); jinak desky dětí přihlášených na
  // tomhle zařízení (klepnutí otevře rovnou dítě), přihlášení, nový účet, bez účtu.
  function showWho() {
    const kids = realUsers();
    $('welcome').hidden = kids.length > 0;
    $('who-known').hidden = !kids.length;
    $('who-pick').innerHTML = kids.map((u) =>
      `<a class="cover" href="${kidHref(u)}" data-color="${esc(u.color)}"><span class="cover-label"><small>Jméno</small>`
      + `<span class="kid-name">${esc(u.name)}</span><small>${esc(u.class_name || 'Předmět: matika')}</small></span>`
      + `<span class="cover-note">Dnes ${u.today} bodů</span></a>`).join('');
    delete document.body.dataset.color;
    show('who');
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-login]');
    if (!b) return;
    if (b.dataset.login === 'guest') startGuest(); else showLogin(b.dataset.login);
  });

  // Bez sešitu: příklady bez ukládání, body jen do zavření prohlížeče (server je drží v session).
  function startGuest() {
    state.user = 0;
    renderKids(state.users);
    openLast();
  }

  // Zvací odkaz: ověřit na serveru a otevřít registraci bez hesla.
  async function openInvite(token) {
    try {
      invite = { token, ...(await api('invite', { user: null, token })) };
      showLogin('register');
    } catch (e) {
      invite = null;
      showWho();
      alert(e.network ? 'Zvací odkaz jde použít jen s internetem.' : e.message);
    }
  }

  // Server dítě nezná jako přihlášené (vypršelo, odhlášené jinde): u aktivního
  // dítěte ukázat přihlášení (fronta offline výsledků zůstane), jiné jen vyřadit.
  function onUnauthorized(uid) {
    if (uid === 0 || uid === null) return;
    if (uid !== state.user) { state.users = state.users.filter((u) => u.id !== uid); return; }
    const u = state.users.find((x) => x.id === uid) || state.page;
    state.user = null;
    clearTimeout(state.timer);
    state.ex = null;
    state.lock = false;
    $('feedback').hidden = true;
    $('feedback').innerHTML = '';
    renderKids(state.users);   // bez štítku a seznamu úloh v záhlaví
    if (u) showLogin(u.has_pin ? 'pin' : 'setup', u); else showWho();
  }

  // ---------- přihlášení ----------
  // mode: pin (sešit z adresy, zná PIN), setup (sešit ze starší verze bez PINu),
  // other (jiné dítě: přezdívka + PIN), register (nový sešit)
  // invite: zvací odkaz (?pozvanka=…) místo hesla pro založení účtu
  let invite = null;
  function showLogin(mode, user) {
    const f = $('form-login');
    f.dataset.mode = mode;
    f.dataset.user = user ? user.id : '';
    const pin = (name, label) => `<label class="field"><span>${label}</span><input type="password" name="${name}" inputmode="numeric" pattern="[0-9]*" autocomplete="off" minlength="${state.pin.min}" maxlength="${state.pin.max}" required></label>`;
    const head = user ? `<div class="login-who" data-color="${esc(user.color)}"><span class="kid-name">${esc(user.name)}</span></div>` : '';
    let html = '';
    if (mode === 'pin') {
      html = `<h1>Ahoj!</h1>${head}${pin('pin', 'Tvůj PIN')}`;
    } else if (mode === 'setup') {
      html = `<h1>Nastav si PIN</h1>${head}<p class="who-note">Účet je teď na PIN, ať ti do něj nikdo neleze. Vymysli si ${state.pin.min} až ${state.pin.max} číslic a zapamatuj si je.</p>`
        + pin('pin', 'Nový PIN') + pin('pin2', 'Ještě jednou');
    } else if (mode === 'other') {
      html = `<h1>Přihlásit se</h1><label class="field"><span>Přihlašovací jméno (nebo přezdívka)</span><input type="text" name="name" maxlength="20" autocomplete="username" autocapitalize="none" required></label>${pin('pin', 'PIN')}`;
    } else {
      const swatches = Object.entries(state.colors).map(([k, name], i) =>
        `<label class="swatch" data-color="${k}"><input type="radio" name="color" value="${k}"${i === 0 ? ' checked' : ''}><span></span>${esc(name)}</label>`).join('');
      html = `<h1>Nový účet</h1><label class="field"><span>Přezdívka (zobrazuje se ostatním; ne celé jméno, web je veřejný)</span><input type="text" name="name" maxlength="20" autocomplete="off" required></label>`
        + '<label class="field"><span>Přihlašovací jméno (jen písmena bez háčků, číslice a pomlčka; je to i tvoje adresa)</span><input type="text" name="login" maxlength="20" autocomplete="username" autocapitalize="none" spellcheck="false" pattern="[a-z0-9-]{1,20}" required></label>'
        + `<fieldset class="field"><legend>Barva</legend><div class="swatches">${swatches}</div></fieldset>`
        + pin('pin', `PIN (${state.pin.min} až ${state.pin.max} číslic, zapamatuj si ho)`) + pin('pin2', 'PIN ještě jednou')
        + (invite
          ? `<p class="who-note">Zvací odkaz${invite.class_name ? ` do třídy <b>${esc(invite.class_name)}</b>` : ''} (${esc(invite.label)}).</p>`
          : '<label class="field"><span>Heslo pro založení účtu (zná ho administrátor, rodiče, …)</span><input type="text" name="code" autocomplete="off" autocapitalize="characters" maxlength="12" required></label>'
          + '<p class="who-note">Neznáš heslo? <button type="button" class="link" data-login="guest">Zkus to zatím bez účtu</button>, body se jen neuloží.</p>');
    }
    f.innerHTML = html + '<p class="login-error" id="login-error" role="alert"></p>'
      + `<div class="login-actions"><button type="submit" class="btn">${mode === 'register' ? 'Založit účet' : mode === 'setup' ? 'Nastavit' : 'Přihlásit se'}</button>`
      + '<a href="./" class="ghostbtn btn-link">Zpět</a></div>';
    delete document.body.dataset.color;
    show('login');
    const first = f.querySelector('input:not([type=radio])');
    if (first) first.focus();
    // přihlašovací jméno se předvyplní z přezdívky (bez háčků a emoji), dokud ho dítě samo nepřepíše
    const nameIn = f.querySelector('input[name=name]');
    const loginIn = f.querySelector('input[name=login]');
    if (nameIn && loginIn) {
      let touched = false;
      loginIn.addEventListener('input', () => { touched = loginIn.value !== ''; });
      nameIn.addEventListener('input', () => { if (!touched) loginIn.value = slugify(nameIn.value); });
    }
  }

  // Přezdívka → přihlašovací jméno, stejně jako slugify() v lib/auth.php.
  function slugify(s) {
    const map = { 'ß': 'ss', 'ł': 'l' };
    s = s.toLowerCase().replace(/[ßł]/g, (c) => map[c]).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 16).replace(/-+$/, '');
  }

  $('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const d = Object.fromEntries(new FormData(f).entries());
    const err = $('login-error');
    err.textContent = '';
    if ('pin2' in d && d.pin !== d.pin2) { err.textContent = 'PINy se liší, zkus to znovu.'; return; }
    f.querySelector('button').disabled = true;
    let r;
    try {
      r = f.dataset.mode === 'register'
        ? await api('register', { user: null, name: d.name, login: d.login || '', color: d.color, pin: d.pin, code: d.code || '', invite: invite ? invite.token : '' })
        : await api('login', { user: null, target: Number(f.dataset.user) || 0, name: d.name || '', pin: d.pin });
    } catch (ex) {
      err.textContent = ex.network ? 'Přihlásit se jde jen s internetem.' : ex.message;
      f.querySelector('button').disabled = false;
      return;
    }
    // sešit z jiné adresy: přejít na ni (ikona na plochu, manifest); jinak rovnou cvičit
    if (!state.page || state.page.id !== r.user.id) { location.href = kidHref(r.user); return; }
    state.user = r.user.id;
    renderKids(r.users);
    openLast();
    trySync();
  });

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
    syncThemeColor();
  }

  // Barva lišty prohlížeče = pozadí záhlaví (v tmavém motivu tmavá).
  function syncThemeColor() {
    const meta = document.querySelector('meta[name=theme-color]');
    if (!meta) return;
    const css = getComputedStyle(document.body);
    const diff = document.body.dataset.diff;
    meta.content = (diff && css.getPropertyValue('--hl-bg').trim()) || css.getPropertyValue('--paper').trim() || DIFF_COLOR[diff] || '#fbfcfa';
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
  // Vypadl internet: pokračuje se ze zásoby.
  async function failOrRenew(err) {
    if (err.network) {
      setOffline(true);
      await next();
      $('hint-info').textContent = 'Vypadl internet, pokračuješ příklady ze zásoby.';
      return;
    }
    if (err.status !== 404) { alert(err.message); return; }
    await next();
    $('hint-info').textContent = 'Předchozí příklad vypršel, tady je nový.';
  }

  async function next() {
    clearTimeout(state.timer);
    if (!state.offline) {
      try {
        state.ex = await api('next', { module: state.module, level: state.level, difficulty: state.diff });
        showQuestion();
        refill();
        return;
      } catch (e) {
        if (!e.network) { alert(e.message); return; }
        setOffline(true);
      }
    }
    const ex = Offline.take(state.user, state.module, state.level, state.diff);
    if (!ex) { showEmptyPool(); return; }
    state.ex = ex;
    showQuestion();
    const left = Offline.left(state.user, state.module, state.level, state.diff);
    if (left < 3) $('hint-info').textContent = ['Tohle je v téhle úloze poslední příklad ze zásoby.', 'V téhle úloze zbývá v zásobě 1 příklad.', 'V téhle úloze zbývají v zásobě 2 příklady.'][left];
    updateBar();
  }

  // ---------- offline ----------
  // Lišta nahoře: bez internetu, kolik příkladů zbývá v zásobě a kolik výsledků čeká.
  function updateBar() {
    const bar = $('offline-bar');
    const waiting = state.user ? Offline.queue(state.user).length : 0;
    if (!state.offline) { bar.hidden = true; return; }
    const left = state.user ? Offline.poolSize(state.user) : 0;
    bar.textContent = `Bez internetu. Počítáš ze zásoby (zbývá ${left}).`
      + (waiting ? ` Výsledky (${waiting}) se odešlou, až budeš online.` : ' Výsledky se odešlou, až budeš online.');
    bar.hidden = false;
  }

  function setOffline(on) {
    state.offline = on;
    updateBar();
  }

  function showEmptyPool() {
    state.ex = null;
    state.lock = true;
    $('review').hidden = true;
    const any = state.user && Offline.poolSize(state.user) > 0;
    $('question').innerHTML = '<span class="pool-empty">' + (isGuest() ? 'Bez účtu to bez internetu nejde. S účtem má appka zásobu příkladů i offline.'
      : 'Příklady na tuhle úlohu a obtížnost už nejsou. Další přibudou, až budeš online.' + (any ? ' Zatím můžeš zkusit jinou úlohu nebo obtížnost.' : '')) + '</span>';
    $('inputs').innerHTML = '';
    $('feedback').hidden = true;
    $('hints').hidden = true;
    $('btn-hint').hidden = true;
    $('btn-reveal').hidden = true;
    $('keypad').hidden = true;
    $('hint-info').textContent = '';
  }

  // Doplní zásobu příkladů pro všechny úlohy, úrovně a obtížnosti (aktuální první).
  let refilling = false;
  async function refill() {
    if (state.offline || refilling || !state.user || !state.module) return;
    const combos = [{ module: state.module, level: state.level, diff: state.diff }];
    Object.keys(state.modules).forEach((module) => Object.keys(state.modules[module].levels).forEach((level) =>
      Object.keys(diffsFor(module)).forEach((diff) => combos.push({ module, level, diff }))));
    const batches = Offline.wanted(state.user, combos);
    if (!batches.length) return;
    refilling = true;
    const uid = state.user;
    try {
      for (const want of batches) {
        const r = await api('pool', { want });
        Offline.addToPool(uid, r.pool, want);
      }
    } catch (e) {
      if (e.network) setOffline(true);
    } finally {
      refilling = false;
      updateBar();
    }
  }

  // Pošle výsledky vyřešené bez internetu (obou dětí) a zjistí, jestli je spojení.
  let syncing = false;
  async function trySync() {
    if (syncing || !realUsers().length) return;
    syncing = true;
    try {
      let users = null;
      for (const u of realUsers()) {
        const items = Offline.queue(u.id);
        if (!items.length && users) continue;   // prázdný sync stačí jednou jako test spojení
        let r;
        try {
          r = await api('sync', { user: u.id, items });
        } catch (e) {
          if (e.network) throw e;
          continue;   // třeba vypršelé přihlášení jednoho dítěte (fronta zůstane), ostatní se pošlou
        }
        Offline.forget(u.id, r.done);
        users = r.users;
      }
      setOffline(false);
      if (users) renderKids(users);
      refill();
      Usage.flush();   // čas v appce za dobu bez internetu
    } catch (e) {
      if (e.network) setOffline(true);
    } finally {
      syncing = false;
      updateBar();
    }
  }

  window.addEventListener('online', trySync);
  window.addEventListener('offline', () => setOffline(true));
  setInterval(() => {
    if (state.offline || (state.user && Offline.queue(state.user).length)) trySync();
  }, 30000);

  function showQuestion() {
    const q = state.ex;
    setDiffColor(q.diff);   // v mixu „vše“ barva podle obtížnosti tohoto příkladu
    $('review').hidden = !q.review;
    $('question').innerHTML = renderQ(q.q) + (q.kind === 'divrem' || q.var || q.q.startsWith('Zkrať') || q.q.endsWith('?') ? '' : ' =');
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
      const mode = q.kind === 'frac' || q.kind === 'roman' ? 'text' : 'decimal';
      const ph = q.kind === 'frac' ? 'např. 3/4' : '';
      const caps = q.kind === 'roman' ? ' autocapitalize="characters" spellcheck="false"' : '';
      // rovnice: dítě píše hodnotu neznámé („x = …“)
      inputs.innerHTML = (q.var ? `<span>${esc(q.var)} =</span>` : '') + `<input type="text" inputmode="${mode}" id="ans" autocomplete="off" placeholder="${ph}"${caps}${ro}>`
        + (q.unit ? `<span>${esc(q.unit)}</span>` : '');   // jednotka za políčkem (… %)
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
    if (q.kind === 'roman') return renderRomanKeypad(extra);
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

  // Římské číslice: místo číslic písmena (I V X, na těžké až M) po třech v řádku.
  function renderRomanKeypad(letters) {
    const key = (label) => label
      ? `<button type="button" class="key" data-key="${esc(label)}">${esc(label)}</button>`
      : '<button type="button" class="key blank" tabindex="-1" aria-hidden="true"></button>';
    let html = '';
    for (let i = 0; i < letters.length; i += 3) {
      html += [0, 1, 2].map((j) => key(letters[i + j])).join('')
        + (i === 0 ? '<button type="button" class="key fn" data-key="del" aria-label="Smazat">smaž</button>' : key(''));
    }
    $('keypad').innerHTML = html + key('') + key('') + '<button type="button" class="key ok wide" data-key="ok">Hotovo</button>';
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
    if (v.length >= (state.ex.kind === 'roman' ? 15 : 12)) return;   // MMMDCCCLXXXVIII má 15 znaků
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

  // Bublina nad stisknutou klávesou (jako klávesnice v telefonu): po dobu
  // stisku je nad klávesou velké číslo, které dítě zmáčklo. Prst klávesu
  // zakryje, bublina ne. Rychlé ťuknutí ji ukáže aspoň na BUBBLE_MIN ms.
  const BUBBLE_MIN = 180;
  const bubble = document.createElement('div');
  bubble.className = 'key-bubble';
  bubble.setAttribute('aria-hidden', 'true');
  bubble.hidden = true;
  document.body.appendChild(bubble);
  let bubbleAt = 0;
  let bubbleTimer = null;
  function showBubble(btn) {
    if (!btn || !/^([0-9]|−|,|\/|[IVXLCDM])$/.test(btn.dataset.key)) return;   // jen znaky, ne smaž, zb., Hotovo
    clearTimeout(bubbleTimer);
    document.querySelectorAll('.key.pressed').forEach((k) => k.classList.remove('pressed'));
    const r = btn.getBoundingClientRect();
    bubble.textContent = btn.dataset.key;
    bubble.style.left = `${r.left + r.width / 2}px`;
    bubble.style.top = `${r.top}px`;
    bubble.style.minWidth = `${r.width}px`;
    bubble.hidden = false;
    btn.classList.add('pressed');
    bubbleAt = performance.now();
  }
  function hideBubble() {
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => {
      bubble.hidden = true;
      document.querySelectorAll('.key.pressed').forEach((k) => k.classList.remove('pressed'));
    }, Math.max(0, BUBBLE_MIN - (performance.now() - bubbleAt)));
  }
  $('keypad').addEventListener('pointerdown', (e) => {
    if (!state.lock) showBubble(e.target.closest('[data-key]'));
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => $('keypad').addEventListener(ev, hideBubble));
  window.addEventListener('scroll', () => { bubble.hidden = true; }, { passive: true });

  // tablet s fyzickou klávesnicí: psaní funguje i do políček jen pro čtení
  document.addEventListener('keydown', (e) => {
    if (!KEYPAD || $('screen-round').hidden || state.lock || e.metaKey || e.ctrlKey) return;
    const map = { Backspace: 'del', Enter: 'ok', '-': '−', ',': ',', '.': ',', '/': '/' };
    const roman = state.ex && state.ex.kind === 'roman';
    const k = roman ? (/^[ivxlcdm]$/i.test(e.key) ? e.key.toUpperCase() : { Backspace: 'del', Enter: 'ok' }[e.key])
      : /^[0-9]$/.test(e.key) ? e.key : map[e.key];
    if (!k) return;
    e.preventDefault();
    pressKey(k);
    // i při psaní z klávesnice bublina nad odpovídající klávesou
    showBubble($('keypad').querySelector(`[data-key="${k}"]`));
    hideBubble();
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
    if (state.lock || !state.ex) return;
    const answer = collectAnswer();
    if (answerEmpty(answer)) return;
    if (state.ex.local) { showAnswer(localAnswer(answer)); return; }
    state.lock = true;
    let r;
    try {
      r = await api('answer', { answer });
    } catch (err) {
      state.lock = false;
      failOrRenew(err);
      return;
    }
    showAnswer(r);
  });

  // Odpověď na příklad ze zásoby: kontrola v telefonu, předběžné body, výsledek do fronty.
  function localAnswer(answer) {
    const ex = state.ex;
    const c = Offline.check(ex, answer);
    if (!c.readable) return { correct: false, note: c.note, why: '' };   // překlep, ne pokus
    ex.tries++;
    ex.answers.push(answer);
    const me = state.users.find((u) => u.id === state.user);
    if (!c.ok) {
      if (ex.tries === 1 && me) me.streak = 0;
      return { correct: false, note: c.note, why: '' };
    }
    const streak = ex.tries === 1 && me ? me.streak + 1 : 0;
    const p = Offline.points(ex.diff, ex.tries, streak);
    let rewards = [];
    if (me) {
      const add = p.points + p.bonus;
      const totalBefore = me.total;
      Object.assign(me, { streak, today: me.today + add, week: me.week + add, total: me.total + add, solved_today: me.solved_today + 1 });
      rewards = Rewards.local({ streak, first: ex.tries === 1, solvedToday: me.solved_today, goal: state.goal, totalBefore, totalAfter: me.total });
    }
    if (!Offline.record(state.user, ex, false)) alert('Výsledek se nepodařilo uložit, v telefonu není místo. Zkus to s internetem.');
    trySync();
    return { correct: true, note: c.note, points: p.points, bonus: p.bonus, streak, rewards, suggest: null, users: state.users, offline: true };
  }

  function showAnswer(r) {
    const fb = $('feedback');
    fb.hidden = false;
    if (r.correct) {
      endQuestion();
      fb.className = 'feedback ok';
      const me = r.users.find((u) => u.id === state.user);
      const tick = '<svg class="tick" width="46" height="40" viewBox="0 0 46 40" aria-hidden="true"><path d="M4 22 C 10 26, 14 31, 17 36 C 22 24, 31 12, 43 4" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      const extra = [];
      // odměny za úspěch (lib/rewards.php, offline rewards.js): text ke každé, animace té nejvzácnější
      const rewards = r.rewards || [];
      const kinds = rewards.map((x) => x.kind);
      const big = Rewards.primary(rewards);
      rewards.forEach((x) => extra.push(esc(Rewards.text(x))));
      const streakShown = kinds.some((k) => ['jednorozec', 'duha', 'zlaty_jednorozec'].includes(k));
      if (r.bonus) extra.push(streakShown ? 'Bod navíc za sérii.' : `${r.streak} správně v řadě, bod navíc`);
      else if (r.streak >= 3 && !streakShown) extra.push(`${r.streak} správně v řadě`);
      if (me.solved_today === state.goal && !kinds.includes('ohnostroj')) extra.push('Denní cíl splněný!');
      const fresh = rewards.filter((x) => x.new).map((x) => Rewards.STICKER[x.kind].name);
      if (fresh.length) extra.push(`Nová nálepka do alba: ${esc(fresh.join(', '))}.`);
      if (r.note) extra.push(esc(r.note));
      // bez účtu: po pár příkladech (a při splnění cíle) nabídnout účet, ať body nepropadnou
      if (isGuest() && (me.solved_today === 5 || me.solved_today === state.goal)) {
        extra.push(`Máš ${me.today} bodů jen do zavření appky. <a class="link" href="./?ucet">Založ si účet</a> a body, nálepky i žebříček ti zůstanou.`);
      }
      fb.innerHTML = `<div class="praise">${tick}<span class="hand">${pick(['Výborně!', 'Správně!', 'Přesně tak!', 'Paráda!', 'Trefa!', 'Super!'])}</span>`
        + `<span class="stamp">+${r.points + (r.bonus || 0)}</span></div>`
        + extra.map((t) => `<small>${t}</small>`).join('');
      renderKids(r.users);
      celebrate($('question'), big);
      if (me.solved_today === state.goal) {   // právě splněný cíl: hra se odemkla
        // hry jsou odemčené: dítě si vybere v rozcestníku
        fb.insertAdjacentHTML('beforeend', `<div class="next suggest"><span>Hry jsou odemčené (${GAME_PLAYS} hry na dnes).</span>`
          + '<button type="button" class="btn" data-game-now>Vybrat hru</button>'
          + '<button type="button" class="ghostbtn" id="btn-next">Další příklad</button></div>');
        fb.querySelector('[data-game-now]').addEventListener('click', openGames);
        $('btn-next').addEventListener('click', next);
        return;
      }
      if (offerSuggestion(fb, r.suggest)) return;   // s návrhem čeká na dítě, jinak sám další příklad
      state.timer = setTimeout(next, big ? 3400 : r.note ? 2400 : 1500);   // velká odměna doběhne
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
  }

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
    if (state.ex.local) {
      const me = state.users.find((u) => u.id === state.user);
      if (me) me.streak = 0;
      if (!Offline.record(state.user, state.ex, true)) alert('Výsledek se nepodařilo uložit, v telefonu není místo. Zkus to s internetem.');
      trySync();
      r = { answer: state.ex.answer, steps: state.ex.steps, suggest: null, users: state.users };
    } else {
      try {
        r = await api('reveal');
      } catch (err) {
        failOrRenew(err);
        return;
      }
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
    if (state.ex.local) {
      const ex = state.ex;
      ex.shownHints = Math.min(ex.hints.length, ex.shownHints + 1);
      r = { steps: ex.hints.slice(0, ex.shownHints), total: ex.hints.length };
    } else {
      try {
        r = await api('hint');
      } catch (err) {
        failOrRenew(err);
        return;
      }
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

  // ---------- hry ----------
  // Hry jsou odměna. Odemknou se splněním denního cíle a mají denní limit:
  // GAME_PLAYS her (každá hra = jedno kolo od startu do konce) a za každých
  // GAME_EXTRA_EVERY dalších vyřešených příkladů jedna hra navíc. Počítá se
  // v prohlížeči (pro každé dítě zvlášť), funguje i offline. Čas v celé appce
  // hlídá oddíl „čas v appce“ níž.
  const GAME_PLAYS = 3;
  const GAME_EXTRA_EVERY = 10;
  const GAMES = {
    had: { title: 'Had', icon: '🐍', label: 'Jablka', how: 'Táhni prstem po ploše, ťukej na šipky, nebo hraj šipkami na klávesnici.',
      pad: ['up', 'left', 'down', 'right'], make: (stage, cb) => { const c = document.createElement('canvas'); stage.appendChild(c); return window.Snake.create(c, cb); } },
    pexeso: { title: 'Pexeso', icon: '🃏', label: 'Tahy', low: true, how: 'Najdi dvojice: příklad a jeho výsledek. Čím méně tahů, tím lépe.',
      pad: [], make: (stage, cb) => window.Pexeso.create(stage, cb) },
    g2048: { title: '2048', icon: '🔢', label: 'Body', how: 'Posouvej dlaždice tažením nebo šipkami. Stejná čísla se spojí.',
      pad: ['up', 'left', 'down', 'right'], make: (stage, cb) => window.Game2048.create(stage, cb) },
    cihly: { title: 'Cihly', icon: '🧱', label: 'Cihly', how: 'Táhni pálkou prstem nebo šipkami a ťuknutím vystřel míček. Máš 3 životy.',
      pad: ['left', 'right'], hold: true, make: (stage, cb) => window.Breakout.create(stage, cb) },
    ptacek: { title: 'Ptáček', icon: '🐤', label: 'Sloupy', how: 'Ťukej na plochu (nebo mezerník) a proleť mezerami mezi sloupy.',
      pad: [], make: (stage, cb) => window.Flappy.create(stage, cb) },
  };
  let gameId = null;    // právě otevřená hra

  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const logKey = () => 'matika_games_' + (state.user || 0);
  function gameLog() {
    const log = Offline.load(logKey(), null);
    return log && log.day === today() ? log : { day: today(), plays: 0, ms: 0 };
  }
  function saveLog(log) { Offline.save(logKey(), log); }
  function me() { return state.users.find((u) => u.id === state.user); }
  function playsAllowed() {
    const m = me();
    if (!m || m.solved_today < state.goal) return 0;
    return GAME_PLAYS + Math.floor((m.solved_today - state.goal) / GAME_EXTRA_EVERY);
  }
  // Proč se teď nedá hrát ('' = dá se)
  function gameBlock() {
    const m = me();
    const log = gameLog();
    if (!m || m.solved_today < state.goal) return `Hry se odemknou po splnění denního cíle (${m ? m.solved_today : 0} z ${state.goal}).`;
    if (log.plays >= playsAllowed()) {
      const need = GAME_EXTRA_EVERY - ((m.solved_today - state.goal) % GAME_EXTRA_EVERY);
      return `Dnešní hry jsou vyčerpané. Další hru dostaneš za ${need} ${need === 1 ? 'vyřešený příklad' : need <= 4 ? 'vyřešené příklady' : 'vyřešených příkladů'}.`;
    }
    return '';
  }
  function gameStatus() {
    const log = gameLog();
    const plays = Math.max(0, playsAllowed() - log.plays);
    return `Zbývá ${plays} ${plays === 1 ? 'hra' : plays >= 2 && plays <= 4 ? 'hry' : 'her'}.`;
  }
  function renderGameButtons() {
    const block = gameBlock();
    const m = me();
    document.querySelectorAll('[data-games]').forEach((b) => {
      b.textContent = !m || m.solved_today < state.goal ? `Hry (po denním cíli, ${m ? m.solved_today : 0} z ${state.goal})`
        : block ? 'Hry (na dnes konec)' : `Hry (${gameStatus().replace('Zbývá ', 'zbývá ').replace('.', '')})`;
    });
  }
  const bestKey = (id) => (id === 'had' ? 'matika_snake_' : `matika_best_${id}_`) + (state.user || 0);
  function bestOf(id) {
    try { return Number(localStorage.getItem(bestKey(id))) || 0; } catch (e) { return 0; }
  }

  function openGames() {
    clearTimeout(state.timer);
    state.ex = null;
    const block = gameBlock();
    $('games-info').textContent = block || gameStatus();
    $('games-list').innerHTML = Object.entries(GAMES).map(([id, g]) =>
      `<button type="button" class="game-card" data-game-id="${id}"${block ? ' disabled' : ''}><span class="game-icon">${g.icon}</span>`
      + `<b>${g.title}</b><small>rekord ${bestOf(id) || '–'}</small></button>`).join('');
    $('btn-random-game').disabled = !!block;
    show('games');
  }
  function gameOverlay(msg, btn) {
    $('game-msg').textContent = msg;
    $('game-start').textContent = btn;
    $('game-start').hidden = !btn;
    $('game-overlay').hidden = false;
    if (btn && !KEYPAD) $('game-start').focus({ preventScroll: true });
  }
  function openGame(id) {
    const g = GAMES[id];
    if (!g || gameBlock()) { openGames(); return; }
    clearTimeout(state.timer);
    state.ex = null;
    if (game) game.stop();
    gameId = id;
    $('game-stage').innerHTML = '';
    $('game-stage').className = 'game-stage game-' + id;
    $('game-title').textContent = g.title;
    $('game-score-label').textContent = g.label;
    $('game-score').textContent = '0';
    $('game-best').textContent = bestOf(id) || '–';
    $('game-pad').hidden = !g.pad.length;
    $('game-pad').querySelectorAll('[data-dir]').forEach((b) => { b.hidden = !g.pad.includes(b.dataset.dir); });
    $('game-limit').textContent = gameStatus();
    show('game');
    game = g.make($('game-stage'), {
      onScore: (n) => { $('game-score').textContent = n; },
      onOver: (n) => gameOver(id, n),
    });
    gameOverlay(g.how, 'Hrát');
  }
  function gameOver(id, n) {
    const g = GAMES[id];
    const best = bestOf(id);
    const record = g.low ? n > 0 && (!best || n < best) : n > best;
    if (record) {
      try { localStorage.setItem(bestKey(id), String(n)); } catch (e) { /* bez úložiště */ }
      $('game-best').textContent = n;
    }
    renderGameButtons();
    $('game-limit').textContent = gameBlock() || gameStatus();
    const block = gameBlock();
    gameOverlay((record ? 'Nový rekord! ' : '') + `${g.label}: ${n}.` + (block ? ' ' + block : ''), block ? '' : 'Hrát znovu');
  }
  // Start kola: spotřebuje jednu hru z denního limitu.
  function gameGo() {
    if (!game) return;
    if (game.running) { $('game-overlay').hidden = true; return; }
    const block = gameBlock();
    if (block) { gameOverlay(block, ''); return; }
    if (game.over || !game.paused) {
      const log = gameLog();
      log.plays++;
      saveLog(log);
      if (game.over) game.reset();
    }
    game.paused = false;
    $('game-overlay').hidden = true;
    game.start();
    renderGameButtons();
    $('game-limit').textContent = gameStatus();
  }
  document.querySelectorAll('[data-games]').forEach((b) => b.addEventListener('click', openGames));
  $('games-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-game-id]');
    if (b) openGame(b.dataset.gameId);
  });
  $('btn-random-game').addEventListener('click', () => openGame(pick(Object.keys(GAMES))));
  $('btn-games-back').addEventListener('click', () => { if (game) game.stop(); openGames(); });
  $('game-start').addEventListener('click', gameGo);
  // první ťuknutí na plochu hru spustí (u ptáčka a cihel je to zároveň první akce)
  $('game-stage').addEventListener('pointerdown', () => { if (game && !game.running && !$('game-overlay').hidden && !game.over && $('game-start').hidden === false) gameGo(); }, true);
  // šipky pod plochou; u cihel se pálka hýbe, dokud je tlačítko stisknuté
  $('game-pad').querySelectorAll('[data-dir]').forEach((b) => {
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!game || game.over) return;
      if (!game.running) gameGo();
      game.turn(b.dataset.dir);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => b.addEventListener(ev, () => { if (game && game.release) game.release(); }));
  });
  document.addEventListener('keydown', (e) => {
    if ($('screen-game').hidden || !game) return;
    const dir = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' }[e.key];
    if (dir) {
      e.preventDefault();
      if (game.over) return;
      if (!game.running) gameGo();
      game.turn(dir);
    } else if (e.key === ' ' || e.key === 'Enter') {
      if (document.activeElement === $('game-start')) return;
      e.preventDefault();
      if (!game.running && !$('game-overlay').hidden && !$('game-start').hidden) gameGo();
      else if (game.action) game.action();
    }
  });
  document.addEventListener('keyup', (e) => {
    if (game && game.release && ['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) game.release();
  });
  // Pauza, když dítě odejde z appky (pokračování nespotřebuje další hru).
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game && game.running) {
      game.stop();
      game.paused = true;
      gameOverlay('Pauza.', 'Pokračovat');
    }
  });

  // ---------- čas v appce (měření a odesílání: usage.js) ----------
  Usage.init({
    api, today, setOffline,
    users: realUsers, user: () => state.user, offline: () => state.offline,
    bar(min) {
      const bar = $('time-bar');
      bar.hidden = min === null;
      if (min !== null) bar.textContent = `Dnes jsi v Matice už ${Usage.minutes(min)}. Dej si pauzu.`;
    },
    warn(min) {
      if (game && game.running) {   // hra počká
        game.stop();
        game.paused = true;
        gameOverlay('Pauza.', 'Pokračovat');
      }
      clearTimeout(state.timer);
      $('time-warn-text').textContent = `Dnes jsi v Matice už ${Usage.minutes(min)}.`;
      $('time-warn').hidden = false;
      $('time-warn-ok').focus();
    },
  });
  $('time-warn-ok').addEventListener('click', () => {
    $('time-warn').hidden = true;
    if (state.ex && state.lock && !$('feedback').hidden && !$('btn-next')) next();   // po správné odpovědi pokračovat
  });

  // ---------- běžné efekty ----------
  // Náhodný efekt za každou správnou odpověď jde vypnout; odměny (jednorožec,
  // ohňostroj …) se hrají dál. Volba je v prohlížeči.
  function effectsOn() {
    try { return localStorage.getItem('matika_fx') !== 'off'; } catch (e) { return true; }
  }
  function renderFxToggle() {
    document.querySelectorAll('[data-fx-toggle]').forEach((b) => { b.textContent = effectsOn() ? 'Efekty: zapnuté' : 'Efekty: vypnuté'; });
  }
  document.querySelectorAll('[data-fx-toggle]').forEach((b) => b.addEventListener('click', () => {
    try {
      if (effectsOn()) localStorage.setItem('matika_fx', 'off'); else localStorage.removeItem('matika_fx');
    } catch (e) { /* bez úložiště */ }
    renderFxToggle();
  }));
  renderFxToggle();

  // ---------- motiv ----------
  // Volba v menu: podle telefonu → tmavý → světlý. Výchozí stav nastaví už
  // skript v <head> (bez probliknutí), tady jen přepínání a změna v systému.
  const THEME_LABEL = { auto: 'Motiv: podle telefonu', dark: 'Motiv: tmavý', light: 'Motiv: světlý' };
  const THEME_NEXT = { auto: 'dark', dark: 'light', light: 'auto' };
  const darkQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  function themePref() {
    try { return THEME_LABEL[localStorage.getItem('matika_theme')] ? localStorage.getItem('matika_theme') : 'auto'; } catch (e) { return 'auto'; }
  }
  function applyTheme() {
    const pref = themePref();
    const dark = pref === 'dark' || (pref === 'auto' && darkQuery && darkQuery.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelectorAll('[data-theme-toggle]').forEach((b) => { b.textContent = THEME_LABEL[pref]; });
    paper.recolor();
    if (game) game.recolor();
    syncThemeColor();
  }
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.addEventListener('click', () => {
    const next = THEME_NEXT[themePref()];
    try {
      if (next === 'auto') localStorage.removeItem('matika_theme'); else localStorage.setItem('matika_theme', next);
    } catch (e) { /* bez úložiště jen do obnovení stránky */ }
    applyTheme();
  }));
  if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener('change', applyTheme);
  applyTheme();

  // Enter po ukázání výsledku = další příklad
  document.addEventListener('keydown', (e) => {
    if ($('screen-round').hidden) return;   // jinde (přihlášení, výsledky) má Enter svůj význam
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
  function particle(x, y, frames, duration, emoji, delay = 0, easing = 'ease-out') {
    const c = document.createElement('i');
    c.className = emoji ? 'fx emoji' : 'fx confetti';
    if (emoji) c.textContent = emoji;
    else c.style.background = pick(COLORS);
    c.style.left = x + 'px';
    c.style.top = y + 'px';
    document.body.appendChild(c);
    c.animate(frames, { duration, delay, easing, fill: 'backwards' }).onfinish = () => c.remove();
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

  // Odměna (rewards.js) má vlastní animaci, jinak náhodný efekt (jde vypnout v menu).
  function celebrate(from, reward) {
    if (CALM || !document.body.animate) return;
    if (reward) { Rewards.play(reward); return; }
    if (!effectsOn()) return;
    const name = pick(Object.keys(EFFECTS).filter((k) => k !== lastEffect));
    lastEffect = name;
    EFFECTS[name](from.getBoundingClientRect());
  }

  // ---------- výsledky ----------
  const MODULE_NAME = (m) => (state.modules[m] ? state.modules[m].title : m);

  // Výsledky: moje body, žebříček (třída / všichni × dnes / týden / celkem),
  // album a přehled pro rodiče. Cizí dítě v žebříčku má veřejnou kartu (body, album).
  let board = null;
  const boardTab = { scope: 'class', range: 'week' };
  const RANGES = { today: 'Dnes', week: 'Tento týden', total: 'Celkem' };

  async function loadStats() {
    if (isGuest()) { alert('Výsledky a body jsou jen s účtem.'); return; }
    let s;
    try {
      s = await api('stats');
    } catch (e) {
      if (e.network) setOffline(true);
      alert(e.network ? 'Výsledky se ukážou, až budeš online.' : e.message);
      return;
    }
    renderKids(s.users);
    const me = s.users.find((u) => u.id === state.user);
    if (!me) return;
    const row = (label, v) => `<tr><th>${label}</th><td class="num">${v}</td></tr>`;
    $('compare').innerHTML =
      `<tr><th colspan="2"><span class="kid-name" data-color="${esc(me.color)}">${esc(me.name)}</span>${me.class_name ? ` <span class="class-name">${esc(me.class_name)}</span>` : ''}</th></tr>`
      + row('Přihlašovací jméno', esc(me.slug))
      + row('Dnes', me.today + ' b.')
      + row('Tento týden', me.week + ' b.')
      + row('Celkem', me.total + ' b.')
      + row('Dnes vyřešeno', `${me.solved_today} / ${state.goal}`)
      + row('Dní v řadě se splněným cílem', me.days || '–')
      + row('Dnes v appce (všechna zařízení)', Usage.minutes(Math.floor(Usage.ms(me.id) / 60000)));
    $('me-actions').innerHTML = '<button type="button" class="link rename">Přejmenovat</button>'
      + '<button type="button" class="link pin">Změnit PIN</button>'
      + '<button type="button" class="link logout">Odhlásit z tohoto zařízení</button>'
      + '<button type="button" class="link reset">Smazat body</button>';
    board = s.board;
    if (!board.class) boardTab.scope = 'all';
    $('card').hidden = true;
    renderBoard();
    // album: získané nálepky (kolikrát), nezískané šedě s tím, jak je dostat
    $('album').innerHTML = renderAlbum(s.stats.stickers || {});
    const st = s.stats;
    const per = st.per_task.length
      ? `<table class="table">${st.per_task.map((p) => `<tr><td>${esc(MODULE_NAME(p.module))} – ${esc(state.diffs[p.difficulty] || p.difficulty)}</td><td class="num">${p.n}×</td><td class="num">${Math.round((p.first / p.n) * 100)} % napoprvé</td></tr>`).join('')}</table>`
      : '<p class="empty">Zatím nic.</p>';
    const hard = st.hardest.length
      ? `<div class="mistakes">${st.hardest.map((h) => `<div><span>${renderQ(h.question)}</span><span class="right">${renderQ(h.answer)}</span></div>`).join('')}</div>`
      : '<p class="empty">Žádné opakované chyby.</p>';
    $('parent').innerHTML = `${per}<h3>Co nejde (30 dní)</h3>${hard}`;
    show('stats');
  }

  function renderAlbum(have) {
    const all = Object.entries(Rewards.STICKER);
    const got = all.filter(([k]) => have[k]).length;
    return `<p class="album-count">${got} z ${all.length}</p><div class="album">${all.map(([k, st]) => {
      const n = have[k] || 0;
      const style = st.gold ? ' style="filter:sepia(1) saturate(6) hue-rotate(-12deg) brightness(1.15)"' : st.hue ? ` style="filter:hue-rotate(${st.hue}deg)"` : '';
      return `<div class="sticker${n ? '' : ' locked'}" title="${esc(st.how)}"><span class="sticker-e"${n ? style : ''}>${st.e}</span>`
        + `<b>${esc(st.name)}</b><small>${n ? (n > 1 ? `${n}×` : 'mám') : esc(st.how)}</small></div>`;
    }).join('')}</div>`;
  }

  // Žebříček: ve „dnes“ a „týden“ jen děti s body, v „celkem“ všichni; vlastní řádek vždy.
  function renderBoard() {
    const tab = (id, items, cur) => { $(id).innerHTML = Object.entries(items).map(([k, label]) =>
      `<button type="button" role="tab" class="tab" data-tab="${k}" aria-selected="${k === cur}">${esc(label)}</button>`).join(''); };
    const scopes = board.class ? { class: board.class_name || 'Moje třída', all: 'Všichni' } : { all: 'Všichni' };
    tab('board-scope', scopes, boardTab.scope);
    tab('board-range', RANGES, boardTab.range);
    const r = boardTab.range;
    const list = (boardTab.scope === 'class' ? board.class : board.all)
      .filter((u) => r === 'total' || u[r] > 0 || u.id === state.user)
      .sort((a, b) => b[r] - a[r] || b.days - a.days || a.id - b.id);
    $('board').innerHTML = list.length ? `<ol class="board">${list.map((u, i) =>
      `<li class="board-row${u.id === state.user ? ' mine' : ''}" data-color="${esc(u.color)}"><span class="rank">${i + 1}.</span>`
      + `<button type="button" class="board-kid" data-user="${u.id}"><span class="kid-name">${esc(u.name)}</span></button>`
      + (u.days ? `<span class="me-days" title="Dní v řadě se splněným cílem">${u.days}× cíl</span>` : '')
      + `<b class="num">${u[r]} b.</b></li>`).join('')}</ol>` : '<p class="empty">Zatím nikdo nemá body.</p>';
  }
  ['board-scope', 'board-range'].forEach((id) => $(id).addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    boardTab[id === 'board-scope' ? 'scope' : 'range'] = b.dataset.tab;
    renderBoard();
  }));
  // karta jiného dítěte: body, série dní, album
  $('board').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-user]');
    if (!b) return;
    const card = $('card');
    let c;
    try {
      c = await api('card', { target: Number(b.dataset.user) });
    } catch (err) {
      alert(err.message);
      return;
    }
    card.dataset.color = c.color;
    card.innerHTML = `<div class="card-head"><span class="kid-name">${esc(c.name)}</span>${c.class_name ? ` <span class="class-name">${esc(c.class_name)}</span>` : ''}`
      + '<button type="button" class="link card-close">Zavřít</button></div>'
      + `<p>Dnes ${c.today} b., tento týden ${c.week} b., celkem ${c.total} b.${c.days ? `, ${c.days}× cíl v řadě` : ''}.</p>` + renderAlbum(c.stickers || {});
    card.hidden = false;
    card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  $('card').addEventListener('click', (e) => { if (e.target.closest('.card-close')) $('card').hidden = true; });

  document.querySelectorAll('[data-stats]').forEach((b) =>
    b.addEventListener('click', () => { clearTimeout(state.timer); state.ex = null; loadStats(); }));
  $('me-actions').addEventListener('click', async (e) => {
    const me = state.users.find((x) => x.id === state.user);
    const b = e.target.closest('button');
    if (!b || !me) return;
    try {
      if (b.classList.contains('reset')) {
        if (!confirm(`Smazat všechny svoje body (${me.total})? Vrátit to nejde. Vyřešené příklady v přehledu a nálepky v albu zůstanou.`)) return;
        await api('reset');
      } else if (b.classList.contains('rename')) {
        const name = prompt('Přezdívka (1 až 20 znaků):', me.name);
        if (name === null) return;
        await api('rename', { name });
      } else if (b.classList.contains('pin')) {
        const old = prompt('Starý PIN:');
        if (old === null) return;
        const pin = prompt(`Nový PIN (${state.pin.min} až ${state.pin.max} číslic):`);
        if (pin === null) return;
        await api('pin', { old, pin });
        alert('PIN je změněný.');
        return;
      } else if (b.classList.contains('logout')) {
        if (!confirm('Odhlásit se z tohoto zařízení? Příště bude appka chtít PIN.')) return;
        await api('logout');
        location.href = './';
        return;
      }
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
      if (state.user !== null) openLast(); else showWho();
    })
  );

  // ---------- start ----------
  (async () => {
    try {
      let s;
      const slug = document.body.dataset.slug || '';
      try {
        s = await api('state', { user: null, slug });
        Offline.save('matika_state', s);
      } catch (e) {
        // bez internetu ze stavu z minula (úlohy, děti, body)
        s = e.network && Offline.load('matika_state', null);
        if (!s) throw e.network ? new Error('Bez internetu. Matiku je potřeba poprvé otevřít s internetem.') : e;
        state.offline = true;
      }
      // dítě z adresy: přihlášené na zařízení → rovnou cvičit, jinak PIN (nebo nastavení PINu)
      const page = s.page && s.page.slug === slug ? s.page : null;
      const me = page && s.users.find((u) => u.id === page.id);
      Object.assign(state, { modules: s.modules, diffs: s.difficulties, goal: s.goal, colors: s.colors || {}, pin: s.pin || state.pin, page, user: me ? me.id : null });
      renderKids(s.users);
      if (me) openLast();
      else if (page) showLogin(page.has_pin ? 'pin' : 'setup', page);
      else if (location.search === '?ucet') showLogin('register');   // z nabídky hostovi po pár příkladech
      else if (/^\?pozvanka=/.test(location.search)) await openInvite(decodeURIComponent(location.search.slice(10)));
      else showWho();
      if (!state.offline) trySync();   // výsledky z minula a doplnění zásoby
    } catch (e) {
      document.body.insertAdjacentHTML('afterbegin', `<p style="padding:16px;color:#d64545">${esc(e.message)}</p>`);
    }
  })();

  // Service worker: appka se otevře i bez internetu (sw.js). Po registraci
  // mu stránka pošle, co právě načetla, ať je to v cache hned napoprvé.
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        const urls = performance.getEntriesByType('resource').map((r) => r.name)
          .filter((u) => u.startsWith(location.origin) && !u.includes('api.php'));
        if (reg.active) reg.active.postMessage({ cache: urls, page: location.href });
      })
      .catch(() => { /* bez service workeru appka funguje dál, jen ne offline */ });
  }
})();
