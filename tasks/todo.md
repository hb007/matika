# Úkoly: Matika

* [x] ověřit nasazení na hosting (GitHub Actions → FTP)

## Offline se zásobou příkladů (2026-10-11)

* [x] server: tabulka `issued`, `pool` (zásoba) a `sync` (přehrání přes `handle_answer`/`handle_reveal`), testy `tests/test_offline.php`
* [x] `offline.js`: kontrola odpovědi v JS, zásoba, fronta výsledků; test shody s PHP (`tests/parity*.php/js`, i v nasazení)
* [x] `sw.js`: stránka, skripty, styly, písma a ikony offline
* [x] `app.js`: přepnutí na zásobu při výpadku, lišta „Bez internetu“, odeslání po připojení, stav z minula při startu bez sítě
* [x] dokumentace (README, rozhodnutí)
* [x] zásoba pro všech 46 kombinací (30 na kombinaci, bez opakování, menší strop u malých úloh), po vyčerpání hláška místo náhrady
* [x] ověřit na skutečném Androidu: appka z plochy v režimu letadlo, po připojení se body započtou (ověřil uživatel)

## Tmavý motiv a jednorožec (2026-10-11)

* [x] barvy napevno → proměnné, tmavá sada pod `[data-theme=dark]`, skript v `<head>` bez probliknutí, přepínač v obou menu, barva lišty prohlížeče podle záhlaví
* [x] pero na papíře z `--canvas-ink`, při přepnutí motivu se přebarví i napsané
* [x] jednorožec za každých 10 správně napoprvé v řadě (online i offline), další příklad až po doběhnutí
* [x] ověřeno v Playwright (Pixel 7, tmavý systém): příklad, nápověda, papír, menu, výběr dítěte, výsledky, lišta offline; přepínač auto → tmavý → světlý, volba drží po obnovení; série 9 + správně → jednorožec s duhou
* [ ] na zařízení ověřit: po kreslení na papír se v Playwrightu první ťuknutí jinam (štítek se jménem) nezapočítá, druhé ano; stejné i před touto změnou, nejspíš artefakt simulovaného dotyku

## Bublina nad stisknutou klávesou (2026-10-11)

* [x] při stisku číslice nebo znaku je nad klávesou bublina s velkým znakem, rychlé ťuknutí ji ukáže aspoň 180 ms
* [x] ověřeno v Playwright (Pixel 7 a tablet na šířku, dotyk přes CDP): bublina nad klávesou a na střed, po puštění zmizí, „smaž“ ji nemá

### Výsledek

* Playwright (Pixel 7, Chromium): online otevření → zásoba 30 + mix 20, stránka a skripty v cache → offline reload otevře appku s lištou → správně (+2), špatně a správně (+1), nápověda ve 2 krocích a ukázat výsledek (0) → online: fronta prázdná, na serveru +3 body a 2 vyřešené, lišta zmizí. Bez JS chyb.
* Shoda kontroly odpovědi PHP a JS na 15 938 případech.
* Plná zásoba: 46 kombinací, 1 324 příkladů, 496 kB, za 0,8 s, bez duplicit. Offline lehká malá násobilka: 16 příkladů, všechny různé, pak hláška „už nejsou“, střední jde dál; po připojení se fronta odeslala a zásoba doplnila.
* Neověřeno: skutečný Android, chování service workeru na produkčním HTTPS, plné localStorage.

## Samostatné příklady bez jmen a bodů (2026-10-11)

* [x] api.php: jen `modules`, `next`, `hint`, `answer`; aktuální příklad v PHP session
* [x] smazat databázi, uživatele, kola, statistiky, přístupové heslo a instalátor (lib/db.php, schema.sql, config.php, install.php, data/)
* [x] generators.php: `generate_round` → jeden příklad
* [x] index.php + app.js: bez přihlášení, výsledku kola a statistik; nekonečný proud příkladů
* [x] konfety + pochvala při správné odpovědi (respektuje omezené animace)
* [x] style.css: odstranit mrtvé styly
* [x] deploy.yml, .htaccess, README, docs/rozhodnuti.md
* [x] ověřit v prohlížeči (desktop + mobil)

### Výsledek

* Ověřeno v Playwright (1280 px a 390 px): správná odpověď → konfety + pochvala → další příklad; nápověda; špatná odpověď s postupem; Enter; návrat do menu; dělení se zbytkem; zlomky.
* API přes curl: `next`, `answer` (špatně i správně), `hint` bez session vrátí 404 s hláškou.
* Neověřeno: skutečná dotyková klávesnice na zařízení, chování PHP session na produkčním hostingu.

## Dvě děti, body a obtížnost (2026-10-11)

Plán: `docs/superpowers/plans/2026-10-11-uzivatele-body-obtiznost.md`, větev `uzivatele-body`.

* [x] obtížnost lehké / střední / těžké v generátorech + testy (`php tests/run.php`)
* [x] databáze a pravidla: body, série, denní cíl, opakování chyb, ochrana proti dvojímu započtení
* [x] API, dítě v každém požadavku, session zvlášť pro každé dítě
* [x] `/holka` a `/kluk`, výrazné označení dítěte, barvy obtížnosti, menu rovnou na příklad
* [x] výsledky a přehled pro rodiče
* [x] nasazení s testy, `data/` v repu, dokumentace
* [x] vlastní ikona na plochu pro každé dítě
* [x] design bez generického vzhledu
* [x] po nasazení ověřit `/kluk` (mod_rewrite) a hlavičku `Cache-Control` u `index.php` na matika.brno.ai

## Vzhled „tichý sešit“ (varianta A, 2026-10-11)

Mockup: https://claude.ai/artifact/EJYCt6BWvmkK7QZrNjRbp9

* [x] písma Atkinson Hyperlegible a Patrick Hand v `fonts/` (bez Google Fonts)
* [x] záhlaví: štítek dítěte + tlačítko úlohy se seznamem (úlohy, přepnout dítě, výsledky), bez záložek a bez menu obrazovky
* [x] otevřít poslední úlohu dítěte
* [x] jeden řádek: úrovně jako symboly + obtížnost jako ikony (pírko, kámen, činka, v mixu i „vše“)
* [x] barvy: zvýrazňovače obtížnosti, holka růžová, kluk petrolejová, pochvala v barvě dítěte, bez emoji v rozhraní
* [x] „Kdo dnes cvičí“ jako desky sešitů
* [x] ikony na plochu pro holku a kluka
* [x] ověřit v prohlížeči (telefon, tablet), README
