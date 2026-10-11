---
nazev: Matika
stav: aktivní
typ: kod
varianta: A
popis: Webová appka na procvičování matematiky pro 2. stupeň ZŠ (PHP bez databáze, FTP hosting)
dalsi-krok: ověřit nasazení na hosting (GitHub Actions → FTP)
---

# Matika – procvičování pro 2. stupeň ZŠ

Jednoduchá webová appka (PHP 8.1+, bez databáze, bez frameworků a bez buildu). Funguje na počítači, tabletu i telefonu.

Dítě si vybere úkol a úroveň a řeší samostatné příklady jeden za druhým, dokud chce. Žádné jméno, body ani kola. Správná odpověď spustí konfety a pochvalu a hned naskočí další příklad. Po špatné odpovědi má dítě další pokus, správný výsledek se ukáže jen na vyžádání. Typ úlohy i úroveň jde přepnout záložkami nad příkladem, bez návratu do menu.

## Co se dá procvičovat

| Úkol | Úrovně |
|---|---|
| Malá násobilka | násobení · dělení · obojí (2–10 × 2–10) |
| Velká násobilka | násobení 11–20 × 2–10 · dělení · obojí · těžká (11–20 × 11–20) |
| Sčítání a odčítání | do 100 · do 1 000 · do 10 000 · záporná čísla · desetinná čísla |
| Zlomky | krácení · sčítání a odčítání · násobení a dělení · všechno |
| Dělení s ocáskem | jednociferný dělitel (100–9 999) · dvojciferný dělitel (1 000–99 999) |
| Náhodný mix | lehčí · všechno (každý příklad z jiného tématu) |

Každý příklad se generuje náhodně.

Pravidla, která hlídá server:

* Zlomek se píše jako `3/4`, jde i smíšené číslo `1 3/4` nebo celé číslo. Nezkrácený správný výsledek se uzná a appka jen napoví, na co se dá zkrátit. V úkolu **Krácení** se vyžaduje základní tvar.
* Desetinná čísla berou čárku i tečku.
* U dělení s ocáskem se zadává podíl a zbytek (zbytek 0 se píše jako 0).

**Správná odpověď.** Ukáže se pochvala s náhodným efektem (konfety, hvězdičky, balónky, padající déšť emoji nebo velká medaile či palec, nikdy dvakrát po sobě stejný) a po chvilce naskočí další příklad. Kdo má v systému zapnuté omezení animací, uvidí jen pochvalu.

**Špatná odpověď.** Appka výsledek neprozradí. Napíše „Ještě ne, zkus to znovu“, a pokud to pozná, tak i **co konkrétně bylo špatně** („sečetl jsi místo odečtení“, „jmenovatele se nesčítají“, „zbytek je větší než dělitel“, „podíl má mít 4 číslice“ …). Odpověď zůstane v políčku k opravě a pokusů je neomezeně. Tlačítko „Ukázat výsledek“ ukáže správný výsledek a **postup řešení po krocích** (rozklad na desítky, společný jmenovatel, dělení pod sebou číslici po číslici). Další příklad pak přijde po kliknutí na „Další“ nebo Enter.

**Záložky.** Nad příkladem jsou záložky s typy úloh a pod nimi úrovně. Přepnutí hned načte nový příklad. Každá záložka si pamatuje naposledy zvolenou úroveň. Na telefonu se záložky posouvají do strany.

**Nápověda po krocích.** Když dítě neví, klikne na „Nápověda“ a uvidí první krok (třeba „Kolikrát se 8 vejde do 66?“). Každé další kliknutí odkryje další krok. Poslední krok nikdy neprozradí výsledek, ten musí dítě dopočítat samo.

**Telefon a tablet.** Na dotykovém zařízení se místo systémové klávesnice ukáže velká číselná klávesnice přímo pod příkladem, jen s klávesami, které příklad potřebuje (lomítko u zlomků, minus u záporných čísel, čárka u desetinných, „zb.“ u dělení se zbytkem). Na tabletu na šířku je papír na počítání vedle příkladu.

**Papír na počítání.** Pod příkladem jde otevřít čtverečkovaný papír, na který se píše prstem, perem nebo myší (guma, krok zpět, smazat). Slouží k počítání pod sebou, appka z něj nic nečte. U každého nového příkladu se vyčistí. Na tabletu s otevřeným papírem se nevysouvá klávesnice sama.

## Nasazení na hosting

Stačí běžný webhosting s **PHP 8.1 nebo novějším**. Databáze ani instalace nejsou potřeba.

1. **Stáhni appku.** Na GitHubu: Code → Download ZIP a rozbal.
2. **Nahraj soubory přes FTP** do kořene webu nebo do podsložky (třeba `/matika`). Nahraj všechno včetně skrytého `.htaccess`.
3. Hotovo, otevři web. Na tabletu nebo telefonu jde stránku přidat na plochu (Sdílet → Přidat na plochu), pak se otevírá jako appka přes celou obrazovku.

Appka si aktuální příklad pamatuje v PHP session, hosting tedy musí mít zapnuté sessions (běžné výchozí nastavení).

## Automatické nahrávání na FTP (GitHub Actions)

Po každém pushi do `main` GitHub zkontroluje syntaxi PHP a nahraje změněné soubory na hosting (`.github/workflows/deploy.yml`). Soubory, které z repa zmizí, na serveru smaže.

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

a otevři <http://localhost:8080>.

Ve vývojovém Docker kontejneru (`docker-compose.yml`, image `vibecode` s PHP) se spouští `php -S 0.0.0.0:$DEV_PORT` a appka je na hostu na `http://localhost:$HOST_PORT` (hodnoty v `.env`). `docs/`, `tasks/` a compose soubory se na FTP nenahrávají.

## Jak to funguje

* `index.php` + `app.js` + `paper.js` + `style.css` – jedna stránka, obrazovky se přepínají v JS. Efekty za správnou odpověď jsou v `app.js` (objekt `EFFECTS`, Web Animations API, bez knihovny); nový efekt = nová položka v `EFFECTS`.
* `api.php` – JSON API (`modules`, `next`, `hint`, `answer`, `reveal`). Příklady generuje a kontroluje server, aktuální příklad drží v PHP session. `answer` vrací jen správně/špatně a rozbor chyby, správný výsledek s postupem dá až `reveal`.
* `lib/generators.php` – generátory příkladů a kontrola odpovědí.
* `lib/explain.php` – nápověda po krocích, postup řešení a rozbor typických chyb.
* `paper.js` – papír na počítání (canvas, pero, guma).

Appka nic neukládá a nikoho nepřihlašuje, takže na ní není co chránit. Kdo ji přesto nechce mít veřejnou, dá před ni HTTP basic auth na úrovni web serveru.
