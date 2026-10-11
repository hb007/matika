---
nazev: Matika
stav: aktivní
typ: kod
varianta: A
popis: Webová appka na procvičování matematiky pro 2. stupeň ZŠ (PHP + SQLite, FTP hosting)
dalsi-krok: ověřit nasazení na hosting (GitHub Actions → FTP)
---

# Matika – procvičování pro 2. stupeň ZŠ

Jednoduchá webová appka (PHP 8.1+, SQLite, bez frameworků a bez buildu). Funguje na počítači, tabletu i telefonu.

Cvičí dvě děti, 👧 holka a 👦 kluk, bez hesla. Každé má svou adresu (`/holka`, `/kluk`), sbírá body a v horním řádku i ve „Výsledcích“ se porovnávají. Dítě si vybere úlohu, úroveň a obtížnost (lehké, střední, těžké) a řeší samostatné příklady jeden za druhým, dokud chce. Správná odpověď spustí efekt a pochvalu a hned naskočí další příklad. Po špatné odpovědi má dítě další pokus, správný výsledek se ukáže jen na vyžádání.

## Co se dá procvičovat

| Úloha (úrovně) | Lehké | Střední | Těžké |
|---|---|---|---|
| Malá násobilka (násobení, dělení, obojí) | 2–5 × 2–5 | 2–10 × 2–10 | 6–9 × 6–9 |
| Velká násobilka (násobení, dělení, obojí) | 11–15 × 2–5 | 11–20 × 2–10 | 11–20 × 11–20 |
| Sčítání a odčítání: celá čísla | do 100 | do 1 000 | do 10 000 |
| Sčítání a odčítání: záporná | ±20 | ±50 | ±500 |
| Sčítání a odčítání: desetinná | 1 místo, 1,0–9,9 | 1 místo, 1,0–99,9 | 2 místa, 1,00–99,99 |
| Zlomky: krácení | jmenovatel do 6, krátí se 2–3 | do 12, 2–6 | do 15, 2–9 |
| Zlomky: sčítání a odčítání | stejné jmenovatele 2–6 | 2–10, polovina stejné | 2–12, vždy různé |
| Zlomky: násobení a dělení | jmenovatele 2–5 | 2–9 | 2–12 |
| Dělení s ocáskem | 100–999 : 2–9 | 1 000–9 999 : 2–9 | 1 000–99 999 : 11–99 |
| Náhodný mix | vše lehké | vše střední | vše těžké |

Rozsahy jsou v `lib/generators.php` (konstanty `MALA_RANGE`, `VELKA_RANGE`, `CELA_MAX` …). Každý příklad se generuje náhodně.

Pravidla, která hlídá server:

* Zlomek se píše jako `3/4`, jde i smíšené číslo `1 3/4` nebo celé číslo. Nezkrácený správný výsledek se uzná a appka jen napoví, na co se dá zkrátit. V úkolu **Krácení** se vyžaduje základní tvar.
* Desetinná čísla berou čárku i tečku.
* U dělení s ocáskem se zadává podíl a zbytek (zbytek 0 se píše jako 0).

**Správná odpověď.** Ukáže se pochvala s náhodným efektem (konfety, hvězdičky, balónky, padající déšť emoji nebo velká medaile či palec, nikdy dvakrát po sobě stejný) a po chvilce naskočí další příklad. Kdo má v systému zapnuté omezení animací, uvidí jen pochvalu.

**Špatná odpověď.** Appka výsledek neprozradí. Napíše „Ještě ne, zkus to znovu“, a pokud to pozná, tak i **co konkrétně bylo špatně** („sečetl jsi místo odečtení“, „jmenovatele se nesčítají“, „zbytek je větší než dělitel“, „podíl má mít 4 číslice“ …). Odpověď zůstane v políčku k opravě a pokusů je neomezeně. Tlačítko „Ukázat výsledek“ ukáže správný výsledek a **postup řešení po krocích** (rozklad na desítky, společný jmenovatel, dělení pod sebou číslici po číslici). Další příklad pak přijde po kliknutí na „Další“ nebo Enter.

**Kdo cvičí.** Adresa `/holka` nebo `/kluk` otevře rovnou profil dítěte, na `/` se appka zeptá „Kdo dnes cvičí?“. Aktivní dítě je velké v horním řádku, nad příkladem i v titulku karty. Druhé dítě je v horním řádku malé a klik na něj přepne profil (přejde na jeho adresu). Dítě se posílá s každým požadavkem, takže se nespletou ani dvě karty v jednom prohlížeči. Ikona přidaná na plochu z `/kluk` otevře rovnou kluka. Přezdívky jdou změnit ve „Výsledcích“ (✏️). Web je veřejný, proto přezdívky, ne skutečná jména.

**Záložky a obtížnost.** Nad příkladem jsou záložky s typy úloh, pod nimi úrovně a obtížnost. Přepnutí hned načte nový příklad. Každé dítě má u každé úlohy zapamatovanou úroveň a obtížnost (v prohlížeči). Obtížnost obarví obrazovku: lehké zeleně, střední modře, těžké červenooranžově. Hlavní menu ukazuje jen úlohy.

**Body.** Správně napoprvé: lehké 1, střední 2, těžké 3 body. Správně po chybném pokusu 1 bod, po „Ukázat výsledek“ 0. Nápověda body nebere. Nečitelná odpověď (písmena, chybí zbytek) se nepočítá jako pokus. Za každých 5 správně napoprvé v řadě je bod navíc (od 3 v řadě se ukazuje 🔥).

**Denní cíl.** 20 vyřešených příkladů za den (ukázaný výsledek se nepočítá), postup ukazuje proužek u dítěte v horním řádku. 🔥 u dítěte je série dní se splněným cílem. Den a týden (od pondělí) se počítají v českém čase.

**Opakování chyb.** Příklad, který dítě napoprvé netrefí, se mu v téže úloze a obtížnosti vrátí po 5 dalších příkladech s odznakem „🔁 Tenhle ti minule nešel“.

**Výsledky.** Porovnání obou dětí (dnes, tento týden, celkem, dnes vyřešeno, série dní) a přehled pro rodiče: úspěšnost napoprvé podle tématu a obtížnosti a příklady, které se za posledních 30 dní nejčastěji nedařily.

**Nápověda po krocích.** Když dítě neví, klikne na „Nápověda“ a uvidí první krok (třeba „Kolikrát se 8 vejde do 66?“). Každé další kliknutí odkryje další krok. Poslední krok nikdy neprozradí výsledek, ten musí dítě dopočítat samo.

**Telefon a tablet.** Na dotykovém zařízení se místo systémové klávesnice ukáže velká číselná klávesnice přímo pod příkladem, jen s klávesami, které příklad potřebuje (lomítko u zlomků, minus u záporných čísel, čárka u desetinných, „zb.“ u dělení se zbytkem). Na tabletu na šířku je papír na počítání vedle příkladu.

**Papír na počítání.** Pod příkladem jde otevřít čtverečkovaný papír, na který se píše prstem, perem nebo myší (guma, krok zpět, smazat). Slouží k počítání pod sebou, appka z něj nic nečte. U každého nového příkladu se vyčistí. Na tabletu s otevřeným papírem se nevysouvá klávesnice sama.

## Nasazení na hosting

Stačí běžný webhosting s **PHP 8.1 nebo novějším** a rozšířením `pdo_sqlite`. Instalace není potřeba: databáze `data/matika-v2.sqlite` se založí sama při prvním použití. Složka `data/` musí být pro PHP zapisovatelná. Pro adresy `/holka` a `/kluk` je potřeba Apache s `mod_rewrite` (bez něj zbytek appky funguje).

1. **Stáhni appku.** Na GitHubu: Code → Download ZIP a rozbal.
2. **Nahraj soubory přes FTP** do kořene webu nebo do podsložky (třeba `/matika`). Nahraj všechno včetně skrytého `.htaccess`.
3. Hotovo, otevři web. Na tabletu nebo telefonu jde stránku přidat na plochu (Sdílet → Přidat na plochu), pak se otevírá jako appka přes celou obrazovku.

Appka si rozpracovaný příklad pamatuje v PHP session, hosting tedy musí mít zapnuté sessions (běžné výchozí nastavení).

Hosting cachuje JS a CSS až 3 dny. `index.php` proto načítá skripty a styly s verzí v adrese (`app.js?v=…`), takže po nasazení prohlížeč vezme nové.

## Automatické nahrávání na FTP (GitHub Actions)

Po každém pushi do `main` GitHub zkontroluje syntaxi PHP, spustí testy (`php tests/run.php`) a nahraje změněné soubory na hosting (`.github/workflows/deploy.yml`). Soubory, které z repa zmizí, na serveru smaže. Databázi v `data/` nikdy nepřepíše ani nesmaže. Složka `data/` proto musí zůstat v repu: kdyby z něj zmizela, akce by ji na serveru smazala i s databází.

Nastavení jednou: v repu na GitHubu **Settings → Secrets and variables → Actions**.

| Kde | Název | Hodnota |
|---|---|---|
| Secrets | `FTP_SERVER` | FTP server hostingu, např. `ftp.tvuj-web.cz` |
| Secrets | `FTP_USERNAME` | FTP uživatel |
| Secrets | `FTP_PASSWORD` | FTP heslo |
| Variables (nepovinné) | `FTP_DIR` | složka na serveru s lomítkem na konci, např. `www/matika/`; výchozí je kořen FTP účtu |
| Variables (nepovinné) | `FTP_PROTOCOL` | `ftps` (výchozí) nebo `ftp`, když hosting šifrované FTP neumí |

Pak v záložce **Actions** spusť „Nasazení na FTP“ ručně (Run workflow), nebo stačí další push.

## Lokální spuštění

```sh
php -S localhost:8080
```

a otevři <http://localhost:8080> (nebo rovnou `/holka`, `/kluk`). Lokální databáze je `data/matika-v2.sqlite`.

Testy (generátory, body, série, opakování chyb):

```sh
php tests/run.php
```

Ve vývojovém Docker kontejneru (`docker-compose.yml`, image `vibecode` s PHP) se spouští `php -S 0.0.0.0:$DEV_PORT` a appka je na hostu na `http://localhost:$HOST_PORT` (hodnoty v `.env`). `docs/`, `tasks/`, `tests/` a compose soubory se na FTP nenahrávají.

## Jak to funguje

* `index.php` + `app.js` + `paper.js` + `style.css` – jedna stránka, obrazovky se přepínají v JS. `index.php` pozná dítě z adresy (`/holka`, `/kluk`). Efekty za správnou odpověď jsou v `app.js` (objekt `EFFECTS`, Web Animations API, bez knihovny); nový efekt = nová položka v `EFFECTS`.
* `api.php` – JSON API (`state`, `next`, `hint`, `answer`, `reveal`, `stats`, `rename`). Každý požadavek nese `user` (1 holka, 2 kluk). Příklady generuje a kontroluje server, rozpracovaný příklad drží v PHP session zvlášť pro každé dítě. `answer` vrací jen správně/špatně a rozbor chyby, správný výsledek s postupem dá až `reveal`. Opakované odeslání hotového příkladu vrátí 409, body se nepřičtou dvakrát.
* `lib/game.php` – body, série, denní cíl, opakování chyb, statistiky. `lib/db.php` – SQLite (tabulky `users`, `results`, `review` se založí samy).
* `lib/generators.php` – generátory příkladů podle obtížnosti a kontrola odpovědí.
* `lib/explain.php` – nápověda po krocích, postup řešení a rozbor typických chyb.
* `paper.js` – papír na počítání (canvas, pero, guma).
* `manifest.php` – manifest pro přidání na plochu, pro `/holka` a `/kluk` zvlášť.
* `data/` – databáze (z nahrávání vyřazená, chrání ji `.htaccess` a `index.html`).
* `tests/` – testy bez frameworku, `php tests/run.php`.

Appka nikoho nepřihlašuje. Kdokoli s adresou může cvičit za kterékoli dítě a měnit přezdívky. Kdo to nechce, dá před web HTTP basic auth na úrovni web serveru.
