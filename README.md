# Matika – procvičování pro 2. stupeň ZŠ

Jednoduchá webová appka (PHP 8 + MySQL, bez frameworků a bez buildu).
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

Pravidla, která hlídá server:

- Zlomek se píše jako `3/4`, jde i smíšené číslo `1 3/4` nebo celé číslo.
  Nezkrácený správný výsledek se uzná a appka jen napoví, na co se dá
  zkrátit. V úkolu **Krácení** se vyžaduje základní tvar.
- Desetinná čísla berou čárku i tečku.
- U dělení s ocáskem se zadává podíl a zbytek (zbytek 0 se píše jako 0).
- Body: 10 za správný příklad (5, když si dítě vzalo nápovědu), +20 za kolo
  bez chyby. Hvězdičky: 3 za 10/10, 2 za 8–9, 1 za 5–7. Žebříček počítá body
  za posledních 7 dní.

Když je odpověď špatně, appka ukáže správný výsledek, pokud to pozná, tak
i **co konkrétně bylo špatně** („sečetl jsi místo odečtení“, „jmenovatele
se nesčítají“, „zbytek je větší než dělitel“, „podíl má mít 4 číslice“ …)
a **postup řešení po krocích** (rozklad na desítky, společný jmenovatel,
dělení pod sebou číslici po číslici). Před odpovědí jde kliknout na
**Nápovědu**, která poradí postup bez výsledku. Postup k chybným příkladům
je i ve výsledku kola (klepnutím na příklad).

## Nasazení (MySQL)

1. Vytvoř databázi a naimportuj schéma:

   ```sh
   mysql -u root -p -e "CREATE DATABASE matika CHARACTER SET utf8mb4 COLLATE utf8mb4_czech_ci"
   mysql -u root -p matika < schema.sql
   ```

2. Nastav přístup k DB – buď proměnnými prostředí (`MATIKA_DSN`,
   `MATIKA_DB_USER`, `MATIKA_DB_PASS`), nebo úpravou výchozích hodnot
   v `config.php`:

   ```php
   'dsn'  => 'mysql:host=localhost;dbname=matika;charset=utf8mb4',
   'user' => 'matika',
   'pass' => 'tajne',
   ```

3. Nasměruj web server (Apache, nginx + php-fpm) na složku `matika/` jako
   document root. Potřebné PHP rozšíření: `pdo_mysql`, `mbstring`.
   Složku `lib/` chrání `.htaccess` (Apache); u nginx ji zakaž v konfiguraci.

## Lokální spuštění bez MySQL

Stejný kód umí běžet nad SQLite (tabulky se založí samy):

```sh
MATIKA_DSN="sqlite:$PWD/matika.sqlite" php -S localhost:8080 -t .
```

a otevři http://localhost:8080.

## Jak to funguje

- `index.php` + `app.js` + `style.css` – jedna stránka, obrazovky se
  přepínají v JS.
- `api.php` – JSON API (`login`, `start`, `answer`, `finish`, `stats`, …).
  Příklady generuje a kontroluje server, klient správné odpovědi nedostane
  dřív, než odpoví.
- `lib/generators.php` – generátory příkladů a kontrola odpovědí.
- `lib/explain.php` – nápověda, postup řešení a rozbor typických chyb.
- `lib/db.php` – PDO připojení, podpora MySQL i SQLite.
- `schema.sql` – tabulky `users`, `rounds`, `answers`.

Přihlášení je jen jménem bez hesla – appka je určená pro rodinu nebo třídu,
ne pro veřejný internet. Pokud ji chceš vystavit ven, dej před ni HTTP
basic auth nebo podobnou ochranu na úrovni web serveru.
