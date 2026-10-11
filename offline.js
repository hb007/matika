// Offline režim: zásoba příkladů, kontrola odpovědi v telefonu a fronta
// výsledků, které se po připojení pošlou na server (viz lib/offline.php).
// Kontrola odpovědi je přepis check_answer z lib/generators.php: server
// výsledek po připojení stejně ověří znovu, tady jde jen o okamžitou odezvu.
window.Offline = (() => {
  const POOL_TARGET = 30;    // aktuální úloha
  const POOL_OTHER = 15;     // ostatní úlohy, které dítě používá
  const POOL_MIX = 20;       // náhodný mix jako záloha, když dojde vybraná úloha
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
      return { ok: Math.abs(v - Number(ex.a)) < 0.001, note: '', readable: true };
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

  // Co si dotáhnout: [{module, level, difficulty, n}] podle toho, co v zásobě chybí.
  // Dotahuje se, až klesne pod polovinu, ať se nežádá po každém příkladu.
  function wanted(uid, current, others) {
    const pool = load(poolKey(uid), {});
    const want = [];
    const add = (c, target) => {
      const key = combo(c.module, c.level, c.diff);
      if (want.some((w) => combo(w.module, w.level, w.difficulty) === key)) return;
      const have = (pool[key] || []).length;
      if (have < target / 2) want.push({ module: c.module, level: c.level, difficulty: c.diff, n: target - have });
    };
    if (current) add(current, POOL_TARGET);
    others.forEach((c) => add(c, POOL_OTHER));
    add({ module: 'mix', level: 'vse', diff: 'vse' }, POOL_MIX);
    return want;
  }

  function addToPool(uid, fresh) {
    const pool = load(poolKey(uid), {});
    Object.entries(fresh || {}).forEach(([key, items]) => { pool[key] = (pool[key] || []).concat(items); });
    if (!save(poolKey(uid), pool)) {
      // plné úložiště: necháme jen aktuální přírůstek
      save(poolKey(uid), fresh || {});
    }
  }

  // Další příklad ze zásoby: vybraná úloha, jinak jiná úroveň téže úlohy, jinak mix.
  function take(uid, module, level, diff) {
    const pool = load(poolKey(uid), {});
    const keys = Object.keys(pool).filter((k) => pool[k].length);
    const pickKey = [combo(module, level, diff)].concat(
      keys.filter((k) => k.startsWith(module + '|')),
      keys.filter((k) => k.startsWith('mix|')),
      keys,
    ).find((k) => pool[k] && pool[k].length);
    if (!pickKey) return null;
    const item = pool[pickKey].shift();
    save(poolKey(uid), pool);
    return { ...item, local: true, other: pickKey !== combo(module, level, diff), tries: 0, answers: [], shownHints: 0 };
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

  return { load, save, check, wanted, addToPool, take, poolSize, queue, record, forget, points, combo };
})();
