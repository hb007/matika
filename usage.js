// Čas v appce: jak dlouho je dnes dítě v Matice, sečteno ze všech zařízení
// (lib/usage.php). Měří se, když je appka otevřená a vidět (příklady i hry).
// Každé zařízení posílá svůj celkový čas za den (ne přírůstek) s vlastním
// id, takže ztracená odpověď serveru nic nepřičte dvakrát. Žádný odpočet
// a nic se nevypíná: po WARN_MIN minutách upozornění, pak každých REPEAT_MIN
// minut znovu. Co se při něm stane (lišta, u rozehrané hry až po jejím konci),
// dodá app.js v init().
window.Usage = (() => {
  const WARN_MIN = 10;
  const REPEAT_MIN = 5;
  const FLUSH_MS = 30000;
  const key = (uid) => 'matika_usage_' + uid;
  let deps = null;   // { api, today, users(), user(), offline(), setOffline(on), warn(min), bar(min|null) }

  // náhodné id zařízení, trvalé v prohlížeči
  const device = (() => {
    let d = Offline.load('matika_device', null);
    if (!/^[0-9a-f]{16}$/.test(d || '')) {
      d = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('');
      Offline.save('matika_device', d);
    }
    return d;
  })();

  // { day, server: ms dnes podle serveru (všechna zařízení), total: { den: ms na tomto zařízení },
  //   sent: { den: ms, které už server zná }, warned: minuta posledního upozornění }
  function usage(uid) {
    const u = Offline.load(key(uid), null) || {};
    u.total = u.total || u.pending || {};   // pending: starší verze (neodeslané přírůstky)
    u.sent = u.sent || {};
    delete u.pending;
    if (u.day !== deps.today()) Object.assign(u, { day: deps.today(), server: 0, warned: 0 });
    return u;
  }
  const unsent = (u, day) => Math.max(0, (u.total[day] || 0) - (u.sent[day] || 0));

  function ms(uid) {
    const u = usage(uid);
    return (u.server || 0) + unsent(u, u.day);
  }

  // dnešní čas ze serveru (přichází se stavem dětí)
  function fromUsers(users) {
    users.forEach((x) => {
      if (typeof x.time_today !== 'number') return;
      const u = usage(x.id);
      u.server = x.time_today;
      Offline.save(key(x.id), u);
    });
  }

  let flushing = false;
  async function flush() {
    if (flushing || deps.offline()) return;
    flushing = true;
    try {
      for (const kid of deps.users()) {
        const u0 = usage(kid.id);
        const items = Object.keys(u0.total).filter((day) => unsent(u0, day) > 0).map((day) => ({ day, ms: u0.total[day] }));
        if (!items.length) continue;
        const r = await deps.api('time', { user: kid.id, device, items });
        const u = usage(kid.id);   // mezitím mohly přibýt další sekundy
        items.forEach(({ day, ms: t }) => { u.sent[day] = Math.max(u.sent[day] || 0, t); });
        Object.keys(u.total).forEach((day) => {   // staré dny, které server zná, už netřeba držet
          if (day !== u.day && !unsent(u, day)) { delete u.total[day]; delete u.sent[day]; }
        });
        u.server = r.ms;
        Offline.save(key(kid.id), u);
      }
    } catch (e) {
      if (e.network) deps.setOffline(true);
    } finally {
      flushing = false;
    }
  }

  function minutes(n) {
    return `${n} ${n === 1 ? 'minutu' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'minuty' : 'minut'}`;
  }

  let sinceFlush = 0;
  function tick() {
    const uid = deps.user();
    if (document.hidden || !uid) return;
    const u = usage(uid);
    u.total[u.day] = (u.total[u.day] || 0) + 1000;
    const min = Math.floor(((u.server || 0) + unsent(u, u.day)) / 60000);
    if (min >= WARN_MIN) {
      const due = WARN_MIN + Math.floor((min - WARN_MIN) / REPEAT_MIN) * REPEAT_MIN;
      if ((u.warned || 0) < due) {
        u.warned = due;
        deps.warn(min);
      }
    }
    Offline.save(key(uid), u);
    deps.bar(min >= WARN_MIN ? min : null);
    sinceFlush += 1000;
    if (sinceFlush >= FLUSH_MS) {
      sinceFlush = 0;
      flush();
    }
  }

  function init(d) {
    deps = d;
    setInterval(tick, 1000);
    document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  }

  return { init, fromUsers, flush, ms, minutes };
})();
