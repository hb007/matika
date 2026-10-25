// Service worker: appka se otevře i bez internetu.
// - stránky (/, /holka, /u/anicka …): nejdřív síť, bez sítě poslední uložená verze
// - skripty, styly, písma, ikony: z cache (nové verze mají jinou adresu ?v=…)
// - api.php se neukládá nikdy; bez sítě si příklady řeší appka sama (offline.js)
const CACHE = 'matika-v2';
const STATIC = [
  'fonts/atkinson-hyperlegible-400-latin.woff2', 'fonts/atkinson-hyperlegible-400-latin-ext.woff2',
  'fonts/atkinson-hyperlegible-700-latin.woff2', 'fonts/atkinson-hyperlegible-700-latin-ext.woff2',
  'fonts/patrick-hand-400-latin.woff2', 'fonts/patrick-hand-400-latin-ext.woff2',
  'icon.svg', 'icon-180.png', 'icon-512.png',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(STATIC.map((u) => c.add(u).catch(() => null)))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Uloží odpověď; starší verze téhož souboru (jiné ?v=) smaže.
async function put(req, res) {
  const c = await caches.open(CACHE);
  const url = new URL(req.url);
  if (url.search) {
    for (const old of await c.keys()) {
      const o = new URL(old.url);
      if (o.pathname === url.pathname && o.search !== url.search) await c.delete(old);
    }
  }
  await c.put(req, res);
}

// Stránka appky: klíč bez parametrů, ať /holka i /holka?x=1 najdou tutéž.
// Ikony v barvě dítěte (icon.php?barva=…) se ukládají jako ostatní soubory.
const pageKey = (url) => url.origin + url.pathname;

async function page(req) {
  const key = pageKey(new URL(req.url));
  try {
    const res = await fetch(req);
    if (res.ok) await put(new Request(key), res.clone());
    return res;
  } catch (err) {
    const c = await caches.open(CACHE);
    const hit = await c.match(key) || await c.match(new URL('./', self.registration.scope).href);
    return hit || new Response('<!doctype html><meta charset="utf-8"><title>Matika</title><p style="font:18px system-ui;padding:24px">Bez internetu. Matiku je potřeba poprvé otevřít s internetem.</p>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}

async function asset(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) await put(req, res.clone());
  return res;
}

// Manifest: nejdřív síť (název podle přezdívky), bez sítě uložený.
async function fresh(req) {
  try {
    const res = await fetch(req);
    if (res.ok) await put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await caches.match(req);
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.endsWith('/api.php')) return;
  if (req.mode === 'navigate') e.respondWith(page(req));
  else if (url.pathname.endsWith('/manifest.php')) e.respondWith(fresh(req));
  else e.respondWith(asset(req));
});

// Stránka po načtení pošle, co právě použila (verze skriptů a stylů s ?v=),
// ať jsou v cache hned od první návštěvy, ne až od druhé.
self.addEventListener('message', (e) => {
  const urls = (e.data && e.data.cache) || [];
  const pg = e.data && e.data.page;
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all([
    pg && fetch(pg).then((res) => res.ok && put(new Request(pageKey(new URL(pg))), res)).catch(() => null),
  ].concat(urls.map(async (u) => {
    const url = new URL(u, self.location.href);
    if (url.origin !== self.location.origin || url.pathname.endsWith('/api.php')) return;
    if (await c.match(u)) return;
    try {
      const res = await fetch(u);
      if (res.ok) await (url.search ? put(new Request(u), res) : c.put(u, res));
    } catch (err) { /* bez sítě nic */ }
  })))));
});
