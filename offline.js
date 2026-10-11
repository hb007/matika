// Offline režim: zásoba příkladů, kontrola odpovědi v telefonu a fronta
// výsledků, které se po připojení pošlou na server (viz lib/offline.php).
// Kontrola odpovědi je přepis check_answer z lib/generators.php: server
// výsledek po připojení stejně ověří znovu, tady jde jen o okamžitou odezvu.
window.Offline = (() => {
  // Zásoba: 20 příkladů pro každou kombinaci úlohy, úrovně a obtížnosti
  // (100 kombinací, zhruba 800 kB na dítě). Malé úlohy mají různých příkladů
  // méně (lehká malá násobilka jen 15), pak je strop menší (caps).
  const POOL_TARGET = 20;
  const BATCH = 400;         // nejvíc příkladů v jednom požadavku (server víc nevydá)
  const DIFF_POINTS = { lehke: 1, stredni: 2, tezke: 3 };
  const STREAK_BONUS = 5;

  // ---------- úložiště (localStorage, chyby tiše ignorujeme) ----------
  function load(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v === null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;   // plné nebo zakázané úložiště: offline jen nebude
    }
  }
  const poolKey = (uid) => 'matika_pool_' + uid;
  const capKey = (uid) => 'matika_poolcap_' + uid;
  const queueKey = (uid) => 'matika_queue_' + uid;

  // ---------- kontrola odpovědi (přepis z PHP) ----------
  const gcd = (a, b) => {
    a = Math.abs(a); b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a;
  };
  function fracStr(n, d) {
    const g = gcd(n, d) || 1;
    [n, d] = [n / g, d / g];
    if (d < 0) [n, d] = [-n, -d];
    return d === 1 ? String(n) : `${n}/${d}`;
  }
  function parseNum(s) {
    s = String(s).trim().replace(/[  ]/g, '').replace(/−/g, '-').replace(/,/g, '.');
    return /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s) ? parseFloat(s) : null;
  }
  function parseFrac(s) {
    s = String(s).replace(/,/g, '.').trim();
    if (s === '') return null;
    let m = s.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);   // smíšené číslo
    if (m) {
      if (+m[4] === 0) return null;
      const n = +m[2] * +m[4] + +m[3];
      return [m[1] === '-' ? -n : n, +m[4]];
    }
    m = s.match(/^(-?\d+)\s*\/\s*(\d+)$/);
    if (m) return +m[2] === 0 ? null : [+m[1], +m[2]];
    if (/^-?\d+$/.test(s)) return [+s, 1];
    return null;
  }
  // { ok, note, readable } – nečitelná odpověď (písmena, chybí zbytek) není pokus
  function check(ex, given) {
    if (ex.kind === 'num') {
      const v = parseNum(given);
      if (v === null) return { ok: false, note: 'To není číslo.', readable: false };
      return { ok: Math.abs(v - Number(ex.a)) < 0.0001, note: '', readable: true };
    }
    if (ex.kind === 'frac') {
      const f = parseFrac(given);
      if (f === null) return { ok: false, note: 'Zlomek piš jako 3/4 (nebo celé číslo).', readable: false };
      const [n, d] = ex.a;
      if (f[0] * d !== n * f[1]) return { ok: false, note: '', readable: true };
      const reduced = f[0] === n && f[1] === d;
      if (!reduced && ex.strict) {
        return { ok: false, readable: true, note: `Hodnota sedí, ale ještě to jde zkrátit (čitatel i jmenovatel dělit ${gcd(f[0], f[1])}).` };
      }
      return { ok: true, readable: true, note: reduced ? '' : `Správně, ale dá se zkrátit na ${fracStr(n, d)}.` };
    }
    // divrem
    const q = parseNum(given.q);
    const r = parseNum(given.r);
    if (q === null || r === null) return { ok: false, note: 'Vyplň podíl i zbytek (zbytek může být 0).', readable: false };
    return { ok: Math.trunc(q) === ex.a[0] && Math.trunc(r) === ex.a[1], note: '', readable: true };
  }

  // ---------- zásoba ----------
  const combo = (module, level, diff) => `${module}|${level}|${diff}`;

  // Co si dotáhnout: dávky [{module, level, difficulty, n, have}] pro všechny
  // kombinace (aktuální první). Dotahuje se, až zásoba klesne pod polovinu
  // stropu, ať se nežádá po každém příkladu. have = zadání, která už v zásobě
  // jsou: server je nevydá znovu, takže se v zásobě nic neopakuje.
  function wanted(uid, combos) {
    const pool = load(poolKey(uid), {});
    const caps = load(capKey(uid), {});
    const want = [];
    const seen = new Set();
    combos.forEach((c) => {
      const key = combo(c.module, c.level, c.diff);
      if (seen.has(key)) return;
      seen.add(key);
      const items = pool[key] || [];
      const cap = Math.max(1, Math.min(POOL_TARGET, caps[key] || POOL_TARGET));
      if (items.length < Math.ceil(cap / 2)) {
        want.push({ module: c.module, level: c.level, difficulty: c.diff, n: POOL_TARGET - items.length, have: items.map((it) => it.q) });
      }
    });
    // po dávkách, ať jeden požadavek nepřesáhne, co server vydá
    const batches = [];
    let cur = [];
    let sum = 0;
    want.forEach((w) => {
      if (sum + w.n > BATCH && cur.length) { batches.push(cur); cur = []; sum = 0; }
      cur.push(w);
      sum += w.n;
    });
    if (cur.length) batches.push(cur);
    return batches;
  }

  // Přidá do zásoby, co server vydal (bez opakování zadání). Když vydal méně,
  // než se chtělo, víc různých příkladů ta úloha nemá: zapamatuje se strop.
  function addToPool(uid, fresh, asked) {
    const pool = load(poolKey(uid), {});
    const caps = load(capKey(uid), {});
    (asked || []).forEach((w) => {
      const key = combo(w.module, w.level, w.difficulty);
      const items = pool[key] || [];
      const qs = new Set(items.map((it) => it.q));
      const got = ((fresh || {})[key] || []).filter((it) => !qs.has(it.q) && qs.add(it.q));
      pool[key] = items.concat(got);
      if (got.length < w.n) caps[key] = pool[key].length;
      else delete caps[key];
    });
    save(capKey(uid), caps);
    if (!save(poolKey(uid), pool)) {
      // plné úložiště: necháme jen právě stažené
      save(poolKey(uid), fresh || {});
    }
  }

  // Další příklad ze zásoby, jen z vybrané úlohy, úrovně a obtížnosti.
  // Použitý příklad ze zásoby zmizí, takže se neopakuje. Když dojdou, null.
  function take(uid, module, level, diff) {
    const pool = load(poolKey(uid), {});
    const key = combo(module, level, diff);
    if (!pool[key] || !pool[key].length) return null;
    const item = pool[key].shift();
    save(poolKey(uid), pool);
    return { ...item, local: true, tries: 0, answers: [], shownHints: 0 };
  }

  function left(uid, module, level, diff) {
    return (load(poolKey(uid), {})[combo(module, level, diff)] || []).length;
  }

  function poolSize(uid) {
    return Object.values(load(poolKey(uid), {})).reduce((n, a) => n + a.length, 0);
  }

  // ---------- fronta výsledků ----------
  function queue(uid) {
    return load(queueKey(uid), []);
  }
  function record(uid, ex, revealed) {
    const q = queue(uid);
    q.push({ id: ex.id, answers: ex.answers, revealed, at: Date.now() });
    save(queueKey(uid), q);
  }
  function forget(uid, ids) {
    const done = new Set(ids);
    save(queueKey(uid), queue(uid).filter((it) => !done.has(it.id)));
  }

  // Předběžné body za offline odpověď (server je po připojení spočítá znovu).
  function points(diff, tries, streak) {
    const base = tries === 1 ? DIFF_POINTS[diff] || 1 : 1;
    const bonus = tries === 1 && streak > 0 && streak % STREAK_BONUS === 0 ? 1 : 0;
    return { points: base, bonus };
  }

  return { load, save, check, wanted, addToPool, take, left, poolSize, queue, record, forget, points, combo };
})();
