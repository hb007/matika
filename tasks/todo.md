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

## Čas ze všech zařízení, desetinná čísla bez celých (2026-10-11)

* [x] server: tabulka `usage`, akce `time` (přírůstky po dnech), `time_today` ve stavu dětí; testy `tests/test_usage.php`
* [x] klient: neodeslaný čas ve frontě, odeslání každých 30 s, při odchodu do pozadí a po připojení; upozornění a lišta podle součtu
* [x] posun čárky: zadání desetinné (nekončí nulou), výsledek až 3 místa; méně celých výsledků u · :; tolerance kontroly 0,0001; tisíce oddělené mezerou i u desetinných
* [x] ověřeno: dvě zařízení (6 + 4 min → upozornění na druhém), Výsledky se součtem, offline čas odeslán po připojení; testy a shoda PHP/JS

## Čas v celé appce (2026-10-11)

* [x] zrušen časový limit her (zámek a „zbývá X min“), zůstává limit počtu her
* [x] čas v appce na dítě a den, upozornění přes celou obrazovku po 10 min a pak každých 5 min, červená lišta, řádek ve Výsledcích
* [x] ověřeno v Playwright (světlý i tmavý): před 10 min nic, v 10 min upozornění a lišta, Rozumím pokračuje, v 15 min znovu, mezi tím ne; hry bez minut

## Procenta, dělitelnost, statistika, desetinná čísla; pět her s limitem (2026-10-11)

* [x] `lib/more.php`: 4 nové úlohy po 3 úrovních, nápověda, postup, rozbor chyb; popisky políček (průměr =, □ =, … %), klávesa čárky; testy rozsahů a rozborů
* [x] hry pexeso, 2048, cihly, ptáček + had pod společným rozcestníkem, náhodná hra po splnění cíle
* [x] limit: po cíli 3 hry + 1 za každých 10 příkladů, 10 minut denně s upozorněním a zámkem
* [x] zásoba offline 20 na kombinaci (100 kombinací)
* [x] ověřeno: testy (všechny kombinace), shoda PHP a JS, Playwright (nové úlohy, zamčené a odemčené hry, každá hra se hraje, vyčerpání 3 her, upozornění po 10 minutách)

## Závorky, rovnice, efekty, hra jako odměna (2026-10-11)

* [x] `lib/algebra.php`: závorky a pořadí operací (3 úrovně, šablony podle obtížnosti), rovnice (jednoduché, na dva kroky, x na obou stranách a závorky; na těžké záporné x a klávesa minus)
* [x] nápověda, postup se zkouškou, rozbor chyb (počítání zleva, opačná operace, zkouška s x dítěte); offline zásoba i mix je berou automaticky
* [x] přepínač „Efekty: zapnuté/vypnuté“ (odměny zůstávají)
* [x] had se odemkne denním cílem, při splnění nabídka „Zahrát si hada“
* [x] ověřeno: testy generátorů pro všechny kombinace, shoda PHP a JS (22 730 případů), Playwright (rovnice s x =, minus, nápověda, rozbor, postup; závorky; vypnuté efekty; odemčení hry)

## Odměny, album nálepek a hra Had (2026-10-11)

* [x] server: `lib/rewards.php`, tabulka `stickers`, odměny v odpovědi `answer`, album ve `stats`; testy `tests/test_rewards.php` (všechny odměny, hranice, offline sync)
* [x] `rewards.js`: animace (ohňostroj, sova, drak podle délky série, raketa, duha, zlatý jednorožec, poklad), texty, offline odměny; album ve Výsledcích
* [x] `snake.js`: hra Had, ovládání tažením, šipkami a klávesnicí, rekord, pauza, motiv
* [x] ověřeno v Playwright: každá odměna s textem a animací, album obou dětí, had sní jablko a uloží rekord, náraz do zdi, tažení prstem, klávesnice, tmavý motiv

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
