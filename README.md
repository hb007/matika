# Matika – procvičování pro 2. stupeň ZŠ

Jednoduchá webová appka (PHP 8.1+, SQLite nebo MySQL, bez frameworků
a bez buildu). Funguje na počítači, tabletu i telefonu.
Dítě si vybere jméno, úkol a úroveň, odehraje kolo 10 příkladů, hned vidí,
co mělo špatně, a sbírá body a hvězdičky. Rodič vidí ve „Výsledcích“
úspěšnost podle úkolů a příklady, které se opakovaně nedaří.

## Co se dá procvičovat

| Úkol | Úrovně |
|---|---|
| Malá násobilka | násobení · dělení · obojí (2–10 × 2–10) |
| Velká násobilka | násobení 11–20 × 2–10 · dělení · obojí · těžká (11–20 × 11–20) |
| Sčítání a odčítání | do 100 · do 1 000 · do 10 000 · záporná čísla · desetinná čísla |
| Zlomky | krácení · sčítání a odčítání · násobení a dělení · všechno |
| Dělení s ocáskem | jednociferný dělitel (100–9 999) · dvojciferný dělitel (1 000–99 999) |
| Náhodný mix | lehčí · všechno (každý příklad z jiného tématu) |

Příklady se generují náhodně při každém kole a v jednom kole se neopakují.

Pravidla, která hlídá server:

- Zlomek se píše jako `3/4`, jde i smíšené číslo `1 3/4` nebo celé číslo.
  Nezkrácený správný výsledek se uzná a appka jen napoví, na co se dá
  zkrátit. V úkolu **Krácení** se vyžaduje základní tvar.
- Desetinná čísla berou čárku i tečku.
- U dělení s ocáskem se zadává podíl a zbytek (zbytek 0 se píše jako 0).
- Body: 10 za správný příklad, každý odkrytý krok nápovědy ubere 3 (nejméně
  1 bod za správnou odpověď), +20 za kolo bez chyby. Hvězdičky: 3 za 10/10, 2 za 8–9, 1 za 5–7. Žebříček počítá body
  za posledních 7 dní.

Když je odpověď špatně, appka ukáže správný výsledek, pokud to pozná, tak
i **co konkrétně bylo špatně** („sečetl jsi místo odečtení“, „jmenovatele
se nesčítají“, „zbytek je větší než dělitel“, „podíl má mít 4 číslice“ …)
a **postup řešení po krocích** (rozklad na desítky, společný jmenovatel,
dělení pod sebou číslici po číslici). Postup k chybným příkladům je i ve
výsledku kola (klepnutím na příklad).

**Nápověda po krocích.** Když dítě neví, klikne na „Nápověda“ a uvidí první
krok (třeba „Kolikrát se 8 vejde do 66?“). Každé další kliknutí odkryje
další krok. Poslední krok nikdy neprozradí výsledek, ten musí dítě dopočítat
samo.

**Telefon a tablet.** Na dotykovém zařízení se místo systémové klávesnice
ukáže velká číselná klávesnice přímo pod příkladem, jen s klávesami, které
příklad potřebuje (lomítko u zlomků, minus u záporných čísel, čárka
u desetinných, „zb.“ u dělení se zbytkem). Na tabletu na šířku je papír
na počítání vedle příkladu.

**Papír na počítání.** Pod příkladem jde otevřít čtverečkovaný papír, na
který se píše prstem, perem nebo myší (guma, krok zpět, smazat). Slouží
k počítání pod sebou, appka z něj nic nečte. U každého nového příkladu se
vyčistí. Na tabletu s otevřeným papírem se nevysouvá klávesnice sama.

## Nasazení na hosting

Stačí běžný webhosting s **PHP 8.1 nebo novějším**. MySQL není potřeba,
appka umí ukládat data do SQLite, což je jeden soubor ve složce `data/`.

1. **Stáhni appku.** Na GitHubu: Code → Download ZIP a rozbal.
2. **Nahraj soubory přes FTP** do kořene webu nebo do podsložky (třeba
   `/matika`). Nahraj všechno včetně skrytého `.htaccess`.
3. **Otevři v prohlížeči `https://tvuj-web.cz/install.php`** (případně
   `/matika/install.php`). Instalátor zkontroluje hosting, nabídne SQLite
   (doporučeno) nebo MySQL a volitelné přístupové heslo. Po úspěchu se sám
   smaže.
4. Hotovo. Na tabletu nebo telefonu jde stránku přidat na plochu
   (Sdílet → Přidat na plochu), pak se otevírá jako appka přes celou obrazovku.

Instalátor není povinný. Když se soubory jen nahrají a otevře se web, appka
si SQLite databázi založí sama, jen bez hesla a s výchozím názvem souboru.

**Když chceš MySQL:** v administraci hostingu nejdřív založ databázi
a uživatele, údaje pak zadej v instalátoru. Tabulky založí instalátor sám
ze `schema.sql`.

**Když instalátor hlásí chybu:**

- *PHP je starší než 8.1:* verze PHP se přepíná v administraci hostingu.
- *Nejde zapisovat do složky:* nastav přes FTP práva složky appky
  a složky `data/` na 755 (případně 775).
- *Chybí SQLite i MySQL:* napiš podpoře hostingu, ať zapne rozšíření
  `pdo_sqlite`.

**Bezpečnost:** nastavení s přístupem k databázi je v `config.local.php`
a data v `data/`. Na Apache je chrání `.htaccess`, SQLite soubor navíc
dostane náhodný název. Přihlášení dětí je jen jménem; pokud je web
veřejný, nastav v instalátoru přístupové heslo.

## Lokální spuštění

```sh
php -S localhost:8080
```

a otevři http://localhost:8080. Data se uloží do `data/matika.sqlite`.

## Jak to funguje

- `index.php` + `app.js` + `paper.js` + `style.css` – jedna stránka, obrazovky se
  přepínají v JS.
- `api.php` – JSON API (`login`, `start`, `answer`, `finish`, `stats`, …).
  Příklady generuje a kontroluje server, klient správné odpovědi nedostane
  dřív, než odpoví.
- `lib/generators.php` – generátory příkladů a kontrola odpovědí.
- `lib/explain.php` – nápověda po krocích, postup řešení a rozbor typických chyb.
- `paper.js` – papír na počítání (canvas, pero, guma).
- `lib/db.php` – PDO připojení, podpora SQLite i MySQL.
- `schema.sql` – tabulky `users`, `rounds`, `answers` (pro MySQL; SQLite si je založí samo).
- `install.php` – instalátor pro hosting, `config.php` – výchozí nastavení,
  `config.local.php` – nastavení z instalátoru (není v gitu).

Přihlášení je jen jménem bez hesla – appka je určená pro rodinu nebo třídu,
ne pro veřejný internet. Pokud ji chceš vystavit ven, dej před ni HTTP
basic auth nebo podobnou ochranu na úrovni web serveru.
